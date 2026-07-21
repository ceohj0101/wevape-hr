const https = require('https');
const fs = require('fs');

const DB_ID = '8887bdc6711744e78475aed069f808ca';
const TOKEN = (process.env.NOTION_TOKEN || '').trim();

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
        ì´ë¦: g(p['ì´ë¦'],'title'),
        ì°ë½ì²: g(p['ì°ë½ì²'],'phone_number'),
        ì´ë©ì¼: g(p['ì´ë©ì¼'],'email'),
        ì§ìì§ë¬´: g(p['ì§ìì§ë¬´'],'select'),
        ì§ìë§¤ì¥: g(p['ì§ìë§¤ì¥'],'rich_text'),
        íë ¥: g(p['íë ¥'],'rich_text'),
        ì§íìí: g(p['ì§íìí'],'select'),
        ë©´ì ê´: g(p['ë©´ì ê´'],'rich_text'),
        íê°ì ì: g(p['íê°ì ì'],'number'),
        ê°ì : g(p['ê°ì '],'rich_text'),
        ì°ë ¤ì¬í­ê°ì ìì¸: g(p['ì°ë ¤ì¬í­ê°ì ìì¸'],'rich_text'),
        ê²½ë ¥ì´ë ¥ììì½: g(p['ê²½ë ¥ì´ë ¥ììì½'],'rich_text'),
        ìëìì¼: g(p['ìëìì¼'],'date'),
        ë©´ì ì¼: g(p['ë©´ì ì¼'],'date'),
        ìì¬ì¼: g(p['ìì¬ì¼'],'date'),
        createdTime: page.created_time
      };
    }).sort((a,b)=> new Date(b.createdTime)-new Date(a.createdTime));

    fs.writeFileSync('data.json', JSON.stringify({ results, updated: new Date().toISOString() }, null, 2));
    console.log(`â Saved ${results.length} records`);
  });
});
req.on('error', e => { console.error(e); process.exit(1); });
req.write(body);
req.end();
