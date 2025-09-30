from openai import OpenAI
from config import OPENAI_API_KEY
import os

client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

def translate_text(text, target_lang='zh'):
    """使用 OpenAI 翻译文本"""
    if not client or not text:
        return text
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a translator. Translate to Chinese naturally, keep brand names in English."},
                {"role": "user", "content": f"Translate: {text}"}
            ],
            temperature=0.3,
            max_tokens=200
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Translation error: {e}")
        return text