// Personnel Database — inline-first / fetch fallback (LEVEL 5 CLASSIFIED)
(function() {
  window.PersonnelDatabase = {
    personnel: [],
    isLoaded: false,
    loadPromise: null,

    searchPersonnel(query) {
      const q = query.toLowerCase();
      return this.personnel.filter(p =>
        p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) ||
        p.division.toLowerCase().includes(q) || p.specialization.toLowerCase().includes(q)
      );
    },
    getPersonnelById(id)     { return this.personnel.find(p => p.id === id); },
    filterByDivision(div)    { return this.personnel.filter(p => p.division.includes(div)); },
    getStatistics() {
      const divisions = {};
      this.personnel.forEach(p => {
        const d = p.division.split(' ')[0];
        divisions[d] = (divisions[d] || 0) + 1;
      });
      return {
        total: this.personnel.length,
        divisions,
        avgAge: Math.round(this.personnel.reduce((s, p) => s + p.age, 0) / this.personnel.length)
      };
    },
    whenReady() { return this.loadPromise; }
  };

  async function loadPersonnelData() {
    // ① インラインデータ優先
    if (window.__DATA_PERSONNEL_DATA) {
      window.PersonnelDatabase.personnel = window.__DATA_PERSONNEL_DATA.personnel || [];
      window.PersonnelDatabase.isLoaded  = true;
      window.dispatchEvent(new CustomEvent('personnelDataLoaded'));
      return window.PersonnelDatabase;
    }
    // ② HTTP / GitHub Pages フォールバック
    const basePath = './data/';
    const response = await fetch(basePath + 'personnel-data.json');
    if (!response.ok) throw new Error('Failed to load personnel data: ' + response.status);
    const data = await response.json();
    window.PersonnelDatabase.personnel = data.personnel || [];
    window.PersonnelDatabase.isLoaded  = true;
    window.dispatchEvent(new CustomEvent('personnelDataLoaded'));
    return window.PersonnelDatabase;
  }

  window.PersonnelDatabase.loadPromise = loadPersonnelData().catch(err => {
    console.error('PersonnelDatabase load failed:', err);
  });
})();
