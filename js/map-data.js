// Map Incident Data — inline-first / fetch fallback
(function() {
  window.MapData = {
    incidents: [],
    isLoaded: false,
    loadPromise: null,

    getIncidentsBySeverity(sev) { return this.incidents.filter(i => i.severity === sev); },
    getIncidentById(id)          { return this.incidents.find(i => i.id === id); },
    getStatistics() {
      return {
        total:    this.incidents.length,
        critical: this.getIncidentsBySeverity('critical').length,
        warning:  this.getIncidentsBySeverity('warning').length,
        safe:     this.getIncidentsBySeverity('safe').length
      };
    },
    whenReady() { return this.loadPromise; }
  };

  async function loadMapData() {
    // ① インラインデータ優先
    if (window.__DATA_MAP_INCIDENTS) {
      window.MapData.incidents = window.__DATA_MAP_INCIDENTS.incidents || [];
      window.MapData.isLoaded  = true;
      window.dispatchEvent(new CustomEvent('mapDataLoaded'));
      return window.MapData;
    }
    // ② HTTP / GitHub Pages フォールバック
    const basePath = './data/';
    const response = await fetch(basePath + 'map-incidents.json');
    if (!response.ok) throw new Error('Failed to load map incidents: ' + response.status);
    const data = await response.json();
    window.MapData.incidents = data.incidents || [];
    window.MapData.isLoaded  = true;
    window.dispatchEvent(new CustomEvent('mapDataLoaded'));
    return window.MapData;
  }

  window.MapData.loadPromise = loadMapData().catch(err => {
    console.error('MapData load failed:', err);
  });
})();
