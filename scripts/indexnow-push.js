#!/usr/bin/env node
/**
 * IndexNow URL Push Script
 * Pushes URLs to search engines for faster indexing
 * 
 * Usage: node scripts/indexnow-push.js [url1] [url2] ...
 * If no URLs provided, pushes recently updated pages
 */

const https = require('https');

const CONFIG = {
  host: 'jilo.ai',
  key: 'ddee3f9754f242b3b7b4c93349a99bbb', // IndexNow key (UUID format)
  keyLocation: 'https://jilo.ai/ddee3f9754f242b3b7b4c93349a99bbb.txt',
  endpoint: 'https://api.indexnow.org/indexnow'
};

// Default URLs to push (recently updated/important pages)
const DEFAULT_URLS = [
  'https://jilo.ai/en/compare/crewai-vs-openclaw',
  'https://jilo.ai/en/reviews/best-ai-video-generators',
  'https://jilo.ai/en/reviews/openclaw-review-and-setup-guide',
  'https://jilo.ai/en/reviews/best-ai-agents',
  'https://jilo.ai/en/alternatives/heygen-alternatives',
  'https://jilo.ai/en/alternatives/deepseek-alternatives',
  'https://jilo.ai/en/alternatives/runway-alternatives'
];

async function pushToIndexNow(urls) {
  const payload = JSON.stringify({
    host: CONFIG.host,
    key: CONFIG.key,
    keyLocation: CONFIG.keyLocation,
    urlList: urls
  });

  const options = {
    hostname: 'api.indexnow.org',
    port: 443,
    path: '/indexnow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode === 200 || res.statusCode === 202) {
          console.log(`✅ Successfully pushed ${urls.length} URLs to IndexNow`);
          resolve(true);
        } else {
          console.log(`⚠️ Response: ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Error: ${e.message}`);
      reject(e);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  const urls = args.length > 0 ? args : DEFAULT_URLS;

  console.log('🚀 IndexNow URL Push');
  console.log(`📦 Pushing ${urls.length} URLs...`);
  urls.forEach(url => console.log(`  - ${url}`));
  console.log('');

  try {
    await pushToIndexNow(urls);
  } catch (error) {
    console.error('Failed to push URLs:', error);
    process.exit(1);
  }
}

main();
