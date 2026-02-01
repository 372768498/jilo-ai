import { NextResponse } from 'next/server';

// IndexNow API - 主动通知搜索引擎有新页面
// Bing, Yandex, Naver 等都支持
const INDEXNOW_KEY = 'jilo_ai_indexnow_2025';
const HOST = 'jilo.ai';

export async function POST(request: Request) {
  try {
    const { urls } = await request.json();
    
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'urls array required' }, { status: 400 });
    }

    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    };

    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      submitted: urls.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'POST with { urls: [...] } to submit URLs to IndexNow',
    key: INDEXNOW_KEY,
  });
}
