/**
 * 海蝕機関 — グローバルエラーハンドリング (error-handler.js)
 * ─────────────────────────────────────────────────────────────────────────
 * 1. window.onerror / unhandledrejection でJSエラーを捕捉してUI通知
 *    ▸ スタックトレースからファイル名・行番号・列番号を抽出して表示
 *    ▸ スクリプトタグ読み込み失敗（404など）もファイル名付きで通知
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
  var _MAX_ERRORS = 10;

  // ── ユーティリティ ──────────────────────────────────

  /** URLからファイル名だけ取り出す  例: "/js/core/router.js?v=1" → "router.js" */
  function basename(url) {
    if (!url) return '(不明)';
    return String(url).replace(/[?#].*$/, '').split('/').pop() || String(url);
  }

  /**
   * Error.stack からフレーム配列を返す
   * 各フレーム: { file, line, col, raw }
   */
  function parseStack(stack) {
    if (!stack) return [];
    return stack.split('\n').reduce(function (acc, raw) {
      raw = raw.trim();
      // Chrome/Edge: "at funcName (file:line:col)" or "at file:line:col"
      var m = raw.match(/\(?(https?:\/\/[^)]+|blob:[^)]+|[^()\s]+):(\d+):(\d+)\)?/);
      if (m) {
        acc.push({ file: basename(m[1]), line: parseInt(m[2], 10), col: parseInt(m[3], 10), raw: raw });
      }
      return acc;
    }, []);
  }

  /**
   * スタックから「機関ファイル」の最初のフレームを返す
   * error-handler.js 自身は除外
   */
  function relevantFrame(frames) {
    return frames.find(function (f) {
      return f.file && f.file !== 'error-handler.js' && !f.file.startsWith('(');
    }) || frames[0] || null;
  }

  /**
   * エラーの位置情報を文字列にフォーマット
   * 例: "router.js:93:12"
   */
  function formatLocation(file, line, col) {
    var loc = basename(file || '');
    if (line) loc += ':' + line;
    if (col)  loc += ':' + col;
    return loc || '(不明)';
  }

  // ── スクリプト/リソース読み込みエラー ──────────────

  window.addEventListener('error', function (e) {
    // <script> / <link> / <img> などのリソース読み込み失敗
    if (e.target && e.target !== window) {
      var tag  = e.target.tagName ? e.target.tagName.toLowerCase() : 'resource';
      var src  = e.target.src || e.target.href || '(不明)';
      var name = basename(src);

      console.error(
        '[海蝕機関 LOAD ERROR] <' + tag + '> の読み込みに失敗:',
        name, '\n  フルパス:', src
      );

      // スクリプト読み込み失敗のみUIに出す（cssや画像は静音）
      if (tag === 'script') {
        _showErrorToast(
          'SCRIPT LOAD ERROR',
          'ファイルが見つかりません: ' + name,
          src
        );
      }
      return; // window.onerror には進まない
    }

    // JS ランタイムエラー
    var frames = e.error ? parseStack(e.error.stack) : [];
    var frame  = relevantFrame(frames);

    var loc = frame
      ? formatLocation(frame.file, frame.line, frame.col)
      : formatLocation(e.filename, e.lineno, e.colno);

    handleJsError(e.message, loc, e.error ? e.error.stack : null);
  }, true); // capture phase でリソースエラーも取れる

  // ── 未処理Promise拒否 ──────────────────────────────

  window.addEventListener('unhandledrejection', function (e) {
    var err = e.reason;
    var msg, loc, stack;

    if (err instanceof Error) {
      msg   = err.message;
      stack = err.stack;
      var frames = parseStack(stack);
      var frame  = relevantFrame(frames);
      loc = frame ? formatLocation(frame.file, frame.line, frame.col) : '非同期処理';
    } else {
      msg   = String(err || '非同期処理エラー');
      loc   = '非同期処理';
      stack = null;
    }

    handleJsError(msg, loc, stack);
    e.preventDefault();
  });

  // ── 共通エラー処理 ──────────────────────────────────

  function handleJsError(msg, loc, stack) {
    _errorCount++;
    if (_errorCount > _MAX_ERRORS) return;

    var logParts = ['[海蝕機関 SYSTEM ERROR]', msg || '(メッセージなし)'];
    if (loc)   logParts.push('@ ' + loc);
    if (stack) logParts.push('\nStack:\n' + stack);
    console.error.apply(console, logParts);

    _showErrorToast('SYSTEM ERROR', msg, loc, stack);
  }

  // ── エラートースト UI ───────────────────────────────

  var _toastContainer = null;

  function _getToastContainer() {
    if (_toastContainer && document.body.contains(_toastContainer)) return _toastContainer;
    _toastContainer = document.createElement('div');
    _toastContainer.id = 'eh-toast-container';
    _toastContainer.style.cssText =
      'position:fixed;bottom:1.5rem;right:1.5rem;z-index:99999;' +
      'display:flex;flex-direction:column;gap:.6rem;' +
      'max-width:420px;pointer-events:none;';
    document.body.appendChild(_toastContainer);
    return _toastContainer;
  }

  /**
   * エラートーストを画面右下に表示する
   * @param {string} label   - 種別ラベル（大文字）
   * @param {string} msg     - エラーメッセージ
   * @param {string} [loc]   - ファイル名:行番号 or URL
   * @param {string} [stack] - スタックトレース全文（展開ボタン用）
   */
  function _showErrorToast(label, msg, loc, stack) {
    // DOMがまだ無ければキュー
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', function () {
        _showErrorToast(label, msg, loc, stack);
      });
      return;
    }

    // NotificationSystem が使えるならそちらに委譲
    if (typeof NotificationSystem !== 'undefined' && !stack) {
      var short = (loc ? '[' + basename(loc) + '] ' : '') + (msg || '').slice(0, 80);
      NotificationSystem.notifySystem('[SYSTEM] ' + short, 'warn');
      return;
    }

    var container = _getToastContainer();
    var id = 'eh-toast-' + Date.now();

    // スタックトレースの整形（先頭5フレーム）
    var stackHtml = '';
    if (stack) {
      var frames = parseStack(stack).slice(0, 5);
      if (frames.length) {
        var rows = frames.map(function (f) {
          return '<div style="padding:.15rem 0;border-bottom:1px solid rgba(255,255,255,.05);">' +
            '<span style="color:rgba(0,255,255,.7);">' + f.file + '</span>' +
            '<span style="color:rgba(255,255,255,.35);">:' + f.line + ':' + f.col + '</span>' +
          '</div>';
        }).join('');
        stackHtml =
          '<div id="' + id + '-stack" style="display:none;margin-top:.6rem;' +
          'background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.08);' +
          'padding:.6rem .75rem;font-size:.65rem;line-height:1.6;max-height:140px;overflow-y:auto;">' +
          rows + '</div>' +
          '<button onclick="var s=document.getElementById(\'' + id + '-stack\');' +
          's.style.display=s.style.display===\'none\'?\'block\':\'none\'" ' +
          'style="margin-top:.4rem;background:none;border:none;' +
          'color:rgba(0,255,255,.55);font-family:\'JetBrains Mono\',monospace;' +
          'font-size:.6rem;cursor:pointer;padding:0;pointer-events:auto;">' +
          '▶ スタックトレースを展開</button>';
      }
    }

    // ファイル名の強調表示
    var locHtml = '';
    if (loc) {
      var parts    = String(loc).split(':');
      var fileName = parts[0];
      var lineCol  = parts.slice(1).join(':');
      locHtml =
        '<div style="margin-top:.4rem;font-size:.68rem;">' +
        '<span style="color:rgba(255,255,255,.4);">発生箇所: </span>' +
        '<span style="color:#fbbf24;font-weight:700;">' + fileName + '</span>' +
        (lineCol ? '<span style="color:rgba(255,255,255,.4);">:' + lineCol + '</span>' : '') +
        '</div>';
    }

    var toast = document.createElement('div');
    toast.id  = id;
    toast.style.cssText =
      'background:rgba(15,10,10,.96);border:1px solid rgba(239,68,68,.5);' +
      'border-left:3px solid #ef4444;' +
      'padding:.75rem 1rem;font-family:\'JetBrains Mono\',monospace;' +
      'box-shadow:0 4px 20px rgba(0,0,0,.6);pointer-events:auto;' +
      'animation:eh-slidein .2s ease;';

    toast.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;">' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:.58rem;letter-spacing:.18em;color:#ef4444;margin-bottom:.3rem;">' +
            '⚠ ' + label +
          '</div>' +
          '<div style="font-size:.72rem;color:rgba(255,255,255,.85);word-break:break-word;line-height:1.5;">' +
            (msg || '').slice(0, 120) +
          '</div>' +
          locHtml +
          stackHtml +
        '</div>' +
        '<button onclick="document.getElementById(\'' + id + '\').remove()" ' +
        'style="background:none;border:none;color:rgba(255,255,255,.3);' +
        'cursor:pointer;font-size:.9rem;padding:0;flex-shrink:0;pointer-events:auto;' +
        'font-family:\'JetBrains Mono\',monospace;">✕</button>' +
      '</div>';

    container.appendChild(toast);

    // 10秒後に自動消去
    setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 10000);
  }

  // アニメーション定義（1回だけ注入）
  if (!document.getElementById('eh-style')) {
    var style = document.createElement('style');
    style.id  = 'eh-style';
    style.textContent =
      '@keyframes eh-slidein{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}';
    document.head.appendChild(style);
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
   * 7. HTML エスケープユーティリティ
   *    innerHTML にデータを挿入する全ページスクリプトで使用
   * ═══════════════════════════════════════ */
  window.escapeHtml = function(text) {
    if (text == null) return '';
    var d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
  };
  /* ═══════════════════════════════════════
   * 公開API
   * ═══════════════════════════════════════ */

  // router.js など外部から呼べるようにグローバル公開
  window._showErrorToast = _showErrorToast;

  window.ErrorHandler = {
    showDataError:   window.showDataError,
    showFatalError:  window.showFatalError,
    fetchWithRetry:  window.fetchWithRetry,
    loadDataJSON:    window.loadDataJSON,
    safeStorage:     window.safeStorage,
    showErrorToast:  _showErrorToast,
    escapeHtml:      window.escapeHtml
  };

})();
