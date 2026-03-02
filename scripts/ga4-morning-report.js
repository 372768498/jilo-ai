#!/usr/bin/env node
/**
 * jilo.ai 每日晨报脚本
 * 供 Commander 的晨报 cron 调用
 * 输出纯文本，可直接 paste 到 Telegram 消息
 * Usage: node scripts/ga4-morning-report.js
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const SA_PATH = path.join(__dirname, '..', 'ga4-service-account.json');
const PROPERTY_ID = '523499574';

const sa = JSON.parse(fs.readFileSync(SA_PATH, 'utf-8'));

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function makeJWT() {
  const now = Math.floor(Date.now() / 1000);
  const h = base64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const p = base64url(Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: sa.token_uri, exp: now + 3600, iat: now
  })));
  const s = crypto.createSign('RSA-SHA256');
  s.update(`${h}.${p}`);
  return `${h}.${p}.${base64url(s.sign(sa.private_key))}`;
}
async function getToken() {
  const r = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + makeJWT()
  });
  const d = await r.json();
  if (!d.access_token) throw new Error(JSON.stringify(d));
  return d.access_token;
}
async function report(token, body) {
  const r = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  return r.json();
}
function fmt(n) { return Number(n).toLocaleString(); }

async function main() {
  const token = await getToken();

  // 昨日 vs 前日
  const trend = await report(token, {
    dateRanges: [
      { startDate: '1daysAgo', endDate: '1daysAgo' },
      { startDate: '2daysAgo', endDate: '2daysAgo' }
    ],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
      { name: 'sessions' }
    ]
  });

  // 近7日总览
  const week = await report(token, {
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
      { name: 'bounceRate' }
    ]
  });

  // 昨日流量来源
  const src = await report(token, {
    dateRanges: [{ startDate: '1daysAgo', endDate: '1daysAgo' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 5
  });

  // 昨日 Top 5 页面
  const pages = await report(token, {
    dateRanges: [{ startDate: '1daysAgo', endDate: '1daysAgo' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 5
  });

  // 计算变化
  const yPV  = parseInt(trend.rows?.[0]?.metricValues?.[0]?.value || 0);
  const yUV  = parseInt(trend.rows?.[0]?.metricValues?.[1]?.value || 0);
  const ySes = parseInt(trend.rows?.[0]?.metricValues?.[2]?.value || 0);
  const dPV  = parseInt(trend.rows?.[1]?.metricValues?.[0]?.value || 0);
  const pvChg = dPV > 0 ? ((yPV - dPV) / dPV * 100).toFixed(1) : 'N/A';
  const pvArrow = yPV >= dPV ? '↑' : '↓';

  const wPV = parseInt(week.rows?.[0]?.metricValues?.[0]?.value || 0);
  const wUV = parseInt(week.rows?.[0]?.metricValues?.[1]?.value || 0);
  const bounce = week.rows?.[0] ? (parseFloat(week.rows[0].metricValues[2].value) * 100).toFixed(1) : 'N/A';

  // 到100万的进度
  const TARGET = 1000000;
  const progress = ((wPV / 7) * 365).toFixed(0); // 按当前7日均值推算年PV
  const pct = (wPV / TARGET * 100).toFixed(3);

  let lines = [];
  lines.push(`📊 jilo.ai 每日晨报 · ${new Date().toLocaleDateString('zh-CN', {month:'long',day:'numeric'})}`);
  lines.push(`${'─'.repeat(30)}`);
  lines.push(`📅 昨日数据`);
  lines.push(`  PV ${fmt(yPV)}  UV ${fmt(yUV)}  Sessions ${fmt(ySes)}`);
  lines.push(`  较前日：${pvArrow} ${pvChg}%`);
  lines.push(``);
  lines.push(`📈 近7天`);
  lines.push(`  PV ${fmt(wPV)}  UV ${fmt(wUV)}  跳出率 ${bounce}%`);
  lines.push(`  按此速度年化约 ${fmt(progress)} PV`);
  lines.push(``);

  if (src.rows?.length) {
    lines.push(`🌐 昨日来源`);
    src.rows.forEach(r => {
      const ch = r.dimensionValues[0].value;
      lines.push(`  ${ch}：${r.metricValues[0].value} sessions`);
    });
    lines.push(``);
  }

  if (pages.rows?.length) {
    lines.push(`🏆 昨日Top页面`);
    pages.rows.forEach((r, i) => {
      const p = r.dimensionValues[0].value;
      const short = p.length > 40 ? '…' + p.slice(-39) : p;
      lines.push(`  ${i+1}. ${short} (${r.metricValues[0].value})`);
    });
    lines.push(``);
  }

  lines.push(`🎯 1M PV 进度`);
  lines.push(`  已累计（近30天）：${pct}%`);
  lines.push(`  当前目标：日均 500 PV（当前 ~${Math.round(wPV/7)} PV/天）`);
  lines.push(`${'─'.repeat(30)}`);

  const output = lines.join('\n');
  console.log(output);

  // 输出 JSON 方便其他脚本读取
  if (process.argv.includes('--json')) {
    console.log('\n' + JSON.stringify({
      date: new Date().toISOString().slice(0,10),
      yesterday: { pv: yPV, uv: yUV, sessions: ySes, pvChange: pvChg },
      week: { pv: wPV, uv: wUV, bounceRate: bounce }
    }));
  }
}

main().catch(err => { console.error('GA4 Error:', err.message); process.exit(1); });
