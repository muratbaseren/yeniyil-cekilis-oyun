# 🎄 Yılbaşı Gecesi · Gizli Kura (Hediyeleşme) Oyunu

Arkadaş ya da aile grubunuz için tarayıcıda çalışan bir yılbaşı oyunu:

- 🎁 **Gizli kura:** Herkes kime hediye alacağını yalnızca kendi özel linki ve gizli koduyla görür. Kimse kendine çıkmaz.
- 🏬 **3B yılbaşı gecesi sahnesi:** Katılımcılar karakter olarak dolaşır, karşılaşınca sohbet edip birbirine hediye verir.
- 🎮 **4 mini oyun:** Hediye Yakala, Süs Eşleştir, Baca Atışı, Kartopu Savaşı. Ortak bir skor tablosu var.
- ⏳ **Geri sayım:** Yılbaşına sayar, 00:00'da havai fişek atılır.

Ücretsiz bir **Netlify** hesabıyla yayınlanır. Sunucu kurmanız gerekmez.

---

## ✅ Gereksinimler

| Ne | Nereden |
|---|---|
| **Node.js 18+** | https://nodejs.org (LTS sürümü). Kontrol: `node -v` |
| **Netlify hesabı** (ücretsiz) | https://app.netlify.com/signup |
| **Netlify CLI** | `npm install -g netlify-cli` |

---

## ⚡ Hızlı başlangıç (özet)

```bash
npm install                      # 1. bağımlılıklar
netlify login                    # 2. Netlify'a giriş
netlify sites:create --name SITE-ADINIZ
netlify link --name SITE-ADINIZ  # 3. site + klasör bağlantısı
npm run kisiler                  # 4. isimleri + cinsiyetleri gir
npm run kura https://SITE-ADINIZ.netlify.app/   # 5. kurayı çek
npm run deploy                   # 6. yayınla
```

Ardından `tools/out/mesajlar.txt` dosyasındaki link ve kodları herkese tek tek gönderin. Ayrıntılar aşağıda 👇

---

## 🚀 Adım adım kurulum

### 1. Projeyi indir
```bash
git clone https://github.com/KULLANICI/REPO.git
cd REPO
```
Ya da GitHub'da **Code → Download ZIP** ile indirip klasöre girin.

### 2. Bağımlılıkları kur
```bash
npm install
```

### 3. Netlify'a giriş yap ve siteyi oluştur
```bash
netlify login
netlify sites:create --name yilbasi-ailem
netlify link --name yilbasi-ailem
```
- `--name` benzersiz olmalı. Siteniz `https://yilbasi-ailem.netlify.app` olur.
- `sites:create` ekip (team) seçmenizi isteyebilir, kendi hesabınızı seçin.

> 🔑 **Önemli sıra:** Önce site adresi belli olur, **sonra** kura çekilir. Davet linkleri bu adrese göre üretilir.

### 4. Katılımcıları gir
```bash
npm run kisiler
```
1. İsimleri virgülle ayırarak ya da her satıra bir isim yazın. Bitirmek için boş satırda Enter'a basın.
2. Script ardından her kişinin cinsiyetini sorar: `e` = erkek, `k` = kadın.

