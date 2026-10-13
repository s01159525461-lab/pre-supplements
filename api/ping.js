'use strict';
// صفحة فحص مؤقتة: افتح /api/ping ثم /api/ping?step=fetch ثم ?step=db ثم ?step=app  (امسح الملف ده بعد ما الموقع يشتغل)
const out = (res, obj, code = 200) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj, null, 1)); };
const err = (e) => ({ error: String(e && e.message || e).slice(0, 400), stack: String(e && e.stack || '').split('\n').slice(1, 5).map((s) => s.trim().replace(/\/var\/task\//, '')) });

module.exports = async (req, res) => {
  const step = new URL(req.url, 'http://x').searchParams.get('step') || 'env';
  const url = process.env.TURSO_DATABASE_URL || '', tok = process.env.TURSO_AUTH_TOKEN || '';
  try {
    if (step === 'env') {
      let host = ''; try { host = new URL(url.replace(/^libsql:/, 'https:')).host; } catch { host = 'INVALID URL'; }
      return out(res, { node: process.version, vercel: !!process.env.VERCEL, tursoHost: host, tokenLength: tok.length, jwtSecretLength: (process.env.JWT_SECRET || '').length, adminEmailSet: !!process.env.ADMIN_EMAIL, adminPasswordSet: !!process.env.ADMIN_PASSWORD, seedDemo: process.env.SEED_DEMO || null });
    }
    if (step === 'fetch') {
      const t0 = Date.now();
      const r = await fetch(url.replace(/^libsql:\/\//, 'https://').replace(/\/+$/, '') + '/v2/pipeline', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql: 'SELECT 1 AS x' } }, { type: 'close' }] }), signal: AbortSignal.timeout(15000) });
      return out(res, { status: r.status, ms: Date.now() - t0, body: (await r.text()).slice(0, 300) });
    }
    if (step === 'db') {
      const t0 = Date.now(); const { q } = require('../lib/db');
      return out(res, { ok: q.get('SELECT 1 AS x'), tables: q.get("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table'"), ms: Date.now() - t0 });
    }
    if (step === 'app') { const t0 = Date.now(); require('../lib/app'); return out(res, { loaded: true, ms: Date.now() - t0 }); }
    return out(res, { error: 'unknown step' }, 400);
  } catch (e) { return out(res, { step, ...err(e) }, 500); }
};
