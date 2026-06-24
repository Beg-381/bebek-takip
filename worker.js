// ── Cloudflare Worker — Bebek Takip API ──

const ALLOWED_ORIGIN = 'https://alisa-36e99.web.app';

function corsHeaders(origin) {
  const allowed = (origin === ALLOWED_ORIGIN || origin === 'http://localhost:5000');
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Secret',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };
}

function checkSecret(request, env) {
  const secret = request.headers.get('X-API-Secret');
  return secret && secret === env.API_SECRET;
}

// ── Mesaj listeleri ──
const MESAJLAR = {
  gundayin: [
    { title: '🌸 Günaydın Eda!', body: 'Alisa Nur seni bekliyor, hadi güne başla! ☀️' },
    { title: '☀️ Günaydın Eda!', body: 'Yeni bir gün, yeni bir başlangıç. Sen hazırsın! 💪' },
    { title: '🌈 Günaydın Eda!', body: 'Alisa Nur\'un ilk bakışı bugün de sana olacak 💕' },
    { title: '🌺 Günaydın Eda!', body: 'Dünyanın en güzel sabahı, dünyanın en güzel annesiyle başlıyor 🌟' },
    { title: '✨ Günaydın Eda!', body: 'Bugün de harikasın, Alisa Nur biliyor bunu 👶' },
    { title: '🐣 Günaydın Eda!', body: 'Minik Alisa Nur\'un yanında olmak ne büyük şans 💛' },
    { title: '💐 Günaydın Eda!', body: 'Güçlü, güzel, harika bir anne uyanıyor şu an 🌸' },
    { title: '🌻 Günaydın Eda!', body: 'Alisa Nur\'un gülümsemesi bugün de seni bekliyor 😊' },
    { title: '🍀 Günaydın Eda!', body: 'Her sabah sıfırdan başlıyorsun, bu cesaret çok büyük 💚' },
    { title: '🦋 Günaydın Eda!', body: 'Bugün de her şeyi güzel yapacaksın, hep böylesin 🌈' },
    { title: '🌙 Günaydın Eda!', body: 'Geceyi atlattın, sabah geldi. Aferin sana! ⭐' },
    { title: '💜 Günaydın Eda!', body: 'Alisa Nur\'un en sevdiği ses senin sesin, biliyor musun? 🎶' },
    { title: '🌊 Günaydın Eda!', body: 'Bugün de dalgaları aş, sen ustasın artık 💪' },
    { title: '🌷 Günaydın Eda!', body: 'Her yorgunluk Alisa Nur\'un bir gülüşüne değiyor 💕' },
    { title: '⭐ Günaydın Eda!', body: 'Yıldızlar söndü, güneş doğdu, sen hâlâ en parlaksın ✨' },
    { title: '🫶 Günaydın Eda!', body: 'Bu sabah Alisa Nur çok seviyor seni, daha da fazla 💖' },
    { title: '🌿 Günaydın Eda!', body: 'Bugün mükemmel olmak zorunda değilsin, zaten yeterlisin 🌸' },
    { title: '🎀 Günaydın Eda!', body: 'Alisa Nur\'un annesiyim diyebilmek, ne büyük gurur 👑' },
  ],
  iyigeceler: [
    { title: '🌙 İyi Geceler Eda!', body: 'Bugün de muhteşemdin. Biraz uyu, hak ettin 💫' },
    { title: '⭐ İyi Geceler Eda!', body: 'Alisa Nur en güzel rüyalarda seni görecek bu gece 💕' },
    { title: '💜 İyi Geceler Eda!', body: 'Gece kahramanı dinleniyor! Yarın da buradayız 💪' },
    { title: '🌸 İyi Geceler Eda!', body: 'Bugün için teşekkürler. Alisa Nur çok şanslı 🌟' },
    { title: '✨ İyi Geceler Eda!', body: 'Yoruldun ama her şeye değdi. Tatlı rüyalar 🫶' },
    { title: '🌙 İyi Geceler Eda!', body: 'Dünyanın en iyi annesi uyumayı hak ediyor 💛' },
    { title: '🌺 İyi Geceler Eda!', body: 'Yarın yeni bir gün, şimdi gözlerini kapat 💕' },
    { title: '🫶 İyi Geceler Eda!', body: 'Alisa Nur güvende, sen de uyu artık 🌙' },
    { title: '💙 İyi Geceler Eda!', body: 'Bugün her zorluğu aştın. Efsane annesin 🌟' },
    { title: '🌟 İyi Geceler Eda!', body: 'Alisa Nur\'un sıcacık nefesi sana iyi geceler diyor 💕' },
    { title: '🌙 İyi Geceler Eda!', body: 'Bu gece birkaç saat bile uyuyabilirsen, mucize olur 😄💪' },
    { title: '🍃 İyi Geceler Eda!', body: 'Gözlerini kapat, bugün her şeyi doğru yaptın 🌸' },
    { title: '💫 İyi Geceler Eda!', body: 'Alisa Nur\'la geçirdiğin her an bir hazine 💛' },
    { title: '🌙 İyi Geceler Eda!', body: 'Uykusuz gecelerin tadını ileride çok arayacaksın 🥺💕' },
    { title: '🌸 İyi Geceler Eda!', body: 'Sen uyurken de harika annesin, dinlen 🌙' },
    { title: '⭐ İyi Geceler Eda!', body: 'Bugün Alisa Nur\'a verdiğin her şey geri dönecek 💖' },
    { title: '🌙 İyi Geceler Eda!', body: 'Geceyi atlat, sabah gelince yine güçlü olacaksın ☀️' },
    { title: '💜 İyi Geceler Eda!', body: 'Her yorgunluk iz bırakır ama her an kalıcı 🌟' },
  ],
  gunici: [
    { title: '☕ Mola Vakti Eda!', body: 'Bir çay koy, 5 dakika sadece senin 🌸' },
    { title: '💕 Harika Annesin Eda!', body: 'Alisa Nur sana baktığında tüm dünyayı görüyor 👶' },
    { title: '💪 Güçlüsün Eda!', body: 'Her gün biraz daha büyüyorsunuz, ikiniz de 👨‍👩‍👧' },
    { title: '🍀 Şanslı Bebek!', body: 'Alisa Nur dünyanın en iyi annesine sahip, farkında mı? 💚' },
    { title: '✨ Unutma Eda!', body: 'Yorulduğunda Alisa Nur\'un o küçük gülüşünü hatırla 😊' },
    { title: '🎀 Minik Prenses!', body: 'Alisa Nur bugün de seni çok seviyor, her dakika 👑' },
    { title: '🌟 Süper Annesin Eda!', body: 'Hiçbir şey kolay değil ama sen her şeyi güzel yapıyorsun 💖' },
    { title: '🫶 Seviliyorsun Eda!', body: 'Alisa Nur\'un kalbi her gün senin için atıyor 💕' },
    { title: '🌻 Güzel Annesin Eda!', body: 'Bugün ne kadar iyi iş yaptığını biliyor musun? 🌟' },
    { title: '💛 Harikasın Eda!', body: 'Hiç fark etmesen de her şeyi doğru yapıyorsun 🌸' },
    { title: '🧸 Alisa Nur Mutlu!', body: 'Senin sayende her gün güvende ve mutlu büyüyor 💕' },
    { title: '🌈 Güçlü Annesin Eda!', body: 'Uykusuz gecelere rağmen sevgiyle bakıyorsun. Efsanesin! ✨' },
    { title: '🌊 Derin Nefes Eda!', body: 'Dur bir saniye, içini doldur, devam et. Olur bu 💙' },
    { title: '🌷 Alisa Nur\'dan!', body: 'Annemi çok seviyorum, her hücremle 🥰' },
    { title: '🎵 Söyle Eda!', body: 'Alisa Nur sesini duyunca huzura kavuşuyor, biliyor musun? 🎶' },
    { title: '🌿 Nefes Al Eda!', body: 'Bugün mükemmel olmak zorunda değilsin, zaten yeterlisin 💚' },
    { title: '🦋 Değişiyorsunuz!', body: 'Her geçen gün Alisa Nur büyüyor, sen de dönüşüyorsun 🌸' },
    { title: '🔥 Çok İyisin Eda!', body: 'Kimse senin kadar güzel yapamaz bunu, inan 💪' },
    { title: '🌙 Az Kaldı Eda!', body: 'Bu zor dönem geçecek, ama güzel anlar hep kalacak 💛' },
    { title: '💖 Alisa Nur Gülümsüyor!', body: 'Seninle huzurlu, seninle mutlu, seninle tamam 🥰' },
    { title: '🎈 Bugün Güzel Eda!', body: 'Küçük şeyleri fark et, hepsi hediye 🌟' },
    { title: '🍵 Çayını İç Eda!', body: 'Soğumadan iç bu sefer, hak ediyorsun ☕' },
    { title: '🌺 Renkliyiz Eda!', body: 'Alisa Nur hayatına ne güzel renkler kattı, değil mi? 🌈' },
    { title: '💝 İyi ki Varsin Eda!', body: 'Alisa Nur\'un bu kadar şanslı olması senin sayende 🌸' },
  ],
};

