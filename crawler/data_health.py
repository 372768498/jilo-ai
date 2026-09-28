"""区分真实零值、缺测和过期数据；只读检查不替业务生成成功记录。"""
from datetime import date, datetime


class AnalyticsUnavailable(RuntimeError):
    pass


def analytics_health(supabase, today=None):
    today = today or datetime.utcnow().date()
    result = {'ready': True, 'ga_date': None, 'gsc_date': None, 'issues': []}
    for source, table, max_lag in [('ga', 'analytics_site_daily', 2), ('gsc', 'search_console_daily', 5)]:
        try:
            if source == 'gsc':
                # 原始行可能只写到第一页；仅整日完成 marker 能证明采集完整。
                markers = supabase.table('growth_state').select('value').like('key', 'gsc_collection:%').order('key', desc=True).limit(1).execute().data or []
                value = (markers[0].get('value') or {}) if markers else {}
                latest = value.get('date') if value.get('data_state') == 'final' else None
            else:
                rows = supabase.table(table).select('date').order('date', desc=True).limit(1).execute().data or []
                latest = rows[0]['date'] if rows else None
            result[source + '_date'] = latest
            lag = (today - date.fromisoformat(latest)).days if latest else None
            if lag is None or lag < 1 or lag > max_lag:
                result['issues'].append(f'{source}: missing/stale analytics date ({latest or "none"})')
        except Exception as exc:
            result['issues'].append(f'{source}: analytics unavailable ({type(exc).__name__})')
    result['ready'] = not result['issues']
    return result


def require_fresh_analytics(supabase):
    health = analytics_health(supabase)
    if not health['ready']:
        raise AnalyticsUnavailable('; '.join(health['issues']))
    return health
