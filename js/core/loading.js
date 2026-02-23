// Loading Animation System — minimal rebuild
(function () {
  'use strict';

  const LoadingSystem = {
    overlay: null,
    bar: null,
    status: null,

    init() {
      this._inject();
      this.overlay = document.getElementById('loadingOverlay');
      this.bar     = document.getElementById('loadingBar');
      this.status  = document.getElementById('loadingStatus');
      this._run();
    },

    _inject() {
      document.body.insertAdjacentHTML('afterbegin', `
        <div class="loading-overlay" id="loadingOverlay">
          <div class="loading-content">
            <div class="loading-mark">
              <div class="loading-ring"></div>
              <div class="loading-dot"></div>
            </div>
            <div class="loading-title">海蝕機関</div>
            <div class="loading-line">
              <div class="loading-line-sweep" id="loadingSweep"></div>
              <div class="loading-line-bar"   id="loadingBar"></div>
            </div>
            <div class="loading-status" id="loadingStatus">初期化中</div>
          </div>
        </div>
      `);
    },

    _set(pct, msg) {
      if (this.bar)    this.bar.style.width = pct + '%';
      if (this.status) this.status.textContent = msg;

      // Once progress starts, hide the idle sweep
      if (pct > 0) {
        const sweep = document.getElementById('loadingSweep');
        if (sweep) sweep.style.display = 'none';
      }
    },

    hide() {
      if (!this.overlay) return;
      this.overlay.classList.add('hidden');
      setTimeout(() => this.overlay?.remove(), 650);
    },

    async _run() {
      const wait = ms => new Promise(r => setTimeout(r, ms));

      this._set(20, 'システム接続中');
      await wait(260);

      this._set(50, 'データ確認中');

      // Wait for CatalogData if present
      if (window.CatalogData?.whenReady) {
        await window.CatalogData.whenReady();
      } else {
        await wait(300);
      }

      this._set(80, 'リソース展開中');

      // Wait for full page load
      await new Promise(r => {
        if (document.readyState === 'complete') { r(); }
        else { window.addEventListener('load', r); setTimeout(r, 2000); }
      });

      this._set(100, '認証完了');
      await wait(380);
      this.hide();
    }
  };

  window.LoadingSystem = LoadingSystem;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LoadingSystem.init());
  } else {
    LoadingSystem.init();
  }
})();
