import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:bebek@takip.app',
  'BEgrAeQEDims6YsEym48lN9SlbgRmxXmAJjGR3uQBM0SkUv6Ha8fA3tI-K3V0DtyDO-M-E4qi4YD21Ln8CuK22E',
  'DJUKWypJNTUlYCH8qkWEAAxQbEUFCGYU2ZuAkkGqcCI'
);

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: cors() });
    }

    // Web push subscribe (eski)
    if (url.pathname === '/api/subscribe' && request.method === 'POST') {
      try {
        const { subscription } = await request.json();
        await webpush.sendNotification(subscription, JSON.stringify({
          title: '🤱 Bebek Takip',
          body: 'Bildirimler aktif! 👶',
          icon: '/icon-192.png',
          tag: 'welcome'
        }));
        return new Response(JSON.stringify({ ok: true }), { headers: cors() });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors() });
      }
    }

    // Web push send (eski)
    if (url.pathname === '/api/send-push' && request.method === 'POST') {
      try {
        const { subscription, nextSide } = await request.json();
        await webpush.sendNotification(subscription, JSON.stringify({
          title: '🤱 Emzirme Vakti!',
          body: `Sıradaki: ${nextSide || '?'} taraf 👶`,
          icon: '/icon-192.png',
          tag: 'emzirme',
          renotify: true
        }));
        return new Response(JSON.stringify({ ok: true }), { headers: cors() });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors() });
      }
    }

    // FCM token kaydet (yeni)
    if (url.pathname === '/api/register-token' && request.method === 'POST') {
      try {
        const { token } = await request.json();
        if (!token) return new Response(JSON.stringify({ error: 'token gerekli' }), { status: 400, headers: cors() });
        await env.BEBEK_KV.put('fcm_token', token);
        return new Response(JSON.stringify({ ok: true }), { headers: cors() });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors() });
      }
    }

    // Son emzirme zamanı kaydet (yeni)
    if (url.pathname === '/api/update-feed' && request.method === 'POST') {
      try {
        const { lastFeedTime, nextSide, intervalHours } = await request.json();
        await env.BEBEK_KV.put('last_feed', JSON.stringify({ lastFeedTime, nextSide, intervalHours }));
        return new Response(JSON.stringify({ ok: true }), { headers: cors() });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors() });
      }
    }

    // Static dosyalar
    try {
      return await getAssetFromKV(
        { request, waitUntil: ctx.waitUntil.bind(ctx) },
        { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST }
      );
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  },

  // CRON: Her 30 dakikada çalışır
  async scheduled(event, env, ctx) {
    try {
      const fcmToken = await env.BEBEK_KV.get('fcm_token');
      if (!fcmToken) return;
      const feedRaw = await env.BEBEK_KV.get('last_feed');
      if (!feedRaw) return;
      const { lastFeedTime, nextSide, intervalHours } = JSON.parse(feedRaw);
      const nextFeedTime = lastFeedTime + (intervalHours || 2) * 3600000;
      const now = Date.now();
      if (now >= nextFeedTime - 60000 && now <= nextFeedTime + 900000) {
        // FCM V1 ile bildirim gönder
        const SA_EMAIL = 'firebase-adminsdk-fbsvc@alisa-36e99.iam.gserviceaccount.com';
        const SA_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDvRiOXsOgQyfiO\ndDe8LmubU4qi7Dw1kGjUH1fzc2QmNLhPXzehHoYjOeN5m2L1ER7gIIFj3ERATjYh\noWQfROPhrV3iVMX1uCoDlIECTNQKWg/jCzIlK+hADKH3V788+tqpqvuYYkUZ9z+k\n9kQsmdATIMHLJGsp+uCv0RpV1YAnuKSEkWfEYA7mdmek8KFP2QfSN4KUK7GyPIf/\nqLwcrii/Vs04EgoIFHGDwm5Xn2z0rgijuQraYmeOmEpHLJmy+O+H+qnqCsFdULud\n6uFDCTwEPTJfKkGC6tBB56XBNOq5xjZtlYn9hSTNn744rk5lhi4Mg2NRjWANYi+k\nP2jD+f67AgMBAAECggEAaNMyEak7qetJ/OLWbhdqJiTd5k2XfSH0gwXuSqZBeGl9\nW6yL2wbb3j/ks+iK3HFxNOCYvw6HSiLZnTcu/XH5YevJZzgbd/CEW4gqUr8k4Bof\nvqivgdBwEetW490p14XQ2ScizVo0CtGirNsE+AM0wMSHkj80wbH60JvLrVH5MKzf\nZboN0/EaEEv2vdxMc9k0+32NS54jThXeOe/+aKdKosN+RAC7BhWFltNIQTrJWc4T\nYJnhhlm4tiX3RCgHJn1gLbgPsIy0PtOHksdlo6HJmZQQbiuahopIptr0jn59Ydey\nOCVSI0riAKBioI/Zs2oaF0np779WURYHhEiPrJ1zvQKBgQD8FVCiSsv+Yfx51mzh\nh6bshix3q7usgkSXWdoDptvzydp3cVGHUxQbo0TH9h5lOm7Cei9ZLVxEHG1ylyLa\n+u6uXZmC2A7bu+fyzpv+O4vwNL2N5E+mRCSMCEL76fPjG9JQgKxA7iycny/cZITo\nrRzlobngYmcM8R5xE7524IM4LQKBgQDy/d+53Ip3UZhh1f67sU0+rxyYoqMTW5pw\n6QQ6gwvxFCgUkS/7VSssFm99ejA65bSvw+PPUgo8JS67FUaC32RRBJKCcYFPDCld\nHt5S6j/GsQoChJTP+9iXm+rm/BdcT1Lg26GS2H4drkMOxZMqGoux+4VQL4lG7CrF\n/k/BDEk7hwKBgQDW24gNu/jhSj06z6OgGtIQ2U+/dFWS9Lln00K6SBdDVDHsCl72\nG76Qy/lNAh7oIwTSp/gBZ2Mz/pLez6j6wlR7s/WrC2KmsSNC1g0phTGCPEGwVf/5\ndC0+WbBWLRMd6NG6oeGvuhG2MQxHKjoKY7q0ksLuWJEC++T5dl2pzzSoxQKBgQCH\nQNbKPr74IXvfYV0UHmGvtYsGTujUupVhqeJHq2/3NdAFercpf8OzG53dSykTb46+\nkxv352N5DP1Q90uzRyMwkYn3f7SJSmyvv6Hipy7uqta2hhPLHRT3drsu7T0XjbPF\nI5txAH5aiQgcbc83jWUaobUX6A3SY1x/rsm3293bewKBgBXzyjsVfK7odjiZO5k4\nhIzKM2qTjnlS4r5Hz8nGyZmgD01mCnSpANyIRF0oelReRx0M27VQKJbjplVdV1SD\njxbyurBWXHy1VGTIh/BIme8VHgX+pix6Zco9ia8vuw0SEhM8Zsxjfeukodstu1lx\nNP0wgvpHcsWCmLUmBsyDqitP\n-----END PRIVATE KEY-----\n';
        const now2 = Math.floor(Date.now() / 1000);
        const b64 = (obj) => btoa(JSON.stringify(obj)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
        const sigInput = `${b64({alg:'RS256',typ:'JWT'})}.${b64({iss:SA_EMAIL,scope:'https://www.googleapis.com/auth/firebase.messaging',aud:'https://oauth2.googleapis.com/token',iat:now2,exp:now2+3600})}`;
        const pemKey = SA_KEY.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g,'');
        const binKey = Uint8Array.from(atob(pemKey),c=>c.charCodeAt(0));
        const cryptoKey = await crypto.subtle.importKey('pkcs8',binKey.buffer,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
        const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5',cryptoKey,new TextEncoder().encode(sigInput));
        const sig64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
        const jwt = `${sigInput}.${sig64}`;
        const tokenRes = await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`});
        const {access_token} = await tokenRes.json();
        await fetch(`https://fcm.googleapis.com/v1/projects/alisa-36e99/messages:send`,{method:'POST',headers:{Authorization:`Bearer ${access_token}`,'Content-Type':'application/json'},body:JSON.stringify({message:{token:fcmToken,notification:{title:'🤱 Emzirme Vakti!',body:`Sıradaki: ${nextSide||'?'} taraf 👶`},android:{priority:'HIGH'}}})});
        await env.BEBEK_KV.delete('last_feed');
      }
    } catch(e) { console.error('Cron error:', e); }
  }
};
