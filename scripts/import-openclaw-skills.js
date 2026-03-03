const https = require('https');
const fs = require('fs');

const GITHUB_API = 'api.github.com';
const REPO_PATH = '/repos/openclaw/skills/contents/skills';
const MAX_SKILLS = 150; // 限制数量
const CONCURRENT = 5; // 并发数

function httpsGet(options) {
  return new Promise((resolve, reject) => {
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function getSkillsList() {
  const options = {
    hostname: GITHUB_API,
    path: REPO_PATH,
    headers: { 'User-Agent': 'jilo-ai-importer' }
  };
  const data = await httpsGet(options);
  return JSON.parse(data);
}

async function getSkillMeta(skillPath) {
  for (const filename of ['SKILL.md', 'Skill.md']) {
    try {
      const options = {
        hostname: GITHUB_API,
        path: `/repos/openclaw/skills/contents/${skillPath}/${filename}`,
        headers: { 'User-Agent': 'jilo-ai-importer' }
      };
      const data = await httpsGet(options);
      const json = JSON.parse(data);
      if (json.content) {
        const content = Buffer.from(json.content, 'base64').toString();
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        if (match) {
          const fm = match[1];
          return {
            name: fm.match(/name:\s*(.+)/)?.[1]?.trim(),
            description: fm.match(/description:\s*(.+)/)?.[1]?.trim()
          };
        }
      }
    } catch (e) {}
  }
  return null;
}

async function processBatch(skills, startIdx, batchSize) {
  const promises = [];
  for (let i = startIdx; i < Math.min(startIdx + batchSize, skills.length); i++) {
    const skill = skills[i];
    if (skill.type !== 'dir') continue;
    
    promises.push(
      getSkillMeta(skill.path).then(meta => {
        console.log(`✓ ${i + 1}/${skills.length}: ${skill.name}`);
        if (meta?.name) {
          return {
            id: skill.name,
            name: meta.name,
            description: meta.description || '',
            category: 'OpenClaw Skills',
            github_url: `https://github.com/openclaw/skills/tree/main/${skill.path}`
          };
        }
        return null;
      }).catch(() => null)
    );
  }
  return (await Promise.all(promises)).filter(Boolean);
}

async function main() {
  console.log('开始抓取 OpenClaw Skills...');
  
  const skillsList = await getSkillsList();
  const total = Math.min(skillsList.length, MAX_SKILLS);
  console.log(`找到 ${skillsList.length} 个目录，处理前 ${total} 个\n`);
  
  const results = [];
  for (let i = 0; i < total; i += CONCURRENT) {
    const batch = await processBatch(skillsList, i, CONCURRENT);
    results.push(...batch);
  }
  
  fs.writeFileSync('skills-import.json', JSON.stringify(results, null, 2));
  console.log(`\n完成！导出 ${results.length} 个 skills`);
}

main().catch(console.error);
