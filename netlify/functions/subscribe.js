const webpush = require('web-push');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors(), body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors(), body: 'Method Not Allowed' };

  try {
    const { subscription } = JSON.parse(event.body);
    if (!subscription) return { statusCode: 400, headers: cors(), body: 'Missing subscription' };

    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:bebek@takip.app',
      process.env.VAPID_PUBLIC,
      process.env.VAPID_PRIVATE
    );

    await webpush.sendNotification(subscription, JSON.stringify({
      title: '🤱 Bebek Takip',
      body: 'Bildirimler aktif! Emzirme hatırlatmaları gelecek. 👶',
      icon: '/icon-192.png',
      tag: 'welcome'
    }));

    return { statusCode: 200, headers: cors(), body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('subscribe error:', err.message);
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: err.message }) };
  }
};

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}
