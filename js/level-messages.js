// Level Messages System — inline-first / fetch fallback
(function() {
  let _data = null;

  const LevelMessages = {
    isLoaded: false,
    loadPromise: null,
    whenReady() { return this.loadPromise; },

    getRankTitle(level)         { return _data?.rankTitles?.[level] ?? _data?.rankTitles?.[0] ?? {}; },
    getWelcomeMessage(level) {
      if (!_data) return '';
      if (level === 0) {
        const msgs = _data.welcomeMessages[0];
        return msgs[Math.floor(Math.random() * msgs.length)];
      }
      return _data.welcomeMessages[level] ?? _data.welcomeMessages[0][0];
    },
    getStatusMessage(level)     { return _data?.statusMessages?.[level]     ?? _data?.statusMessages?.[0]     ?? {}; },
    getDashboardMessage(level)  { return _data?.dashboardMessages?.[level]  ?? _data?.dashboardMessages?.[0]  ?? {}; },
    getDailyLoginMessage(level) { return _data?.dailyLoginMessages?.[level] ?? _data?.dailyLoginMessages?.[0] ?? {}; },
    getHintMessage(level) {
      const hints = _data?.hintMessages?.[level] ?? _data?.hintMessages?.[0] ?? [''];
      return hints[Math.floor(Math.random() * hints.length)];
    },
    getLevelUpMessage(newLevel)    { return _data?.levelUpMessages?.[newLevel] ?? null; },
    getMotivationalMessage(level) {
      const msgs = _data?.motivationalMessages?.[level] ?? _data?.motivationalMessages?.[0] ?? [''];
      return msgs[Math.floor(Math.random() * msgs.length)];
    },
    get RANK_TITLES() { return _data?.rankTitles ?? {}; }
  };

  async function loadLevelMessages() {
    // ① インラインデータ優先
    if (window.__DATA_LEVEL_MESSAGES_DATA) {
      _data = window.__DATA_LEVEL_MESSAGES_DATA;
      LevelMessages.isLoaded = true;
      window.dispatchEvent(new CustomEvent('levelMessagesLoaded'));
      return LevelMessages;
    }
    // ② HTTP / GitHub Pages フォールバック
    const basePath = './data/';
    const response = await fetch(basePath + 'level-messages-data.json');
    if (!response.ok) throw new Error('Failed to load level messages: ' + response.status);
    _data = await response.json();
    LevelMessages.isLoaded = true;
    window.dispatchEvent(new CustomEvent('levelMessagesLoaded'));
    return LevelMessages;
  }

  LevelMessages.loadPromise = loadLevelMessages().catch(err => {
    console.error('LevelMessages load failed:', err);
  });
  window.LevelMessages = LevelMessages;
})();
