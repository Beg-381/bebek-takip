
// ── DATA ──
var feedH   = JSON.parse(localStorage.getItem('bb_feed')   || '[]');
var diaperH = JSON.parse(localStorage.getItem('bb_diaper') || '[]');
var sleepH  = JSON.parse(localStorage.getItem('bb_sleep')  || '[]');
var weightH = JSON.parse(localStorage.getItem('bb_weight') || '[]');
var heightH = JSON.parse(localStorage.getItem('bb_height') || '[]');
var feverH  = JSON.parse(localStorage.getItem('bb_fever')  || '[]');
var vaccineH= JSON.parse(localStorage.getItem('bb_vaccine')|| '[]');
var notesH  = JSON.parse(localStorage.getItem('bb_notes')  || '[]');

function sv(k,d){
  localStorage.setItem(k,JSON.stringify(d));
  if(window.fsWrite) window.fsWrite(k, d);
}

// ── DARK MODE ──
if(localStorage.getItem('bb_dark')==='1'){document.documentElement.setAttribute('data-theme','dark');document.getElementById('darkBtn').textContent='☀️';}
function toggleDark(){
  const on=document.documentElement.getAttribute('data-theme')==='dark';
  document.documentElement.setAttribute('data-theme',on?'':'dark');
  localStorage.setItem('bb_dark',on?'0':'1');
  document.getElementById('darkBtn').textContent=on?'🌙':'☀️';
}

// ── TABS ──
const tabNames=['emzirme','bez','uyku','kilo','analiz','ates','igne','notlar','yedek'];
const tabTitles={emzirme:'🤱 Emzirme',bez:'🍼 Bez',uyku:'😴 Uyku',kilo:'⚖️ Kilo/Boy',analiz:'📊 Analiz',ates:'🌡️ Ateş',igne:'💉 İğne/Aşı',notlar:'📝 Notlar',yedek:'💾 Yedek'};
function showTab(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.querySelectorAll('.tab')[tabNames.indexOf(name)].classList.add('active');
  document.getElementById('pageTitle').textContent=tabTitles[name];
  localStorage.setItem('bb_last_tab',name);
  if(name==='analiz')renderAnaliz();
  if(name==='uyku'){renderSleepStatus();renderSleepHistory();}
  if(name==='bez'){renderDiaperCd();renderDiaperHistory();}
  if(name==='yedek'){renderStorageInfo();updateBabyAge();if(birthDate)document.getElementById('birthDate').value=new Date(birthDate).toISOString().slice(0,10);}
  if(name==='ates'){renderFeverHistory();}
  if(name==='igne'){renderVaccineHistory();}
  if(name==='notlar'){renderNotes();}
}

// ── ARALIK & ALARM ──
let alarmInterval = parseFloat(localStorage.getItem('bb_interval') || '2');
let alarmTimeout = null;
let alarmAudio = null;
let swRegistration = null;
let notifGranted = false;
let pushSubscription = null;

function setInterval_(hours) {
  alarmInterval = hours;
  localStorage.setItem('bb_interval', hours);
  document.querySelectorAll('.interval-btn').forEach(b => b.classList.remove('active'));
  const map = {1.5:'iv1', 2:'iv2', 3:'iv3'};
  document.getElementById(map[hours]).classList.add('active');
  updateCountdown();
  scheduleAlarm();
}

function initIntervalBtns() {
  const map = {1.5:'iv1', 2:'iv2', 3:'iv3'};
  document.querySelectorAll('.interval-btn').forEach(b => b.classList.remove('active'));
  if(map[alarmInterval]) document.getElementById(map[alarmInterval]).classList.add('active');
}

function scheduleAlarm() {
  clearTimeout(alarmTimeout);
  if (!feedH.length) return;
  const last = feedH[0];
  const nextSide = last.startSide === 'sol' ? 'Sağ' : 'Sol';
  const nextTs = last.timestamp + alarmInterval * 3600000;
  const delay = Math.max(0, nextTs - Date.now());
  const lastAlarm = parseInt(localStorage.getItem('bb_last_alarm') || '0');
  if (lastAlarm === last.timestamp && delay < 5000) return;
  alarmTimeout = setTimeout(() => triggerAlarm(nextSide, last.timestamp), delay);
}

// AudioContext önceden hazırla
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) { try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {} }
  if (_audioCtx && _audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}
document.addEventListener('touchstart', () => getAudioCtx(), {passive: true});
document.addEventListener('click', () => getAudioCtx(), {passive: true});

function triggerAlarm(nextSide, lastTs) {
  // Ses çal
  try {
    const ctx = getAudioCtx() || new (window.AudioContext || window.webkitAudioContext)();
    function beep(freq, start, dur) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq;
      o.type = 'sine';
      g.gain.setValueAtTime(0.6, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur + 0.1);
    }
    // Güzel melodi
    beep(523, 0, 0.3);
    beep(659, 0.35, 0.3);
    beep(784, 0.7, 0.3);
    beep(659, 1.05, 0.3);
    beep(784, 1.4, 0.5);
    setTimeout(() => {
      beep(523, 0, 0.3); beep(659, 0.35, 0.3);
      beep(784, 0.7, 0.3); beep(659, 1.05, 0.3);
      beep(784, 1.4, 0.5);
    }, 2200);
  } catch(e) {}

  // Ekran uyarısı
  const overlay = document.getElementById('alarmOverlay');
  overlay.style.display = 'flex';
  overlay.style.visibility = 'visible';
  document.getElementById('alarmSideText').textContent = `Sıradaki: ${nextSide} taraf`;
  const h = Math.floor(alarmInterval);
  const m = Math.round((alarmInterval - h) * 60);
  document.getElementById('alarmTimeText').textContent = `${h > 0 ? h + ' saat ' : ''}${m > 0 ? m + ' dakika' : ''} geçti`;

  // Titreşim
  if (navigator.vibrate) navigator.vibrate([600, 200, 600, 200, 600, 200, 600]);
}

function dismissAlarm() {
  const overlay = document.getElementById('alarmOverlay');
  overlay.style.display = 'none';
  overlay.style.visibility = 'hidden';
  if(feedH.length) localStorage.setItem('bb_last_alarm', feedH[0].timestamp);
  scheduleAlarm();
}

const VAPID_PUBLIC = 'BEgrAeQEDims6YsEym48lN9SlbgRmxXmAJjGR3uQBM0SkUv6Ha8fA3tI-K3V0DtyDO-M-E4qi4YD21Ln8CuK22E';
const API_BASE = 'https://bebek-takip.ggroupang.workers.dev';

async function requestNotif() {
  if (!('Notification' in window)) { alert('Tarayıcın bildirim desteklemiyor'); return; }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') { alert('Bildirim izni verilmedi'); return; }
  await subscribePush();
}

async function subscribePush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
    });
    pushSubscription = sub.toJSON();
    localStorage.setItem('bb_push_sub', JSON.stringify(pushSubscription));
    await fetch(API_BASE + '/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: pushSubscription })
    });
    updateNotifBanner(true);
  } catch(e) {
    console.error('Push subscribe error:', e);
  }
}

