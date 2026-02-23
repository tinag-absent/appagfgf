// Catalog Data - inline-first loader (file:// & HTTP 両対応)
(function() {
  window.CatalogData = {
    modules: [],
    entities: [],
    locations: [],
    divisions: [],
    isLoaded: false,
    loadPromise: null,
    whenReady() { return this.loadPromise; }
  };

  async function loadCatalogData() {
    try {
      // インラインデータ優先（file:// で動作）
      if (window.__DATA_MODULES_DATA && window.__DATA_ENTITIES_DATA &&
          window.__DATA_LOCATIONS_DATA && window.__DATA_DIVISIONS_DATA) {
        window.CatalogData.modules   = window.__DATA_MODULES_DATA.modules   || [];
        window.CatalogData.entities  = window.__DATA_ENTITIES_DATA.entities  || [];
        window.CatalogData.locations = window.__DATA_LOCATIONS_DATA.locations || [];
        window.CatalogData.divisions = window.__DATA_DIVISIONS_DATA.divisions || [];
        window.CatalogData.isLoaded  = true;
        window.dispatchEvent(new CustomEvent('catalogDataLoaded'));
        return window.CatalogData;
      }

      // フォールバック: HTTP サーバー経由
      const basePath = './data/';
      const [m, e, l, d] = await Promise.all([
        fetch(basePath + 'modules-data.json'),
        fetch(basePath + 'entities-data.json'),
        fetch(basePath + 'locations-data.json'),
        fetch(basePath + 'divisions-data.json')
      ]);
      const [md, ed, ld, dd] = await Promise.all([m.json(), e.json(), l.json(), d.json()]);
      window.CatalogData.modules   = md.modules   || [];
      window.CatalogData.entities  = ed.entities  || [];
      window.CatalogData.locations = ld.locations || [];
      window.CatalogData.divisions = dd.divisions || [];
      window.CatalogData.isLoaded  = true;
      window.dispatchEvent(new CustomEvent('catalogDataLoaded'));
      return window.CatalogData;
    } catch (error) {
    console.error('[海蝕機関] カタログデータ読み込み失敗:', error.message || error);
    if (typeof window._showErrorToast === 'function') {
      window._showErrorToast('DATA LOAD ERROR', error.message || 'カタログデータの読み込みに失敗', 'catalog-data.js', null);
    }
    throw error;
    }
  }

  window.CatalogData.loadPromise = loadCatalogData();
})();