function rastgele(liste) {
  return liste[Math.floor(Math.random() * liste.length)];
}

function turkiyeSaati(now = Date.now()) {
  return (new Date(now).getUTCHours() + 3) % 24;
}

function bugunStr(now = Date.now()) {
  const d = new Date(now + 3 * 3600000);
  return d.toISOString().slice(0, 10);
}

function aiMesajUret(tip) {
  return rastgele(MESAJLAR[tip]);
}

async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  const b64url = obj => btoa(JSON.stringify(obj)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const header  = b64url({ alg: 'RS256', typ: 'JWT' });
  const payload = b64url({
    iss: env.SA_EMAIL,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600
  });
  const input = `${header}.${payload}`;
  const pemKey = env.SA_KEY.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g,'');
  const binKey = Uint8Array.from(atob(pemKey), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', binKey.buffer, { name:'RSASSA-PKCS1-v1_5', hash:'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input));
  const sig64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const jwt = `${input}.${sig64}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  const { access_token } = await res.json();
  return access_token;
}

async function sendFCM(token, title, body, env, tag = 'emzirme') {
  const accessToken = await getAccessToken(env);
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        android: { priority: 'HIGH', notification: { sound: 'default', channel_id: 'emzirme' } },
        webpush: {
          headers: { Urgency: 'high' },
          notification: { title, body, icon: '/icon-192.png', requireInteraction: true, vibrate: [400,150,400], tag }
        }
      }
    })
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('FCM error:', JSON.stringify(data));
    const errCode = data?.error?.details?.[0]?.errorCode || data?.error?.status || '';
    if (errCode === 'UNREGISTERED' || errCode === 'INVALID_ARGUMENT') {
      return { ok: false, invalidToken: true };
    }
    return { ok: false, invalidToken: false };
  }
  return { ok: true, invalidToken: false };
}

async function sendToAll(title, body, env, tag = 'surpriz') {
  const raw = await env.BEBEK_KV.get('fcm_tokens');
  let tokens = raw ? JSON.parse(raw) : [];
  if (!tokens.length) return false;

  const results = await Promise.all(tokens.map(t => sendFCM(t, title, body, env, tag)));

  const validTokens = tokens.filter((_, i) => !results[i].invalidToken);
  if (validTokens.length !== tokens.length) {
    await env.BEBEK_KV.put('fcm_tokens', JSON.stringify(validTokens), { expirationTtl: 60 * 60 * 24 * 60 });
    console.log(`${tokens.length - validTokens.length} geçersiz token temizlendi`);
  }

  return results.some(r => r.ok);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const CORS = corsHeaders(origin);

    if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });

    // Token kayıt — secret gerekmez
    if ((url.pathname === '/api/register-token' || url.pathname === '/api/subscribe') && request.method === 'POST') {
      try {
        const body = await request.json();
        const token = body.token || null;
        if (!token) {
          if (body.subscription) {
            await env.BEBEK_KV.put('push_subscription', JSON.stringify(body.subscription), { expirationTtl: 60 * 60 * 24 * 60 });
            return new Response(JSON.stringify({ ok: true }), { headers: CORS });
          }
          return new Response(JSON.stringify({ error: 'token gerekli' }), { status: 400, headers: CORS });
        }
        const raw = await env.BEBEK_KV.get('fcm_tokens');
        let tokens = raw ? JSON.parse(raw) : [];
        if (!tokens.includes(token)) tokens.push(token);
        if (tokens.length > 10) tokens = tokens.slice(-10);
        await env.BEBEK_KV.put('fcm_tokens', JSON.stringify(tokens), { expirationTtl: 60 * 60 * 24 * 60 });
        await env.BEBEK_KV.put('fcm_token', token, { expirationTtl: 60 * 60 * 24 * 60 });
        return new Response(JSON.stringify({ ok: true, total: tokens.length }), { headers: CORS });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
      }
    }

    // ── Aşağıdaki endpoint'ler API secret gerektirir ──
    if (!checkSecret(request, env)) {
      return new Response(JSON.stringify({ error: 'Yetkisiz istek' }), { status: 401, headers: CORS });
    }

    if (url.pathname === '/api/update-feed' && request.method === 'POST') {
      try {
        const { lastFeedTime, nextSide, intervalHours } = await request.json();
        await env.BEBEK_KV.put('last_feed', JSON.stringify({
          lastFeedTime: Number(lastFeedTime),
          nextSide,
          intervalHours: Number(intervalHours) || 2
        }), { expirationTtl: 60 * 60 * 24 });
        return new Response(JSON.stringify({ ok: true }), { headers: CORS });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
      }
    }

    if (url.pathname === '/api/test-notif' && request.method === 'POST') {
      try {
        const raw = await env.BEBEK_KV.get('fcm_tokens');
        const tokens = raw ? JSON.parse(raw) : [];
        if (!tokens.length) return new Response(JSON.stringify({ error: 'Token kayıtlı değil.' }), { status: 404, headers: CORS });
        const results = await Promise.all(tokens.map(t => sendFCM(t, '🤱 Test Bildirimi', 'Sistem çalışıyor! İki telefona da bildirim gelecek. 👶', env)));
        return new Response(JSON.stringify({ ok: results.some(r => r.ok), total: tokens.length }), { headers: CORS });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
      }
    }

    // Test endpoint'leri artık AI kullanıyor
    if (url.pathname === '/api/test-gundayin' && request.method === 'POST') {
      try {
        const mesaj = aiMesajUret('gundayin');
        const ok = await sendToAll(mesaj.title, mesaj.body, env, 'gundayin');
        return new Response(JSON.stringify({ ok, mesaj, ai: !!env.AI }), { headers: CORS });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
      }
    }

    if (url.pathname === '/api/test-iyigeceler' && request.method === 'POST') {
      try {
        const mesaj = aiMesajUret('iyigeceler');
        const ok = await sendToAll(mesaj.title, mesaj.body, env, 'iyigeceler');
        return new Response(JSON.stringify({ ok, mesaj, ai: !!env.AI }), { headers: CORS });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
      }
    }

    if (url.pathname === '/api/test-surpriz' && request.method === 'POST') {
      try {
        const mesaj = aiMesajUret('gunici');
        const ok = await sendToAll(mesaj.title, mesaj.body, env, 'surpriz');
        return new Response(JSON.stringify({ ok, mesaj, ai: !!env.AI }), { headers: CORS });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
      }
    }

    // ── Aşı hatırlatma verisini KV'ye kaydet ──
    if (url.pathname === '/api/update-vaccine-reminders' && request.method === 'POST') {
      if (!checkSecret(request, env)) {
        return new Response(JSON.stringify({ error: 'Yetkisiz istek' }), { status: 401, headers: CORS });
      }
      try {
        const { birthDate, vaccineNames } = await request.json();
        await env.BEBEK_KV.put('vaccine_reminders', JSON.stringify({
          birthDate: Number(birthDate) || null,
          vaccineNames: vaccineNames || [],
          updatedAt: Date.now()
        }), { expirationTtl: 60 * 60 * 24 * 90 }); // 90 gün
        return new Response(JSON.stringify({ ok: true }), { headers: CORS });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
      }
    }

    return new Response(JSON.stringify({ status: 'Bebek Takip API çalışıyor' }), { headers: CORS });
  },

  async scheduled(event, env) {
    try {
      const raw = await env.BEBEK_KV.get('fcm_tokens');
      const tokens = raw ? JSON.parse(raw) : [];
      if (!tokens.length) return;

      const now = Date.now();
      const hourTR = turkiyeSaati(now);
      const bugun = bugunStr(now);

      // ── EMZİRME BİLDİRİMİ — AI yok, sabit metin mantıklı ──
      const feedRaw = await env.BEBEK_KV.get('last_feed');
      if (feedRaw) {
        const { lastFeedTime, nextSide, intervalHours } = JSON.parse(feedRaw);
        const nextTime = Number(lastFeedTime) + (Number(intervalHours) || 2) * 3600000;
        const diff = nextTime - now;

        if (diff <= 10 * 60 * 1000 && diff >= -30 * 60 * 1000) {
          const lastNotified = await env.BEBEK_KV.get('last_notified');
          if (lastNotified !== String(lastFeedTime)) {
            const results = await Promise.all(tokens.map(t =>
              sendFCM(t, '🤱 Emzirme Vakti!', `Sıradaki: ${nextSide || '?'} taraf 👶`, env)
            ));
            const validTokens = tokens.filter((_, i) => !results[i].invalidToken);
            if (validTokens.length !== tokens.length) {
              await env.BEBEK_KV.put('fcm_tokens', JSON.stringify(validTokens), { expirationTtl: 60 * 60 * 24 * 60 });
            }
            if (results.some(r => r.ok)) {
              await env.BEBEK_KV.put('last_notified', String(lastFeedTime), { expirationTtl: 3600 * 4 });
            }
          }
        }
      }

      // ── GÜNAYDIM — saat 08:00, günde 1 kere ──
      if (hourTR === 8) {
        const key = `gundayin_${bugun}`;
        if (!await env.BEBEK_KV.get(key)) {
          const mesaj = aiMesajUret('gundayin');
          await sendToAll(mesaj.title, mesaj.body, env, 'gundayin');
          await env.BEBEK_KV.put(key, '1', { expirationTtl: 3600 * 48 });
        }
      }

      // ── İYİ GECELER — saat 23:00, günde 1 kere ──
      if (hourTR === 23) {
        const key = `iyigeceler_${bugun}`;
        if (!await env.BEBEK_KV.get(key)) {
          const mesaj = aiMesajUret('iyigeceler');
          await sendToAll(mesaj.title, mesaj.body, env, 'iyigeceler');
          await env.BEBEK_KV.put(key, '1', { expirationTtl: 3600 * 48 });
        }
      }

      // ── GÜN İÇİ MOTİVASYON — 09:00-22:00, 2-3 saatte bir ──
      if (hourTR >= 9 && hourTR < 22) {
        const lastSurpriz = parseInt(await env.BEBEK_KV.get('last_surpriz') || '0');
        const savedInterval = parseInt(await env.BEBEK_KV.get('surpriz_interval') || '0');

        if (!savedInterval || now - lastSurpriz > savedInterval) {
          const newInterval = 7200000 + Math.floor(Math.random() * 3600000); // 2-3 saat
          await env.BEBEK_KV.put('surpriz_interval', String(newInterval), { expirationTtl: 3600 * 4 });
          const mesaj = aiMesajUret('gunici');
          await sendToAll(mesaj.title, mesaj.body, env, 'surpriz');
          await env.BEBEK_KV.put('last_surpriz', String(now), { expirationTtl: 3600 * 24 });
        }
      }

      // ── AŞI HATIRLATMALARI — saat 10:00, günde 1 kere ──
      if (hourTR === 10) {
        const vaccineRaw = await env.BEBEK_KV.get('vaccine_reminders');
        if (vaccineRaw) {
          try {
            const vData = JSON.parse(vaccineRaw);
            const birthDate = vData.birthDate;
            const doneVaccines = vData.vaccineNames || [];
            const notifiedKey = `vax_notified_${bugun}`;

            if (birthDate && !(await env.BEBEK_KV.get(notifiedKey))) {
              const babyAgeMonths = (now - birthDate) / (30.44 * 86400000 * 1000);

              // Tüm aşı takvimini kontrol et
              const SCHEDULE = [
                { month:0,  name:'Hepatit B',        dose:'1. Doz' },
                { month:1,  name:'Hepatit B',        dose:'2. Doz' },
                { month:2,  name:'DBT-İPA-Hib',      dose:'1. Doz' },
                { month:2,  name:'Pnömokok (KPA)',   dose:'1. Doz' },
                { month:2,  name:'Rotavirüs',        dose:'1. Doz' },
                { month:4,  name:'DBT-İPA-Hib',      dose:'2. Doz' },
                { month:4,  name:'Pnömokok (KPA)',   dose:'2. Doz' },
                { month:4,  name:'Rotavirüs',        dose:'2. Doz' },
                { month:6,  name:'DBT-İPA-Hib',      dose:'3. Doz' },
                { month:6,  name:'Hepatit B',        dose:'3. Doz' },
                { month:6,  name:'OPA',              dose:'1. Doz' },
                { month:6,  name:'Pnömokok (KPA)',   dose:'3. Doz' },
                { month:12, name:'KKK',              dose:'1. Doz' },
                { month:12, name:'Pnömokok (KPA)',   dose:'Rapel' },
                { month:12, name:'Suçiçeği',         dose:'1. Doz' },
                { month:18, name:'DBT-İPA-Hib',      dose:'Rapel' },
                { month:18, name:'OPA',              dose:'2. Doz' },
                { month:18, name:'Hepatit A',        dose:'1. Doz' },
                { month:24, name:'Hepatit A',        dose:'2. Doz' }
              ];

              for (const s of SCHEDULE) {
                // Bu aşı zaten yapılmış mı?
                const alreadyDone = doneVaccines.some(v =>
                  (v.name||'').toLowerCase().includes(s.name.toLowerCase()) &&
                  (v.dose||'').toLowerCase() === s.dose.toLowerCase()
                );
                if (alreadyDone) continue;

                const daysUntil = Math.floor((birthDate + s.month * 30.44 * 86400000 - now) / 86400000);

                let reminderTitle = null, reminderBody = null;
                if (daysUntil <= 1 && daysUntil > 0) {
                  reminderTitle = '🔔 Yarın Aşı Var!';
                  reminderBody = `${s.name} (${s.dose}) — yarın yapılması gerekiyor. Hazırlanın! 💉`;
                } else if (daysUntil <= 2 && daysUntil > 1) {
                  reminderTitle = '⚠️ 2 Gün Kaldı!';
                  reminderBody = `${s.name} (${s.dose}) aşısına 2 gün kaldı. 🏥`;
                } else if (daysUntil <= 7 && daysUntil > 2) {
                  reminderTitle = '⏰ Yaklaşan Aşı';
                  reminderBody = `${s.name} (${s.dose}) aşısına ${daysUntil} gün kaldı. Şimdiden planlayın! 📅`;
                }

                if (reminderTitle) {
                  await sendToAll(reminderTitle, reminderBody, env, 'vax');
                }
              }

              await env.BEBEK_KV.put(notifiedKey, '1', { expirationTtl: 3600 * 48 });
            }
          } catch (e) { console.error('Aşı hatırlatma hatası:', e); }
        }
      }

    } catch (e) {
      console.error('CRON hata:', e);
    }
  }
};