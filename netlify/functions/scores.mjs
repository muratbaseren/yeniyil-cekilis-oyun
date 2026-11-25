// Yılbaşı oyunu skor uç noktası — Netlify Functions (v2) + Netlify Blobs
//   GET  /api/scores            -> { "<oyun>": { "<kisiId>": { s, t } } }
//   POST /api/scores {p,game,score} -> kişinin o oyundaki en iyi skoru güncellenir
// Kura verisinden HİÇBİR ŞEY burada tutulmaz; sadece kişi id + skor.
import { getStore } from '@netlify/blobs';
import { IDS } from '../shared/ids.mjs';

// Oyun anahtarı -> kabul edilen en yüksek skor (basit hile filtresi)
const GAMES = { kizak: 5000, cam: 5000, baca: 5000, kartopu: 5000 };

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export default async (req) => {
  const store = getStore({ name: 'yilbasi-skor', consistency: 'strong' });

  if (req.method === 'GET') {
    const { blobs } = await store.list({ prefix: 's/' });
    const out = {};
    await Promise.all(blobs.map(async ({ key }) => {
      const [, game, p] = key.split('/');
      const v = await store.get(key, { type: 'json' });
      if (v && GAMES[game] !== undefined) (out[game] ||= {})[p] = v;
    }));
    return json(out);
  }

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch { return json({ error: 'geçersiz istek' }, 400); }
    const { p, game } = body || {};
    const score = Math.floor(Number(body?.score));
    if (!IDS.includes(p)) return json({ error: 'kişi bulunamadı' }, 403);
    if (GAMES[game] === undefined) return json({ error: 'oyun bulunamadı' }, 400);
    if (!Number.isFinite(score) || score < 0 || score > GAMES[game]) return json({ error: 'skor geçersiz' }, 400);

    const key = `s/${game}/${p}`;            // kişi+oyun başına ayrı kayıt: yarış durumu yok
    const old = await store.get(key, { type: 'json' });
    if (old && old.s >= score) return json({ ok: true, best: old.s, yeniRekor: false });
    await store.setJSON(key, { s: score, t: Date.now() });
    return json({ ok: true, best: score, yeniRekor: true });
  }

  return json({ error: 'yöntem desteklenmiyor' }, 405);
};

export const config = { path: '/api/scores' };
