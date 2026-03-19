// ==================== 配置 ====================
// 本地开发用 localhost，部署后换成 Railway 域名
const API_BASE = 'https://piecebypeas.onrender.com/api';

// ==================== API 工具函数 ====================

async function apiFetch(path, options = {}) {
    const res = await fetch(API_BASE + path, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',   // 必须加：让浏览器自动带上 session cookie
        ...options
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
}

// ==================== 通用函数 ====================

function updateGreeting() {
    const username = localStorage.getItem('username') || 'Hello';
    document.querySelectorAll('#userGreeting').forEach(el => {
        el.textContent = `Hello, ${username}`;
    });
}

async function logout() {
    if (!confirm('Are you sure you want to log out?')) return;
    await apiFetch('/auth/logout', { method: 'POST' });
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

// 检查登录状态（访问受保护页面时调用）
async function checkAuth() {
    const { ok } = await apiFetch('/auth/me');
    if (!ok && !window.location.pathname.includes('login')) {
        window.location.href = 'login.html';
    }
}

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', function () {
    const path = window.location.pathname;

    if (path.includes('login')) {
        initializeLoginPage();
    } else {
        // 所有非登录页先验证身份
        checkAuth().then(() => {
            updateGreeting();
            if (path.includes('add'))   initializeAddPage();
            if (path.includes('report')) initializeReportPage();
            if (path.includes('index') || path.endsWith('/')) initializeHomePage();
        });
    }
});

// ==================== 登录页面 ====================

function initializeLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email    = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        const { ok, data } = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (ok) {
            localStorage.setItem('username', data.user.username);
            showLoginSuccess(data.user.username);
            setTimeout(() => { window.location.href = 'index.html'; }, 1200);
        } else {
            alert(data.error || '登录失败，请检查邮箱和密码');
        }
    });
}

function showLoginSuccess(username) {
    const btn = document.querySelector('.login-btn');
    if (btn) {
        btn.innerHTML = `
            <span>Welcome, ${username}!</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>`;
        btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    }
}

// ==================== 首页 ====================

function initializeHomePage() {
    const mainTitle = document.querySelector('.main-title');
    if (mainTitle) {
        const hour = new Date().getHours();
        if (hour < 12)      mainTitle.textContent = 'Good morning! Ready for breakfast?';
        else if (hour < 17) mainTitle.textContent = 'Good afternoon! Time for lunch?';
        else                mainTitle.textContent = "Good evening! What's for dinner?";
    }
}

// ==================== 添加餐食页面 ====================

function initializeAddPage() {
    // 设置默认时间为当前时间
    const timeInput = document.getElementById('mealTime');
    if (timeInput) {
        const now = new Date();
        timeInput.value = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    }

    // checkbox 动画
    document.querySelectorAll('.food-item input[type="checkbox"]').forEach(item => {
        item.addEventListener('change', function () {
            const label = this.nextElementSibling;
            label.style.animation = this.checked ? 'pulse 0.5s ease' : '';
        });
    });

    // 表单提交 → 发给后端
    const mealForm = document.getElementById('mealForm');
    if (!mealForm) return;

    mealForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const title    = document.getElementById('mealName').value.trim();
        const type     = document.getElementById('mealType').value;
        const time     = document.getElementById('mealTime').value;
        const includes = [...document.querySelectorAll('.food-item input[type="checkbox"]:checked')]
                            .map(cb => cb.value);

        if (!title || !type || !time) {
            alert('Please fill in all required fields');
            return;
        }
        if (includes.length === 0) {
            alert('Please select at least one food group');
            return;
        }

        const { ok, data } = await apiFetch('/meals/', {
            method: 'POST',
            body: JSON.stringify({ title, type, time, includes })
        });

        if (ok) {
            showNotification('Meal added successfully!', 'success');
            setTimeout(() => { window.location.href = 'report.html'; }, 1000);
        } else {
            alert(data.error || '保存失败，请重试');
        }
    });
}

// ==================== 报告页面 ====================

function initializeReportPage() {
    loadAndRenderReport();
}

async function loadAndRenderReport() {
    const { ok, data } = await apiFetch('/meals/');

    if (!ok) {
        console.error('Failed to load meals');
        return;
    }

    // 只显示今天的记录
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = data.filter(meal => meal.created_at.startsWith(today));

    displayMealRecords(todayMeals);
    generateReport(todayMeals);
}

function displayMealRecords(meals) {
    const container = document.getElementById('mealRecords');
    if (!container) return;

    if (meals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
                <p>No meals recorded yet</p>
                <button class="btn-primary" onclick="location.href='add.html'">Add your first meal</button>
            </div>`;
        return;
    }

    meals.sort((a, b) => a.time > b.time ? 1 : -1);
    container.innerHTML = '';

    meals.forEach((meal, index) => {
        const indicators = (meal.includes || [])
            .map(item => `<div class="food-dot ${item}" title="${item}"></div>`)
            .join('');

        const div = document.createElement('div');
        div.className = 'meal-record';
        div.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s both`;
        div.innerHTML = `
            <div class="meal-info">
                <span class="meal-time">${meal.time || '--:--'}</span>
                <span class="meal-name">${meal.title || 'Unnamed meal'}</span>
            </div>
            <div class="meal-tags">${indicators}</div>
            <div class="meal-actions">
                <button class="btn-delete" onclick="deleteMeal(${meal.id})" title="Delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>`;
        container.appendChild(div);
    });
}

async function deleteMeal(mealId) {
    if (!confirm('Are you sure you want to delete this meal?')) return;

    const { ok } = await apiFetch(`/meals/${mealId}`, { method: 'DELETE' });
    if (ok) {
        showNotification('Meal deleted', 'info');
        setTimeout(() => location.reload(), 800);
    } else {
        alert('删除失败，请重试');
    }
}

