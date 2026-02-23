// Dashboard initialization script (SPA-compatible)
// Runs via eval() on every #/dashboard navigation

(function() {
  'use strict';

  const CURRENT_USER_KEY = 'kaishoku_current_user';

  function getCurrentUser() {
    const user = safeStorage.get(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  function saveCurrentUser(user) {
    safeStorage.setJSON(CURRENT_USER_KEY, user);
  }

  function clearCurrentUser() {
    safeStorage.remove(CURRENT_USER_KEY);
  }

  const divisionNames = {
    'convergence': '収束部門',
    'support': '支援部門',
    'engineering': '工作部門',
    'foreign': '外事部門',
    'port': '港湾部門'
  };

  const pageNames = {
    'index.html': 'ステータス・ダッシュボード',
    'divisions.html': '各部門情報',
    'division-convergence.html': '収束部門詳細',
    'division-support.html': '支援部門詳細',
    'division-engineering.html': '工作部門詳細',
    'division-foreign.html': '外事部門詳細',
    'division-port.html': '港湾部門詳細',
    'phenomenon.html': 'アーカイブ：海蝕現象',
    'chat.html': '機関員チャット',
    'dashboard.html': 'マイページ',
    'modules.html': 'モジュールカタログ',
    'entities.html': '海蝕実体カタログ',
    'missions.html': '収束任務',
    'classified.html': '機密情報',
    'map.html': '海蝕現象マップ',
    'search.html': '統合データベース検索',
    'history.html': 'アクセス履歴',
    'codex.html': '機関員コーデックス',
    'reports.html': '報告書アーカイブ',
    'agency-history.html': '機関の歴史',
    'statistics.html': '統計データ',
  };

  function pageToHash(page) {
    const routeMap = {
      'index.html': '#/',
      'divisions.html': '#/divisions',
      'division-convergence.html': '#/division-convergence',
      'division-support.html': '#/division-support',
      'division-engineering.html': '#/division-engineering',
      'division-foreign.html': '#/division-foreign',
      'division-port.html': '#/division-port',
      'phenomenon.html': '#/phenomenon',
      'chat.html': '#/chat',
      'dashboard.html': '#/dashboard',
      'modules.html': '#/modules',
      'entities.html': '#/entities',
      'missions.html': '#/missions',
      'classified.html': '#/classified',
      'map.html': '#/map',
      'search.html': '#/search',
      'history.html': '#/history',
      'codex.html': '#/codex',
      'reports.html': '#/reports',
      'agency-history.html': '#/agency-history',
      'statistics.html': '#/statistics',
    };
    return routeMap[page] || '#/';
  }

  function setEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
    return el;
  }

  // --- Auth check ---
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.hash = '#/login';
    return;
  }

  // Initialize XP if missing
  if (typeof currentUser.xp === 'undefined') {
    currentUser.xp = 0;
    saveCurrentUser(currentUser);
  }

  // Track profile view XP
  if (typeof ProgressSystem !== 'undefined') {
    ProgressSystem.trackActivity('profile_view');
  }

  // --- Level messages ---
  function updateLevelBasedMessages(user) {
    const level = user.level || 0;
    if (typeof LevelMessages === 'undefined') return;

    const dashboardMsg = LevelMessages.getDashboardMessage(level);
    const rankInfo = LevelMessages.getRankTitle(level);

    const greetingEl = document.getElementById('dashboardGreeting');
    if (greetingEl) greetingEl.textContent = dashboardMsg.greeting;

    const descEl = document.getElementById('dashboardDescription');
    if (descEl) descEl.innerHTML = dashboardMsg.description;

    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');
    if (statusText && rankInfo) {
      statusText.textContent = rankInfo.status;
      statusText.style.color = rankInfo.color;
    }
    if (statusDot && rankInfo) {
      statusDot.style.backgroundColor = rankInfo.color;
    }

    const userLevelEl = document.getElementById('userLevel');
    if (userLevelEl && rankInfo) {
      userLevelEl.textContent = rankInfo.title;
      userLevelEl.style.color = rankInfo.color;
    }
  }

  updateLevelBasedMessages(currentUser);

  // --- Populate user data ---
  setEl('welcomeUserName', currentUser.name);
  setEl('userId', currentUser.id);
  setEl('userName', currentUser.name);
  setEl('userDivision', divisionNames[currentUser.division] || currentUser.division || '---');
  setEl('userXP', (currentUser.xp || 0) + ' XP');

  if (typeof ProgressSystem !== 'undefined') {
    const levelInfo = ProgressSystem.getNextLevelInfo(currentUser);
    if (levelInfo.isMaxLevel) {
      setEl('xpNeeded', 'MAX LEVEL');
      const bar = document.getElementById('xpProgress');
      if (bar) bar.style.width = '100%';
    } else {
      setEl('xpNeeded', levelInfo.xpNeeded + ' XP');
      const bar = document.getElementById('xpProgress');
      if (bar) bar.style.width = levelInfo.progress + '%';
    }
  }

  // Registration date
  if (currentUser.registeredAt) {
    const regDate = new Date(currentUser.registeredAt);
    setEl('userRegistered', regDate.toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }));
  }

  // --- Unlocked / Locked content ---
  function displayUnlockedContent(level) {
    const container = document.getElementById('unlockedContent');
    if (!container || typeof ProgressSystem === 'undefined') return;

    const unlockedPages = ProgressSystem.getUnlockedPages(level);
    const displayPages = unlockedPages.filter(function(p) {
      return p !== 'login.html' && p !== 'dashboard.html';
    });

    if (displayPages.length === 0) {
      container.innerHTML = '<p class="text-muted" style="grid-column: span 2; text-align: center;">アクセス可能なコンテンツはありません</p>';
      return;
    }

    container.innerHTML = displayPages.map(function(page) {
      const name = pageNames[page] || page;
      const hash = pageToHash(page);
      return '<a href="' + hash + '" style="text-decoration: none;">' +
        '<div style="padding: 1rem; background-color: rgba(0,255,255,0.05); border: 1px solid rgba(0,255,255,0.2); transition: all 0.3s; cursor: pointer;"' +
        ' onmouseover="this.style.backgroundColor=\'rgba(0,255,255,0.1)\'"' +
        ' onmouseout="this.style.backgroundColor=\'rgba(0,255,255,0.05)\'">' +
        '<div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">' +
        '<svg width="16" height="16" fill="none" stroke="var(--primary)" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
        '</svg>' +
        '<span style="color: var(--primary); font-family: \'JetBrains Mono\', monospace; font-size: 0.75rem; text-transform: uppercase;">アンロック済み</span>' +
        '</div>' +
        '<div style="color: white; font-weight: 600; font-size: 0.875rem;">' + name + '</div>' +
        '</div></a>';
    }).join('');
  }

  function displayLockedContent(level) {
    const container = document.getElementById('lockedContent');
    if (!container || typeof ProgressSystem === 'undefined') return;

    const lockedPages = ProgressSystem.getLockedPages(level);

    if (lockedPages.length === 0) {
      container.innerHTML = '<p class="text-muted" style="grid-column: span 2; text-align: center;">全てのコンテンツがアンロックされました！</p>';
      return;
    }

    const pageRequirements = {};
    try {
      Object.entries(ProgressSystem.LEVEL_UNLOCKS).forEach(function(entry) {
        var lvl = entry[0], pages = entry[1];
        pages.forEach(function(page) {
          if (lockedPages.includes(page)) {
            pageRequirements[page] = parseInt(lvl);
          }
        });
      });
    } catch(e) {}

    container.innerHTML = lockedPages.map(function(page) {
      const name = pageNames[page] || page;
      const requiredLevel = pageRequirements[page] || '?';
      return '<div style="padding: 1rem; background-color: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); opacity: 0.6;">' +
        '<div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">' +
        '<svg width="16" height="16" fill="none" stroke="var(--destructive)" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>' +
        '</svg>' +
        '<span style="color: var(--destructive); font-family: \'JetBrains Mono\', monospace; font-size: 0.75rem; text-transform: uppercase;">LEVEL ' + requiredLevel + ' 必要</span>' +
        '</div>' +
        '<div style="color: var(--muted-foreground); font-weight: 600; font-size: 0.875rem;">' + name + '</div>' +
        '</div>';
    }).join('');
  }

  displayUnlockedContent(currentUser.level || 0);
  displayLockedContent(currentUser.level || 0);

  // --- Daily login status ---
  function formatTimeUntilNextDay(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return hours + '時間' + minutes + '分後';
    return minutes + '分後';
  }

  function displayDailyLoginStatus() {
    const container = document.getElementById('dailyLoginStatus');
    if (!container || typeof ProgressSystem === 'undefined') return;

    const status = ProgressSystem.getDailyLoginStatus();
    if (!status) {
      container.innerHTML = '<div style="color: var(--muted-foreground);">ログインが必要です</div>';
      return;
    }

    const streakDay = status.streak > 0 ? ((status.streak - 1) % 7) + 1 : 1;
    const rewards = ProgressSystem.DAILY_LOGIN_REWARDS;
    const nextReward = (rewards && rewards[streakDay]) || 25;

    var claimHtml = '';
    if (status.canClaim) {
      claimHtml = '<button id="claimDailyBtn" style="margin-top:1rem;padding:0.75rem 1.5rem;background:transparent;border:2px solid rgb(16,185,129);color:rgb(16,185,129);font-family:\'Space Grotesk\',sans-serif;font-size:0.875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;cursor:pointer;width:100%;transition:all 0.3s;" onmouseover="this.style.backgroundColor=\'rgba(16,185,129,0.2)\'" onmouseout="this.style.backgroundColor=\'transparent\'">受け取る</button>';
    } else {
      claimHtml = '<div style="margin-top:1rem;font-size:0.875rem;color:var(--muted-foreground);font-family:\'JetBrains Mono\',monospace;">' + formatTimeUntilNextDay(status.nextRewardIn) + '</div>';
    }

    container.innerHTML =
      '<div><div class="font-mono text-muted" style="font-size:0.75rem;margin-bottom:0.5rem;">連続ログイン</div>' +
      '<div style="font-size:2rem;font-family:\'Space Grotesk\',sans-serif;font-weight:700;color:var(--primary);">' + status.streak + ' 日</div></div>' +
      '<div><div class="font-mono text-muted" style="font-size:0.75rem;margin-bottom:0.5rem;">累計ログイン</div>' +
      '<div style="font-size:2rem;font-family:\'Space Grotesk\',sans-serif;font-weight:700;color:white;">' + status.totalLogins + ' 日</div></div>' +
      '<div><div class="font-mono text-muted" style="font-size:0.75rem;margin-bottom:0.5rem;">' + (status.canClaim ? '本日の報酬' : '次回報酬') + '</div>' +
      '<div style="font-size:1.5rem;font-family:\'Space Grotesk\',sans-serif;font-weight:700;color:' + (status.canClaim ? 'rgb(16,185,129)' : 'var(--primary)') + ';">+' + nextReward + ' XP</div>' +
      claimHtml + '</div>';

    const claimBtn = document.getElementById('claimDailyBtn');
    if (claimBtn) {
      claimBtn.addEventListener('click', function() {
        if (typeof DailyLoginUI !== 'undefined') {
          const s = ProgressSystem.getDailyLoginStatus();
          const ui = new DailyLoginUI();
          ui.show(s);
        }
      });
    }
  }

  displayDailyLoginStatus();

  // --- Logout button ---
  const logoutBtn = document.getElementById('logoutButton');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      var doLogout = function() {
        clearCurrentUser();
        window.location.hash = '#/login';
      };
      if (typeof ModalSystem !== 'undefined') {
        ModalSystem.confirm('ログアウトしますか？', 'LOGOUT CONFIRMATION').then(function(confirmed) {
          if (confirmed) doLogout();
        });
      } else {
        if (confirm('ログアウトしますか？')) doLogout();
      }
    });
  }

  // --- Progress update listener ---
  window.addEventListener('userProgressUpdated', function(e) {
    const result = e.detail;
    const updatedUser = result.user;

    setEl('userXP', (updatedUser.xp || 0) + ' XP');

    if (typeof ProgressSystem !== 'undefined') {
      const levelInfo = ProgressSystem.getNextLevelInfo(updatedUser);
      if (levelInfo.isMaxLevel) {
        setEl('xpNeeded', 'MAX LEVEL');
        const bar = document.getElementById('xpProgress');
        if (bar) bar.style.width = '100%';
      } else {
        setEl('xpNeeded', levelInfo.xpNeeded + ' XP');
        const bar = document.getElementById('xpProgress');
        if (bar) bar.style.width = levelInfo.progress + '%';
      }
    }

    if (result.leveledUp) {
      updateLevelBasedMessages(updatedUser);
      displayUnlockedContent(updatedUser.level);
      displayLockedContent(updatedUser.level);
    }
  });

  // --- Daily login claimed listener ---
  window.addEventListener('dailyLoginClaimed', function() {
    displayDailyLoginStatus();
  });

  // --- Ctrl+Shift+C hidden console shortcut ---
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      window.open('./admin/console.html', '_blank');
    }
  });

})();
