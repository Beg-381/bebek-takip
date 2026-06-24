
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB2WWcnLR3ROyJEZ-mRXBoYSyhViNv9L_I",
  authDomain: "alisa-36e99.firebaseapp.com",
  projectId: "alisa-36e99",
  storageBucket: "alisa-36e99.firebasestorage.app",
  messagingSenderId: "649957485100",
  appId: "1:649957485100:web:23b3372061650f9c0e7f89"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const DATA_DOC = doc(db, "bebek", "ortak");
window.API_URL = "https://bebek-takip.ggroupang.workers.dev";
window.FS_setDoc = setDoc;
window.FS_DATA_DOC = DATA_DOC;

function applyData(d) {
  const map = {feed:'bb_feed',diaper:'bb_diaper',sleep:'bb_sleep',weight:'bb_weight',height:'bb_height',fever:'bb_fever',vaccine:'bb_vaccine',notes:'bb_notes',customVax:'bb_custom_vax'};
  const varMap = {feed:'feedH',diaper:'diaperH',sleep:'sleepH',weight:'weightH',height:'heightH',fever:'feverH',vaccine:'vaccineH',notes:'notesH',customVax:'customVaccineSeries'};
  Object.keys(map).forEach(k => {
    if (d[k] && (typeof d[k] !== 'object' || (Array.isArray(d[k]) ? d[k].length > 0 : true))) {
      window[varMap[k]] = d[k];
      localStorage.setItem(map[k], JSON.stringify(d[k]));
    }
  });
  if (d.birthDate) { window.birthDate = d.birthDate; localStorage.setItem("bb_birth", String(d.birthDate)); if(typeof updateBabyAge==="function") updateBabyAge(); }
}

function refreshUI() {
  if (typeof updateCountdown !== 'function') return;
  updateCountdown(); renderFeedHistory(); renderDiaperCd(); renderDiaperHistory();
  renderSleepStatus(); renderWeightHistory(); renderFeverHistory(); renderVaccineHistory(); renderNotes();
  scheduleAlarm();
}

// İlk yükleme — Firestore'dan çek, UI'yi güncelle
getDoc(DATA_DOC).then(snap => {
  if (snap.exists()) { applyData(snap.data()); refreshUI(); }
});

// Gerçek zamanlı dinle
let firstSnap = true;
onSnapshot(DATA_DOC, snap => {
  if (!snap.exists()) return;
  if (firstSnap) { firstSnap = false; return; } // ilk tetiklenmeyi atla
  applyData(snap.data());
  refreshUI();
});

// sv() çağrıldığında Firestore'a yaz
window.fsWrite = async function(key, data) {
  const keyMap = {bb_feed:'feed',bb_diaper:'diaper',bb_sleep:'sleep',bb_weight:'weight',bb_height:'height',bb_fever:'fever',bb_vaccine:'vaccine',bb_notes:'notes',bb_custom_vax:'customVax'};
  if (!keyMap[key]) return;
  try { await setDoc(DATA_DOC, {[keyMap[key]]: data}, {merge: true}); } catch(e) { console.error('FS:', e); }
};

// localStorage verilerini Firestore'a it
setTimeout(function(){['bb_feed','bb_diaper','bb_sleep','bb_weight','bb_height','bb_fever','bb_vaccine','bb_notes','bb_custom_vax'].forEach(function(k){var d=[];try{d=JSON.parse(localStorage.getItem(k)||'[]');}catch(e){}if(d.length)window.fsWrite(k,d);});},2000);
