// Router fallback for multi-page mode
// Provides Router.navigate() without SPA routing
if (!window.Router) {
  const hashToPath = {
    '#/dashboard': './dashboard.html',
    '#/login': './login.html',
    '#/missions': './missions.html',
    '#/entities': './entities.html',
    '#/modules': './modules.html',
    '#/search': './search.html',
    '#/reports': './reports.html',
  };

  function navigateFallback(hashOrPath) {
    if (!hashOrPath) { window.location.href = './dashboard.html'; return; }

    // Handle hash with query params: #/entity-detail?id=xxx
    const qIdx = hashOrPath.indexOf('?');
    const hashBase = qIdx >= 0 ? hashOrPath.slice(0, qIdx) : hashOrPath;
    const queryStr = qIdx >= 0 ? hashOrPath.slice(qIdx) : '';

    if (hashBase === '#/entity-detail') {
      window.location.href = './details/entity-detail.html' + queryStr.replace('?', '?');
    } else if (hashBase === '#/module-detail') {
      window.location.href = './details/module-detail.html' + queryStr;
    } else if (hashBase === '#/mission-detail') {
      window.location.href = './details/mission-detail.html' + queryStr;
    } else if (hashBase === '#/personnel-detail') {
      window.location.href = './details/personnel-detail.html' + queryStr;
    } else if (hashBase === '#/location-detail') {
      window.location.href = './details/location-detail.html' + queryStr;
    } else if (hashToPath[hashBase]) {
      window.location.href = hashToPath[hashBase];
    } else if (hashOrPath.startsWith('#/')) {
      const path = hashBase.replace('#/', '') + '.html';
      window.location.href = './' + path;
    } else {
      window.location.href = hashOrPath;
    }
  }

  window.Router = {
    navigate: navigateFallback
  };
}