async function scheduleNotif() {
  scheduleAlarm();
  if (!feedH.length) return;
  const last = feedH[0];
  const nextSide = last.startSide === 'sol' ? 'Sağ' : 'Sol';
  // Cloudflare Cron'a son emzirme zamanını bildir
  try {
    await fetch(API_BASE + '/api/update-feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lastFeedTime: last.timestamp,
        nextSide: nextSide,
        intervalHours: alarmInterval
      })
    });
  } catch(e) {
    console.log('update-feed error:', e);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function updateNotifBanner(granted) {
  notifGranted = granted;
  const b = document.getElementById('notifBanner');
  if (!b) return;
  if (granted) {
    b.className = 'notif-banner granted';
    b.innerHTML = '✅ Bildirimler aktif! Uygulama kapalıyken de gelecek.';
  } else {
    b.innerHTML = '🔔 Bildirim aç — uygulama kapalıyken de hatırlatır';
  }
}

function checkNotif() {
  if (Notification.permission === 'granted' && pushSubscription) updateNotifBanner(true);
}

// ── PWA ──
function initPWA(){
  // Service Worker kaydet
  if('serviceWorker' in navigator){
    const base = location.pathname.replace(/\/[^/]*$/, '/');
    navigator.serviceWorker.register(base + 'sw.js', {scope: base})
      .then(reg => {
        swRegistration = reg;
        // Mevcut push aboneliğini kontrol et
        const savedSub = localStorage.getItem('bb_push_sub');
        if(savedSub) {
          try { pushSubscription = JSON.parse(savedSub); } catch{}
        }
        checkNotif();
      })
      .catch(e => console.log('SW error:', e));
  }

  // iOS banner
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone;
  if(isIOS&&!isStandalone&&!localStorage.getItem('bb_install_dismissed')) showInstallBanner('ios');
  window.addEventListener('beforeinstallprompt', e=>{
    e.preventDefault(); window._installPrompt=e;
    if(!isStandalone) showInstallBanner('android');
  });
}

function showInstallBanner(type){
  if(document.getElementById('installBanner')) return;
  const banner=document.createElement('div');
  banner.id='installBanner';
  banner.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#e07090,#c8a8e9);color:white;padding:14px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 -4px 20px rgba(200,100,140,0.3);font-family:Nunito,sans-serif;';
  const msg=type==='ios'
    ?'<div style="flex:1;font-size:0.82rem;line-height:1.4"><strong>Ana ekrana ekle!</strong><br>Safari\u2019de <strong>Paylaş \u2192 Ana Ekrana Ekle</strong></div>'
    :'<div style="flex:1;font-size:0.82rem;line-height:1.4"><strong>Uygulama olarak yükle!</strong><br>Offline çalışır, bildirim gelir</div>';
  const btn=type==='android'?'<button onclick="doInstall()" style="border:none;background:white;color:#e07090;border-radius:10px;padding:8px 14px;font-family:Nunito,sans-serif;font-weight:800;font-size:0.85rem;cursor:pointer;">Yükle</button>':'';
  const close='<button onclick="dismissInstall()" style="border:none;background:rgba(255,255,255,0.2);color:white;border-radius:50%;width:28px;height:28px;font-size:1rem;cursor:pointer;flex-shrink:0;">✕</button>';
  banner.innerHTML='🤱 '+msg+btn+close;
  document.body.appendChild(banner);
}
function doInstall(){if(window._installPrompt){window._installPrompt.prompt();window._installPrompt.userChoice.then(()=>{window._installPrompt=null;dismissInstall();});}}
function triggerInstall(){
  const note=document.getElementById('installNote');
  if(window._installPrompt){
    window._installPrompt.prompt();
    window._installPrompt.userChoice.then(r=>{
      window._installPrompt=null;
      if(r.outcome==='accepted'){note.textContent='✅ Uygulama yüklendi!';}
      else{note.textContent='İptal edildi.';}
    });
  } else {
    const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
    if(isIOS){
      note.innerHTML='Safari\'de aç → <strong>Paylaş</strong> → <strong>Ana Ekrana Ekle</strong>';
    } else {
      note.textContent='Tarayıcı menüsünden "Ana ekrana ekle" seçeneğini kullan.';
    }
  }
}
function dismissInstall(){const b=document.getElementById('installBanner');if(b)b.remove();localStorage.setItem('bb_install_dismissed','1');}

// ── FEED SESSION ──
let activeSide=null,pausedSide=null,transferMode=false;
let sessionStart=null,firstSide=null;
let leftSecs=0,rightSecs=0,transferSecs=0;
let sideStart=null,transferStart=null;
let tickInt=null;

function handleSideBtn(side){
  if(!sessionStart){
    sessionStart=Date.now();firstSide=side;activeSide=side;pausedSide=null;
    transferMode=false;transferStart=null;sideStart=Date.now();
    document.getElementById('activeSection').classList.add('running');
    document.getElementById('stopBtn').classList.add('visible');
    if(!tickInt)tickInt=setInterval(tick,1000);
    updateUI();return;
  }
  if(side===activeSide){
    const elapsed=Math.floor((Date.now()-sideStart)/1000);
    if(side==='sol')leftSecs+=elapsed;else rightSecs+=elapsed;
    sideStart=null;pausedSide=side;activeSide=null;
    transferMode=true;transferStart=Date.now();
    document.getElementById('transferRow').classList.add('visible');
    updateUI();return;
  }
  if(side===pausedSide){
    activeSide=side;pausedSide=null;sideStart=Date.now();
    transferMode=false;transferStart=null;transferSecs=0;
    document.getElementById('transferRow').classList.remove('visible');
    document.getElementById('transferTime').textContent='00:00';
    updateUI();return;
  }
  if(activeSide&&!transferMode){
    const elapsed=Math.floor((Date.now()-sideStart)/1000);
    if(activeSide==='sol')leftSecs+=elapsed;else rightSecs+=elapsed;
    sideStart=null;activeSide=null;
    transferMode=true;transferStart=Date.now();
    document.getElementById('transferRow').classList.add('visible');
  }
  if(transferMode&&transferStart){
    transferSecs=Math.floor((Date.now()-transferStart)/1000);
    transferStart=null;transferMode=false;
  }
  activeSide=side;pausedSide=null;sideStart=Date.now();
  updateUI();
}

function tick(){
  const now=Date.now();
  let l=leftSecs,r=rightSecs;
  if(activeSide&&sideStart){
    const e=Math.floor((now-sideStart)/1000);
    if(activeSide==='sol')l+=e;else r+=e;
  }
  document.getElementById('leftTime').textContent=fmt(l);
  document.getElementById('rightTime').textContent=fmt(r);
  if(transferMode&&transferStart){
    const tr=Math.floor((now-transferStart)/1000);
    document.getElementById('transferTime').textContent=fmt(tr);
  }
  saveActive();
}

function updateUI(){
  const lb=document.getElementById('leftBtn'),rb=document.getElementById('rightBtn');
  const ls=document.getElementById('leftState'),rs=document.getElementById('rightState');
  const hint=document.getElementById('btnHint'),pauseInd=document.getElementById('pauseIndicator');
  if(activeSide==='sol'){lb.className='side-btn left-btn active-left';ls.textContent='▶ Sayıyor';}
  else if(pausedSide==='sol'){lb.className='side-btn left-btn paused-left';ls.textContent='Duraklatıldı';}
  else{lb.className='side-btn left-btn';ls.textContent='';}
  if(activeSide==='sag'){rb.className='side-btn right-btn active-right';rs.textContent='▶ Sayıyor';}
  else if(pausedSide==='sag'){rb.className='side-btn right-btn paused-right';rs.textContent='Duraklatıldı';}
  else{rb.className='side-btn right-btn';rs.textContent='';}
  if(!sessionStart){hint.textContent='Başlamak için tarafa dokun';pauseInd.classList.remove('visible');}
  else if(activeSide){hint.textContent='Durdurmak için aynı tarafa · Geçmek için diğer tarafa bas';pauseInd.classList.remove('visible');}
  else if(pausedSide){hint.textContent='Devam etmek için aynı tarafa · Geçmek için diğer tarafa bas';pauseInd.classList.add('visible');}
  if(transferSecs>0&&!transferStart)document.getElementById('transferTime').textContent=fmt(transferSecs);
}

function stopSession(){
  if(!sessionStart)return;
  if(activeSide&&sideStart){const e=Math.floor((Date.now()-sideStart)/1000);if(activeSide==='sol')leftSecs+=e;else rightSecs+=e;}
  if(transferStart){transferSecs=Math.floor((Date.now()-transferStart)/1000);transferStart=null;}
  const note=document.getElementById('feedNote').value.trim();
  const entry={id:uid(),timestamp:Date.now(),startSide:firstSide||"sol",leftSecs,rightSecs,transferSecs,totalSecs:leftSecs+rightSecs,note};
  feedH.unshift(entry);if(feedH.length>100)feedH=feedH.slice(0,100);
  sv('bb_feed',feedH);
  activeSide=null;pausedSide=null;transferMode=false;sessionStart=null;firstSide=null;
  leftSecs=0;rightSecs=0;transferSecs=0;sideStart=null;transferStart=null;
  clearInterval(tickInt);tickInt=null;localStorage.removeItem('bb_active');
  document.getElementById('activeSection').classList.remove('running');
  document.getElementById('stopBtn').classList.remove('visible');
  document.getElementById('transferRow').classList.remove('visible');
  document.getElementById('pauseIndicator').classList.remove('visible');
  document.getElementById('leftBtn').className='side-btn left-btn';
  document.getElementById('rightBtn').className='side-btn right-btn';
  document.getElementById('leftTime').textContent='00:00';
  document.getElementById('rightTime').textContent='00:00';
  document.getElementById('leftState').textContent='';
  document.getElementById('rightState').textContent='';
  document.getElementById('feedNote').value='';
  document.getElementById('btnHint').textContent='Başlamak için tarafa dokun';
  updateCountdown();renderFeedHistory();scheduleNotif();
}

function restoreSession(){
  const s=localStorage.getItem('bb_active');if(!s)return;
  try{
    const d=JSON.parse(s);
    leftSecs=d.l||0;rightSecs=d.r||0;transferSecs=d.tr||0;
    sessionStart=d.ss;activeSide=d.as;pausedSide=d.ps;
    firstSide=d.fs;sideStart=d.st;transferStart=d.tst||null;transferMode=d.tm||false;
    document.getElementById('activeSection').classList.add('running');
    document.getElementById('stopBtn').classList.add('visible');
    if(transferSecs>0||transferStart)document.getElementById('transferRow').classList.add('visible');
    updateUI();tickInt=setInterval(tick,1000);tick();
  }catch(e){localStorage.removeItem('bb_active');}
}
function saveActive(){
  if(!sessionStart){localStorage.removeItem('bb_active');return;}
  localStorage.setItem('bb_active',JSON.stringify({l:leftSecs,r:rightSecs,tr:transferSecs,ss:sessionStart,as:activeSide,ps:pausedSide,fs:firstSide,st:sideStart,tst:transferStart,tm:transferMode}));
}

// ── COUNTDOWN ──
function updateCountdown(){
  clearInterval(window._cdi);
  const el=document.getElementById('countdown'),info=document.getElementById('nextSideInfo');
  if(!feedH.length){el.textContent='—';info.innerHTML='İlk emzirmeyi kaydedin';return;}
  const last=feedH[0],nextSide=last.startSide==='sol'?'Sağ':'Sol',nextTs=last.timestamp+alarmInterval*3600000;
  function refresh(){
    const diff=nextTs-Date.now();
    if(diff<=0){el.textContent='Şimdi!';}
    else{const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);el.textContent=h>0?`${h}s ${pad(m)}d`:`${pad(m)}:${pad(s)}`;}
    info.innerHTML=`Sıradaki taraf: <span>${nextSide}</span>`;
  }
  refresh();window._cdi=setInterval(refresh,1000);
}
function renderFeedHistory(){
  const el=document.getElementById('feedHistory');
  if(!feedH.length){el.innerHTML='<div class="history-empty">Henüz kayıt yok 🌸</div>';return;}
  el.innerHTML=feedH.slice(0,10).map((e,i)=>{
    const d=new Date(e.timestamp);
    const ts=d.toLocaleDateString('tr-TR',{day:'numeric',month:'short'})+' '+d.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
    const icon=e.startSide==='sol'?'👈':'👉',lbl=e.startSide==='sol'?'Sol başladı':'Sağ başladı';
    const detail=`Sol: ${fmt(e.leftSecs)} · Sağ: ${fmt(e.rightSecs)}`;
    const transfer=e.transferSecs>0?`<div class="htransfer">🔄 Geçiş: ${fmt(e.transferSecs)}</div>`:'';
    return `<div class="hi"><div class="hbadge ${e.startSide==='sol'?'sol':'sag'}">${icon}</div><div class="hinfo"><div class="hside">${lbl}</div><div class="htime">${ts} · ${detail}</div>${transfer}${e.note?`<div class="hnote">📝 ${e.note}</div>`:''}</div><div class="hdur">${fmt(e.totalSecs)}</div><button onclick="deleteFeed(${i})" style="border:none;background:none;color:var(--text-light);font-size:1rem;cursor:pointer;padding:0 4px;flex-shrink:0;">🗑️</button></div>`;
  }).join('');
}
function updateManualDuration() {
  const startVal = document.getElementById('manualStart').value;
  const endVal = document.getElementById('manualEnd').value;
  const durDiv = document.getElementById('manualDuration');
  const durVal = document.getElementById('manualDurationVal');
  if (!startVal || !endVal) { durDiv.style.display = 'none'; return; }
  const [sh,sm] = startVal.split(':').map(Number);
  const [eh,em] = endVal.split(':').map(Number);
  let diff = (eh*60+em) - (sh*60+sm);
  if (diff <= 0) diff += 24*60; // gece yarısı geçişi
  const h = Math.floor(diff/60);
  const m = diff % 60;
  durVal.textContent = h > 0 ? `${h}s ${pad(m)}dk` : `${m} dakika`;
  durDiv.style.display = 'block';
}

