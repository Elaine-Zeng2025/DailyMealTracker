const API_BASE = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://piecebypeas.onrender.com/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function checkAuth() {
  const { ok } = await apiFetch('/auth/me');
  if (!ok && !window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
    window.location.href = 'login.html';
  }
}

function initTagSelect() {
  document.querySelectorAll('.tag-option').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('selected'));
  });
}

function getSelectedTags() {
  return [...document.querySelectorAll('.tag-option.selected')].map(b => b.dataset.tag);
}

function parseDate(str) {
  if (!str) return null;
  return new Date(str.replace(' ', 'T'));
}

function getDateStr(str) {
  if (!str) return null;
  return str.substring(0, 10);
}

// ══════════════════════════════════════
// ROUTER
// ══════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  const path = window.location.pathname;
  if (path.includes('login.html') || path.endsWith('login')) { initLoginPage(); applyLanguage(); return; }
  if (path.includes('register')) { initRegisterPage(); applyLanguage(); return; }
  checkAuth().then(() => {
    NavBar.updateGreeting();
    applyLanguage();
    if (path.includes('add'))    initAddPage();
    if (path.includes('log'))    initLogPage();
    if (path.includes('report')) initReportPage();
    if (path.includes('index') || path === '/' || path.endsWith('/')) initHomePage();
  });
});

// ══════════════════════════════════════
// LOGIN
// ══════════════════════════════════════
function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const { ok, data } = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (ok) {
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('userEmail', data.user.email);
      const btn = document.querySelector('.login-btn');
      if (btn) { btn.textContent = `Welcome, ${data.user.username}!`; btn.style.background = '#628A6B'; }
      setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    } else {
      alert(data.error || 'Login failed.');
    }
  });
}

// ══════════════════════════════════════
// REGISTER
// ══════════════════════════════════════
function initRegisterPage() {
  const form = document.getElementById('registerForm');
  if (!form) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const { ok, data } = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) });
    if (ok) {
      showNotification(typeof t === 'function' ? t('account_created') : 'Account created! Please log in.', 'success');
      setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    } else {
      alert(data.error || 'Registration failed.');
    }
  });
}

// ══════════════════════════════════════
// HOME
// ══════════════════════════════════════
function initHomePage() {
  const el = document.getElementById('homeGreeting');
  if (!el) return;
  const h = new Date().getHours();
  if (typeof t === 'function') {
    if (h < 12) el.textContent = t('greeting_morning');
    else if (h < 17) el.textContent = t('greeting_afternoon');
    else el.textContent = t('greeting_evening');
  } else {
    if (h < 12) el.textContent = 'Good morning! Ready for breakfast?';
    else if (h < 17) el.textContent = 'Good afternoon! Time for lunch?';
    else el.textContent = "Good evening! What's for dinner?";
  }
}

// ══════════════════════════════════════
// ADD MEAL
// ══════════════════════════════════════
function initAddPage() {
  initTagSelect();
  const timeInput = document.getElementById('mealTime');
  if (timeInput && !timeInput.value) {
    const now = new Date();
    timeInput.value = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  }

  const editingMeal = sessionStorage.getItem('editingMeal');
  if (editingMeal) {
    const meal = JSON.parse(editingMeal);
    const nameEl = document.getElementById('mealName');
    const typeEl = document.getElementById('mealType');
    const timeEl = document.getElementById('mealTime');
    if (nameEl) nameEl.value = meal.title || '';
    if (typeEl) typeEl.value = meal.type || '';
    if (timeEl) timeEl.value = meal.time || '';
    (meal.includes || []).forEach(g => {
      const cb = document.getElementById(g);
      if (cb) cb.checked = true;
    });
    setTimeout(() => {
      (meal.tags || []).forEach(tag => {
        document.querySelectorAll('.tag-option').forEach(btn => {
          if (btn.dataset.tag === tag) btn.classList.add('selected');
        });
      });
    }, 50);
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.textContent = typeof t === 'function' ? t('update') : 'Update';
  }

  const form = document.getElementById('mealForm');
  if (!form) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const title = document.getElementById('mealName').value.trim();
    const type = document.getElementById('mealType').value;
    const time = document.getElementById('mealTime').value;
    const includes = [...document.querySelectorAll('.food-item input[type="checkbox"]:checked')].map(cb => cb.value);
    const tags = getSelectedTags();

    if (!title || !type || !time) { alert('Please fill in all required fields'); return; }
    if (includes.length === 0) { alert('Please select at least one food group'); return; }

    const editing = sessionStorage.getItem('editingMeal');
    if (editing) {
      const old = JSON.parse(editing);
      const { ok, data } = await apiFetch(`/meals/${old.id}`, { method: 'PUT', body: JSON.stringify({ title, type, time, includes, tags }) });
      if (ok) {
        sessionStorage.removeItem('editingMeal');
        showNotification('Meal updated!', 'success');
        setTimeout(() => { window.location.href = 'log.html'; }, 900);
      } else {
        alert(data.error || 'Failed to update.');
      }
    } else {
      const { ok, data } = await apiFetch('/meals/', { method: 'POST', body: JSON.stringify({ title, type, time, includes, tags }) });
      if (ok) {
        showNotification('Meal added!', 'success');
        setTimeout(() => { window.location.href = 'log.html'; }, 900);
      } else {
        alert(data.error || 'Failed to save.');
      }
    }
  });

  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) cancelBtn.onclick = () => {
    sessionStorage.removeItem('editingMeal');
    window.location.href = 'log.html';
  };
  applyLanguage();
}

