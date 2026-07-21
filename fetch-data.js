const https = require('https');
const fs = require('fs');

const DB_ID = '8887bdc6711744e78475aed069f808ca';
const TOKEN = (process.env.NOTION_TOKEN || '').replace(/[^\x21-\x7E]/g, '');

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
        '\uc774\ub984': g(p['\uc774\ub984'],'title'),
        '\uc5f0\ub77d\ucc98': g(p['\uc5f0\ub77d\ucc98'],'phone_number'),
        '\uc774\uba54\uc77c': g(p['\uc774\uba54\uc77c'],'email'),
        '\uc9c0\uc6d0\uc9c1\ubb34': g(p['\uc9c0\uc6d0\uc9c1\ubb34'],'select'),
        '\uc9c0\uc6d0\ub9e4\uc7a5': g(p['\uc9c0\uc6d0\ub9e4\uc7a5'],'rich_text'),
        '\ud559\ub825': g(p['\ud559\ub825'],'rich_text'),
        '\uc9c4\ud589\uc0c1\ud0dc': g(p['\uc9c4\ud589\uc0c1\ud0dc'],'select'),
        '\uba74\uc811\uad00': g(p['\uba74\uc811\uad00'],'rich_text'),
        '\ud3c9\uac00\uc810\uc218': g(p['\ud3c9\uac00\uc810\uc218'],'number'),
        '\uac15\uc810': g(p['\uac15\uc810'],'rich_text'),
        '\uc6b0\ub824\uc0ac\ud56d\uac10\uc810\uc694\uc778': g(p['\uc6b0\ub824\uc0ac\ud56d\uac10\uc810\uc694\uc778'],'rich_text'),
        '\uacbd\ub825\uc774\ub825\uc11c\uc694\uc57d': g(p['\uacbd\ub825\uc774\ub825\uc11c\uc694\uc57d'],'rich_text'),
        '\uc0dd\ub144\uc6d4\uc77c': g(p['\uc0dd\ub144\uc6d4\uc77c'],'date'),
        '\uba74\uc811\uc77c': g(p['\uba74\uc811\uc77c'],'date'),
        '\uc785\uc0ac\uc77c': g(p['\uc785\uc0ac\uc77c'],'date'),
        createdTime: page.created_time
      };
    }).sort((a,b)=> new Date(b.createdTime)-new Date(a.createdTime));

    fs.writeFileSync('data.json', JSON.stringify({ results, updated: new Date().toISOString() }, null, 2));
    console.log(`Saved ${results.length} records`);
  });
});
req.on('error', e => { console.error(e); process.exit(1); });
req.write(body);
req.end();
