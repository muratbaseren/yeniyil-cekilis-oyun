#!/usr/bin/env node
/* =====================================================================
   Yılbaşı Hediyeleşme — KÖR KURA
   ---------------------------------------------------------------------
   Kullanım (hepsi geçerli):
     npm run kura https://SITENIZ.netlify.app/
     npm run kura -- --url https://SITENIZ.netlify.app/
     node tools/kura.mjs https://SITENIZ.netlify.app/
   Seçenekler:
     <adres> / --url   Davet linklerinin başı (ZORUNLU)
     --dosya   Katılımcı dosyası (varsayılan: tools/katilimcilar.json)

   Ne yapar?
   1) Kimse kendine çıkmayacak şekilde rastgele eşleştirir.
   2) Her kişiye kelime kodu + link id üretir.
   3) Her sonucu kişinin koduyla şifreler (PBKDF2 -> AES-GCM),
      eşit uzunluğa doldurur, sırasını karıştırır.
   4) Şifreli veriyi site/kura.js dosyasına yazar,
      skor fonksiyonu için id listesini yazar (netlify/shared/ids.mjs).
   5) tools/out/mesajlar.txt dosyasına kişi başına link + kod yazar.

   SONUÇLAR HİÇBİR YERDE DÜZ METİN OLARAK YAZILMAZ / EKRANA BASILMAZ.
   ===================================================================== */
import { webcrypto as wc, randomInt } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const subtle = wc.subtle;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };

/* Site adresi: npm/PowerShell'in "--" ve "--url" işaretlerini yuttuğu durumlar da dahil her yoldan okunur */
function siteUrl() {
  const a = process.argv.slice(2); let u = null;
  const eq = a.find(x => x.startsWith('--url=')); if (eq) u = eq.slice(6);
  const i = a.indexOf('--url'); if (!u && i > -1 && a[i + 1] && !a[i + 1].startsWith('--')) u = a[i + 1];
  if (!u) u = a.find(x => /^https?:\/\//i.test(x) || /\.netlify\.app/i.test(x));          // konumsal adres
  const env = process.env.npm_config_url; if (!u && env && env !== 'true') u = env;       // npm "--url"i kendine aldıysa
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try { const x = new URL(u); return x.origin + (x.pathname.endsWith('/') ? x.pathname : x.pathname + '/'); } catch { return null; }
}
const URL_BASE = siteUrl();
if (!URL_BASE) {
  console.error('❌ Site adresi verilmedi ya da geçersiz.\n   Örnek: npm run kura https://SITENIZ.netlify.app/');
  process.exit(1);
}
const FILE = path.resolve(arg('dosya', path.join(ROOT, 'tools/katilimcilar.json')));
const KURA_JS = path.join(ROOT, 'site/kura.js');
const OUT_DIR = path.join(ROOT, 'tools/out');
const IDS_FILE = path.join(ROOT, 'netlify/shared/ids.mjs');

const ITER = 600000;   // PBKDF2 tur sayısı (tarayıcıyla aynı olmalı)
const PAD = 160;       // düz metin byte uzunluğu (isim uzunluğu sızmasın)

/* ===== Kelime listesi (kod için) ===== */
const WORDS = `KAR BUZ ÇAM KIZAK GEYİK YILDIZ MUM ZİL ÇAN HEDİYE PAKET KURDELE ŞEKER BASTON KURABİYE PASTA KEK
ÇİKOLATA KESTANE MANDALİNA PORTAKAL NAR ELMA ARMUT ÇAY SALEP KAKAO BERE ATKI ELDİVEN KAZAK ÇORAP BOT KAYAK PATEN
KARTOPU TİLKİ AYI PENGUEN BAYKUŞ SİNCAP TAVŞAN KEDİ KÖPEK KUZU MARTI BALİNA YUNUS KAPLAN ASLAN ZÜRAFA FİL PANDA
KOALA KİRPİ KUNDUZ SERÇE KARTAL ŞAHİN AY GÜNEŞ BULUT RÜZGAR ŞİMŞEK DAĞ ORMAN NEHİR DENİZ GÖL ADA KUM TAŞ YAPRAK
ÇİÇEK LALE PAPATYA GÜL MENEKŞE ROKET GEMİ TREN BALON UÇURTMA TOP ROBOT MASAL ŞARKI DAVUL GİTAR KEMAN FLÜT PİYANO
KALEM DEFTER KİTAP HARİTA PUSULA FENER LAMBA IŞIK YELKEN ÇADIR KULE KALE KÖPRÜ SARAY TAÇ ELMAS İNCİ ALTIN GÜMÜŞ
BAKIR KRİSTAL PAMUK BAL REÇEL LOKUM SİMİT POĞAÇA BÖREK PİZZA MAKARNA ÇORBA LİMON ÇİLEK KİRAZ ÜZÜM MUZ KAVUN
KARPUZ FINDIK CEVİZ BADEM FISTIK ZEYTİN PEYNİR`.split(/\s+/).filter(Boolean);

/* Tarayıcıdaki ile BİREBİR aynı normalizasyon */
function norm(s) {
  return String(s).toLocaleUpperCase('tr-TR')
    .replace(/İ/g, 'I').replace(/Ç/g, 'C').replace(/Ş/g, 'S')
    .replace(/Ğ/g, 'G').replace(/Ö/g, 'O').replace(/Ü/g, 'U')
    .replace(/[^A-Z0-9]/g, '');
}
const uniqWords = [...new Map(WORDS.map(w => [norm(w), w])).values()];

/* ===== Yardımcılar ===== */
const b64 = u8 => Buffer.from(u8).toString('base64');
const enc = new TextEncoder();
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function derangement(n) {
  // Kimse kendine çıkmayana kadar karıştır (8 kişi için ortalama ~2.7 deneme)
  for (;;) { const p = shuffle([...Array(n).keys()]); if (p.every((v, i) => v !== i)) return p; }
}
function makeCode() {
  const w1 = uniqWords[randomInt(uniqWords.length)];
  let w2; do { w2 = uniqWords[randomInt(uniqWords.length)]; } while (w2 === w1);
  return `${w1}-${w2}-${String(randomInt(10000)).padStart(4, '0')}`;
}
function makeId() { const a = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = ''; for (let i = 0; i < 6; i++) s += a[randomInt(a.length)]; return s; }
async function deriveKey(code, salt) {
  const base = await subtle.importKey('raw', enc.encode(norm(code)), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

/* ===== Ana akış ===== */
if (!fs.existsSync(FILE)) { console.error('❌ Katılımcı dosyası yok: ' + path.relative(ROOT, FILE) + '\n   Önce: npm run kisiler'); process.exit(1); }
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const people = data.people;
if (!Array.isArray(people) || people.length < 3) throw new Error('En az 3 katılımcı gerekli.');
const names = people.map(p => p.name.trim());
if (new Set(names.map(norm)).size !== names.length) throw new Error('İsimler benzersiz olmalı.');

const perm = derangement(people.length);
const salt = wc.getRandomValues(new Uint8Array(16));

const codes = []; const ids = [];
while (codes.length < people.length) { const c = makeCode(); if (!codes.some(x => norm(x) === norm(c))) codes.push(c); }
while (ids.length < people.length) { const id = makeId(); if (!ids.includes(id)) ids.push(id); }

const blobs = [];
for (let i = 0; i < people.length; i++) {
  const key = await deriveKey(codes[i], salt);
  let json = JSON.stringify({ v: 1, g: names[i], r: names[perm[i]] });
  const bytes = enc.encode(json);
  if (bytes.length > PAD) throw new Error('İsim çok uzun.');
  const padded = new Uint8Array(PAD).fill(32); padded.set(bytes);   // boşlukla doldur
  const iv = wc.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, padded));
  blobs.push({ iv: b64(iv), ct: b64(ct) });
}
shuffle(blobs);   // sıra kişiyle ilişkilendirilemesin

/* ===== Kendi kendine doğrulama (sonuç basmadan) ===== */
{
  const dec = new TextDecoder();
  const seenR = new Set();
  for (let i = 0; i < people.length; i++) {
    const key = await deriveKey(codes[i], salt); let hit = 0;
    for (const b of blobs) {
      try {
        const pt = await subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(b.iv, 'base64') }, key, Buffer.from(b.ct, 'base64'));
        const o = JSON.parse(dec.decode(pt)); hit++;
        if (o.g !== names[i] || o.r === o.g) throw new Error('Doğrulama hatası');
        seenR.add(o.r);
      } catch (e) { if (e.message === 'Doğrulama hatası') throw e; }
    }
    if (hit !== 1) throw new Error('Doğrulama hatası (kod eşleşmesi)');
  }
  if (seenR.size !== people.length) throw new Error('Doğrulama hatası (herkes tam bir kez alınmalı)');
}

