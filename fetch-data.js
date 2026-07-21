const https = require('https');
const fs = require('fs');

const DB_ID = '8887bdc6711744e78475aed069f808ca';
const TOKEN = process.env.NOTION_TOKEN;

if (!TOKEN) { console.error('NOTION_TOKEN missing'); process.exit(1); }

const body = JSON.stringify({ page_size: 100 });
const opts = {
  hostname: 'api.notion.com',
  path: `/v1/databases/${DB_ID}/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = https.request(opts, res => {
  let raw = '';
  res.on('data', c => raw += c);
  res.on('end', () => {
    const data = JSON.parse(raw);
    if (data.status === 401) { console.error('Unauthorized:', raw); process.exit(1); }
    const g = (p, t) => {
      if (!p) return null;
      if (t === 'title')        return p.title?.[0]?.plain_text ?? null;
      if (t === 'select')       return p.select?.name ?? null;
      if (t === 'rich_text')    return p.rich_text?.[0]?.plain_text ?? null;
      if (t === 'phone_number') return p.phone_number ?? null;
      if (t === 'email')        return p.email ?? null;
      if (t === 'number')       return p.number ?? null;
      if (t === 'date')         return p.date?.start ?? null;
      return null;
    };
    const results = (data.results || []).map(page => {
      const p = page.properties;
      return {
        id: page.id, url: page.url,
        이름: g(p['이름'],'title'),
        연락처: g(p['연락처'],'phone_number'),
        이메일: g(p['이메일'],'email'),
        지원직무: g(p['지원직무'],'select'),
        지원매장: g(p['지원매장'],'rich_text'),
        학력: g(p['학력'],'rich_text'),
        진행상태: g(p['진행상태'],'select'),
        면접관: g(p['면접관'],'rich_text'),
        평가점수: g(p['평가점수'],'number'),
        강점: g(p['강점'],'rich_text'),
        우려사항감점요인: g(p['우려사항감점요인'],'rich_text'),
        경력이력서요약: g(p['경력이력서요약'],'rich_text'),
        생년월일: g(p['생년월일'],'date'),
        면접일: g(p['면접일'],'date'),
        입사일: g(p['입사일'],'date'),
        createdTime: page.created_time
      };
    }).sort((a,b)=> new Date(b.createdTime)-new Date(a.createdTime));

    fs.writeFileSync('data.json', JSON.stringify({ results, updated: new Date().toISOString() }, null, 2));
    console.log('Saved ' + results.length + ' records');
  });
});
req.on('error', e => { console.error(e); process.exit(1); });
req.write(body);
req.end();
