// Login page initialization (SPA-compatible)
// Runs via eval() on every #/login navigation

(function() {
  'use strict';

  const USERS_KEY = 'kaishoku_users';
  const CURRENT_USER_KEY = 'kaishoku_current_user';

  // Dev account initialization
  (function initDevAccount() {
    const DEV_ID = 'K-000-DEV';
    const stored = safeStorage.get(USERS_KEY);
    const users = stored ? JSON.parse(stored) : [];
    if (!users.find(function(u) { return u.id === DEV_ID; })) {
      users.unshift({
        id: DEV_ID, name: '開発者', password: 'dev_admin_2026',
        division: '開発部門', level: 5, xp: 500,
        registeredAt: '2026-01-01T00:00:00.000Z'
      });
      safeStorage.setJSON(USERS_KEY, users);
    }
  })();

  function getUsers() {
    const u = safeStorage.get(USERS_KEY);
    return u ? JSON.parse(u) : [];
  }
  function saveUsers(users) { safeStorage.setJSON(USERS_KEY, users); }
  function getCurrentUser() { const u = safeStorage.get(CURRENT_USER_KEY); return u ? JSON.parse(u) : null; }
  function setCurrentUser(user) { safeStorage.setJSON(CURRENT_USER_KEY, user); }
  function clearCurrentUser() { safeStorage.remove(CURRENT_USER_KEY); }
  function updateUserInStorage(updatedUser) {
    const users = getUsers();
    const idx = users.findIndex(function(u) { return u.id === updatedUser.id; });
    if (idx !== -1) { users[idx] = updatedUser; saveUsers(users); }
    setCurrentUser(updatedUser);
  }

  // Simple notification using existing toast elements or alert
  function showNotification(type, title, message) {
    var toastId = type === 'error' ? 'toastError' : 'toastSuccess';
    var toast = document.getElementById(toastId);
    if (toast) {
      var titleEl = document.getElementById(type === 'error' ? 'toastErrorTitle' : 'toastSuccessTitle');
      var msgEl = document.getElementById(type === 'error' ? 'toastErrorMessage' : 'toastSuccessMessage');
      if (titleEl) titleEl.textContent = title;
      if (msgEl) msgEl.textContent = message;
      toast.style.opacity = '1';
      toast.style.pointerEvents = 'auto';
      setTimeout(function() { toast.style.opacity = '0'; toast.style.pointerEvents = 'none'; }, 3000);
    } else {
      // Fallback: inline message
      var notif = document.getElementById('loginNotification');
      if (!notif) {
        notif = document.createElement('div');
        notif.id = 'loginNotification';
        notif.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;padding:1rem 1.5rem;border-radius:4px;font-family:\'JetBrains Mono\',monospace;font-size:0.875rem;max-width:20rem;transition:opacity 0.3s;';
        document.body.appendChild(notif);
      }
      notif.style.background = type === 'error' ? 'rgba(127,29,29,0.95)' : 'rgba(6,78,59,0.95)';
      notif.style.border = type === 'error' ? '1px solid rgb(239,68,68)' : '1px solid rgb(16,185,129)';
      notif.style.color = 'white';
      notif.style.opacity = '1';
      notif.innerHTML = '<div style="font-weight:700;margin-bottom:0.25rem;">' + title + '</div><div>' + message + '</div>';
      setTimeout(function() { notif.style.opacity = '0'; }, 3000);
    }
  }

  // Already logged in check
  var existingUser = getCurrentUser();
  if (existingUser) {
    // Show banner or redirect
    var banner = document.getElementById('alreadyLoggedInBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'alreadyLoggedInBanner';
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:rgba(6,78,59,0.95);border-bottom:1px solid rgb(16,185,129);padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between;z-index:10000;backdrop-filter:blur(10px);flex-wrap:wrap;gap:0.75rem;';
      banner.innerHTML = '<div style="font-family:\'JetBrains Mono\',monospace;font-size:0.8rem;color:rgba(255,255,255,0.9);">' +
        '<span style="color:rgb(16,185,129);font-weight:700;">▶ セッション継続中</span>' +
        ' &nbsp;|&nbsp; <strong>' + existingUser.name + '</strong> (' + existingUser.id + ') としてログイン済みです' +
        '</div>' +
        '<div style="display:flex;gap:0.75rem;">' +
        '<a href="#/dashboard" style="font-family:\'JetBrains Mono\',monospace;font-size:0.75rem;padding:0.4rem 1rem;background:rgb(16,185,129);color:#000;font-weight:700;text-decoration:none;letter-spacing:0.05em;">ダッシュボードへ →</a>' +
        '<button id="bannerLogout" style="font-family:\'JetBrains Mono\',monospace;font-size:0.75rem;padding:0.4rem 1rem;background:transparent;color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.3);cursor:pointer;">ログアウト</button>' +
        '</div>';
      document.body.prepend(banner);
    }
    var bannerLogout = document.getElementById('bannerLogout');
    if (bannerLogout) {
      bannerLogout.addEventListener('click', function() {
        clearCurrentUser();
        banner.remove();
      });
    }
  }

  // Tab switching
  document.querySelectorAll('.tab-button').forEach(function(button) {
    button.addEventListener('click', function() {
      var targetTab = this.getAttribute('data-tab');
      document.querySelectorAll('.tab-button').forEach(function(btn) { btn.classList.remove('active'); });
      this.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
      var tabEl = document.getElementById(targetTab + '-tab');
      if (tabEl) tabEl.classList.add('active');
    });
  });

  // Register form
  var registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var button = document.getElementById('registerButton');
      var buttonText = document.getElementById('registerButtonText');
      var spinner = document.getElementById('registerSpinner');

      var id = (document.getElementById('registerId').value || '').trim();
      var name = (document.getElementById('registerName').value || '').trim();
      var password = document.getElementById('registerPassword').value;
      var passwordConfirm = document.getElementById('registerPasswordConfirm').value;
      var division = document.getElementById('registerDivision').value;

      if (!/^K-\d{3}-\d{3}$/.test(id)) {
        showNotification('error', 'VALIDATION ERROR', '機関員IDの形式が正しくありません (K-XXX-XXX)');
        return;
      }
      if (password.length < 8) {
        showNotification('error', 'VALIDATION ERROR', 'パスキーは最低8文字必要です');
        return;
      }
      if (password !== passwordConfirm) {
        showNotification('error', 'VALIDATION ERROR', 'パスキーが一致しません');
        return;
      }
      if (!division) {
        showNotification('error', 'VALIDATION ERROR', '希望部門を選択してください');
        return;
      }

      var users = getUsers();
      if (users.find(function(u) { return u.id === id; })) {
        showNotification('error', 'REGISTRATION FAILED', 'この機関員IDは既に使用されています');
        return;
      }

      if (button) button.disabled = true;
      if (buttonText) buttonText.style.display = 'none';
      if (spinner) spinner.style.display = 'block';

      setTimeout(function() {
        var newUser = { id: id, name: name, password: password, division: division, level: 0, xp: 0, registeredAt: new Date().toISOString() };
        users.push(newUser);
        saveUsers(users);

        registerForm.reset();
        if (button) button.disabled = false;
        if (buttonText) buttonText.style.display = 'inline';
        if (spinner) spinner.style.display = 'none';

        showNotification('success', 'REGISTRATION COMPLETE', '登録が完了しました。ログインしてください。');

        setTimeout(function() {
          var loginTab = document.querySelector('[data-tab="login"]');
          if (loginTab) loginTab.click();
          var loginIdEl = document.getElementById('loginId');
          if (loginIdEl) loginIdEl.value = id;
        }, 1000);
      }, 1500);
    });
  }

  // Login form
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var button = document.getElementById('loginButton');
      var buttonText = document.getElementById('loginButtonText');
      var spinner = document.getElementById('loginSpinner');

      var id = (document.getElementById('loginId').value || '').trim();
      var password = document.getElementById('loginPassword').value;

      if (button) button.disabled = true;
      if (buttonText) buttonText.style.display = 'none';
      if (spinner) spinner.style.display = 'block';

      setTimeout(function() {
        var users = getUsers();
        var user = users.find(function(u) { return u.id === id && u.password === password; });

        if (user) {
          var now = new Date();
          var lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
          var isFirstLogin = !user.lastLogin;
          var isDailyLogin = lastLogin && (now.toDateString() !== lastLogin.toDateString());

          user.lastLogin = now.toISOString();
          if (typeof user.xp === 'undefined') user.xp = 0;
          updateUserInStorage(user);

          showNotification('success', 'ACCESS GRANTED', 'ようこそ、' + user.name + 'さん (' + user.id + ')');

          setTimeout(function() {
            // SPA navigation
            window.location.hash = '#/dashboard';

            // XP bonuses
            setTimeout(function() {
              if (window.ProgressSystem) {
                if (isFirstLogin) ProgressSystem.trackActivity('first_login');
                else if (isDailyLogin) ProgressSystem.trackActivity('daily_login');
              }
            }, 500);
          }, 1200);
        } else {
          if (button) button.disabled = false;
          if (buttonText) buttonText.style.display = 'inline';
          if (spinner) spinner.style.display = 'none';
          showNotification('error', 'ACCESS DENIED', 'IDまたはパスキーが正しくありません。');
        }
      }, 1500);
    });
  }

})();