function toggleManual() {
  const card = document.getElementById('manualCard');
  const btn = document.getElementById('manualToggleBtn');
  const visible = card.style.display !== 'none';
  card.style.display = visible ? 'none' : 'block';
  btn.textContent = visible ? '+ Manuel Ekle' : '✕ Kapat';
  if (!visible) {
    // Şu anki saati başlangıç olarak ayarla
    const now = new Date();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    document.getElementById('manualStart').value = `${hh}:${mm}`;
    document.getElementById('manualEnd').value = `${hh}:${mm}`;
    document.getElementById('manualMsg').textContent = '';
  }
}

function saveManual() {
  const startVal = document.getElementById('manualStart').value;
  const endVal = document.getElementById('manualEnd').value;
  const side = document.getElementById('manualSide').value;
  const note = document.getElementById('manualNote').value.trim();
  const msg = document.getElementById('manualMsg');

  if (!startVal || !endVal) { msg.textContent = '❌ Saat girin'; msg.style.color = 'var(--rose-dark)'; return; }

  const today = new Date();
  const [sh, sm] = startVal.split(':').map(Number);
  const [eh, em] = endVal.split(':').map(Number);

  let startTs = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sh, sm, 0).getTime();
  let endTs   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), eh, em, 0).getTime();

  // Gece yarısı geçişi (örn. 23:50 → 00:10)
  if (endTs <= startTs) endTs += 86400000;

  const totalSecs = Math.floor((endTs - startTs) / 1000);
  if (totalSecs <= 0) { msg.textContent = '❌ Bitiş başlangıçtan önce olamaz'; msg.style.color = 'var(--rose-dark)'; return; }

  const entry = {
    timestamp: endTs,
    startSide: side,
    leftSecs: side === 'sol' ? totalSecs : 0,
    rightSecs: side === 'sag' ? totalSecs : 0,
    transferSecs: 0,
    totalSecs,
    note,
    manual: true
  };

  feedH.unshift(entry);
  feedH.sort((a,b) => b.timestamp - a.timestamp);
  if (feedH.length > 100) feedH = feedH.slice(0,100);
  sv('bb_feed', feedH);

  msg.textContent = '✅ Kaydedildi!';
  msg.style.color = 'var(--green-dark)';
  document.getElementById('manualNote').value = '';
  updateCountdown(); renderFeedHistory(); scheduleAlarm();
  setTimeout(() => toggleManual(), 1000);
}

function deleteFeed(i){feedH.splice(i,1);sv('bb_feed',feedH);renderFeedHistory();updateCountdown();scheduleAlarm();}
function clearFeed(){if(!confirm('Emzirme geçmişi silinsin mi?'))return;feedH=[];sv('bb_feed',feedH);renderFeedHistory();updateCountdown();}

