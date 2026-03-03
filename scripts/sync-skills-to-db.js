const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.xlldqubzkqauvswiiwjw:NNJhGTgC4qlrMbsu@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  await client.connect();
  
  // 清空旧数据，重新灌完整21条
  await client.query('DELETE FROM openclaw_skills');
  
  const skills = require('../content/openclaw-skills.json');
  
  for (const s of skills) {
    await client.query(
      `INSERT INTO openclaw_skills (name, slug, description, description_zh, category, author, github_url, clawhub_url, install_command, rating, downloads, tags, featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (slug) DO UPDATE SET
         description=$3, description_zh=$4, rating=$10, downloads=$11, featured=$13, updated_at=now()`,
      [s.name, s.slug, s.description, s.description_zh, s.category, s.author, s.github_url, s.clawhub_url||null, s.install_command, s.rating, s.downloads, s.tags, s.featured]
    );
    console.log('✅', s.slug);
  }
  
  const res = await client.query('SELECT count(*) FROM openclaw_skills');
  console.log('Total:', res.rows[0].count);
  await client.end();
})();