/* ===== Çıktılar ===== */
const KURA = {
  v: 1, iter: ITER, salt: b64(salt), blobs,
  people: people.map((p, i) => ({ id: ids[i], name: names[i], look: p.look || {} }))
};
fs.writeFileSync(KURA_JS, `// tools/kura.mjs tarafından üretildi — elle düzenleme\nwindow.KURA = ${JSON.stringify(KURA)};\n`);

fs.mkdirSync(path.dirname(IDS_FILE), { recursive: true });
fs.writeFileSync(IDS_FILE, `// kura.mjs tarafından üretildi\nexport const IDS = ${JSON.stringify(ids)};\n`);

fs.mkdirSync(OUT_DIR, { recursive: true });
const base = URL_BASE;
const lines = people.map((p, i) =>
`=== ${names[i]} ===
🎄 Merhaba ${names[i]}! Yılbaşı hediyeleşme oyununa davetlisin 🎁
Oyun linkin: ${base}?p=${ids[i]}
Gizli kodun: ${codes[i]}
(Kodu kimseyle paylaşma! Danışma bankosunda soracaklar 😉)
`);
fs.writeFileSync(path.join(OUT_DIR, 'mesajlar.txt'), lines.join('\n'));

const bits = Math.log2(uniqWords.length * (uniqWords.length - 1) * 10000).toFixed(1);
console.log(`✅ Kura tamam: ${people.length} kişi, sonuçlar şifrelendi ve doğrulandı.`);
console.log(`🔑 Kod gücü ≈ ${bits} bit (${uniqWords.length} kelime), PBKDF2 ${ITER} tur.`);
console.log(`🌐 Davet linkleri: ${base}?p=…`);
console.log(`📄 ${path.relative(ROOT, KURA_JS)} yazıldı`);
console.log(`📄 ${path.relative(ROOT, IDS_FILE)} güncellendi`);
console.log(`✉️  Mesajlar: ${path.relative(ROOT, path.join(OUT_DIR, 'mesajlar.txt'))}  (GitHub'a GÖNDERME!)`);
