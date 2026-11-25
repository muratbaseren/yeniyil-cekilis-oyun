#!/usr/bin/env node
/* =====================================================================
   Katılımcıları oluştur  →  tools/katilimcilar.json
   ---------------------------------------------------------------------
   Kullanım:
     npm run kisiler                          (isimleri ve cinsiyetleri sorar)
     npm run kisiler Ali:e Ayşe:k Ece:k Can:e (doğrudan ver; e = erkek, k = kadın)
   Seçenek:
     --evet   Var olan dosyanın üzerine sormadan yaz

   Saç: kadın → uzun, erkek → kısa. Kıyafet, saç rengi, bere, gözlük ve
   atkı RASTGELE atanır. Beğenmezsen komutu tekrar çalıştır ya da
   tools/katilimcilar.json dosyasını elle düzenle.
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools/katilimcilar.json');
const MIN = 3, MAX = 20, MAX_LEN = 24;

const SHIRTS = ['#d62839', '#1d6fd8', '#9b5de5', '#2a9d8f', '#ff6fae', '#f4a261', '#3fb950', '#ffb547', '#e76f51', '#5ad1ff', '#8338ec', '#06d6a0'];
const PANTS = ['#2b2d42', '#333a4d', '#22223b', '#3d405b', '#4a4e69', '#264653', '#1f2a44', '#2d3142'];
const HAIR = ['#3b2416', '#1e1a17', '#5a3420', '#2a1a12', '#c88a3a', '#2b1b10', '#d9a441', '#120d0a', '#8a4b2a', '#e0c08a'];
const SCARF = ['#ffffff', '#e63946', '#f7d046', '#5ad1ff', '#2fbf71', '#ff6fae'];
const pick = a => a[Math.floor(Math.random() * a.length)];
const key = s => s.toLocaleLowerCase('tr-TR');

/* "e", "erkek", "k", "kadın" → 'erkek' | 'kadin' | null */
function gender(s) {
  const g = key(String(s || '').trim());
  if (/^(e|erkek|m|male)$/.test(g)) return 'erkek';
  if (/^(k|kad[ıi]n|f|female)$/.test(g)) return 'kadin';
  return null;
}
/* "Ali:e", "Ayşe (k)", "Ece" → {name, g} */
function parseEntry(s) {
  s = s.trim().replace(/\s+/g, ' ');
  const m = s.match(/^(.*?)\s*(?::|\(|\s-\s)\s*(e|k|erkek|kad[ıi]n)\s*\)?$/i);
  return m ? { name: m[1].trim(), g: gender(m[2]) } : { name: s, g: null };
}
const splitList = t => t.split(/[,\n;]+/).map(x => x.trim()).filter(Boolean);

function validate(list) {
  const errs = [];
  if (list.length < MIN) errs.push(`En az ${MIN} kişi gerekli (şu an ${list.length}).`);
  if (list.length > MAX) errs.push(`En fazla ${MAX} kişi önerilir (şu an ${list.length}); sahne yavaşlayabilir.`);
  const seen = new Set();
  list.forEach(({ name }) => {
    if (!name) errs.push('Boş isim var.');
    if (name.length > MAX_LEN) errs.push(`"${name}" çok uzun (en fazla ${MAX_LEN} karakter).`);
    if (seen.has(key(name))) errs.push(`"${name}" iki kez yazılmış.`); seen.add(key(name));
  });
  if (errs.length) { console.error('\n❌ ' + errs.join('\n❌ ')); process.exit(1); }
}

/* Satır satır okuyan basit soru-cevap (terminal ya da yönlendirilmiş girdi) */
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
const queue = [], waiters = []; let closed = false;
rl.on('line', l => waiters.length ? waiters.shift()(l) : queue.push(l));
rl.on('close', () => { closed = true; while (waiters.length) waiters.shift()(null); });
const ask = q => { process.stdout.write(q); return queue.length ? Promise.resolve(queue.shift()) : closed ? Promise.resolve(null) : new Promise(r => waiters.push(r)); };

async function main() {
  const args = process.argv.slice(2), yes = args.includes('--evet');
  let list = splitList(args.filter(a => !a.startsWith('--')).join(',')).map(parseEntry);
  if (list.length) validate(list);

  if (fs.existsSync(OUT) && !yes) {
    const a = await ask(`⚠️  ${path.relative(ROOT, OUT)} zaten var. Üzerine yazılsın mı? (e/h) `);
    if (!/^e/i.test((a || '').trim())) { console.log('\nVazgeçildi.'); return; }
  }

  if (!list.length) {
    console.log('\n🎄 Katılımcı isimlerini gir.');
    console.log('   Virgülle ayırabilir ya da her satıra bir isim yazabilirsin.');
    console.log('   İstersen cinsiyeti isimle birlikte yaz: Ali:e, Ayşe:k  (e = erkek, k = kadın)');
    console.log('   Bitirmek için boş satırda Enter.\n');
    const lines = [];
    for (let first = true; ; first = false) { const l = await ask(first ? 'İsim(ler): ' : '> '); if (l == null || !l.trim()) break; lines.push(l); }
    list = splitList(lines.join('\n')).map(parseEntry);
    validate(list);
  }

  // Cinsiyeti eksik olanlara sor
  const missing = list.filter(p => !p.g);
  if (missing.length) {
    console.log('\n👫 Cinsiyetler (e = erkek, k = kadın):');
    for (const p of missing) {
      for (;;) {
        const a = await ask(`   ${p.name}: `);
        if (a == null) { console.error(`\n❌ "${p.name}" için cinsiyet girilmedi.`); process.exit(1); }
        p.g = gender(a); if (p.g) break; console.log('     ↳ Lütfen e ya da k yaz.');
      }
    }
  }

  // Görünümler: saç cinsiyete göre, gerisi rastgele (gömlekler mümkün olduğunca farklı)
  const shirts = [...SHIRTS].sort(() => Math.random() - .5);
  const people = list.map(({ name, g }, i) => ({
    name, gender: g,
    look: {
      shirt: shirts[i % shirts.length],
      pants: pick(PANTS),
      hair: pick(HAIR),
      hairStyle: g === 'kadin' ? 'uzun' : 'kisa',
      hat: Math.random() < .35 ? 'bere' : 'none',
      glasses: Math.random() < .25,
      scarf: Math.random() < .45 ? pick(SCARF) : null
    }
  }));

  fs.writeFileSync(OUT, JSON.stringify({
    _not: 'npm run kisiler ile üretildi. look alanları elle değiştirilebilir: shirt/pants/hair (renk), hairStyle: kisa|uzun, hat: bere|none, glasses: true/false, scarf: renk ya da null',
    people
  }, null, 2) + '\n');

  console.log(`\n✅ ${people.length} katılımcı yazıldı → ${path.relative(ROOT, OUT)}\n`);
  people.forEach(p => {
    const l = p.look, extra = [l.hat === 'bere' ? 'bere' : '', l.glasses ? 'gözlük' : '', l.scarf ? 'atkı' : ''].filter(Boolean).join(', ');
    console.log(`   ${p.gender === 'kadin' ? '👩' : '👨'} ${p.name.padEnd(MAX_LEN)} ${l.hairStyle === 'uzun' ? 'uzun saç' : 'kısa saç'}${extra ? ', ' + extra : ''}`);
  });
  console.log('\n👉 Sıradaki adım: npm run kura https://SITENIZ.netlify.app/');
}
main().finally(() => rl.close());