// ══════════════════════════════════════
// LOG PAGE
// ══════════════════════════════════════
let logOffset = 0;
let allMeals = [];
let activeTab = 'today';

function initLogPage() {
  const prevBtn = document.getElementById('prevDayBtn');
  const nextBtn = document.getElementById('nextDayBtn');
  if (prevBtn) prevBtn.addEventListener('click', () => { logOffset--; renderLog(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { if (logOffset < 0) { logOffset++; renderLog(); } });
  loadMeals();
}

async function loadMeals() {
  const { ok, data } = await apiFetch('/meals/');
  if (!ok) return;
  allMeals = data;
  renderLog();
}

function renderLog() {
  updateDateDisplay();
  if (activeTab === 'today') renderToday();
  else renderHistory();
}

function updateDateDisplay() {
  const d = new Date();
  d.setDate(d.getDate() + logOffset);
  const isToday = logOffset === 0;
  const isYesterday = logOffset === -1;
  const mainEl = document.getElementById('dateMain');
  const subEl = document.getElementById('dateSub');
  const nextBtn = document.getElementById('nextDayBtn');
  const lang = typeof getLang === 'function' ? getLang() : 'en';
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  if (mainEl) {
    if (isToday) mainEl.textContent = typeof t === 'function' ? t('today') : 'Today';
    else if (isYesterday) mainEl.textContent = typeof t === 'function' ? t('yesterday') : 'Yesterday';
    else mainEl.textContent = d.toLocaleDateString(locale, { weekday: 'long' });
  }
  if (subEl) subEl.textContent = d.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' });
  if (nextBtn) nextBtn.disabled = logOffset >= 0;
}

function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tabToday')?.classList.toggle('active', tab === 'today');
  document.getElementById('tabHistory')?.classList.toggle('active', tab === 'history');
  const todayView = document.getElementById('todayView');
  const historyView = document.getElementById('historyView');
  if (todayView) todayView.style.display = tab === 'today' ? 'block' : 'none';
  if (historyView) historyView.style.display = tab === 'history' ? 'block' : 'none';
  renderLog();
}

function getMealsForDate(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  return allMeals.filter(m => getDateStr(m.created_at) === dateStr);
}

function renderToday() {
  const meals = getMealsForDate(logOffset);
  const countEl = document.getElementById('todayCount');
  const listEl = document.getElementById('mealList');
  const sugEl = document.getElementById('suggestionsBox');
  const recorded = typeof t === 'function' ? t('meals_recorded') : 'meals recorded';

  if (countEl) countEl.textContent = meals.length ? `${meals.length} ${recorded}` : '';
  if (!listEl) return;

  if (meals.length === 0) {
    const noMeals = typeof t === 'function' ? t('no_meals') : 'No meals recorded yet';
    const addFirst = typeof t === 'function' ? t('add_first') : 'Add your first meal';
    listEl.innerHTML = `<div class="empty-state"><p>${noMeals}</p><button class="btn-primary" onclick="location.href='add.html'">${addFirst}</button></div>`;
    if (sugEl) sugEl.innerHTML = '';
    return;
  }

  meals.sort((a, b) => (a.time || '') > (b.time || '') ? 1 : -1);

  listEl.innerHTML = meals.map(meal => {
    const tags = Array.isArray(meal.tags) ? meal.tags : (typeof meal.tags === 'string' ? JSON.parse(meal.tags || '[]') : []);
    const dots = (meal.includes || []).map(g => `<span class="food-dot ${g}" title="${g}"></span>`).join('');
    const tagPills = tags.map(tag => {
      const cls = tag === 'diet' ? 'pill-diet' : tag === 'cheat' ? 'pill-cheat' : 'pill-type';
      const label = typeof t === 'function' ? t('tag_' + tag) : capitalize(tag) + ' meal';
      return `<span class="pill ${cls}">${label}</span>`;
    }).join('');
    const typeLabel = typeof t === 'function' ? t(meal.type) : capitalize(meal.type);

    return `<div class="meal-card">
      <div class="meal-card-top">
        <span class="meal-card-name">${meal.title}</span>
        <span class="meal-card-time">${formatTime(meal.time)}</span>
      </div>
      <div class="meal-card-meta">
        <span class="pill pill-type">${typeLabel}</span>
        ${tagPills}
        <div class="food-dots">${dots}</div>
      </div>
      <div class="meal-card-actions">
        <button class="btn-edit-sm" onclick="editMeal(${meal.id})" title="Edit">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn-delete" onclick="deleteMeal(${meal.id})" title="Delete">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>`;
  }).join('');

  if (sugEl) sugEl.innerHTML = buildSuggestions(meals);
}

function renderHistory() {
  const listEl = document.getElementById('historyList');
  if (!listEl) return;
  const lang = typeof getLang === 'function' ? getLang() : 'en';
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';

  const grouped = {};
  allMeals.forEach(m => {
    const d = getDateStr(m.created_at);
    if (!d) return;
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(m);
  });

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  if (dates.length === 0) {
    listEl.innerHTML = `<div class="empty-state"><p>${typeof t === 'function' ? t('no_meals') : 'No history yet'}</p></div>`;
    return;
  }

  listEl.innerHTML = dates.map(date => {
    const meals = grouped[date];
    const groups = [...new Set(meals.flatMap(m => m.includes || []))];
    const dots = groups.map(g => `<span class="food-dot ${g}"></span>`).join('');
    const d = new Date(date + 'T12:00:00');
    const label = d.toLocaleDateString(locale, { month: 'long', day: 'numeric' });
    const mealWord = lang === 'zh' ? `${meals.length} 餐` : `${meals.length} meal${meals.length > 1 ? 's' : ''}`;
    const groupsText = lang === 'zh' ? `${groups.length} / 6 类` : `${groups.length} / 6 groups`;
    return `<div class="history-card" onclick="jumpToDate('${date}')">
      <div class="history-card-top">
        <span class="history-date">${label}</span>
        <span class="history-count">${mealWord}</span>
      </div>
      <div style="display:flex;align-items:center;gap:4px">
        <div class="food-dots">${dots}</div>
        <span class="history-groups">${groupsText}${groups.length === 6 ? ' ✓' : ''}</span>
      </div>
    </div>`;
  }).join('');
}

function jumpToDate(dateStr) {
  const target = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(12,0,0,0);
  const diffDays = Math.round((target - today) / 86400000);
  logOffset = diffDays;
  switchTab('today');
}

function buildSuggestions(meals) {
  const all = ['grains','protein','vegetables','fruits','dairy','snacks'];
  const consumed = new Set(meals.flatMap(m => m.includes || []));
  const missing = all.filter(g => !consumed.has(g));
  const title = typeof t === 'function' ? t('suggestions_title') : "Today's suggestions";

  if (missing.length === 0) {
    const allGood = typeof t === 'function' ? t('all_groups') : "You've covered all food groups today! 🎉";
    return `<div class="suggestions-box"><div class="suggestions-title">${title}</div><p style="font-size:.85rem;color:var(--text-mid)">${allGood}</p></div>`;
  }

  const tips = {
    grains:     typeof t === 'function' ? t('tip_grains')     : 'Try adding rice, bread, or oatmeal to your next meal.',
    protein:    typeof t === 'function' ? t('tip_protein')    : 'Consider eggs, chicken, beans, or tofu.',
    vegetables: typeof t === 'function' ? t('tip_vegetables') : 'Sneak in some leafy greens, carrots, or bell peppers.',
    fruits:     typeof t === 'function' ? t('tip_fruits')     : 'Grab an apple, banana, or a handful of berries.',
    dairy:      typeof t === 'function' ? t('tip_dairy')      : 'A glass of milk or some yogurt would round things out.',
    snacks:     typeof t === 'function' ? t('tip_snacks')     : 'A small healthy snack like nuts could help.'
  };
  const items = missing.map(g => `<div class="suggestion-item"><span class="suggestion-dot"></span><span>${tips[g]}</span></div>`).join('');
  return `<div class="suggestions-box"><div class="suggestions-title">${title}</div>${items}</div>`;
}

function editMeal(id) {
  const meal = allMeals.find(m => m.id === id);
  if (!meal) return;
  sessionStorage.setItem('editingMeal', JSON.stringify(meal));
  window.location.href = 'add.html';
}

async function deleteMeal(id) {
  if (!confirm('Delete this meal?')) return;
  const { ok } = await apiFetch(`/meals/${id}`, { method: 'DELETE' });
  if (ok) { showNotification('Deleted', 'info'); await loadMeals(); }
  else alert('Failed to delete.');
}

// ══════════════════════════════════════
// REPORT PAGE
// ══════════════════════════════════════
let reportPeriod = 'week';
let barChartInst, radarChartInst, donutChartInst;
const COLORS = { grains:'#f0945d', protein:'#EF82A0', vegetables:'#6bb392', fruits:'#ffd970', dairy:'#88abda', snacks:'#dcc7e1' };
const GROUPS = ['grains','protein','vegetables','fruits','dairy','snacks'];
const LABELS = ['Grains','Protein','Vegetables','Fruits','Dairy','Snacks'];

function initReportPage() { setPeriod('week'); }

function setPeriod(p) {
  reportPeriod = p;
  ['month','week','custom'].forEach(x => {
    document.getElementById('tab' + capitalize(x))?.classList.toggle('active', x === p);
  });
  loadReportData();
}

async function loadReportData() {
  const { ok, data } = await apiFetch('/meals/');
  if (!ok) return;
  const { start, end, meals } = filterByPeriod(data, reportPeriod);
  updatePeriodRange(start, end);
  updateStats(meals, start, end);
  drawCharts(meals, start, end);
}

function filterByPeriod(meals, period) {
  const now = new Date();
  let start, end;
  if (period === 'week') {
    const day = now.getDay();
    start = new Date(now); start.setDate(now.getDate() - (day === 0 ? 6 : day - 1)); start.setHours(0,0,0,0);
    end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else {
    start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0,0,0,0);
    end = new Date(now); end.setHours(23,59,59,999);
  }
  return { start, end, meals: meals.filter(m => { const d = parseDate(m.created_at); return d && d >= start && d <= end; }) };
}

function updatePeriodRange(start, end) {
  const lang = typeof getLang === 'function' ? getLang() : 'en';
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  const fmt = d => d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  const el = document.getElementById('periodRange');
  if (el) el.textContent = `[${fmt(start)} ~ ${fmt(end)}]`;
}

function updateStats(meals, start, end) {
  const days = Math.round((end - start) / 86400000) + 1;
  const daysWithMeals = new Set(meals.map(m => getDateStr(m.created_at))).size;
  const avg = daysWithMeals > 0 ? meals.length / daysWithMeals : 0;
  const counts = Object.fromEntries(GROUPS.map(g => [g, 0]));
  meals.forEach(m => (m.includes || []).forEach(g => counts[g]++));
  const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
  const lang = typeof getLang === 'function' ? getLang() : 'en';

  const foodNames = {
    en: { grains:'Grains', protein:'Protein', vegetables:'Vegetables', fruits:'Fruits', dairy:'Dairy', snacks:'Snacks' },
    zh: { grains:'谷物', protein:'蛋白质', vegetables:'蔬菜', fruits:'水果', dairy:'乳制品', snacks:'零食' }
  };
  const names = foodNames[lang] || foodNames.en;

  document.getElementById('statDays')?.setAttribute('textContent', '');
  const statDays = document.getElementById('statDays');
  const statAvg = document.getElementById('statAvg');
  const statTop = document.getElementById('statTop');
  const statMissing = document.getElementById('statMissing');
  if (statDays) statDays.textContent = `${daysWithMeals} / ${days}`;
  if (statAvg) statAvg.textContent = avg.toFixed(1);
  if (statTop) statTop.textContent = sorted[0][1] > 0 ? names[sorted[0][0]] : '—';
  if (statMissing) statMissing.textContent = sorted[sorted.length-1][1] === 0 ? names[sorted[sorted.length-1][0]] : '—';
}

function drawCharts(meals, start, end) {
  const lang = typeof getLang === 'function' ? getLang() : 'en';
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  const days = [];
  const d = new Date(start);
  while (d <= end) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  const labels = days.map(d => d.toLocaleDateString(locale, { weekday: 'short' }));

  const chartLabels = lang === 'zh'
    ? ['谷物','蛋白质','蔬菜','水果','乳制品','零食']
    : LABELS;

  const datasets = GROUPS.map((g, i) => ({
    label: chartLabels[i],
    data: days.map(day => {
      const year  = day.getFullYear();
      const month = String(day.getMonth() + 1).padStart(2, '0');
      const dd    = String(day.getDate()).padStart(2, '0');
      const s = `${year}-${month}-${dd}`;
      return meals.some(m => getDateStr(m.created_at) === s && (m.includes||[]).includes(g)) ? 1 : 0;
    }),
    backgroundColor: COLORS[g], stack: 's'
  }));

  const barCtx = document.getElementById('barChart');
  if (barCtx && typeof Chart !== 'undefined') {
    if (barChartInst) barChartInst.destroy();
    barChartInst = new Chart(barCtx, { type:'bar', data:{labels,datasets}, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{stacked:true,grid:{display:false},ticks:{autoSkip:false}},y:{stacked:true,max:6,ticks:{stepSize:2}}} } });
  }

  const radarCtx = document.getElementById('radarChart');
  if (radarCtx && typeof Chart !== 'undefined') {
    if (radarChartInst) radarChartInst.destroy();
    const rc = GROUPS.map(g => meals.filter(m=>(m.includes||[]).includes(g)).length);
    radarChartInst = new Chart(radarCtx, { type:'radar', data:{labels:chartLabels,datasets:[{data:rc,backgroundColor:'rgba(98,138,107,0.2)',borderColor:'#628A6B',pointBackgroundColor:'#628A6B'}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{r:{min:0,ticks:{stepSize:1,font:{size:10}}}}} });
  }

  const donutCtx = document.getElementById('donutChart');
  if (donutCtx && typeof Chart !== 'undefined') {
    if (donutChartInst) donutChartInst.destroy();
    const types=['breakfast','lunch','dinner','brunch','snack'];
    const typeLabels = lang === 'zh' ? ['早餐','午餐','晚餐','早午餐','零食'] : types.map(capitalize);
    const dc = types.map(tp=>meals.filter(m=>m.type===tp).length);
    donutChartInst = new Chart(donutCtx, { type:'doughnut', data:{labels:typeLabels,datasets:[{data:dc,backgroundColor:['#ffd970','#88abda','#6bb392','#f0945d','#dcc7e1']}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:11},boxWidth:12}}}} });
  }
}

// ══════════════════════════════════════
// NOTIFICATION + UTILS
// ══════════════════════════════════════
function showNotification(message, type='info') {
  const colors = { success:'#628A6B', warning:'#F58E68', info:'#9FC5A3' };
  const n = document.createElement('div');
  n.style.cssText = `position:fixed;top:20px;right:20px;background:${colors[type]||colors.info};color:#fff;padding:.75rem 1.25rem;border-radius:12px;z-index:9999;font-family:Nunito,sans-serif;font-size:.9rem;font-weight:600;`;
  n.textContent = message;
  document.body.appendChild(n);
  setTimeout(() => { n.style.opacity='0'; n.style.transition='opacity .3s'; setTimeout(()=>n.remove(),300); }, 2500);
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function formatTime(t) {
  if (!t) return '--:--';
  const [h, m] = t.split(':').map(Number);
  return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;
}