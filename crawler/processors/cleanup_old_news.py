from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY
from datetime import datetime, timedelta

def cleanup_old_news():
    """删除90天前的旧新闻"""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 计算90天前的日期
    cutoff_date = (datetime.now() - timedelta(days=90)).isoformat()
    
    try:
        result = supabase.table('news')\
            .delete()\
            .lt('published_at', cutoff_date)\
            .execute()
        
        print(f"✅ Cleaned up old news (before {cutoff_date[:10]})")
        return True
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
        return False

if __name__ == "__main__":
    cleanup_old_news()
