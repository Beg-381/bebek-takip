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

// ── FALLBACK: AI çalışmazsa bunlar kullanılır ──
const MESAJLAR = {
  gundayin: [
    { title: '🌸 Günaydın!', body: 'Yeni bir gün! Bugün de harikasın, Alisa seninle çok şanslı 💕' },
    { title: '☀️ Günaydın!', body: 'Güneş doğdu, en güzel anne de uyanıyor! 🌟' },
    { title: '🌈 Günaydın!', body: 'Bugün de muhteşem bir anne olacaksın, hep böylesin zaten 👶' },
    { title: '🌺 Günaydın!', body: 'Alisa\'nın gülüşü seni bekliyor! Güzel bir gün olsun 💛' },
    { title: '✨ Günaydın!', body: 'Her sabah seni biraz daha admire ediyorum. Harikasın! 🌸' },
    { title: '🐣 Günaydın!', body: 'Dünyanın en tatlı bebek — dünyanın en harika annesiyle 💕' },
    { title: '💐 Günaydın!', body: 'Bugün de güçlüsün, bugün de güzelsin, bugün da en iyisisin! ☀️' },
  ],
  iyigeceler: [
    { title: '🌙 İyi Geceler!', body: 'Bugün de mükemmeldin. Biraz uyu, hak ediyorsun 💫' },
    { title: '⭐ İyi Geceler!', body: 'Alisa\'nın en güzel rüyalarında sen varsın. Tatlı uykular 💕' },
    { title: '🌙 İyi Geceler!', body: 'Gece kahramanı dinleniyor! Yarın da seninleyiz 💪' },
    { title: '💜 İyi Geceler!', body: 'Bu gün için teşekkürler. Alisa\'nın şansı var sende 🌟' },
    { title: '🌸 İyi Geceler!', body: 'Yoruldun ama her şeye değdi. Tatlı rüyalar 🫶' },
    { title: '✨ İyi Geceler!', body: 'Dünyanın en iyi annesi uyumayı hak ediyor. Geceyi rahat geçir 💛' },
    { title: '🌙 İyi Geceler!', body: 'Yarın yeni bir gün, yeni bir başlangıç. Şimdi uyu 💕' },
  ],
  gunici: [
    { title: '💕 Harika Annesin!', body: 'Alisa\'nın sana baktığı o anları bir bilsen! Çok şanslı 👶' },
    { title: '☕ Mola Vakti!', body: 'Bir nefes al, çay iç. Hep böyle güçlü olman gerekmiyor 🌸' },
    { title: '💪 Güçlüsün!', body: 'Her gün biraz daha büyüyorsunuz, ikisi de! 👨‍👩‍👧' },
    { title: '🍀 Şanslı Bebek!', body: 'Dünyanın en iyi annesine sahip Alisa farkında mı? 💚' },
    { title: '✨ Unutma!', body: 'Yorulduğunda Alisa\'nın o küçük gülüşünü hatırla 😊' },
    { title: '🎀 Minik Prenses!', body: 'Alisa bugün de seni çok seviyor, her dakika 👑' },
    { title: '🌟 Süper Anne!', body: 'Hiçbir şey kolay değil ama sen her şeyi güzel yapıyorsun 💖' },
    { title: '🫶 Seviliyorsun!', body: 'Alisa\'nın kalbi seni çarptırıyor, her gün 💕' },
    { title: '🌻 Güzel Anne!', body: 'Bugün ne kadar iyi iş yaptığını biliyor musun? 🌟' },
    { title: '💛 Harikasın!', body: 'Hiç fark etmesen de, her şeyi doğru yapıyorsun 🌸' },
    { title: '🧸 Alisa Mutlu!', body: 'Senin sayende her gün güvende ve mutlu büyüyor 💕' },
    { title: '🌈 Güçlü Anne!', body: 'Uykusuz gecelere, sevgiyle bakmaya devam ediyorsun. Efsanesin! ✨' },
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

// ── WORKERS AI: Dinamik mesaj üretimi ──
const AI_PROMPT = {
  gundayin: `Sen sevecen, sıcak bir asistansın. Yeni bebek sahibi genç bir anneye (adı belirtilmiyor) sabah bildirimi yazıyorsun.
Görev: Kısa, samimi, neşeli bir sabah mesajı yaz. Türkçe. Emoji kullan.
Çıktı YALNIZCA şu JSON formatında olsun, başka hiçbir şey yazma:
{"title":"<emoji + kısa başlık>","body":"<1-2 cümle, içten ve motivasyonel mesaj>"}
Her seferinde farklı, yaratıcı ve beklenmedik bir şey yaz. Klişe olma.`,

  iyigeceler: `Sen sevecen, sıcak bir asistansın. Yeni bebek sahibi genç bir anneye gece bildirimi yazıyorsun.
Görev: Kısa, dinlendirici, takdirkâr bir iyi geceler mesajı yaz. Türkçe. Emoji kullan.
Çıktı YALNIZCA şu JSON formatında olsun, başka hiçbir şey yazma:
{"title":"<emoji + kısa başlık>","body":"<1-2 cümle, bugünün yorgunluğunu onurlayan bir mesaj>"}
Her seferinde farklı, samimi ve beklenmedik bir şey yaz.`,

  gunici: `Sen sevecen, sıcak bir asistansın. Gün içinde yeni bebek sahibi yorgun bir anneye sürpriz motivasyon bildirimi yazıyorsun.
Görev: Kısa, güldüren veya dokunan, gün ortası bir motivasyon mesajı yaz. Türkçe. Emoji kullan.
Çıktı YALNIZCA şu JSON formatında olsun, başka hiçbir şey yazma:
{"title":"<emoji + kısa başlık>","body":"<1-2 cümle, samimi ve özgün mesaj>"}
Her seferinde farklı bir tema dene: bazen komik, bazen şiirsel, bazen pratik bir öneri, bazen sadece sevgi.`,
};

async function aiMesajUret(tip, env) {
  // env.AI yoksa (local test gibi) direkt fallback
  if (!env.AI) {
    console.log('AI binding yok, fallback kullanılıyor');
    return rastgele(MESAJLAR[tip]);
  }

  try {
    const response = await Promise.race([
      env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: AI_PROMPT[tip] },
          { role: 'user', content: 'Şimdi yaz.' }
        ],
        max_tokens: 120,
        temperature: 0.9,   // Yüksek yaratıcılık
      }),
      // 8 saniye timeout — CRON'da yeterli süre var
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), 8000)
      )
    ]);

    const text = response?.response?.trim() || '';

    // JSON parse dene — model bazen ```json ... ``` sarıyor, temizle
    const clean = text.replace(/```json|```/gi, '').trim();
    const parsed = JSON.parse(clean);

    // Zorunlu alanlar var mı kontrol et
    if (parsed?.title && parsed?.body) {
      console.log(`AI mesaj (${tip}):`, parsed);
      return parsed;
    }

    throw new Error('Geçersiz AI çıktısı: ' + text);

  } catch (e) {
    console.error(`AI mesaj hatası (${tip}), fallback:`, e.message);
    return rastgele(MESAJLAR[tip]);
  }
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
        const mesaj = await aiMesajUret('gundayin', env);
        const ok = await sendToAll(mesaj.title, mesaj.body, env, 'gundayin');
        return new Response(JSON.stringify({ ok, mesaj, ai: !!env.AI }), { headers: CORS });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
      }
    }

    if (url.pathname === '/api/test-iyigeceler' && request.method === 'POST') {
      try {
        const mesaj = await aiMesajUret('iyigeceler', env);
        const ok = await sendToAll(mesaj.title, mesaj.body, env, 'iyigeceler');
        return new Response(JSON.stringify({ ok, mesaj, ai: !!env.AI }), { headers: CORS });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
      }
    }

    if (url.pathname === '/api/test-surpriz' && request.method === 'POST') {
      try {
        const mesaj = await aiMesajUret('gunici', env);
        const ok = await sendToAll(mesaj.title, mesaj.body, env, 'surpriz');
        return new Response(JSON.stringify({ ok, mesaj, ai: !!env.AI }), { headers: CORS });
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
          const mesaj = await aiMesajUret('gundayin', env);
          await sendToAll(mesaj.title, mesaj.body, env, 'gundayin');
          await env.BEBEK_KV.put(key, '1', { expirationTtl: 3600 * 48 });
        }
      }

      // ── İYİ GECELER — saat 23:00, günde 1 kere ──
      if (hourTR === 23) {
        const key = `iyigeceler_${bugun}`;
        if (!await env.BEBEK_KV.get(key)) {
          const mesaj = await aiMesajUret('iyigeceler', env);
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
          const mesaj = await aiMesajUret('gunici', env);
          await sendToAll(mesaj.title, mesaj.body, env, 'surpriz');
          await env.BEBEK_KV.put('last_surpriz', String(now), { expirationTtl: 3600 * 24 });
        }
      }

    } catch (e) {
      console.error('CRON hata:', e);
    }
  }
};