Cinsiyeti isimle birlikte yazarsanız ayrıca sormaz:
```bash
npm run kisiler Ali:e Ayşe:k "Can Deniz:e" Ece:k
```
- En az **3**, önerilen en fazla **20** kişi.
- **Saç cinsiyete göre:** kadın → uzun, erkek → kısa.
- **Geri kalanı rastgele:** kıyafet ve saç rengi, bere, gözlük, atkı. Beğenmezseniz komutu tekrar çalıştırın ya da `tools/katilimcilar.json` dosyasını elle düzenleyin (alanlar için bkz. [Özelleştirme](#-özelleştirme)).

### 5. Kurayı çek
```bash
npm run kura https://yilbasi-ailem.netlify.app/
```
- Adresi **kendi sitenizin adresiyle** yazın. `https://` yazmasanız da olur.
- Ekranda şunları görmelisiniz:
  - `✅ Kura tamam: N kişi, sonuçlar şifrelendi ve doğrulandı.`
  - `🌐 Davet linkleri: https://yilbasi-ailem.netlify.app/?p=…`

  Buradaki adresin doğru olduğunu kontrol edin.

> 💡 `npm run kura -- --url https://…` biçimi de çalışır. Ancak Windows PowerShell `--` işaretini yuttuğu için en sorunsuz yazım yukarıdaki gibi **adresi doğrudan** vermektir.

Oluşan dosyalar:

| Dosya | İçerik |
|---|---|
| `site/kura.js` | Şifreli kura (oyun bunu okur) |
| `netlify/shared/ids.mjs` | Skor kaydı için geçerli kişi listesi |
| `tools/out/mesajlar.txt` | Her kişi için **link + gizli kod** (🔒 gizli!) |

> 🙈 **Kör kura:** Sonuçlar hiçbir yerde düz metin olarak yazılmaz, ekrana da basılmaz. Kurayı çeken kişi de sonuçları göremez.

### 6. Yayınla
```bash
npm run deploy
```
> ⚠️ Yayını mutlaka bu komutla yapın. Netlify Drop (sürükle-bırak) ve GitHub bağlantılı otomatik yayın skor sistemini ya da kurayı **çalıştırmaz** (bkz. [Neden CLI?](#-neden-cli-ile-yayın)).

### 7. Kontrol et
1. `https://yilbasi-ailem.netlify.app/api/scores` adresi `{}` döndürmeli (skor sistemi çalışıyor demek).
2. **Kendi linkinizi** açın: "Hoş geldin …! 🎄" yazısını görmelisiniz.
3. Danışma bankosuna gidip kendi kodunuzla kutuyu açın.
4. Bir mini oyun oynayın, 🏆 düğmesinden skorunuzun göründüğüne bakın.

### 8. Davetleri gönder
- `tools/out/mesajlar.txt` dosyasında her kişinin bloğu ayrı. Her bloğu yalnızca o kişiye gönderin (WhatsApp, e-posta vb.).
- Hepsini gönderdikten sonra bu dosyayı **silin**.

---

## 🧪 Yerelde deneme (isteğe bağlı)
```bash
npm run dev
```
`http://localhost:8888` adresinde oyun ve skor sistemi birlikte çalışır. Kendinizi test etmek için adresin sonuna `?p=KISI_ID` ekleyin. Id'yi `mesajlar.txt` içindeki linkten alabilirsiniz.

---

## 🔄 Sonradan değişiklik

| Durum | Ne yapmalı |
|---|---|
| Oyun kodunu değiştirdim (`site/index.html`) | `npm run deploy`. Kura **korunur**, linkler aynı kalır. |
| Kişi ekleyip çıkarmak / kurayı yeniden çekmek istiyorum | `npm run kisiler` → `npm run kura https://SITE-ADINIZ.netlify.app/` → `npm run deploy` → **yeni** mesajları herkese gönderin. Eski linkler geçersiz olur. |
| Sadece görünümleri değiştirdim (`katilimcilar.json`) | Görünümler kurayla birlikte gömülür. `npm run kura https://SITE-ADINIZ.netlify.app/` + `npm run deploy` gerekir, linkler değişir. |

---

## 👀 Misafir modu
Link'te geçerli `?p=` yoksa ya da yanlışsa oyun **misafir** olarak açılır:

| Özellik | Misafir |
|---|---|
| Sahneyi gezmek, mini oyunlar | ✅ |
| Danışmadan kura sonucu almak | ❌ "Sadece özel davet linkiyle" mesajı çıkar |
| Skor kaydı | ❌ |

---

## 🎨 Özelleştirme

**Görünümler** (`tools/katilimcilar.json`), kişi başına:

| Alan | Değerler |
|---|---|
| `gender` | `erkek` / `kadin` (kişi düzeyinde; saç uzunluğunu `npm run kisiler` buna göre seçer) |
| `shirt`, `pants`, `hair` | Renk kodu (`#d62839` gibi) |
| `hat` | `bere` / `none` |
| `hairStyle` | `kisa` / `uzun` |
| `glasses` | `true` / `false` |
| `scarf` | Renk kodu ya da `null` |

**Diğerleri:**
- **Açılış görseli:** `site/splash.jpg` dosyasını kendi görselinizle değiştirin. Dikey (yaklaşık 9:16) önerilir.
- **Yılbaşı tarihi:** Otomatik. Her zaman bir sonraki 1 Ocak'a sayar, 1-7 Ocak arası kutlama modundadır.
- **Metinler:** `site/index.html` içinde `MSG` (danışma ve oda mesajları) ve `GAME_*` (oyun açıklamaları) bölümlerinde.

---

## 🔒 Public repo ve gizlilik

Kişisel ve üretilen dosyalar `.gitignore` içinde, **repoya gitmez**:
```
tools/katilimcilar.json   # isimler
tools/out/                # linkler + gizli kodlar
site/kura.js              # şifreli kura
netlify/shared/ids.mjs    # kişi id'leri
```
Repoda yalnızca örnek bir liste bulunur: `tools/katilimcilar.ornek.json`.

### ❓ Neden CLI ile yayın?
Kura dosyaları (`site/kura.js`, `ids.mjs`) bilerek repoya konmaz. Netlify'ı GitHub'a bağlayıp otomatik yayın yaparsanız bu dosyalar sunucuya hiç gitmez, kura ve skor çalışmaz. `npm run deploy` (Netlify CLI) ise yerel klasörünüzdeki dosyaları doğrudan yükler.

---

## 🛠️ Sorun giderme

| Belirti | Çözüm |
|---|---|
| `netlify: command not found` | `npm install -g netlify-cli` |
| `❌ Katılımcı dosyası yok` | Önce `npm run kisiler` çalıştırın. |
| `❌ Site adresi verilmedi` | Adresi komuta ekleyin: `npm run kura https://SITE-ADINIZ.netlify.app/` |
| `mesajlar.txt` içinde yanlış adres var | `npm run kura https://DOGRU-ADRES.netlify.app/` ile tekrar çekip `npm run deploy` yapın. Ya da kurayı bozmadan dosyada bul-değiştir yapın. |
| Kendi linkimde "Misafir" yazıyor | Link eski bir kuraya ait ya da son kuradan sonra yayın yapılmadı. `npm run deploy` sonrası tekrar deneyin. |
| `/api/scores` 404 veriyor | Yayın `npm run deploy` ile yapılmamış (Drop / Git ile yapılmış olabilir). |
| Deploy hatası: `ids.mjs` bulunamadı | Kura çekilmeden yayın yapılmış. Önce `npm run kura https://SITE-ADINIZ.netlify.app/`. |
| "Bu kod eşleşmedi" | Kod son kuraya mı ait? Büyük/küçük harf, tire ve boşluk fark etmez. |
| Site askıya alındı | Ücretsiz plan kotası dolmuş olabilir. Netlify panelinde **Billing** bölümüne bakın, gereksiz deploy yapmayın. |

---

## 🔐 Güvenlik özeti

- **Şifreleme:** PBKDF2-SHA256 (600.000 tur) → AES-GCM-256.
- **Kod:** 2 kelime + 4 rakam (yaklaşık 27,5 bit).
- **Sızıntı önlemleri:** Sonuçlar eşit uzunluğa doldurulur, sırası karıştırılır. Oyun, girilen kodu bütün kayıtlarda dener; kişi ile kayıt arasında bağlantı yoktur.
- **Anahtar yok:** `kura.js` dosyasında anahtar bulunmaz. Dosyayı ele geçiren biri sonuçları göremez.
- **Kaba kuvvet:** Tek CPU çekirdeğiyle aylar sürer, güçlü bir GPU ile saatler/günler mertebesindedir. Arkadaş ve aile kullanımı için yeterlidir.
- **Skor sunucusu:** Yalnızca kayıtlı kişi id'lerini ve makul skorları (0-5000) kabul eder. Kura verisi sunucuda **tutulmaz**.

---

## 📁 Proje yapısı
```
site/index.html                 oyun (tek dosya, Three.js)
site/splash.jpg                 açılış ekranı görseli
site/kura.js                    ⟵ npm run kura üretir
tools/kisiler.mjs               katılımcı listesi + rastgele görünüm üretici
tools/kura.mjs                  kör kura script'i
tools/katilimcilar.ornek.json   örnek liste
netlify/functions/scores.mjs    /api/scores (Netlify Blobs)
netlify.toml                    yayın ayarları (sadece site/ yayınlanır)
```