// ── DIAPER ──
function logDiaper(type){diaperH.unshift({timestamp:Date.now(),type});if(diaperH.length>100)diaperH=diaperH.slice(0,100);sv('bb_diaper',diaperH);renderDiaperCd();renderDiaperHistory();}
function renderDiaperCd(){
  const el=document.getElementById('diaperCd'),info=document.getElementById('diaperLast');
  if(!diaperH.length){el.textContent='—';info.textContent='Kayıt yok';return;}
  const last=diaperH[0],ts=new Date(last.timestamp).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
  function refresh(){const diff=Date.now()-last.timestamp,h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000);el.textContent=h>0?`${h}s ${pad(m)}d önce`:`${pad(m)}d önce`;el.style.color=diff>3*3600000?'#e07090':'var(--rose-dark)';info.textContent=`Son: ${last.type} · ${ts}`;}
  refresh();clearInterval(window._dci);window._dci=setInterval(refresh,30000);
}
function renderDiaperHistory(){
  const el=document.getElementById('diaperHistory');
  if(!diaperH.length){el.innerHTML='<div class="history-empty">Henüz kayıt yok</div>';return;}
  el.innerHTML=diaperH.slice(0,10).map((e,i)=>{
    const d=new Date(e.timestamp),ts=d.toLocaleDateString('tr-TR',{day:'numeric',month:'short'})+' '+d.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
    return `<div class="hi"><div class="hbadge diaper">${e.type==='ıslak'?'💧':'💩'}</div><div class="hinfo"><div class="hside">${e.type==='ıslak'?'Islak bez':'Kirli bez'}</div><div class="htime">${ts}</div></div><button onclick="deleteDiaper(${i})" style="border:none;background:none;color:var(--text-light);font-size:1rem;cursor:pointer;padding:0 4px;">🗑️</button></div>`;
  }).join('');
}
function deleteDiaper(i){diaperH.splice(i,1);sv('bb_diaper',diaperH);renderDiaperCd();renderDiaperHistory();}
function clearDiaper(){if(!confirm('Bez geçmişi silinsin mi?'))return;diaperH=[];sv('bb_diaper',diaperH);renderDiaperCd();renderDiaperHistory();}

// ── SLEEP ──
function logSleep(type){sleepH.unshift({timestamp:Date.now(),type});if(sleepH.length>100)sleepH=sleepH.slice(0,100);sv('bb_sleep',sleepH);renderSleepStatus();renderSleepHistory();}
function renderSleepStatus(){
  const badge=document.getElementById('sleepBadge'),el=document.getElementById('sleepEl');
  if(!sleepH.length){badge.textContent='☀️ Uyanık';badge.className='sleep-badge awake';el.textContent='';return;}
  const last=sleepH[0],isSleep=last.type==='uyudu';
  badge.textContent=isSleep?'😴 Uyuyor':'☀️ Uyanık';badge.className='sleep-badge '+(isSleep?'sleeping':'awake');
  function refresh(){const diff=Date.now()-last.timestamp,h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000);el.textContent=(isSleep?'Uyuyor: ':'Uyanık: ')+(h>0?`${h}s ${pad(m)}d`:`${pad(m)} dakika`);}
  refresh();clearInterval(window._sli);window._sli=setInterval(refresh,30000);
}
function renderSleepHistory(){
  const el=document.getElementById('sleepHistory');
  if(!sleepH.length){el.innerHTML='<div class="history-empty">Henüz kayıt yok</div>';return;}
  el.innerHTML=sleepH.slice(0,12).map((e,i)=>{
    const d=new Date(e.timestamp),ts=d.toLocaleDateString('tr-TR',{day:'numeric',month:'short'})+' '+d.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
    const isSleep=e.type==='uyudu';let dur='';
    if(isSleep){const wi=sleepH.slice(i+1).findIndex(x=>x.type==='uyandı');if(wi!==-1){const secs=Math.abs(Math.floor((e.timestamp-sleepH[i+1+wi].timestamp)/1000)),h=Math.floor(secs/3600),m=Math.floor((secs%3600)/60);dur=h>0?`${h}s ${pad(m)}d`:`${pad(m)}d`;}}
    return `<div class="hi"><div class="hbadge ${isSleep?'sleeping':'awake'}">${isSleep?'😴':'☀️'}</div><div class="hinfo"><div class="hside">${isSleep?'Uyudu':'Uyandı'}</div><div class="htime">${ts}</div></div>${dur?`<div class="hdur">${dur}</div>`:''}<button onclick="deleteSleep(${i})" style="border:none;background:none;color:var(--text-light);font-size:1rem;cursor:pointer;padding:0 4px;">🗑️</button></div>`;
  }).join('');
}
function deleteSleep(i){sleepH.splice(i,1);sv('bb_sleep',sleepH);renderSleepStatus();renderSleepHistory();}
function clearSleep(){if(!confirm('Uyku geçmişi silinsin mi?'))return;sleepH=[];sv('bb_sleep',sleepH);renderSleepStatus();renderSleepHistory();}

// ── WEIGHT / HEIGHT ──
function saveWeight(type){
  const id=type==='kilo'?'weightVal':'heightVal';
  const val=parseFloat(document.getElementById(id).value);
  if(isNaN(val)||val<=0){alert('Geçerli değer girin');return;}
  const arr=type==='kilo'?weightH:heightH;
  arr.unshift({id:uid(),timestamp:Date.now(),val});if(arr.length>30)arr.splice(30);
  sv(type==='kilo'?'bb_weight':'bb_height',arr);
  document.getElementById(id).value='';renderWeightHistory();
}
function renderWeightHistory(){renderMeasure('weightHistory',weightH,'kg','kilo');renderMeasure('heightHistory',heightH,'cm','boy');}
function renderMeasure(elId,arr,unit,type){
  const el=document.getElementById(elId);
  if(!arr.length){el.innerHTML='<div class="history-empty">Henüz kayıt yok</div>';return;}
  el.innerHTML=arr.slice(0,10).map((e,i)=>{
    const ts=new Date(e.timestamp).toLocaleDateString('tr-TR',{day:'numeric',month:'short',year:'numeric'});
    let diff='';if(i<arr.length-1){const delta=e.val-arr[i+1].val,cls=delta>=0?'up':'dn';diff=`<span class="wdiff ${cls}">${delta>0?'+':''}${delta.toFixed(2)} ${unit}</span>`;}
    return `<div class="witem"><div><div class="wval">${e.val} ${unit}</div><div class="wdate">${ts}</div></div>${diff}<button onclick="deleteMeasure('${type}',${i})" style="border:none;background:none;color:var(--text-light);font-size:1rem;cursor:pointer;padding:0 4px;">🗑️</button></div>`;
  }).join('');
}
function deleteMeasure(type,i){
  if(type==='kilo'){weightH.splice(i,1);sv('bb_weight',weightH);}
  else{heightH.splice(i,1);sv('bb_height',heightH);}
  renderWeightHistory();
}

// ── ANALİZ ──
function calcSleepToday(){
  const now=new Date();now.setHours(0,0,0,0);const todayTs=now.getTime();
  const todaySleep=sleepH.filter(e=>e.timestamp>=todayTs);
  let totalSleep=0,totalAwake=0,sessions=0;
  for(let i=0;i<todaySleep.length;i++){
    const e=todaySleep[i];
    if(e.type==='uyudu'){
      sessions++;
      const next=todaySleep.slice(i+1).find(x=>x.type==='uyandı');
      if(next)totalSleep+=Math.floor((next.timestamp-e.timestamp)/1000);
      else totalSleep+=Math.floor((Date.now()-e.timestamp)/1000);
    } else if(e.type==='uyandı'){
      const next=todaySleep.slice(i+1).find(x=>x.type==='uyudu');
      if(next)totalAwake+=Math.floor((next.timestamp-e.timestamp)/1000);
    }
  }
  return{totalSleep,totalAwake,sessions};
}
function calcSleepForDay(dayTs){
  const nextDay=dayTs+86400000;
  const daySleep=sleepH.filter(e=>e.timestamp>=dayTs&&e.timestamp<nextDay);
  let total=0;
  for(let i=0;i<daySleep.length;i++){
    if(daySleep[i].type==='uyudu'){
      const next=daySleep.slice(i+1).find(x=>x.type==='uyandı');
      if(next)total+=Math.floor((next.timestamp-daySleep[i].timestamp)/1000);
    }
  }
  return Math.round(total/3600*10)/10;
}

