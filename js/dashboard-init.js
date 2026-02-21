// Auto-generated dashboard init script
// Keyboard shortcut: Ctrl+Shift+C to access hidden console
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        window.open('./console.html', '_blank');
      }
    });
const CURRENT_USER_KEY = 'kaishoku_current_user';

    function getCurrentUser() {
      const user = localStorage.getItem(CURRENT_USER_KEY);
      return user ? JSON.parse(user) : null;
    }

    function clearCurrentUser() {
      localStorage.removeItem(CURRENT_USER_KEY);
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
      'classified.html': '機密情報'
    };

    // Check authentication
    const currentUser = getCurrentUser();
    if (!currentUser) {
      window.location.href = './login.html';
    } else {
      // Initialize XP if not exists
      if (typeof currentUser.xp === 'undefined') {
        currentUser.xp = 0;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      }

      // Track profile view
      ProgressSystem.trackActivity('profile_view');

      // Update level-based messages
      updateLevelBasedMessages(currentUser);

      // Populate user data
      document.getElementById('sidebarUserName').textContent = currentUser.name;
      document.getElementById('welcomeUserName').textContent = currentUser.name;
      document.getElementById('userId').textContent = currentUser.id;
      document.getElementById('userName').textContent = currentUser.name;
      document.getElementById('userDivision').textContent = divisionNames[currentUser.division] || currentUser.division;
      document.getElementById('userLevel').textContent = `LEVEL ${currentUser.level}`;
      
      // Display XP and progress
      document.getElementById('userXP').textContent = `${currentUser.xp || 0} XP`;
      
      const levelInfo = ProgressSystem.getNextLevelInfo(currentUser);
      if (levelInfo.isMaxLevel) {
        document.getElementById('xpNeeded').textContent = 'MAX LEVEL';
        document.getElementById('xpProgress').style.width = '100%';
      } else {
        document.getElementById('xpNeeded').textContent = `${levelInfo.xpNeeded} XP`;
        document.getElementById('xpProgress').style.width = `${levelInfo.progress}%`;
      }
      
      // Format registration date
      const regDate = new Date(currentUser.registeredAt);
      document.getElementById('userRegistered').textContent = regDate.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Display unlocked and locked content
      displayUnlockedContent(currentUser.level);
      displayLockedContent(currentUser.level);
    }

    function displayUnlockedContent(level) {
      const container = document.getElementById('unlockedContent');
      const unlockedPages = ProgressSystem.getUnlockedPages(level);
      
      // Filter out login and dashboard
      const displayPages = unlockedPages.filter(p => p !== 'login.html' && p !== 'dashboard.html');
      
      if (displayPages.length === 0) {
        container.innerHTML = '<p class="text-muted" style="grid-column: span 2; text-align: center;">アクセス可能なコンテンツはありません</p>';
        return;
      }

      container.innerHTML = displayPages.map(page => {
        const name = pageNames[page] || page;
        return `
          <a href="./${page}" style="text-decoration: none;">
            <div style="padding: 1rem; background-color: rgba(0, 255, 255, 0.05); border: 1px solid rgba(0, 255, 255, 0.2); transition: all 0.3s; cursor: pointer;" 
                 onmouseover="this.style.backgroundColor='rgba(0, 255, 255, 0.1)'" 
                 onmouseout="this.style.backgroundColor='rgba(0, 255, 255, 0.05)'">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <svg width="16" height="16" fill="none" stroke="var(--primary)" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span style="color: var(--primary); font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; text-transform: uppercase;">アンロック済み</span>
              </div>
              <div style="color: white; font-weight: 600; font-size: 0.875rem;">${name}</div>
            </div>
          </a>
        `;
      }).join('');
    }

    function displayLockedContent(level) {
      const container = document.getElementById('lockedContent');
      const lockedPages = ProgressSystem.getLockedPages(level);
      
      if (lockedPages.length === 0) {
        container.innerHTML = '<p class="text-muted" style="grid-column: span 2; text-align: center;">全てのコンテンツがアンロックされました！</p>';
        return;
      }

      // Find required level for each locked page
      const pageRequirements = {};
      Object.entries(ProgressSystem.LEVEL_UNLOCKS).forEach(([lvl, pages]) => {
        pages.forEach(page => {
          if (lockedPages.includes(page)) {
            pageRequirements[page] = parseInt(lvl);
          }
        });
      });

      container.innerHTML = lockedPages.map(page => {
        const name = pageNames[page] || page;
        const requiredLevel = pageRequirements[page] || 0;
        return `
          <div style="padding: 1rem; background-color: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); opacity: 0.6;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <svg width="16" height="16" fill="none" stroke="var(--destructive)" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <span style="color: var(--destructive); font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; text-transform: uppercase;">LEVEL ${requiredLevel} 必要</span>
            </div>
            <div style="color: var(--muted-foreground); font-weight: 600; font-size: 0.875rem;">${name}</div>
          </div>
        `;
      }).join('');
    }

    // Logout functionality
    document.getElementById('logoutButton').addEventListener('click', function() {
      ModalSystem.confirm(
        'ログアウトしますか？',
        'LOGOUT CONFIRMATION'
      ).then(confirmed => {
        if (confirmed) {
          clearCurrentUser();
          window.location.href = './login.html';
        }
      });
    });

    // Listen for progress updates
    window.addEventListener('userProgressUpdated', function(e) {
      const result = e.detail;
      const updatedUser = result.user;
      
      // Update displays
      document.getElementById('userLevel').textContent = `LEVEL ${updatedUser.level}`;
      document.getElementById('sidebarUserLevel').textContent = `LEVEL ${updatedUser.level}`;
      document.getElementById('userXP').textContent = `${updatedUser.xp || 0} XP`;
      
      const levelInfo = ProgressSystem.getNextLevelInfo(updatedUser);
      if (levelInfo.isMaxLevel) {
        document.getElementById('xpNeeded').textContent = 'MAX LEVEL';
        document.getElementById('xpProgress').style.width = '100%';
      } else {
        document.getElementById('xpNeeded').textContent = `${levelInfo.xpNeeded} XP`;
        document.getElementById('xpProgress').style.width = `${levelInfo.progress}%`;
      }

      // Refresh content lists if leveled up
      if (result.leveledUp) {
        displayUnlockedContent(updatedUser.level);
        displayLockedContent(updatedUser.level);
      }
    });

    // Display daily login status
    function displayDailyLoginStatus() {
      const status = ProgressSystem.getDailyLoginStatus();
      const container = document.getElementById('dailyLoginStatus');
      
      if (!status) {
        container.innerHTML = '<div style="color: var(--muted-foreground);">ログインが必要です</div>';
        return;
      }

      const streakDay = status.streak > 0 ? ((status.streak - 1) % 7) + 1 : 1;
      const nextReward = ProgressSystem.DAILY_LOGIN_REWARDS[streakDay] || 25;
      
      container.innerHTML = `
        <div>
          <div class="font-mono text-muted" style="font-size: 0.75rem; margin-bottom: 0.5rem;">連続ログイン</div>
          <div style="font-size: 2rem; font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: var(--primary);">
            ${status.streak} 日
          </div>
        </div>
        <div>
          <div class="font-mono text-muted" style="font-size: 0.75rem; margin-bottom: 0.5rem;">累計ログイン</div>
          <div style="font-size: 2rem; font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: white;">
            ${status.totalLogins} 日
          </div>
        </div>
        <div>
          <div class="font-mono text-muted" style="font-size: 0.75rem; margin-bottom: 0.5rem;">
            ${status.canClaim ? '本日の報酬' : '次回報酬'}
          </div>
          <div style="font-size: 1.5rem; font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: ${status.canClaim ? 'rgb(16, 185, 129)' : 'var(--primary)'};">
            +${nextReward} XP
          </div>
          ${status.canClaim ? `
            <button onclick="showDailyLoginModal()" style="
              margin-top: 1rem;
              padding: 0.75rem 1.5rem;
              background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
              border: 2px solid rgb(16, 185, 129);
              color: rgb(16, 185, 129);
              font-family: 'Space Grotesk', sans-serif;
              font-size: 0.875rem;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              cursor: pointer;
              width: 100%;
              transition: all 0.3s;
            " onmouseover="this.style.backgroundColor='rgba(16, 185, 129, 0.3)'" onmouseout="this.style.backgroundColor='transparent'">
              受け取る
            </button>
          ` : `
            <div style="margin-top: 1rem; font-size: 0.875rem; color: var(--muted-foreground); font-family: 'JetBrains Mono', monospace;">
              ${formatTimeUntilNextDay(status.nextRewardIn)}
            </div>
          `}
        </div>
      `;
    }

    function formatTimeUntilNextDay(milliseconds) {
      const hours = Math.floor(milliseconds / (1000 * 60 * 60));
      const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}時間${minutes}分後`;
      }
      return `${minutes}分後`;
    }

    function showDailyLoginModal() {
      const status = ProgressSystem.getDailyLoginStatus();
      const ui = new DailyLoginUI();
      ui.show(status);
    }

    // Listen for daily login claimed event
    window.addEventListener('dailyLoginClaimed', function(e) {
      displayDailyLoginStatus();
    });

    // Display daily login status on load
    displayDailyLoginStatus();

    /**
     * Update level-based messages
     */
    function updateLevelBasedMessages(user) {
      const level = user.level || 0;
      
      // Get level-specific messages
      const dashboardMsg = LevelMessages.getDashboardMessage(level);
      const rankInfo = LevelMessages.getRankTitle(level);
      
      // Update greeting
      const greetingElement = document.getElementById('dashboardGreeting');
      if (greetingElement) {
        greetingElement.textContent = dashboardMsg.greeting;
      }
      
      // Update description
      const descriptionElement = document.getElementById('dashboardDescription');
      if (descriptionElement) {
        descriptionElement.innerHTML = dashboardMsg.description;
      }
      
      // Update status text and color
      const statusText = document.getElementById('statusText');
      const statusDot = document.getElementById('statusDot');
      if (statusText && rankInfo) {
        statusText.textContent = rankInfo.status;
        statusText.style.color = rankInfo.color;
      }
      if (statusDot && rankInfo) {
        statusDot.style.backgroundColor = rankInfo.color;
      }
      
      // Update user level display with rank title
      const userLevelElement = document.getElementById('userLevel');
      if (userLevelElement) {
        userLevelElement.textContent = rankInfo.title;
        userLevelElement.style.color = rankInfo.color;
      }
    }