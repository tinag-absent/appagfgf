/**
 * SPA Router for 海蝕機関
 * Hash-based routing: #/page or #/page?param=value
 */
(function() {
  'use strict';

  // Route → page key mapping
  const ROUTES = {
    '/':                    'index',
    '/index':               'index',
    '/divisions':           'divisions',
    '/missions':            'missions',
    '/phenomenon':          'phenomenon',
    '/chat':                'chat',
    '/map':                 'map',
    '/search':              'search',
    '/history':             'history',
    '/dashboard':           'dashboard',
    '/login':               'login',
    '/entities':            'entities',
    '/modules':             'modules',
    '/classified':          'classified',
    '/entity-detail':       'entity-detail',
    '/location-detail':     'location-detail',
    '/mission-detail':      'mission-detail',
    '/module-detail':       'module-detail',
    '/personnel-detail':    'personnel-detail',
    '/division-foreign':    'division-foreign',
    '/division-support':    'division-support',
    '/division-convergence':'division-convergence',
    '/division-port':       'division-port',
    '/division-engineering':'division-engineering',
    '/statistics':          'statistics',
    '/codex':               'codex',
    '/reports':             'reports',
    '/agency-history':      'agency-history',
  };

  // Convert old-style .html paths to SPA routes
  function pathToRoute(path) {
    // Remove ./ or ../ prefix
    path = path.replace(/^\.\.\//, '/').replace(/^\.\//, '/');
    // Remove .html extension
    path = path.replace(/\.html(\?.*)?$/, function(m, qs) { return qs || ''; });
    // Handle details/ and divisions/ subpaths
    path = path.replace(/^\/details\//, '/');
    path = path.replace(/^\/divisions\//, '/division-');
    // Normalize
    if (path === '' || path === '/index') return '/';
    return path;
  }

  // Convert old-style href to hash route
  function hrefToHash(href) {
    if (!href) return null;
    if (href.startsWith('#')) return href;
    if (href.startsWith('http')) return null; // external
    
    // Extract query string
    const qIdx = href.indexOf('?');
    const base = qIdx >= 0 ? href.slice(0, qIdx) : href;
    const qs = qIdx >= 0 ? href.slice(qIdx) : '';
    
    const route = pathToRoute(base);
    return '#' + route + qs;
  }

  // Currently loaded scripts for the current page
  let loadedPageScripts = [];

  // Script loading promise map
  const scriptPromises = {};

  function loadScript(src) {
    if (scriptPromises[src]) return scriptPromises[src];
    scriptPromises[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return scriptPromises[src];
  }

  // Re-execute an already-loaded script by eval-ing its content
  // We need fresh execution for page-specific IIFEs on every navigation
  const scriptContents = {};

  async function executePageScript(filename) {
    const src = './js/' + filename;
    
    // Try to get cached content first
    if (scriptContents[filename]) {
      try { 
        (0, eval)(scriptContents[filename]);
      } catch(e) { console.warn('Script re-exec error:', filename, e); }
      return;
    }
    
    // Fetch and cache
    try {
      const resp = await fetch(src);
      const text = await resp.text();
      scriptContents[filename] = text;
      try { 
        (0, eval)(text);
      } catch(e) { console.warn('Script exec error:', filename, e); }
    } catch(e) {
      console.warn('Failed to load script:', filename, e);
    }
  }

  // Parse current hash
  function parseHash(hash) {
    hash = hash || window.location.hash || '#/';
    // Remove leading #
    const withoutHash = hash.slice(1) || '/';
    const qIdx = withoutHash.indexOf('?');
    const path = qIdx >= 0 ? withoutHash.slice(0, qIdx) : withoutHash;
    const search = qIdx >= 0 ? withoutHash.slice(qIdx) : '';
    return { path: path || '/', search };
  }

  // Get page key for current route
  function getPageKey(path) {
    return ROUTES[path] || ROUTES['/'];
  }

  // Render page content into main
  async function renderPage(hash, replace) {
    const { path, search } = parseHash(hash);
    const pageKey = getPageKey(path);
    const pageData = window.PAGES && window.PAGES[pageKey];
    
    if (!pageData) {
      console.warn('Page not found:', pageKey);
      return;
    }

    // Show loading
    if (window.LoadingSystem) {
      // Don't show full loading for navigation, just a quick flash
    }

    // Update main content
    const main = document.querySelector('.main-content');
    if (!main) return;

    // Animate out
    main.style.opacity = '0';
    main.style.transition = 'opacity 0.15s ease';

    await new Promise(r => setTimeout(r, 150));

    // Set new content
    main.innerHTML = pageData.html;

    // Handle console page - it uses full-screen body style, skip for SPA
    // The console will run within the main area

    // Animate in
    main.style.opacity = '1';

    // Scroll to top
    main.scrollTop = 0;
    window.scrollTo(0, 0);

    // Intercept all links in the new content
    interceptLinks(main);

    // Intercept onclick attributes (for dynamically generated items)
    patchInlineOnclicks(main);

    // Update sidebar active state
    if (window.sidebarComponent) {
      window.sidebarComponent.updateActiveNav(pageKey);
    }

    // Update document title
    updateTitle(pageKey);

    // ── ストーリーエンジン: ページ訪問を通知 ──
    if (window.StoryEngine) {
      StoryEngine.onPageVisit(pageKey);
    }

    // Execute page-specific scripts
    for (const scriptFile of pageData.scripts) {
      await executePageScript(scriptFile);
    }

    // Re-init common page functionality
    reinitPage(pageKey, search);

    // Update URL (for shareable links)
    const newHash = '#' + path + search;
    if (replace) {
      history.replaceState({ pageKey, search }, '', newHash);
    } else {
      history.pushState({ pageKey, search }, '', newHash);
    }
  }

  // Re-initialize page-specific logic after rendering
  function reinitPage(pageKey, search) {
    // Terminal logs on index
    if (pageKey === 'index' && typeof initTerminalLogs === 'function') {
      initTerminalLogs();
    }
    if (pageKey === 'index' && typeof initGlitchEffect === 'function') {
      initGlitchEffect();
    }

    // Daily login modal
    if (typeof DailyLogin !== 'undefined') {
      try { DailyLogin.check && DailyLogin.check(); } catch(e) {}
    }

    // Progress system re-check
    if (typeof ProgressSystem !== 'undefined') {
      try { ProgressSystem.checkPageAccess && ProgressSystem.checkPageAccess(); } catch(e) {}
    }

    // Update sidebar user info
    if (window.sidebarComponent) {
      window.sidebarComponent.updateUserInfo();
    }

    // ViewHistory tracking
    trackPageView(pageKey, search);
  }

  function trackPageView(pageKey, search) {
    if (typeof ViewHistory === 'undefined') return;
    const params = new URLSearchParams(search);
    const id = params.get('id');
    if (!id) return;
    
    const typeMap = {
      'mission-detail': 'mission',
      'entity-detail': 'entity',
      'module-detail': 'module',
      'location-detail': 'location',
      'personnel-detail': 'personnel',
    };
    const type = typeMap[pageKey];
    if (type) {
      // Will be recorded by the detail page script with the name
    }
  }

  function updateTitle(pageKey) {
    const titles = {
      'index': '海蝕機関 - ステータス・ダッシュボード',
      'divisions': '各部門情報 - 海蝕機関',
      'missions': '収束案件一覧 - 海蝕機関',
      'phenomenon': 'アーカイブ：海蝕現象 - 海蝕機関',
      'chat': '機関員チャット - 海蝕機関',
      'map': '海蝕現象マップ - 海蝕機関',
      'search': '統合データベース検索 - 海蝕機関',
      'history': 'アクセス履歴 - 海蝕機関',
      'dashboard': 'マイページ - 海蝕機関',
      'login': '機関員アクセス - 海蝕機関',
      'entities': '海蝕実体カタログ - 海蝕機関',
      'modules': 'モジュールカタログ - 海蝕機関',
      'classified': '機関員一覧 [CLASSIFIED] - 海蝕機関',
      'entity-detail': '実体詳細 - 海蝕機関',
      'location-detail': '場所詳細 - 海蝕機関',
      'mission-detail': '案件詳細 - 海蝕機関',
      'module-detail': 'モジュール詳細 - 海蝕機関',
      'personnel-detail': '人員詳細 - 海蝕機関',
      'statistics': '機関統計 - 海蝕機関',
      'codex': '世界観コデックス - 海蝕機関',
      'reports': 'インシデント報告 - 海蝕機関',
      'agency-history': '機関の歴史 - 海蝕機関',
    };
    document.title = titles[pageKey] || '海蝕機関';
  }

  // Intercept <a> tags to use SPA navigation
  function interceptLinks(container) {
    const links = container.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') && !href.includes('.html')) return;
      if (href.startsWith('http') || href.startsWith('//')) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
      
      // Convert to hash
      const newHash = hrefToHash(href);
      if (newHash) {
        link.setAttribute('href', newHash);
      }
    });
  }

  // Patch onclick="window.location.href='...'" patterns in innerHTML
  function patchInlineOnclicks(container) {
    // Find elements with onclick that contain window.location.href
    const allElems = container.querySelectorAll('[onclick]');
    allElems.forEach(el => {
      const onclick = el.getAttribute('onclick');
      if (!onclick) return;
      
      // Replace window.location.href='...' with Router.navigate('...')
      const patched = onclick.replace(
        /window\.location\.href\s*=\s*['"]([^'"]+)['"]/g,
        function(match, url) {
          const hash = hrefToHash(url);
          if (hash) {
            return `Router.navigate('${hash}')`;
          }
          return match;
        }
      );
      
      if (patched !== onclick) {
        el.setAttribute('onclick', patched);
      }
    });
  }

  // Navigate to a hash route
  function navigate(hashOrPath) {
    let hash = hashOrPath;
    if (!hash.startsWith('#')) {
      // Convert old-style path to hash
      hash = hrefToHash(hashOrPath) || ('#' + hashOrPath);
    }
    window.location.hash = hash.slice(1); // triggers hashchange
  }

  // Handle hashchange
  function onHashChange() {
    renderPage(window.location.hash, true);
  }

  // Handle popstate (back/forward)
  function onPopState() {
    renderPage(window.location.hash, true);
  }

  // Patch window.location.href setter globally
  // We override navigation via a global Router object
  window.Router = {
    navigate: function(hashOrPath) {
      navigate(hashOrPath);
    },
    hrefToHash: hrefToHash,
    parseHash: parseHash,
    getPageKey: getPageKey,
    interceptLinks: interceptLinks,
    patchInlineOnclicks: patchInlineOnclicks,
  };

  // Initialize
  function init() {
    // Intercept initial links in sidebar
    interceptLinks(document);

    // Listen for hash changes
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onPopState);

    // Render initial page
    const initialHash = window.location.hash || '#/';
    renderPage(initialHash, true);
  }

  // Run after DOM and common scripts are loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// Override URLSearchParams to work with hash-based routing
// Page scripts that use `new URLSearchParams(window.location.search)` need the hash query string
(function patchURLSearchParams() {
  const OriginalURLSearchParams = window.URLSearchParams;
  
  // Patch window.location.search getter to return hash query string
  const locationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
  if (!locationDescriptor) return;
  
  // We can't directly override window.location.search, so we patch the scripts
  // by injecting a helper that the patched scripts use
  window.__getHashSearch = function() {
    const hash = window.location.hash || '';
    const qIdx = hash.indexOf('?');
    return qIdx >= 0 ? hash.slice(qIdx) : '';
  };
})();
