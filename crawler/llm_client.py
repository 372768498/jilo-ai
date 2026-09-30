from openai import OpenAI

from config import OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_TIMEOUT_SECONDS, OPENAI_MODEL
import re


def safe_model_error(error):
    message = str(error)
    if OPENAI_API_KEY:
        message = message.replace(OPENAI_API_KEY, '[REDACTED]')
    return re.sub(r'(?i)(api[_-]?key\s*[:=]\s*)[^\s,\}\'\"]+', r'\1[REDACTED]', message)[:1000]


def sanitize_details(value):
    if isinstance(value, dict):
        return {k: sanitize_details(v) for k, v in value.items()}
    if isinstance(value, list):
        return [sanitize_details(v) for v in value]
    return safe_model_error(value) if isinstance(value, str) else value


def is_auth_error(error):
    from failure_chain import classify_failure
    return classify_failure('llm', str(error))['subtype'] in ('system_env_missing', 'system_env_invalid')


class ModelAuthenticationError(RuntimeError):
    pass


def release_auth_failure(supabase, action, error):
    """全局凭据故障不消耗单个内容动作的尝试额度。"""
    import action_queue
    from ops_logger import log_operation
    action_queue.release_pending(supabase, action, safe_model_error(error))
    log_operation('llm_health', 'error', 'Model authentication unavailable')


def get_openai_client():
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")
    kwargs = {
        "api_key": OPENAI_API_KEY,
        "timeout": OPENAI_TIMEOUT_SECONDS,
        "max_retries": 1,
    }
    if OPENAI_BASE_URL:
        kwargs["base_url"] = OPENAI_BASE_URL
    return OpenAI(**kwargs)


def check_llm_health():
    """用生产同一模型做有界预检，失败前不领取业务动作。"""
    from ops_logger import log_operation
    from failure_chain import classify_failure
    try:
        response = get_openai_client().with_options(timeout=45, max_retries=0).chat.completions.create(
            model=OPENAI_MODEL, messages=[{'role': 'user', 'content': 'Reply with OK only.'}],
            max_tokens=16,
        )
        if not response.choices or not response.choices[0].message.content:
            raise RuntimeError('Model health probe returned empty content')
        if not log_operation('llm_health', 'success', 'Production model chat probe passed'):
            raise RuntimeError('Model health evidence could not be persisted')
        return True
    except Exception as error:
        # 不记录原始 provider 响应，避免上游把凭据回显到日志。
        info = classify_failure('llm_health', str(error))
        message = 'Model authentication unavailable' if info['subtype'] == 'system_env_invalid' else 'Model health probe failed'
        log_operation('llm_health', 'error', message,
                      {'failure_category': info['subtype'], 'http_status': getattr(error, 'status_code', None)})
        raise RuntimeError(message) from None
