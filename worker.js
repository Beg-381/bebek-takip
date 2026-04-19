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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: cors() });
    }

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

    try {
      return await getAssetFromKV(
        { request, waitUntil: ctx.waitUntil.bind(ctx) },
        { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST }
      );
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  }
};