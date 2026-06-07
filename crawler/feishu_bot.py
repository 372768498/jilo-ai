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
        return resp.status_code == 200
    except Exception as e:
        print(f"[Feishu] Send failed: {e}")
        return False


def send_feishu_alert(webhook_url: str, title: str, message: str, level: str = "warning") -> bool:
    """Send an alert message. level: 'warning' (yellow) or 'error' (red)."""
    color = "red" if level == "error" else "yellow"
    level_label = "严重错误" if level == "error" else "警告"
    content = f"**级别：** {level_label}\n\n{message}"
    return send_feishu_card(webhook_url, title, content, color=color)