// ==================== 营养报告生成（保留原有逻辑）====================

function generateReport(meals) {
    const reportText = document.getElementById('reportText');
    const adviceDiv  = document.getElementById('nutritionAdvice');
    if (!reportText) return;

    if (meals.length === 0) {
        reportText.textContent = 'Start tracking your meals to see your nutrition summary';
        if (adviceDiv) adviceDiv.innerHTML = '';
        return;
    }

    const allGroups   = ['grains', 'protein', 'vegetables', 'fruits', 'dairy', 'snacks'];
    const counts      = Object.fromEntries(allGroups.map(g => [g, 0]));
    meals.forEach(meal => (meal.includes || []).forEach(g => counts[g]++));

    const consumed = allGroups.filter(g => counts[g] > 0);
    const missing  = allGroups.filter(g => counts[g] === 0);

    const mealWord = meals.length === 1 ? 'meal' : 'meals';
    reportText.innerHTML = `
        <p>Today you've had <strong>${meals.length} ${mealWord}</strong>
        and consumed food from <strong>${consumed.length} out of 6</strong> food groups.
        You've included: <strong>${consumed.join(', ') || 'none yet'}</strong>.</p>`;

    if (adviceDiv) adviceDiv.innerHTML = generateNutritionAdvice(consumed, missing, counts);
}

function generateNutritionAdvice(consumed, missing, counts) {
    if (missing.length === 0) {
        return `<div class="advice-great">
            <h4>🎉 Fantastic job!</h4>
            <p>You've hit all six food groups today! Your body is doing a happy dance right now. Keep up this amazing balanced eating!</p>
        </div>`;
    }

    const suggestions = {
        grains:     { icon:'🌾', title:'Missing Some Grains',       text:"Your body's asking for some carb love! How about whole wheat toast, brown rice, or a warm bowl of oatmeal?",         examples:['Whole grain bread','Brown rice','Quinoa','Oatmeal'] },
        protein:    { icon:'🥩', title:'Need More Protein Power',    text:"Time to fuel those muscles! Think eggs, chicken, fish, beans, or tofu.",                                              examples:['Grilled chicken','Salmon','Eggs','Greek yogurt','Lentils'] },
        vegetables: { icon:'🥬', title:'Veggie Alert!',              text:"Uh oh, where are the veggies? Sneak in some leafy greens, crunchy carrots, or colorful bell peppers.",               examples:['Spinach salad','Broccoli','Carrots','Bell peppers'] },
        fruits:     { icon:'🍎', title:'Fruit Break Needed',         text:"Your daily dose of natural sweetness is missing! Grab an apple, munch on some berries, or slice up an orange.",     examples:['Apples','Bananas','Berries','Oranges'] },
        dairy:      { icon:'🥛', title:'Dairy Department Calling',   text:"Your bones want some calcium love! How about a glass of milk, some yogurt, or a piece of cheese?",                  examples:['Milk','Greek yogurt','Cheese','Cottage cheese'] },
        snacks:     { icon:'🍪', title:'Treat Yourself (Smartly)',   text:"Life needs balance! A small healthy snack won't hurt. Think nuts, dark chocolate, or popcorn.",                     examples:['Mixed nuts','Dark chocolate','Popcorn','Rice cakes'] }
    };

    let header = '';
    if (missing.length >= 4)      header = `<div class="advice-urgent"><h4>⚠️ Houston, we have a nutrition gap!</h4><p>You're missing quite a few food groups today. Here's what your body is asking for:</p></div>`;
    else if (missing.length >= 2) header = `<div class="advice-moderate"><h4>💪 Almost there!</h4><p>You're doing good, but let's make it great!</p></div>`;
    else                          header = `<div class="advice-mild"><h4>✨ So close to perfection!</h4><p>Just one more food group to go:</p></div>`;

    const items = missing.map(g => {
        const s = suggestions[g];
        return `<div class="advice-item">
            <div class="advice-header"><span class="advice-icon">${s.icon}</span><h5>${s.title}</h5></div>
            <p>${s.text}</p>
            <div class="food-suggestions">
                <strong>Try these:</strong>
                <div class="suggestion-tags">${s.examples.map(f => `<span class="suggestion-tag">${f}</span>`).join('')}</div>
            </div>
        </div>`;
    }).join('');

    if (counts['snacks'] >= 4) {
        return `<div class="advice-container">${header}${items}
            <div class="advice-warning">
                <h4>🤔 Snack Attack Alert!</h4>
                <p>Looks like you've been hitting the snacks pretty hard today (${counts['snacks']} times!). Maybe balance it out with some wholesome meals?</p>
            </div></div>`;
    }

    return `<div class="advice-container">${header}${items}</div>`;
}

// ==================== 通知组件（保留原有样式）====================

function showNotification(message, type = 'info') {
    const colors = { success: '#10b981', warning: '#f59e0b', info: '#6366f1' };
    const n = document.createElement('div');
    n.style.cssText = `position:fixed;top:20px;right:20px;background:${colors[type]||colors.info};color:white;
        padding:1rem 1.5rem;border-radius:12px;z-index:9999;animation:slideInRight 0.3s ease;`;
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => { n.style.animation = 'slideOutRight 0.3s ease'; setTimeout(() => n.remove(), 300); }, 3000);
}

if (!document.querySelector('#notificationStyles')) {
    const style = document.createElement('style');
    style.id = 'notificationStyles';
    style.textContent = `
        @keyframes slideInRight  { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0);    opacity:1; } }
        @keyframes slideOutRight { from { transform:translateX(0);    opacity:1; } to { transform:translateX(100%); opacity:0; } }
        @keyframes fadeInUp      { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0);    opacity:1; } }
    `;
    document.head.appendChild(style);
}
