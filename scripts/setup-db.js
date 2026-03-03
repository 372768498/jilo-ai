const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 用连接字符串方式
const client = new Client({
  connectionString: 'postgresql://postgres.xlldqubzkqauvswiiwjw:NNJhGTgC4qlrMbsu@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    await client.connect();
    console.log('Connected!');

    // 建表
    const createSQL = fs.readFileSync(
      path.join(__dirname, 'sql/create-openclaw-skills.sql'), 'utf8'
    );
    await client.query(createSQL);
    console.log('Table created!');

    // 灌数据
    const seedSQL = fs.readFileSync(
      path.join(__dirname, 'sql/seed-openclaw-skills.sql'), 'utf8'
    );
    await client.query(seedSQL);
    console.log('Data seeded!');

    // 验证
    const res = await client.query('SELECT count(*) FROM openclaw_skills');
    console.log('Total rows:', res.rows[0].count);

    await client.end();
  } catch (e) {
    console.error('Error:', e.message);
    await client.end();
  }
})();
