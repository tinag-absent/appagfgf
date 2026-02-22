/**
 * 海蝕機関 — ブックマークシステム (bookmark.js)
 * ─────────────────────────────────────────────────────────────────────────
 * 機能:
 *   - 任意のタイプ(mission/entity/module/personnel/location)をブックマーク
 *   - サイドバーのブックマーク件数バッジ
 *   - ブックマーク一覧はsearch.htmlのBookmarkパネルで表示
 *   - XP報酬連携 (bookmark_add)
 * ─────────────────────────────────────────────────────────────────────────
 */
var BookmarkSystem = (function () {
  'use strict';

  var KEY = 'kaishoku_bookmarks';

  var TYPE_META = {
    mission:   { label: '収束案件',   icon: '◈', color: 'hsl(20,100%,55%)' },
    entity:    { label: '海蝕実体',   icon: '▲', color: 'hsl(0,70%,55%)'   },
    module:    { label: 'モジュール', icon: '⬡', color: 'hsl(270,70%,60%)' },
    personnel: { label: '機関員',     icon: '●', color: 'hsl(180,70%,50%)' },
    location:  { label: '拠点/場所',  icon: '◉', color: 'hsl(150,70%,45%)' },
  };

  /* ── ストレージ ──────────────────────────────────── */
  function load() {
    try {
      return safeStorage.getJSON(KEY, []);
    } catch (e) { return []; }
  }

  function save(arr) {
    try {
      safeStorage.setJSON(KEY, arr);
    } catch (e) {
      console.warn('[BookmarkSystem] 保存失敗:', e);
    }
    _syncBadge();
    _dispatchChange();
  }

  function isBookmarked(type, id) {
    return load().some(function (b) { return b._type === type && b.id === id; });
  }

  /* ── 追加/削除 ───────────────────────────────────── */
  function toggle(type, id, name) {
    var bms = load();
    var idx = bms.findIndex(function (b) { return b._type === type && b.id === id; });
    if (idx >= 0) {
      bms.splice(idx, 1);
    } else {
      bms.unshift({
        _type:   type,
        id:      id,
        name:    name,
        savedAt: Date.now()
      });
      // XP報酬
      if (typeof ProgressSystem !== 'undefined' && ProgressSystem.trackActivity) {
        try { ProgressSystem.trackActivity('bookmark_add'); } catch (e) {}
      }
    }
    save(bms);
    _updateAllBtns(type, id);
  }

  function add(type, id, name) {
    if (isBookmarked(type, id)) return;
    var bms = load();
    bms.unshift({ _type: type, id: id, name: name, savedAt: Date.now() });
    save(bms);
    _updateAllBtns(type, id);
  }

  function remove(type, id) {
    var bms = load().filter(function (b) {
      return !(b._type === type && b.id === id);
    });
    save(bms);
    _updateAllBtns(type, id);
  }

  function clear() {
    save([]);
  }

  function getAll() {
    return load();
  }

  function countByType(type) {
    return load().filter(function (b) { return b._type === type; }).length;
  }

  /* ── UIボタン更新 ─────────────────────────────────── */
  function _updateAllBtns(type, id) {
    var saved = isBookmarked(type, id);
    document.querySelectorAll('.detail-bm-btn[data-bm-type="' + type + '"][data-bm-id="' + id + '"]')
      .forEach(function (btn) {
        btn.classList.toggle('saved', saved);
        var star = btn.querySelector('.bm-star-char');
        var lbl  = btn.querySelector('.bm-label');
        if (star) star.textContent = saved ? '★' : '☆';
        if (lbl)  lbl.textContent  = saved ? 'ブックマーク解除' : 'ブックマーク';
        btn.title = saved ? 'ブックマーク解除' : 'ブックマークに追加';
      });
  }

  /* ── ボタン生成 ───────────────────────────────────── */
  function render(type, id, name) {
    if (!_bmBtnStylesInjected) _injectBtnStyles();

    var saved = isBookmarked(type, id);
    var btn = document.createElement('button');
    btn.className = 'detail-bm-btn' + (saved ? ' saved' : '');
    btn.title = saved ? 'ブックマーク解除' : 'ブックマークに追加';
    btn.setAttribute('data-bm-type', type);
    btn.setAttribute('data-bm-id',   id);
    btn.innerHTML =
      '<span class="bm-star-char">' + (saved ? '★' : '☆') + '</span>' +
      '<span class="bm-label">' + (saved ? 'ブックマーク解除' : 'ブックマーク') + '</span>';
    btn.addEventListener('click', function () { toggle(type, id, name); });
    return btn;
  }

  /* ── サイドバーバッジ ─────────────────────────────── */
  function _syncBadge() {
    var badge = document.getElementById('bm-sidebar-badge');
    if (!badge) return;
    var cnt = load().length;
    badge.textContent = cnt;
    badge.style.display = cnt > 0 ? 'inline-flex' : 'none';
  }

  /**
   * サイドバーの「統合データベース検索」リンク横にバッジを追加
   */
  function injectSidebarBadge() {
    if (document.getElementById('bm-sidebar-badge')) {
      _syncBadge();
      return;
    }
    var navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(function (item) {
      var href = item.getAttribute('href') || '';
      if (href.includes('search') || (item.textContent && item.textContent.includes('統合データベース'))) {
        var badge = document.createElement('span');
        badge.id = 'bm-sidebar-badge';
        badge.style.cssText =
          'margin-left:auto;min-width:1.1rem;height:1.1rem;border-radius:999px;' +
          'background:hsl(270,70%,55%);color:#fff;' +
          'font-family:\'JetBrains Mono\',monospace;font-size:.55rem;font-weight:700;' +
          'display:inline-flex;align-items:center;justify-content:center;padding:0 .2rem;';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.appendChild(badge);
        _syncBadge();
      }
    });
  }

  /* ── イベント ─────────────────────────────────────── */
  function _dispatchChange() {
    window.dispatchEvent(new CustomEvent('kaishoku:bookmark:change', {
      detail: { count: load().length }
    }));
  }

  window.addEventListener('kaishoku:bookmark:change', function () {
    _syncBadge();
  });

  /* ── ボタンCSS ────────────────────────────────────── */
  var _bmBtnStylesInjected = false;
  function _injectBtnStyles() {
    if (_bmBtnStylesInjected) return;
    var style = document.createElement('style');
    style.textContent = `
.detail-bm-btn {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  padding: .45rem 1rem;
  background: rgba(0,0,0,.3);
  border: 1px solid rgba(255,255,255,.15);
  color: var(--muted-foreground, #94a3b8);
  font-family: 'JetBrains Mono', monospace;
  font-size: .72rem;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
  transition: all .18s;
  border-radius: 3px;
}
.detail-bm-btn:hover {
  border-color: hsl(270,70%,55%);
  color: hsl(270,70%,75%);
  background: rgba(139,92,246,.1);
}
.detail-bm-btn.saved {
  border-color: hsl(270,70%,55%);
  color: hsl(270,70%,75%);
  background: rgba(139,92,246,.12);
}
.detail-bm-btn .bm-star-char {
  font-size: .9rem;
  line-height: 1;
}
    `;
    document.head.appendChild(style);
    _bmBtnStylesInjected = true;
  }

  /* ── 初期化 ───────────────────────────────────────── */
  function init() {
    _injectBtnStyles();
    // サイドバー描画後にバッジを注入
    var attempts = 0;
    var t = setInterval(function () {
      attempts++;
      injectSidebarBadge();
      if (document.getElementById('bm-sidebar-badge') || attempts > 20) clearInterval(t);
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── 公開API ──────────────────────────────────────── */
  return {
    toggle:        toggle,
    add:           add,
    remove:        remove,
    clear:         clear,
    isBookmarked:  isBookmarked,
    getAll:        getAll,
    countByType:   countByType,
    render:        render,
    TYPE_META:     TYPE_META,
    syncBadge:     _syncBadge,
  };
})();