function renderAnaliz(){
  const now=new Date();now.setHours(0,0,0,0);const todayTs=now.getTime();
  const tf=feedH.filter(e=>e.timestamp>=todayTs);
  const td=diaperH.filter(e=>e.timestamp>=todayTs);
  const tm=tf.reduce((a,e)=>a+Math.floor(e.totalSecs/60),0);
  let avgI='—';
  if(feedH.length>=2){const diffs=feedH.slice(0,-1).map((e,i)=>e.timestamp-feedH[i+1].timestamp);const avg=diffs.reduce((a,b)=>a+b,0)/diffs.length;const h=Math.floor(avg/3600000),m=Math.floor((avg%3600000)/60000);avgI=h>0?`${h}s ${pad(m)}d`:`${pad(m)}d`;}
  const lw=weightH.length?weightH[0].val+' kg':'—';

  document.getElementById('statGrid').innerHTML=`
    <div class="sbox"><div class="sval">${tf.length}</div><div class="slabel">Bugün emzirme</div></div>
    <div class="sbox"><div class="sval">${tm}d</div><div class="slabel">Bugün toplam dk</div></div>
    <div class="sbox"><div class="sval">${td.length}</div><div class="slabel">Bugün bez</div></div>
    <div class="sbox"><div class="sval">${avgI}</div><div class="slabel">Ort. aralık</div></div>
    <div class="sbox"><div class="sval">${feedH.length}</div><div class="slabel">Toplam kayıt</div></div>
    <div class="sbox"><div class="sval">${lw}</div><div class="slabel">Son kilo</div></div>`;

  // Uyku özeti
  const sl=calcSleepToday();
  function hm(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h>0?`${h}s${pad(m)}d`:`${pad(m)}d`;}
  document.getElementById('sleepTotalToday').textContent=sl.totalSleep>0?hm(sl.totalSleep):'—';
  document.getElementById('sleepAwakeToday').textContent=sl.totalAwake>0?hm(sl.totalAwake):'—';
  document.getElementById('sleepSessionsToday').textContent=sl.sessions||'—';

  // Saatlik ısı haritası (24 saat → 12 hücre = 2 saatlik bloklar)
  const cutoff=Date.now()-3*86400000;
  const recentFeed=feedH.filter(e=>e.timestamp>=cutoff);
  const hourBuckets=Array(12).fill(0); // her hücre = 2 saat
  recentFeed.forEach(e=>{const h=new Date(e.timestamp).getHours();hourBuckets[Math.floor(h/2)]++;});
  const maxBucket=Math.max(...hourBuckets,1);
  const colors=['#f8a4b8','#f28090','#e07090','#cc506a','#a83050'];
  document.getElementById('hourChart').innerHTML=hourBuckets.map((v,i)=>{
    const pct=v/maxBucket;
    const ci=Math.min(Math.floor(pct*4),4);
    const col=v===0?'var(--border)':colors[ci];
    const startH=i*2,label=`${pad(startH)}:00-${pad(startH+2)}:00 · ${v} kez`;
    return `<div class="hour-cell" style="background:${col}" title="${label}"><span style="opacity:${v>0?1:0}">${v||''}</span></div>`;
  }).join('');

  // Peak saat
  if(recentFeed.length){
    const peakIdx=hourBuckets.indexOf(Math.max(...hourBuckets));
    document.getElementById('peakHour').textContent=`En yoğun saat: ${pad(peakIdx*2)}:00 – ${pad(peakIdx*2+2)}:00`;
  } else {document.getElementById('peakHour').textContent='';}

  // 7 günlük emzirme
  const days=last7();
  const wf=days.map(d=>({lbl:dlbl(d),val:feedH.filter(e=>sameDay(new Date(e.timestamp),d)).reduce((a,e)=>a+Math.floor(e.totalSecs/60),0)}));
  const mf=Math.max(...wf.map(d=>d.val),1);
  document.getElementById('weekChart').innerHTML=wf.map(d=>`<div class="bar-wrap"><div class="bar-lbl"><span>${d.lbl}</span><span>${d.val}d</span></div><div class="bar-bg"><div class="bar-fill" style="width:${Math.round(d.val/mf*100)}%"></div></div></div>`).join('');

  // 7 günlük bez
  const wd=days.map(d=>({lbl:dlbl(d),val:diaperH.filter(e=>sameDay(new Date(e.timestamp),d)).length}));
  const md=Math.max(...wd.map(d=>d.val),1);
  document.getElementById('diaperChart').innerHTML=wd.map(d=>`<div class="bar-wrap"><div class="bar-lbl"><span>${d.lbl}</span><span>${d.val} kez</span></div><div class="bar-bg"><div class="bar-fill dy" style="width:${Math.round(d.val/md*100)}%"></div></div></div>`).join('');

  // 7 günlük uyku
  const ws=days.map(d=>{d.setHours(0,0,0,0);return{lbl:dlbl(d),val:calcSleepForDay(d.getTime())};});
  const ms=Math.max(...ws.map(d=>d.val),1);
  document.getElementById('sleepChart').innerHTML=ws.map(d=>`<div class="bar-wrap"><div class="bar-lbl"><span>${d.lbl}</span><span>${d.val}s</span></div><div class="bar-bg"><div class="bar-fill sl" style="width:${Math.round(d.val/ms*100)}%"></div></div></div>`).join('');
}

function last7(){const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);days.push(new Date(d));}return days;}
function sameDay(a,b){return a.getDate()===b.getDate()&&a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear();}
function dlbl(d){return['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'][d.getDay()];}

