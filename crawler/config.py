import os
from dotenv import load_dotenv

load_dotenv()

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Feishu
FEISHU_WEBHOOK_URL = os.getenv("FEISHU_WEBHOOK_URL")

# Google Analytics
GOOGLE_SERVICE_ACCOUNT_JSON = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
GA_PROPERTY_ID = os.getenv("GA_PROPERTY_ID")
GSC_SITE_URL = os.getenv("GSC_SITE_URL")

# Crawler sources
SOURCES = {
    "producthunt": "https://www.producthunt.com/topics/artificial-intelligence",
    "toolify": "https://www.toolify.ai/Best-AI-Tools",
}

RSS_SOURCES = {
    'TechCrunch AI': 'https://techcrunch.com/tag/artificial-intelligence/feed/',
    'VentureBeat AI': 'https://venturebeat.com/category/ai/feed/',
    'The Verge AI': 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml',
    'MIT Tech Review AI': 'https://www.technologyreview.com/topic/artificial-intelligence/feed/',
    'OpenAI Blog': 'https://openai.com/blog/rss/',
    'Anthropic Blog': 'https://www.anthropic.com/rss.xml',
    'Hacker News AI': 'https://hnrss.org/newest?q=AI+OR+LLM+OR+GPT&points=50',
}
