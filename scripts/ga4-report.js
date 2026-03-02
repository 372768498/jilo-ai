#!/usr/bin/env node
/**
 * GA4 Data API Report
 * 拉取 jilo.ai 流量数据
 * Usage: node scripts/ga4-report.js [days=7]
 */

const path = require('path');
const fs = require('fs');

const SA_PATH = path.join(__dirname, '..', 'ga4-service-account.json');
const PROPERTY_ID = '523499574'; // Jilo.ai GA4 媒体资源 ID

const sa = JSON.parse(fs.readFileSync(SA_PATH, 'utf-8'));
const days = parseInt(process.argv[2] || '7', 10);

// 生成 JWT for Google OAuth2
const crypto = require('crypto');

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function makeJWT() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payload = base64url(Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: sa.token_uri,
    exp: now + 3600,
    iat: now
  })));
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = base64url(sign.sign(sa.private_key));
  return `${header}.${payload}.${sig}`;
}

async function getAccessToken() {
  const jwt = makeJWT();
  const resp = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error('Token error: ' + JSON.stringify(data));
  return data.access_token;
}

async function runReport(token, body) {
  const resp = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );
  return resp.json();
}

function fmt(n) { return Number(n).toLocaleString(); }

async function main() {
  console.log(`\n📊 jilo.ai GA4 流量报告（近 ${days} 天）`);
  console.log('═'.repeat(50));

  let token;
  try {
    token = await getAccessToken();
  } catch (e) {
    console.error('❌ 获取 Access Token 失败:', e.message);
    process.exit(1);
  }

  // 1. 总览：PV / UV / Sessions / 跳出率 / 平均停留时长
  const overview = await runReport(token, {
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' }
    ]
  });

  if (overview.rows) {
    const r = overview.rows[0].metricValues;
    const bounce = (parseFloat(r[3].value) * 100).toFixed(1);
    const dur = parseInt(r[4].value);
    const mm = String(Math.floor(dur / 60)).padStart(2, '0');
    const ss = String(dur % 60).padStart(2, '0');
    console.log(`\n📈 总览`);
    console.log(`  PV（页面浏览）  : ${fmt(r[0].value)}`);
    console.log(`  UV（活跃用户）  : ${fmt(r[1].value)}`);
    console.log(`  Sessions（会话）: ${fmt(r[2].value)}`);
    console.log(`  跳出率          : ${bounce}%`);
    console.log(`  平均停留时长    : ${mm}:${ss}`);
  } else {
    console.log('\n⚠️  总览数据为空（可能权限未配置或数据尚未同步）');
    console.log(JSON.stringify(overview, null, 2));
    return;
  }

  // 2. 流量来源
  const source = await runReport(token, {
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 8
  });

  if (source.rows) {
    console.log(`\n🌐 流量来源`);
    source.rows.forEach(row => {
      const ch = row.dimensionValues[0].value.padEnd(22);
      console.log(`  ${ch} Sessions: ${fmt(row.metricValues[0].value).padStart(8)}  UV: ${fmt(row.metricValues[1].value)}`);
    });
  }

  // 3. Top 10 页面
  const pages = await runReport(token, {
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10
  });

  if (pages.rows) {
    console.log(`\n🏆 Top 10 页面`);
    pages.rows.forEach((row, i) => {
      const p = row.dimensionValues[0].value;
      const short = p.length > 45 ? p.slice(0, 44) + '…' : p;
      console.log(`  ${String(i+1).padStart(2)}. ${short.padEnd(46)} PV: ${fmt(row.metricValues[0].value).padStart(7)}`);
    });
  }

  // 4. 按国家/地区
  const geo = await runReport(token, {
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'country' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 8
  });

  if (geo.rows) {
    console.log(`\n🗺️  用户地区`);
    geo.rows.forEach(row => {
      const c = row.dimensionValues[0].value.padEnd(25);
      console.log(`  ${c} UV: ${fmt(row.metricValues[0].value)}`);
    });
  }

  // 5. 昨日 vs 前日对比
  const trend = await runReport(token, {
    dateRanges: [
      { startDate: '1daysAgo', endDate: '1daysAgo' },
      { startDate: '2daysAgo', endDate: '2daysAgo' }
    ],
    metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }]
  });

  if (trend.rows) {
    const y = trend.rows[0].metricValues; // yesterday (dateRange0)
    const d = trend.rows[1]?.metricValues; // day before
    const pvY = parseInt(y[0].value);
    const pvD = d ? parseInt(d[0].value) : 0;
    const uvY = parseInt(y[1].value);
    const change = pvD > 0 ? ((pvY - pvD) / pvD * 100).toFixed(1) : 'N/A';
    const arrow = pvY >= pvD ? '↑' : '↓';
    console.log(`\n📅 昨日数据`);
    console.log(`  PV: ${fmt(pvY)}  UV: ${fmt(uvY)}  较前日: ${arrow} ${change}%`);
  }

  console.log('\n' + '═'.repeat(50));
  console.log(`数据来源: Google Analytics 4 | Property: ${PROPERTY_ID}`);
  console.log('');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
