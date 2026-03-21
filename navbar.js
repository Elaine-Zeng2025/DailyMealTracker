(function () {
  const API_BASE = window.location.hostname === 'localhost'
    ? '/api'
    : 'https://piecebypeas.onrender.com/api';

  const ICONS = {
    home:`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 12 12 3 21 12"/>
        <path d="M5 10v9a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-9"/></svg>`,
    add: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    log: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="3" y1="6" x2="9" y2="6"/>
        <line x1="14" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="9" y2="12"/>
        <line x1="14" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="9" y2="18"/>
        <line x1="14" y1="18" x2="21" y2="18"/></svg>`,
    report: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <circle class="report-dot" cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/>
        <line x1="9" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  };

  const NAV_ITEMS = [
    { id: 'home',   href: 'index.html',  label: 'Home'   },
    { id: 'add',    href: 'add.html',    label: 'Add'    },
    { id: 'log',    href: 'log.html',    label: 'Log'    },
    { id: 'report', href: 'report.html', label: 'Report' },
  ];

  function getActivePage() {
    const path = window.location.pathname;
    if (path.includes('add'))    return 'add';
    if (path.includes('log'))    return 'log';
    if (path.includes('report')) return 'report';
    return 'home';
  }

  function buildSidebar() {
    const active = getActivePage();
    const navItems = NAV_ITEMS.map(item => {
      const isActive = item.id === active ? 'active' : '';
      const inner = item.id === 'add'
        ? `<div class="nav-icon-circle">${ICONS[item.id]}</div>`
        : ICONS[item.id];
      return `<a href="${item.href}" class="nav-item ${isActive}" aria-label="${item.label}">${inner}</a>`;
    }).join('');

    return `
      <nav class="sidebar" id="mainSidebar">
        <div class="nav-user" id="navUser" onclick="NavBar.toggleDropdown()">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20v-1a8 8 0 0116 0v1"/>
          </svg>
          <span class="nav-user-name" id="userGreeting">Hello</span>
          <div class="user-dropdown" id="userDropdown">
            <div class="dropdown-email" id="dropdownEmail">—</div>
            <button class="dropdown-item" onclick="NavBar.openProfile()">Edit profile</button>
            <button class="dropdown-item" id="langToggleBtn" onclick="toggleLanguage()">中文</button>
            <button class="dropdown-item logout" onclick="NavBar.logout()">Log out</button>
          </div>
        </div>
        <div class="nav-items">${navItems}</div>
      </nav>

      <div class="modal-overlay" id="profileModal">
        <div class="modal-card">
          <p class="modal-title">Edit profile</p>
          <div class="modal-field">
            <label>Username</label>
            <input type="text" id="profileName" placeholder="Your username">
          </div>
          <div class="modal-field">
            <label>Email</label>
            <input type="email" id="profileEmail" placeholder="Your email">
          </div>
          <div class="modal-field">
            <label>New password</label>
            <input type="password" id="profilePassword" placeholder="Leave blank to keep current">
          </div>
          <div id="profileError" style="color:#e05a3a;font-size:.82rem;margin-top:.25rem;display:none"></div>
          <div class="modal-actions">
            <button class="btn-secondary" onclick="NavBar.closeProfile()">Cancel</button>
            <button class="btn-primary" id="profileSaveBtn" onclick="NavBar.saveProfile()">Save</button>
          </div>
        </div>
      </div>`;
  }

  function inject() {
    document.body.insertAdjacentHTML('afterbegin', buildSidebar());
  }

  window.NavBar = {
    toggleDropdown() {
      document.getElementById('userDropdown')?.classList.toggle('open');
    },

    openProfile() {
      document.getElementById('userDropdown')?.classList.remove('open');
      document.getElementById('profileName').value = localStorage.getItem('username') || '';
      document.getElementById('profileEmail').value = localStorage.getItem('userEmail') || '';
      document.getElementById('profilePassword').value = '';
      document.getElementById('profileError').style.display = 'none';
      document.getElementById('profileModal')?.classList.add('open');
    },

    closeProfile() {
      document.getElementById('profileModal')?.classList.remove('open');
    },

    async saveProfile() {
      const username = document.getElementById('profileName').value.trim();
      const email    = document.getElementById('profileEmail').value.trim();
      const password = document.getElementById('profilePassword').value;
      const errEl    = document.getElementById('profileError');
      const saveBtn  = document.getElementById('profileSaveBtn');

      if (!username || !email) {
        errEl.textContent = 'Username and email cannot be empty.';
        errEl.style.display = 'block';
        return;
      }

      saveBtn.textContent = 'Saving...';
      saveBtn.disabled = true;

      const body = { username, email };
      if (password) body.password = password;

      try {
        const res = await fetch(API_BASE + '/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });
        const data = await res.json();

        if (res.ok) {
          localStorage.setItem('username', data.user.username);
          localStorage.setItem('userEmail', data.user.email);
          NavBar.updateGreeting();
          NavBar.closeProfile();
          if (typeof showNotification === 'function') showNotification('Profile updated', 'success');
        } else {
          errEl.textContent = data.error || 'Update failed.';
          errEl.style.display = 'block';
        }
      } catch (e) {
        errEl.textContent = 'Network error. Please try again.';
        errEl.style.display = 'block';
      }

      saveBtn.textContent = 'Save';
      saveBtn.disabled = false;
    },

    updateGreeting() {
      const username = localStorage.getItem('username') || 'Hello';
      const emailStr = localStorage.getItem('userEmail') || '—';
      const greetEl = document.getElementById('userGreeting');
      const emailEl = document.getElementById('dropdownEmail');
      if (greetEl) greetEl.textContent = `Hello, ${username}`;
      if (emailEl) emailEl.textContent = emailStr;
    },

    toggleLanguage() {
      if (typeof showNotification === 'function') showNotification('Language switching coming soon', 'info');
    },

    async logout() {
      if (!confirm('Are you sure you want to log out?')) return;
      await fetch(API_BASE + '/auth/logout', { method: 'POST', credentials: 'include' });
      localStorage.removeItem('username');
      localStorage.removeItem('userEmail');
      window.location.href = 'login.html';
    },
  };

  document.addEventListener('click', function (e) {
    const navUser = document.getElementById('navUser');
    const dd = document.getElementById('userDropdown');
    if (dd && navUser && !navUser.contains(e.target)) dd.classList.remove('open');
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();