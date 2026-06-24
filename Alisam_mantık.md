# 🤱 Bebek Takip — Sistem Dökümanı

## 📋 Genel Bakış

Alisa için yapılmış bebek takip uygulaması. İki telefon arasında gerçek zamanlı senkronizasyon ve uygulama kapalıyken bile bildirim gönderme özelliği var.

---

## 🏗️ Mimari

```
┌─────────────────────────────┐
│   Firebase Hosting          │
│   https://alisa-36e99.web.app│
│   index.html, sw.js,        │
│   manifest.json, ikonlar    │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   Firebase Firestore        │
│   Proje: alisa-36e99        │
│   Collection: bebek/ortak   │
│   2 telefon arası senkron   │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   Cloudflare Worker         │
│   bebek-takip.ggroupang     │
│         .workers.dev        │
│   Her 5 dakikada CRON       │
│   FCM ile bildirim gönderir │
└─────────────────────────────┘
```

---

## 📁 Dosya Yapısı

```
bebek-takip/
├── index.html        → Ana uygulama HTML iskeleti (Firebase Hosting)
├── styles.css        → Tüm CSS stilleri (~150 satır)
├── firebase.js       → Firebase + Firestore sync modülü (~58 satır)
├── app.js            → Tüm uygulama JavaScript'i (~900 satır)
├── sw.js             → Service Worker, FCM arka plan bildirimi
├── manifest.json     → PWA ayarları
├── firebase.json     → Firebase Hosting config
├── worker.js         → Cloudflare Worker (CRON + FCM)
├── wrangler.toml     → Cloudflare Worker config
├── icon-192.png      → PWA ikonu (192x192)
├── icon-512.png      → PWA ikonu (512x512)
└── 404.html          → Firebase tarafından oluşturuldu
```

---

## 🔧 Servisler ve Bilgiler

### Firebase
- **Proje ID:** `alisa-36e99`
- **Hosting URL:** https://alisa-36e99.web.app
- **Firestore:** `bebek/ortak` dokümanı (tüm veriler burada)
- **FCM Sender ID:** `649957485100`
- **Service Account:** `firebase-adminsdk-fbsvc@alisa-36e99.iam.gserviceaccount.com`
- **VAPID Key:** `BL7KFu9zxKwbU4InAz3ZA3830V4SxQkN_l7mEr7E1Lh4-iA97T9hzVp-R3JdKzEpUvhNGOpy7cGRnqTW6oqtJ4w`

### Cloudflare Worker
- **Worker URL:** https://bebek-takip.ggroupang.workers.dev
- **KV Namespace:** `BEBEK_KV` (ID: `76a597e2104d463db6aa6dcec8991f14`)
- **CRON:** Her 5 dakikada çalışır (`*/5 * * * *`)
- **Secrets:** `SA_EMAIL`, `SA_KEY`, `FIREBASE_PROJECT_ID`, `API_SECRET`

### GitHub
- **Repo:** https://github.com/Beg-381/bebek-takip

---

## 🔌 API Endpointleri

| Endpoint | Method | Auth | Ne yapar |
|----------|--------|------|----------|
| `/api/register-token` | POST | ❌ Gerekmez | FCM token kaydeder |
| `/api/subscribe` | POST | ❌ Gerekmez | FCM token kaydeder (alias) |
| `/api/update-feed` | POST | ✅ X-API-Secret | Son emzirme zamanını KV'ye yazar |
| `/api/update-vaccine-reminders` | POST | ✅ X-API-Secret | Aşı hatırlatma verisini KV'ye yazar |
| `/api/test-notif` | POST | ✅ X-API-Secret | Test bildirimi gönderir |
| `/api/test-gundayin` | POST | ✅ X-API-Secret | Test günaydın bildirimi |
| `/api/test-iyigeceler` | POST | ✅ X-API-Secret | Test iyi geceler bildirimi |
| `/api/test-surpriz` | POST | ✅ X-API-Secret | Test motivasyon bildirimi |
| `/api/test-vax-reminder` | POST | ✅ X-API-Secret | Aşı hatırlatma testi |
| `/api/kv-debug` | GET | ✅ X-API-Secret | KV'deki aşı verisini gösterir |

---

## 📊 Veri Yapısı (Firestore)

`bebek/ortak` dokümanında şu alanlar var:

```json
{
  "feed": [...],      // Emzirme kayıtları
  "diaper": [...],    // Bez değişimi kayıtları
  "sleep": [...],     // Uyku kayıtları
  "weight": [...],    // Kilo kayıtları
  "height": [...],    // Boy kayıtları
  "fever": [...],     // Ateş kayıtları
  "vaccine": [...],   // Aşı kayıtları
  "notes": [...],     // Notlar
  "customVax": [...], // Özel aşı serileri (Nimenrix, Bexsero, Rotarix vb.)
  "birthDate": 1744857600000  // Doğum tarihi (timestamp)
}
```

---

## 🔔 Bildirim Sistemi Nasıl Çalışır?

1. Kullanıcı "Bildirimleri Etkinleştir" butonuna basar
2. `index.html` Firebase Messaging'den FCM token alır
3. Token Cloudflare Worker'a `/api/register-token` ile gönderilir
4. KV'ye kaydedilir
5. Emzirme kaydedilince `/api/update-feed` çağrılır (API_SECRET ile)
6. Cloudflare her 5 dakikada CRON çalıştırır
7. Vakti gelince FCM üzerinden telefona bildirim gönderilir
8. Geçersiz token'lar otomatik olarak temizlenir

