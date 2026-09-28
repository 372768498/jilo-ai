import requests


def send_feishu_card(webhook_url: str, title: str, content: str, color: str = "blue") -> bool:
    """Send a card message to Feishu webhook. Returns True on success."""
    payload = {
        "msg_type": "interactive",
        "card": {
            "header": {
                "title": {"tag": "plain_text", "content": title},
                "template": color,
            },
            "elements": [
                {"tag": "markdown", "content": content}
            ],
        },
    }
    try:
        resp = requests.post(webhook_url, json=payload, timeout=10)
        acknowledgement = resp.json()
        code = acknowledgement.get('code', acknowledgement.get('StatusCode'))
        accepted = resp.status_code == 200 and type(code) is int and code == 0
        # 只输出验收状态，不输出 webhook 或响应正文。
        print(f"[Feishu] HTTP={resp.status_code} accepted={accepted}")
        return accepted
    except Exception as e:
        print(f"[Feishu] Send failed: {type(e).__name__}")
        return False


def send_feishu_alert(webhook_url: str, title: str, message: str, level: str = "warning") -> bool:
    """Send an alert message. level: 'warning' (yellow) or 'error' (red)."""
    color = "red" if level == "error" else "yellow"
    level_label = "严重错误" if level == "error" else "警告"
    content = f"**级别：** {level_label}\n\n{message}"
    return send_feishu_card(webhook_url, title, content, color=color)
