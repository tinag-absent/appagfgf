// Mission Database — inline-first / fetch fallback (file:// & GitHub Pages 両対応)
(function() {
  window.MissionData = {
    missions: [],
    isLoaded: false,
    loadPromise: null,

    searchMissions(filters) {
      let results = this.missions;
      if (filters.status && filters.status !== 'all')
        results = results.filter(m => m.status === filters.status);
      if (filters.priority && filters.priority !== 'all')
        results = results.filter(m => m.priority === filters.priority);
      if (filters.searchText) {
        const text = filters.searchText.toLowerCase();
        results = results.filter(m => m.id.toLowerCase() === text);
      }
      if (filters.division)
        results = results.filter(m => m.assignedDivisions.some(d => d.includes(filters.division)));
      return results;
    },

    getMissionById(id)  { return this.missions.find(m => m.id === id); },
    getStatistics() {
      return {
        total:      this.missions.length,
        active:     this.missions.filter(m => m.status === 'active').length,
        monitoring: this.missions.filter(m => m.status === 'monitoring').length,
        completed:  this.missions.filter(m => m.status === 'completed').length,
        critical:   this.missions.filter(m => m.priority === 'critical').length
      };
    },
    whenReady() { return this.loadPromise; }
  };

  async function loadMissionData() {
    // ① インラインデータ優先（file:// でも動作）
    if (window.__DATA_MISSION_DATA) {
      window.MissionData.missions  = window.__DATA_MISSION_DATA.missions || [];
      window.MissionData.isLoaded  = true;
      window.dispatchEvent(new CustomEvent('missionDataLoaded'));
      return window.MissionData;
    }
    // ② HTTP / GitHub Pages フォールバック
    const basePath = './data/';
    const response = await fetch(basePath + 'mission-data.json');
    if (!response.ok) throw new Error('Failed to load mission data: ' + response.status);
    const data = await response.json();
    window.MissionData.missions = data.missions || [];
    window.MissionData.isLoaded = true;
    window.dispatchEvent(new CustomEvent('missionDataLoaded'));
    return window.MissionData;
  }

  window.MissionData.loadPromise = loadMissionData().catch(err => {
    console.error('MissionData load failed:', err);
  });
})();
