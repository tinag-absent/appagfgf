/**
 * 海蝕機関 — グローバルエラーハンドリング (error-handler.js)
 * ─────────────────────────────────────────────────────────────────────────
 * 1. window.onerror / unhandledrejection でJSエラーを捕捉してUI通知
 * 2. fetchWithRetry() — リトライ付きfetch wrapper
 * 3. データロード失敗時のフォールバックUI
 * 4. localStorage 容量不足・quota エラーの安全処理
 * 5. ネットワーク断線検知・オフライン表示
 * ─────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════
   * 1. グローバルエラーキャプチャ
   * ═══════════════════════════════════════ */
  var _errorCount = 0;
  var _MAX_ERRORS = 5; // これ以上は表示しない（スパム防止）

  window.addEventListener('error', function (e) {
    // 画像・スクリプト読み込み失敗はコンソールのみ
    if (e.target && e.target !== window) {
      console.warn('[海蝕機関] リソース読み込みエラー:', e.target.src || e.target.href);
      return;
    }
    handleJsError(e.message, e.filename, e.lineno);
  });

  window.addEventListener('unhandledrejection', function (e) {
    var msg = e.reason instanceof Error
      ? e.reason.message
      : String(e.reason || '非同期処理エラー');
    handleJsError(msg, '非同期処理', 0);
    e.preventDefault(); // コンソール出力を抑制
  });

  function handleJsError(msg, file, line) {
    _errorCount++;
    if (_errorCount > _MAX_ERRORS) return;

    // 開発者向けコンソール
    console.error('[海蝕機関 SYSTEM ERROR]', msg, file ? ('@ ' + file + ':' + line) : '');

    // ユーザーへの通知（NotificationSystemがあれば使う）
    if (typeof NotificationSystem !== 'undefined') {
      // 重大なエラーのみ表示
      if (msg && msg.length < 120) {
        NotificationSystem.notifySystem('[SYSTEM] 内部エラーを検出: ' + msg.slice(0, 80), 'warn');
      }
    }
  }

  /* ═══════════════════════════════════════
   * 2. fetchWithRetry — リトライ付きfetch
   * ═══════════════════════════════════════ */
  window.fetchWithRetry = function (url, options, maxRetries) {
    maxRetries = maxRetries || 3;
    options = options || {};
    var attempt = 0;

    function doFetch() {
      attempt++;
      return fetch(url, options).then(function (res) {
        if (!res.ok) {
          throw new Error('HTTP ' + res.status + ': ' + url);
        }
        return res;
      }).catch(function (err) {
        if (attempt < maxRetries) {
          var delay = Math.pow(2, attempt) * 300; // 指数バックオフ
          console.warn('[fetchWithRetry] リトライ ' + attempt + '/' + maxRetries + ' — ' + url);
          return new Promise(function (resolve) {
            setTimeout(resolve, delay);
          }).then(doFetch);
        }
        throw err;
      });
    }

    return doFetch();
  };

  /* ═══════════════════════════════════════
   * 3. データロード失敗フォールバックUI
   * ═══════════════════════════════════════ */

  /**
   * コンテナ要素にエラー表示を注入する
   * @param {Element|string} containerOrId  - コンテナ or ID文字列
   * @param {string} title
   * @param {string} detail
   * @param {Function} [retryFn]  - 再試行ボタン用コールバック
   */
  window.showDataError = function (containerOrId, title, detail, retryFn) {
    var el = typeof containerOrId === 'string'
      ? document.getElementById(containerOrId)
      : containerOrId;
    if (!el) return;

    var retryBtn = retryFn
      ? '<button onclick="(' + retryFn.toString() + ')()" style="' +
        'margin-top:1rem;padding:.5rem 1.2rem;background:rgba(0,255,255,.1);' +
        'border:1px solid var(--primary);color:var(--primary);' +
        'font-family:\'JetBrains Mono\',monospace;font-size:.75rem;cursor:pointer;' +
        'text-transform:uppercase;letter-spacing:.1em;">' +
        '▶ 再試行</button>'
      : '';

    el.innerHTML =
      '<div style="text-align:center;padding:3rem 1rem;font-family:\'JetBrains Mono\',monospace;">' +
      '<div style="font-size:2rem;margin-bottom:.75rem;opacity:.5">⚠</div>' +
      '<div style="color:#f87171;font-size:.8rem;letter-spacing:.15em;text-transform:uppercase;margin-bottom:.5rem;">' +
      (title || 'データ読み込みエラー') + '</div>' +
      '<div style="color:rgba(255,255,255,.4);font-size:.72rem;line-height:1.6;max-width:320px;margin:0 auto;">' +
      (detail || 'データの読み込みに失敗しました。ネットワーク接続を確認してください。') + '</div>' +
      retryBtn +
      '</div>';
  };

  /**
   * ページ全体をエラー画面に置き換える（致命的エラー用）
   */
  window.showFatalError = function (code, title, detail) {
    var mc = document.querySelector('.main-content') || document.body;
    mc.innerHTML =
      '<div class="container" style="display:flex;align-items:center;justify-content:center;min-height:80vh;">' +
      '<div style="text-align:center;font-family:\'JetBrains Mono\',monospace;max-width:480px;">' +
      '<div style="font-size:5rem;font-weight:900;color:rgba(239,68,68,.3);margin-bottom:.5rem;">' + (code || 'ERR') + '</div>' +
      '<div style="font-size:1.1rem;font-weight:700;color:#f87171;text-transform:uppercase;letter-spacing:.15em;margin-bottom:1rem;">' + (title || 'システムエラー') + '</div>' +
      '<div style="font-size:.78rem;color:rgba(255,255,255,.45);line-height:1.7;margin-bottom:2rem;">' + (detail || '') + '</div>' +
      '<button onclick="location.reload()" style="padding:.6rem 1.5rem;background:rgba(239,68,68,.1);border:1px solid #f87171;' +
      'color:#f87171;font-family:\'JetBrains Mono\',monospace;font-size:.78rem;cursor:pointer;' +
      'text-transform:uppercase;letter-spacing:.1em;">▶ 再読み込み</button>' +
      '</div></div>';
  };

  /* ═══════════════════════════════════════
   * 4. localStorage 安全ラッパー
   * ═══════════════════════════════════════ */
  window.safeStorage = {
    get: function (key, fallback) {
      try {
        var val = localStorage.getItem(key);
        return val !== null ? val : (fallback !== undefined ? fallback : null);
      } catch (e) {
        console.warn('[safeStorage] get失敗:', key, e.message);
        return fallback !== undefined ? fallback : null;
      }
    },
    getJSON: function (key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : (fallback !== undefined ? fallback : null);
      } catch (e) {
        console.warn('[safeStorage] getJSON失敗:', key, e.message);
        return fallback !== undefined ? fallback : null;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        // QuotaExceededError
        if (e.name === 'QuotaExceededError' || e.code === 22) {
          console.warn('[safeStorage] localStorage容量不足。古いデータを削除中...');
          _evictOldData();
          try {
            localStorage.setItem(key, value);
            return true;
          } catch (e2) {
            console.error('[safeStorage] 空き確保後も保存失敗:', key);
          }
        }
        return false;
      }
    },
    setJSON: function (key, obj) {
      return this.set(key, JSON.stringify(obj));
    },
    remove: function (key) {
      try { localStorage.removeItem(key); } catch (e) {}
    }
  };

  // 古いキャッシュを削除して容量を確保
  function _evictOldData() {
    var evictable = [
      'kaishoku_notifications', // 通知履歴（再生成可能）
      'kaishoku_view_history',
      'kaishoku_story_state'
    ];
    evictable.forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) {}
    });
  }

  /* ═══════════════════════════════════════
   * 5. オフライン検知
   * ═══════════════════════════════════════ */
  var _offlineBanner = null;

  function showOfflineBanner() {
    if (_offlineBanner) return;
    _offlineBanner = document.createElement('div');
    _offlineBanner.id = 'offline-banner';
    _offlineBanner.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:20000;' +
      'background:rgba(180,83,9,0.95);color:#fbbf24;' +
      'font-family:\'JetBrains Mono\',monospace;font-size:.72rem;' +
      'text-align:center;padding:.4rem 1rem;letter-spacing:.1em;' +
      'border-bottom:1px solid #b45309;';
    _offlineBanner.textContent = '▲ ネットワーク接続が切断されています — インラインデータで動作中';
    document.body.insertBefore(_offlineBanner, document.body.firstChild);
  }

  function hideOfflineBanner() {
    if (_offlineBanner) {
      _offlineBanner.remove();
      _offlineBanner = null;
    }
  }

  window.addEventListener('offline', showOfflineBanner);
  window.addEventListener('online',  hideOfflineBanner);

  // 起動時にオフラインなら即表示
  if (!navigator.onLine) {
    document.addEventListener('DOMContentLoaded', showOfflineBanner);
  }

  /* ═══════════════════════════════════════
   * 6. JSON読み込みユーティリティ（インライン優先）
   * ═══════════════════════════════════════ */

  /**
   * JSON データをインライン(__DATA_*)またはfetchで取得
   * @param {string} inlineKey   - window.__DATA_XXX のキー
   * @param {string} fetchPath   - フォールバック用fetchパス
   * @returns {Promise<object>}
   */
  window.loadDataJSON = function (inlineKey, fetchPath) {
    // インラインデータが存在する場合は即返す（file://対応）
    if (window[inlineKey]) {
      return Promise.resolve(window[inlineKey]);
    }
    // fetchにフォールバック
    return fetchWithRetry(fetchPath)
      .then(function (res) { return res.json(); })
      .catch(function (err) {
        console.error('[loadDataJSON] 読み込み失敗:', fetchPath, err);
        throw err;
      });
  };

  /* ═══════════════════════════════════════
   * 公開API
   * ═══════════════════════════════════════ */
  window.ErrorHandler = {
    showDataError:  window.showDataError,
    showFatalError: window.showFatalError,
    fetchWithRetry: window.fetchWithRetry,
    loadDataJSON:   window.loadDataJSON,
    safeStorage:    window.safeStorage
  };

})();
