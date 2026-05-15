import time

import requests
from bs4 import BeautifulSoup
from supabase import create_client

from config import SUPABASE_KEY, SUPABASE_URL
from processors.translator import translate_text


def crawl_ai_news():
    """Legacy lightweight Product Hunt crawler."""
    print("Crawling AI news...")
    news_list = []

    try:
        url = "https://www.producthunt.com/topics/artificial-intelligence"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")

        for article in soup.find_all("article")[:3]:
            title = article.find("h3")
            link = article.find("a")
            if not title or not link or not link.get("href"):
                continue

            href = link["href"]
            news_item = {
                "title_en": title.text.strip()[:200],
                "source": "Product Hunt",
                "source_url": href if href.startswith("http") else f"https://www.producthunt.com{href}",
                "news_type": "product_launch",
            }
            news_list.append(news_item)
            print(f"  Found: {news_item['title_en'][:50]}")
    except Exception as e:
        print(f"  Product Hunt error: {e}")

    return news_list


def save_news_to_db(news_list):
    """Save crawled news to Supabase as draft records."""
    if not news_list:
        print("No news to save")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    saved = 0

    for news in news_list:
        try:
            slug = news["title_en"].lower().replace(" ", "-")[:100]
            slug = "".join(c for c in slug if c.isalnum() or c == "-")

            existing = supabase.table("news").select("id").eq("slug", slug).execute()
            if existing.data:
                print(f"  Skip existing: {news['title_en'][:50]}")
                continue

            news["title_zh"] = translate_text(news["title_en"])
            news["slug"] = slug
            news["status"] = "draft"

            result = supabase.table("news").insert(news).execute()
            if result.data:
                saved += 1
                print(f"  Saved: {news['title_en'][:50]}")

            time.sleep(1)
        except Exception as e:
            print(f"  Error saving {news.get('title_en', '')[:30]}: {e}")

    print(f"Saved {saved}/{len(news_list)} news items")


if __name__ == "__main__":
    print("Starting news crawler...")
    news = crawl_ai_news()
    save_news_to_db(news)
    print("Done!")