// ── YEDEKLEME ──
function exportData(){
  const data={
    version:1,
    exportedAt:new Date().toISOString(),
    feed:feedH,diaper:diaperH,sleep:sleepH,weight:weightH,height:heightH,fever:feverH,vaccine:vaccineH,notes:notesH
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const date=new Date().toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'}).replace(/\./g,'-');
  a.href=url;a.download=`bebek-takip-${date}.json`;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importData(event){
  const file=event.target.files[0];if(!file)return;
  const msg=document.getElementById('importMsg');
  const reader=new FileReader();
  reader.onload=function(e){
    try{
      const data=JSON.parse(e.target.result);
      if(!data.version||!data.feed){msg.textContent='❌ Geçersiz dosya formatı';msg.style.color='var(--rose-dark)';return;}
      if(!confirm(`Yedek bulundu (${new Date(data.exportedAt).toLocaleDateString('tr-TR')}). Mevcut veriler silinecek. Devam?`)){event.target.value='';return;}
      feedH=data.feed||[];diaperH=data.diaper||[];sleepH=data.sleep||[];
      weightH=data.weight||[];heightH=data.height||[];feverH=data.fever||[];vaccineH=data.vaccine||[];if(data.customVax){customVaccineSeries=data.customVax;localStorage.setItem('bb_custom_vax',JSON.stringify(data.customVax));}
      sv('bb_fever',feverH);sv('bb_vaccine',vaccineH);
      sv('bb_feed',feedH);sv('bb_diaper',diaperH);sv('bb_sleep',sleepH);
      sv('bb_weight',weightH);sv('bb_height',heightH);sv('bb_notes',notesH);sv('bb_custom_vax',customVaccineSeries);if(data.birthDate){birthDate=data.birthDate;window.birthDate=birthDate;localStorage.setItem('bb_birth',String(data.birthDate));}
      renderFeedHistory();renderDiaperCd();renderSleepStatus();renderWeightHistory();updateCountdown();
      msg.textContent=`✅ Geri yüklendi! ${feedH.length} emzirme, ${diaperH.length} bez, ${sleepH.length} uyku kaydı`;
      msg.style.color='var(--green-dark)';
      renderStorageInfo();
    }catch(err){msg.textContent='❌ Dosya okunamadı: '+err.message;msg.style.color='var(--rose-dark)';}
    event.target.value='';
  };
  reader.readAsText(file);
}

function renderStorageInfo(){
  const keys=['bb_feed','bb_diaper','bb_sleep','bb_weight','bb_height','bb_fever','bb_vaccine','bb_notes','bb_custom_vax'];
  const labels={bb_feed:'Emzirme',bb_diaper:'Bez',bb_sleep:'Uyku',bb_weight:'Kilo',bb_height:'Boy',bb_fever:'Ateş',bb_vaccine:'İğne',bb_notes:'Notlar'};
  const counts={bb_feed:feedH.length,bb_diaper:diaperH.length,bb_sleep:sleepH.length,bb_weight:weightH.length,bb_height:heightH.length,bb_fever:feverH.length,bb_vaccine:vaccineH.length,bb_notes:notesH.length};
  let totalBytes=0;
  const rows=keys.map(k=>{
    const val=localStorage.getItem(k)||'';
    const bytes=new Blob([val]).size;totalBytes+=bytes;
    return `<div class="storage-row"><span>${labels[k]}</span><span>${counts[k]} kayıt · ${(bytes/1024).toFixed(1)} KB</span></div>`;
  }).join('');
  document.getElementById('storageInfo').innerHTML=rows+`<div class="storage-row" style="font-weight:700;margin-top:4px;"><span>Toplam</span><span>${(totalBytes/1024).toFixed(1)} KB</span></div>`;
}


// ── ATEŞ ──
function saveFever(){
  const val=parseFloat(document.getElementById('feverVal').value);
  if(isNaN(val)||val<35||val>42){alert('35-42 arası geçerli değer girin');return;}
  const loc=document.getElementById('feverLocation').value;
  const note=document.getElementById('feverNote').value.trim();
  feverH.unshift({timestamp:Date.now(),val,loc,note});
  if(feverH.length>50)feverH=feverH.slice(0,50);
  sv('bb_fever',feverH);
  document.getElementById('feverVal').value='';
  document.getElementById('feverNote').value='';
  renderFeverHistory();
}
function feverColor(v){
  if(v<37.5) return '#4aac78'; // normal
  if(v<38.5) return '#f59e0b'; // hafif
  if(v<39.5) return '#ea580c'; // yüksek
  return '#e07090'; // çok yüksek
}
function feverLabel(v){
  if(v<37.5) return 'Normal';
  if(v<38.5) return 'Hafif ateş';
  if(v<39.5) return 'Yüksek ateş';
  return '🚨 Çok yüksek';
}
function renderFeverHistory(){
  const el=document.getElementById('feverHistory');
  if(!feverH.length){el.innerHTML='<div class="history-empty">Henüz kayıt yok</div>';return;}
  el.innerHTML=feverH.slice(0,20).map((e,i)=>{
    const d=new Date(e.timestamp);
    const ts=d.toLocaleDateString('tr-TR',{day:'numeric',month:'short'})+' '+d.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
    const col=feverColor(e.val);
    const lbl=feverLabel(e.val);
    return `<div class="hi"><div class="hbadge" style="background:${col}20;font-size:1.1rem;">🌡️</div><div class="hinfo"><div class="hside" style="color:${col}">${e.val}°C — ${lbl}</div><div class="htime">${ts} · ${e.loc}</div>${e.note?`<div class="hnote">📝 ${e.note}</div>`:''}</div><button onclick="deleteFever(${i})" style="border:none;background:none;color:var(--text-light);font-size:1rem;cursor:pointer;padding:0 4px;">🗑️</button></div>`;
  }).join('');
}
function deleteFever(i){feverH.splice(i,1);sv('bb_fever',feverH);renderFeverHistory();}
function clearFever(){if(!confirm('Ateş geçmişi silinsin mi?'))return;feverH=[];sv('bb_fever',feverH);renderFeverHistory();}

// ── İĞNE/AŞI ──
// ── DOGUM TARIHI ──
var birthDate=parseInt(localStorage.getItem("bb_birth")||"0")||null;
window.birthDate=birthDate;
if(birthDate){setTimeout(function(){var inp=document.getElementById("birthDate");if(inp)inp.value=new Date(birthDate).toISOString().slice(0,10);},500);}
function saveBirthDate(){var val=document.getElementById("birthDate").value;if(!val){showToast("Dogum tarihi secin","error");return;}birthDate=new Date(val).getTime();window.birthDate=birthDate;localStorage.setItem("bb_birth",birthDate);try{window.FS_setDoc(window.FS_DATA_DOC,{birthDate:birthDate},{merge:true});}catch(e){}updateBabyAge();renderVaccineTimeline();syncVaccineReminders();showToast("Dogum tarihi kaydedildi","success");}
function updateBabyAge(){var el=document.getElementById("babyAge");if(!el)return;if(!birthDate){el.textContent="Dogum tarihi girilince asi takvimi goruntulenecek ✨";return;}var diffDays=Math.floor((Date.now()-birthDate)/86400000);var months=Math.floor(diffDays/30.44),days=Math.floor(diffDays%30.44);var years=Math.floor(months/12),remainMonths=months%12;var text="";if(years>0)text+=years+" yas ";if(remainMonths>0||years===0)text+=remainMonths+" ay ";if(days>0&&years===0)text+=days+" gun";el.textContent="🎂 "+text+"lik";}
function getBabyAgeMonths(){if(!birthDate)return null;return Math.floor((Date.now()-birthDate)/(30.44*86400000));}

// ── ASI SISTEMI ──
var VAX_ALIASES={"hep b":["hepatit b"],"hepb":["hepatit b"],"hbv":["hepatit b"],"bcg":["verem"],"bch":["verem"],"verem":["verem"],"dbt":["dbt-ipa-hib"],"dabt":["dbt-ipa-hib"],"besli":["dbt-ipa-hib"],"5li":["dbt-ipa-hib"],"karma":["dbt-ipa-hib"],"kpa":["pnomokok"],"pnomokok":["pnomokok"],"zaturre":["pnomokok"],"opa":["opa"],"cocuk felci":["opa"],"polio":["opa"],"kkk":["kkk"],"kizamik":["kkk"],"mmr":["kkk"],"sucicegi":["sucicegi"],"varicella":["sucicegi"],"hepatit a":["hepatit a"],"hepa":["hepatit a"]};
function normalizeVaxName(name){var n=(name||"").toLowerCase().replace(/[^a-z0-9ğüşıöç\-]/g,"").trim();for(var alias in VAX_ALIASES){if(n.includes(alias))return VAX_ALIASES[alias][0];var targets=VAX_ALIASES[alias];for(var t=0;t<targets.length;t++){if(n.includes(targets[t]))return targets[0];}}return n;}
function normalizeDose(dose){var d=(dose||"").toLowerCase().trim();if(d.includes("1")||d.includes("tek"))return"1. doz";if(d.includes("2"))return"2. doz";if(d.includes("3"))return"3. doz";if(d.includes("rapel")||d.includes("4"))return"rapel";return d;}
var VACCINE_SCHEDULE=[];
function matchVaccines(){var babyAgeMonths=getBabyAgeMonths();var customSeries=JSON.parse(localStorage.getItem("bb_custom_vax")||"[]");var fullSchedule=VACCINE_SCHEDULE.slice();for(var s=0;s<customSeries.length;s++){var cs=customSeries[s];for(var d=0;d<cs.doses.length;d++){fullSchedule.push({plannedDate:cs.doses[d].plannedDate,name:cs.name,dose:cs.doses[d].dose,desc:"Ozel asi serisi",group:"ozel",seriesIdx:s,doseIdx:d});}}var schedule=fullSchedule.map(function(sched){var match=null,schedNormal=normalizeVaxName(sched.name);for(var i=0;i<vaccineH.length;i++){var v=vaccineH[i];if(normalizeVaxName(v.name)===schedNormal&&normalizeDose(v.dose)===normalizeDose(sched.dose)){match=v;break;}}if(match)return{name:sched.name,dose:sched.dose,desc:sched.desc,plannedDate:sched.plannedDate,group:sched.group,status:"done",matched:match,date:match.timestamp,seriesIdx:sched.seriesIdx,doseIdx:sched.doseIdx};return{name:sched.name,dose:sched.dose,desc:sched.desc,plannedDate:sched.plannedDate,group:sched.group,status:"pending",matched:null,seriesIdx:sched.seriesIdx,doseIdx:sched.doseIdx};});for(var i=0;i<vaccineH.length;i++){var v=vaccineH[i],vNormal=normalizeVaxName(v.name),found=false;for(var j=0;j<schedule.length;j++){if(vNormal===normalizeVaxName(schedule[j].name)&&normalizeDose(v.dose)===normalizeDose(schedule[j].dose)){found=true;break;}}if(!found){schedule.push({name:v.name,dose:v.dose||"Tek Doz",desc:v.note||"Ozel asi",plannedDate:null,group:"ozel",status:"done",matched:v,date:v.timestamp});}}schedule.sort(function(a,b){if(a.status==="done"&&b.status!=="done")return 1;if(b.status==="done"&&a.status!=="done")return-1;if(!a.plannedDate)return 1;if(!b.plannedDate)return-1;return a.plannedDate-b.plannedDate;});return schedule;}
function quickMarkVaccine(name,dose){if(!confirm(name+"\\n("+dose+") yapildi olarak isaretlensin mi?"))return;vaccineH.unshift({id:uid(),timestamp:Date.now(),name:name,dose:dose,note:""});vaccineH.sort(function(a,b){return b.timestamp-a.timestamp;});if(vaccineH.length>50)vaccineH=vaccineH.slice(0,50);sv("bb_vaccine",vaccineH);syncVaccineReminders();renderVaccineHistory();showToast("💉 "+name+" ("+dose+") — yapildi!","success");}
function deleteCustomDose(seriesIdx,doseIdx){var cs=customVaccineSeries[seriesIdx];if(!cs)return;var dose=cs.doses[doseIdx];if(!confirm(cs.name+" - "+dose.dose+"\\ndozu silinsin mi?"))return;cs.doses.splice(doseIdx,1);if(cs.doses.length===0){customVaccineSeries.splice(seriesIdx,1);}sv("bb_custom_vax",customVaccineSeries);renderVaccineTimeline();showToast("Doz silindi","error");}
function deleteCustomSeries(idx){var cs=customVaccineSeries[idx];if(!cs)return;var doseNames=cs.doses.map(function(d){return d.dose;}).join(", ");if(!confirm(cs.name+" serisini sil\\n("+cs.doses.length+" doz: "+doseNames+")\\n\\nBu islem geri alinamaz!"))return;customVaccineSeries.splice(idx,1);sv("bb_custom_vax",customVaccineSeries);renderVaccineTimeline();showToast("Asi serisi silindi","error");}function renderVaccineTimeline(){var card=document.getElementById("vaccineScheduleCard"),prog=document.getElementById("vaccineProgress"),tl=document.getElementById("vaccineTimeline");if(!card||!prog||!tl)return;var schedule=matchVaccines(),done=0,overdue=0;for(var i=0;i<schedule.length;i++){if(schedule[i].status==="done")done++;if(schedule[i].status==="pending")overdue++;}var total=schedule.length;if(!birthDate){card.style.display="block";prog.innerHTML='<div style="text-align:center;color:var(--text-light);font-size:.8rem;">Dogum tarihi girilince asi takvimi goruntulenecek ✨</div>';tl.innerHTML="";return;}card.style.display="block";var pct=Math.round(done/Math.max(total,1)*100);var reminders=[];for(var i=0;i<schedule.length;i++){var s=schedule[i];if(s.status==="pending"&&s.plannedDate){var daysUntil=Math.floor((s.plannedDate-Date.now())/86400000);if(daysUntil<=7&&daysUntil>0)reminders.push({name:s.name,dose:s.dose,days:daysUntil});}}prog.innerHTML='<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="font-size:.7rem;color:var(--text-light);">Tamamlanan</span><span style="font-size:.8rem;font-weight:700;color:var(--green-dark);">'+done+'/'+total+' asi (%'+pct+')</span></div><div class="bar-bg"><div class="bar-fill" style="width:'+pct+'%;background:linear-gradient(90deg,var(--green),var(--green-dark));"></div></div>'+(overdue>0?'<div style="text-align:center;font-size:.78rem;font-weight:700;color:var(--yellow-dark);margin-top:5px;">⏳ '+overdue+' asi bekliyor</div>':'');if(reminders.length>0){var rh="";for(var i=0;i<reminders.length;i++){var r=reminders[i],label=r.days<=1?"🔔 Yarin!":(r.days<=2?"⚠️ "+r.days+" gun kaldi":"⏰ "+r.days+" gun kaldi");rh+='<div class="vax-reminder">'+label+' — '+r.name+' ('+r.dose+')</div>';}prog.innerHTML+=rh;}var statusLabels={done:"✅ Yapildi",pending:"⏳ Bekliyor",custom:"💜 Ozel Asi"};
// Dozlari asi adina gore grupla
var groups={};
for(var i=0;i<schedule.length;i++){
  var v=schedule[i], key=v.name;
  if(!groups[key]) groups[key]=[];
  groups[key].push(v);
}
var html='';
for(var gname in groups){
  var doses=groups[gname], doneCnt=0;
  for(var d=0;d<doses.length;d++){ if(doses[d].status==="done") doneCnt++; }
  html+='<div class="vax-group"><div class="vg-title">💉 '+gname+' <span class="vg-badge">'+doneCnt+'/'+doses.length+'</span></div><div class="vtl">';
  for(var d=0;d<doses.length;d++){
    var v=doses[d],
        dateStr=v.date?new Date(v.date).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"}):"",
        noteStr=v.matched&&v.matched.note?" — "+v.matched.note:"",
        expectedDate="";
    if(v.plannedDate){ var expDate=new Date(v.plannedDate); expectedDate=expDate.toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"}); }
    var monthLabel=v.plannedDate?expectedDate:"",
        clickable=v.status==="pending",
        hint=clickable?' <span style="font-size:.6rem;opacity:.6;">(yapildi isaretle)</span>':"",
        delBtn=(v.seriesIdx!==undefined)?' <button onclick="event.stopPropagation();deleteCustomDose('+v.seriesIdx+','+v.doseIdx+')" style="border:none;background:none;color:var(--text-light);cursor:pointer;font-size:.7rem;padding:0 2px;" title="Bu dozu sil">🗑️</button>':"";
    html+='<div class="vti '+v.status+'" data-vax-idx="'+d+'"><div class="vtname">'+v.dose+delBtn+'</div><div class="vtstatus">'+statusLabels[v.status]+(dateStr?" · Yapildi: "+dateStr:"")+((v.status!=="done"&&monthLabel)?" · Beklenen: "+monthLabel:"")+hint+noteStr+'</div></div>';
  }
  html+='</div></div>';
}
tl.innerHTML=html;var items=tl.querySelectorAll(".vti");for(var j=0;j<items.length;j++){(function(vti,sched){if(sched.status==="pending"){vti.style.cursor="pointer";vti.addEventListener("click",function(){quickMarkVaccine(sched.name,sched.dose);});}})(items[j],schedule[j]);}}
function syncVaccineReminders(){if(!birthDate)return;var names=vaccineH.map(function(v){return{name:v.name,dose:v.dose};});try{fetch(window.API_URL+"/api/update-vaccine-reminders",{method:"POST",headers:{"Content-Type":"application/json","X-API-Secret":window.API_SECRET},body:JSON.stringify({birthDate:birthDate,vaccineNames:names})}).catch(function(){});}catch(e){}}

// ── OZEL ASI SERISI ──
var customVaccineSeries=JSON.parse(localStorage.getItem("bb_custom_vax")||"[]");window.customVaccineSeries=customVaccineSeries;
var customDoseCount=1;
function toggleCustomSeries(){var form=document.getElementById("customSeriesForm"),btn=document.getElementById("customSeriesToggle");if(form.style.display==="none"){form.style.display="block";btn.textContent="✕ Kapat";document.getElementById("customVaxName").value="";document.getElementById("customSeriesMsg").textContent="";customDoseCount=1;document.getElementById("customDoses").innerHTML='<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;"><input class="note-inp" id="cdLabel0" placeholder="Doz adi (1. Doz, Rapel...)" maxlength="20" style="flex:1;padding:7px 8px;font-size:.78rem;margin-bottom:0;"><input type="date" id="cdDate0" class="winp" style="flex:1;padding:7px 8px;font-size:.78rem;"></div>';}else{form.style.display="none";btn.textContent="+ Ekle";}}
function addCustomDose(){customDoseCount++;var div=document.createElement("div");div.style.cssText="display:flex;gap:6px;align-items:center;margin-bottom:6px;";div.innerHTML='<input class="note-inp" id="cdLabel'+(customDoseCount-1)+'" placeholder="Doz adi" maxlength="20" style="flex:1;padding:7px 8px;font-size:.78rem;margin-bottom:0;"><input type="date" id="cdDate'+(customDoseCount-1)+'" class="winp" style="flex:1;padding:7px 8px;font-size:.78rem;"><button onclick="this.parentElement.remove();customDoseCount--" style="border:none;background:none;color:var(--rose-dark);cursor:pointer;font-size:.9rem;">✕</button>';document.getElementById("customDoses").appendChild(div);}
function saveCustomVaccineSeries(){var name=document.getElementById("customVaxName").value.trim(),msg=document.getElementById("customSeriesMsg");if(!name){msg.textContent="❌ Asi adi girin";msg.style.color="var(--rose-dark)";return;}var doses=[];for(var i=0;i<customDoseCount;i++){var dateEl=document.getElementById("cdDate"+i),labelEl=document.getElementById("cdLabel"+i);if(dateEl&&dateEl.value){var ts=new Date(dateEl.value).getTime();if(!isNaN(ts)){var label=labelEl&&labelEl.value.trim()?labelEl.value.trim():(i+1)+". Doz";doses.push({dose:label,plannedDate:ts});}}}if(doses.length===0){msg.textContent="❌ En az bir doz icin tarih girin";msg.style.color="var(--rose-dark)";return;}customVaccineSeries.push({name:name,doses:doses,addedAt:Date.now()});sv("bb_custom_vax",customVaccineSeries);msg.textContent="✅ "+name+" eklendi ("+doses.length+" doz)";msg.style.color="var(--green-dark)";toggleCustomSeries();renderVaccineTimeline();showToast("💉 "+name+" takvime eklendi","success");}

function saveVaccine(){
  const name=document.getElementById('vaccineName').value.trim();
  if(!name){alert('Aşı adı girin');return;}
  const dateVal=document.getElementById('vaccineDate').value;
  const dose=document.getElementById('vaccineDose').value;
  const note=document.getElementById('vaccineNote').value.trim();
  const timestamp=dateVal?new Date(dateVal).getTime():Date.now();
  vaccineH.unshift({timestamp,name,dose,note});
  vaccineH.sort((a,b)=>b.timestamp-a.timestamp);
  if(vaccineH.length>50)vaccineH=vaccineH.slice(0,50);
  sv('bb_vaccine',vaccineH);
  document.getElementById('vaccineName').value='';
  document.getElementById('vaccineNote').value='';
  document.getElementById('vaccineDate').value='';
  renderVaccineHistory();
}
function renderVaccineHistory(){
  const el=document.getElementById('vaccineHistory');
  if(!vaccineH.length){el.innerHTML='<div class="history-empty">Henüz kayıt yok</div>';renderVaccineTimeline();return;}
  el.innerHTML=vaccineH.map((e,i)=>{
    const ts=new Date(e.timestamp).toLocaleDateString('tr-TR',{day:'numeric',month:'short',year:'numeric'});
    return `<div class="hi"><div class="hbadge" style="background:#fce7f3;font-size:1.1rem;">💉</div><div class="hinfo"><div class="hside">${e.name} <span style="font-weight:400;color:var(--text-light);font-size:0.8rem;">${e.dose}</span></div><div class="htime">${ts}</div>${e.note?`<div class="hnote">📝 ${e.note}</div>`:''}</div><button onclick="deleteVaccine(${i})" style="border:none;background:none;color:var(--text-light);font-size:1rem;cursor:pointer;padding:0 4px;">🗑️</button></div>`;
  }).join('');
  renderVaccineTimeline();
}
function deleteVaccine(i){vaccineH.splice(i,1);sv('bb_vaccine',vaccineH);renderVaccineHistory();}
function clearVaccine(){if(!confirm('Aşı geçmişi silinsin mi?'))return;vaccineH=[];sv('bb_vaccine',vaccineH);renderVaccineHistory();}


// ── NOTLAR ──
function saveNote(){
  const title=document.getElementById('noteTitle').value.trim();
  const body=document.getElementById('noteBody').value.trim();
  if(!body){alert('Not içeriği boş olamaz');return;}
  notesH.unshift({id:Date.now(),timestamp:Date.now(),title,body});
  if(notesH.length>100)notesH=notesH.slice(0,100);
  sv('bb_notes',notesH);
  document.getElementById('noteTitle').value='';
  document.getElementById('noteBody').value='';
  renderNotes();
}
function deleteNote(id){
  notesH=notesH.filter(n=>n.id!==id);
  sv('bb_notes',notesH);
  renderNotes();
}
function editNote(id){
  const n=notesH.find(x=>x.id===id);if(!n)return;
  document.getElementById('noteTitle').value=n.title||'';
  document.getElementById('noteBody').value=n.body||'';
  deleteNote(id);
  document.getElementById('noteTitle').focus();
  window.scrollTo(0,0);
}
function renderNotes(){
  const el=document.getElementById('notesList');
  if(!notesH.length){
    el.innerHTML='<div class="card"><div class="history-empty">Henüz not yok 📝</div></div>';
    return;
  }
  el.innerHTML=notesH.map(n=>{
    const ts=new Date(n.timestamp).toLocaleDateString('tr-TR',{day:'numeric',month:'short',year:'numeric'})+' '+new Date(n.timestamp).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
    const preview=n.body.length>120?n.body.slice(0,120)+'...':n.body;
    return `<div class="card" style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
        <div style="font-weight:700;font-size:0.9rem;color:var(--rose-dark);flex:1;">${n.title||'Not'}</div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button onclick="editNote(${n.id})" style="border:none;background:var(--border);border-radius:8px;padding:4px 8px;font-size:0.75rem;cursor:pointer;color:var(--text-light);">✏️</button>
          <button onclick="deleteNote(${n.id})" style="border:none;background:none;color:var(--text-light);font-size:1rem;cursor:pointer;">🗑️</button>
        </div>
      </div>
      <div style="font-size:0.85rem;color:var(--text);line-height:1.5;white-space:pre-wrap;">${preview}</div>
      <div style="font-size:0.68rem;color:var(--text-light);margin-top:6px;">${ts}</div>
    </div>`;
  }).join('');
}

// ── UTILS ──
function fmt(secs){const m=Math.floor(secs/60),s=secs%60;return`${pad(m)}:${pad(s)}`;}
function pad(n){return String(n).padStart(2,"0");}
function uid(){return Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8);}
function showToast(msg,type){var c=document.getElementById("toastContainer");if(!c){c=document.createElement("div");c.id="toastContainer";c.className="toast-container";document.body.appendChild(c);}var t=document.createElement("div");t.className="toast "+(type||"");t.textContent=msg;c.appendChild(t);setTimeout(function(){t.remove();},3200);}
function _mergeById(remote,local,maxLen){var map=new Map();remote.forEach(function(e){var key=e.id||(e.timestamp+"_"+(e.type||"")+"_"+(e.startSide||""));map.set(key,e);});local.forEach(function(e){var key=e.id||(e.timestamp+"_"+(e.type||"")+"_"+(e.startSide||""));map.set(key,e);});var merged=Array.from(map.values()).sort(function(a,b){return b.timestamp-a.timestamp;});return maxLen?merged.slice(0,maxLen):merged;}
window._mergeById=_mergeById;

// ── INIT ──
var lastTab=localStorage.getItem('bb_last_tab')||'emzirme';showTab(lastTab);
initIntervalBtns();restoreSession();updateCountdown();renderFeedHistory();
renderDiaperCd();renderDiaperHistory();renderSleepStatus();renderWeightHistory();
renderFeverHistory();renderVaccineHistory();renderNotes();
scheduleAlarm();
initPWA();
setTimeout(function(){var lo=document.getElementById("loadingOverlay");if(lo)lo.style.display="none";},1000);
setTimeout(function(){var box=document.getElementById("notifBanner");if(!box)return;var perm=Notification.permission;if(perm==="granted"){box.className="notif-banner granted";box.textContent="✅ Bildirimler aktif!";}else if(perm==="denied"){box.className="notif-banner denied";box.textContent="❌ Bildirim engellendi.";}else{box.className="notif-banner";box.textContent="🔔 Bildirim izni verilmemis.";}},3000);