### Bildirim Türleri ve Tag'leri

| Tür | Tag | Saat | Sıklık |
|-----|-----|------|--------|
| Emzirme hatırlatması | `emzirme` | Her an | Ayarlanan aralıkta |
| Günaydın | `gundayin` | 08:00 | Günde 1 |
| İyi geceler | `iyigeceler` | 23:00 | Günde 1 |
| Motivasyon | `surpriz` | 09:00-22:00 | 2-3 saatte 1 |
| Aşı hatırlatması | `vax` | 10:00 | Günde 1 (yaklaşan varsa) |

---

## 🛡️ Güvenlik

### CORS
Worker sadece `https://alisa-36e99.web.app` domain'inden gelen istekleri kabul eder.

### API Secret
`/api/update-feed` ve test endpoint'leri `X-API-Secret` header gerektirir.
- Cloudflare secret adı: `API_SECRET`
- `index.html`'deki değişken: `API_SECRET`
- İkisi **birbiriyle aynı** olmalı

### Firestore Kuralları ⚠️
Yeni veri alanı eklenince Firestore rules güncellenmeli! 
`customVax` alanı eklendiğinde rules izin vermiyordu → sync çalışmadı.
Çözüm: Firebase Console → Firestore → Rules → allow read, write

---

## 🚀 Güncelleme Yapmak

### Site güncellemek (index.html, sw.js vs.)
```bash
cd bebebek-takip
firebase deploy --only hosting
```

### Worker güncellemek (worker.js)
```bash
wrangler deploy
```

---

## 📱 Uygulama Sekmeleri

| Sekme | İkon | Ne yapar |
|-------|------|----------|
| Emzirme | 🤱 | Sol/sağ taraf takibi, süre sayacı, hatırlatma |
| Bez | 🍼 | Islak/kirli bez takibi |
| Uyku | 😴 | Uyku/uyanma takibi |
| Kilo/Boy | ⚖️ | Ölçüm geçmişi |
| Analiz | 📊 | Grafikler, istatistikler |
| Ateş | 🌡️ | Ateş ölçüm geçmişi |
| İğne | 💉 | Özel aşı serisi ekleme, takvim, manuel aşı kaydı |
| Notlar | 📝 | Serbest notlar |
| Yedek | 💾 | Bildirim ayarları, JSON yedek, doğum tarihi |

---

## 🐛 Geçmiş Hatalar ve Çözümleri

### v4 — Haziran 2026: Firestore senkronizasyonu

**Hata:** Özel aşı serileri (customVax) iki cihaz arasında senkronize olmuyordu. Eski veriler (emzirme, bez vb.) senkronize oluyordu.

**Kök neden:** Firestore security rules `customVax` alanına izin vermiyordu. `fsWrite` fonksiyonundaki `catch` bloğu hatayı sessizce yutuyordu. JS kodu baştan beri doğruydu.

**Çözüm:** 
1. Firebase Console → Firestore → Rules → `customVax` alanına izin ver
2. `saveCustomVaccineSeries`, `deleteCustomDose`, `deleteCustomSeries` fonksiyonlarını `sv()` kullanacak şekilde güncelle (diğer veri tipleriyle aynı yol)
3. `exportData` ve `importData` fonksiyonlarına `customVax` ve `birthDate` eklendi
4. `renderStorageInfo` fonksiyonuna `bb_custom_vax` eklendi

**Alınan ders:** Yeni bir Firestore alanı eklenince her zaman security rules'ı kontrol et. Hata sessizce yutuluyorsa konsola bak.

### v3 — Mayıs 2026: API_SECRET modül scope hatası

**Hata:** `API_SECRET` değişkeni `type="module"` script bloğunda tanımlıydı. İkinci script bloğundaki `scheduleNotif` göremiyordu, `/api/update-feed` fetch'i hiç atılmıyordu, KV boş kalıyordu, emzirme bildirimleri gitmiyordu.

**Çözüm:** `window.API_SECRET = API_SECRET` eklendi. `scheduleNotif` içinde `window.API_SECRET` kullanıldı.

### v2 — Nisan 2026: Genel güvenlik ve stabilite

- CORS kısıtlandı
- API endpoint'lere `X-API-Secret` zorunluluğu eklendi
- Geçersiz FCM token'lar otomatik temizleniyor
- Surpriz bildirim interval'i KV'de saklanıyor
- `sw.js` bildirim tag'leri dinamik hale getirildi

---

## ⚠️ Dikkat Edilmesi Gerekenler

1. **Dosya düzenleme:** `index.html`'i düzenlerken minified JS satırlarına dikkat et. Byte-level değişiklik yaparken CRLF line ending'i koru.
2. **Yeni Firestore alanı:** Her yeni alan için Firestore security rules'ı güncelle.
3. **Test:** Değişiklik sonrası her iki cihazda da test et.
4. **Commit:** Her çalışan sürümü commit'le. `0e4356e` çalışan stabil sürümdür.
5. **Worker KV:** KV'ye yazılan veriler production ortamında. `wrangler kv key get` preview'a bakar.
6. **Türkçe karakter:** PowerShell `Set-Content` Türkçe karakterleri bozar. Binary mod kullan.

---

## 👨‍👩‍👧 Kullanıcılar
- **Baba:** Cloudflare hesabı: `Ggroupang@gmail.com`
- **Firebase hesabı:** `bahtiyarcaann@gmail.com`
- **2 telefon** aynı anda kullanabilir, Firestore sayesinde senkronize
