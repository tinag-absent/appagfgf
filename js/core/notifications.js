/**
 * 海蝕機関 — 統合通知システム (notifications.js)
 * ─────────────────────────────────────────────────────────────────────────
 * 役割:
 *   1. ゲームプレイ通知（XP獲得・レベルアップ・デイリーログイン報酬・
 *      未読チャット・任務状況更新）をリッチなトースト／バナーで表示
 *   2. story-engine の低レベル showNotification() をラップして
 *      ARGシステムメッセージを同一のビジュアルスタイルで表示
 *   3. サイドバーのベルアイコンにバッジを付け、通知センター（ドロワー）
 *      から過去の通知を確認できるようにする
 *
 * 依存: story-engine.js より後に読み込むこと
 * ─────────────────────────────────────────────────────────────────────────
 */

var NotificationSystem = (function () {
  'use strict';

  /* ═══════════════════════════════════════════
   * 定数
   * ═══════════════════════════════════════════ */
  var STORAGE_KEY   = 'kaishoku_notifications';
  var MAX_STORED    = 50;   // ストレージに保持する最大件数
  var TOAST_DURATION = 6000; // ms

  /* ═══════════════════════════════════════════
   * 通知タイプ定義
   * ═══════════════════════════════════════════ */
  var TYPES = {
    // ── ゲームプレイ ──────────────────────────
    xp:       { label: 'EXP獲得',     icon: '⬡', colorClass: 'nt-xp'       },
    levelup:  { label: 'レベルアップ', icon: '▲', colorClass: 'nt-levelup'  },
    login:    { label: 'ログイン報酬', icon: '◈', colorClass: 'nt-login'    },
    unlock:   { label: '機能解放',     icon: '◉', colorClass: 'nt-unlock'   },
    chat:     { label: '新着通信',     icon: '⬡', colorClass: 'nt-chat'     },
    mission:  { label: '任務更新',     icon: '◈', colorClass: 'nt-mission'  },
    // ── ARGシステムメッセージ ─────────────────
    info:     { label: 'SYSTEM',      icon: '●', colorClass: 'nt-info'      },
    warn:     { label: 'ALERT',       icon: '▲', colorClass: 'nt-warn'      },
    error:    { label: 'CRITICAL',    icon: '■', colorClass: 'nt-error'     },
  };

  /* ═══════════════════════════════════════════
   * ストレージ
   * ═══════════════════════════════════════════ */
  function loadHistory() {
    try {
      return safeStorage.getJSON(STORAGE_KEY, []);
    } catch (e) { return []; }
  }

  function saveHistory(list) {
    try {
      safeStorage.setJSON(STORAGE_KEY, list.slice(-MAX_STORED));
    } catch (e) {}
  }

  function pushToHistory(n) {
    var list = loadHistory();
    list.push(n);
    saveHistory(list);
    updateBadge();
  }

  function markAllRead() {
    var list = loadHistory().map(function (n) {
      n.read = true; return n;
    });
    saveHistory(list);
    updateBadge();
  }

  function unreadCount() {
    return loadHistory().filter(function (n) { return !n.read; }).length;
  }

  /* ═══════════════════════════════════════════
   * CSS インジェクション
   * ═══════════════════════════════════════════ */
  function injectStyles() {
    if (document.getElementById('nt-styles')) return;
    var style = document.createElement('style');
    style.id = 'nt-styles';
    style.textContent = `
/* ── Toast container ───────────────────────────────── */
#nt-toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9998;
  display: flex;
  flex-direction: column-reverse;
  gap: 0.5rem;
  pointer-events: none;
  max-width: 340px;
  width: calc(100vw - 3rem);
}

/* ── Toast base ─────────────────────────────────────── */
.nt-toast {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.65rem 0.9rem;
  border-radius: 4px;
  border-left: 3px solid;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  line-height: 1.45;
  pointer-events: all;
  cursor: pointer;
  backdrop-filter: blur(8px);
  opacity: 0;
  transform: translateX(16px);
  transition: opacity 0.25s ease, transform 0.25s ease;
  position: relative;
  overflow: hidden;
}
.nt-toast.nt-visible {
  opacity: 1;
  transform: translateX(0);
}
.nt-toast.nt-hiding {
  opacity: 0;
  transform: translateX(20px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

/* Progress bar */
.nt-toast::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 100%;
  transform-origin: left;
  animation: nt-progress var(--nt-duration, 6s) linear forwards;
}
@keyframes nt-progress {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}

.nt-toast-icon {
  font-size: 0.8rem;
  flex-shrink: 0;
  margin-top: 0.05rem;
}
.nt-toast-body { flex: 1; min-width: 0; }
.nt-toast-label {
  font-size: 0.58rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.65;
  margin-bottom: 0.15rem;
}
.nt-toast-msg {
  word-break: break-word;
}
.nt-toast-close {
  flex-shrink: 0;
  opacity: 0.4;
  font-size: 0.75rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.1rem;
  transition: opacity 0.15s;
}
.nt-toast-close:hover { opacity: 1; }

/* ── Color variants ─────────────────────────────────── */
.nt-xp {
  background: rgba(17, 24, 39, 0.94);
  border-color: hsl(180, 70%, 45%);
  color: hsl(180, 70%, 75%);
}
.nt-xp::after { background: hsl(180, 70%, 45%); }

.nt-levelup {
  background: rgba(10, 20, 35, 0.97);
  border-color: hsl(45, 100%, 55%);
  color: hsl(45, 100%, 78%);
  box-shadow: 0 0 16px rgba(250, 200, 50, 0.2);
}
.nt-levelup::after { background: hsl(45, 100%, 55%); }

.nt-login {
  background: rgba(15, 20, 35, 0.95);
  border-color: hsl(270, 70%, 60%);
  color: hsl(270, 70%, 80%);
}
.nt-login::after { background: hsl(270, 70%, 60%); }

.nt-unlock {
  background: rgba(10, 25, 20, 0.96);
  border-color: hsl(150, 70%, 40%);
  color: hsl(150, 70%, 70%);
  box-shadow: 0 0 12px rgba(50, 200, 120, 0.15);
}
.nt-unlock::after { background: hsl(150, 70%, 40%); }

.nt-chat {
  background: rgba(15, 22, 38, 0.95);
  border-color: hsl(200, 80%, 50%);
  color: hsl(200, 80%, 75%);
}
.nt-chat::after { background: hsl(200, 80%, 50%); }

.nt-mission {
  background: rgba(25, 15, 10, 0.96);
  border-color: hsl(20, 100%, 55%);
  color: hsl(20, 100%, 75%);
}
.nt-mission::after { background: hsl(20, 100%, 55%); }

.nt-info {
  background: rgba(15, 20, 30, 0.95);
  border-color: #334155;
  color: #94a3b8;
}
.nt-info::after { background: #334155; }

.nt-warn {
  background: rgba(30, 20, 5, 0.97);
  border-color: #b45309;
  color: #fbbf24;
}
.nt-warn::after { background: #b45309; }

.nt-error {
  background: rgba(30, 5, 5, 0.98);
  border-color: #991b1b;
  color: #f87171;
  box-shadow: 0 0 12px rgba(220, 38, 38, 0.2);
}
.nt-error::after { background: #991b1b; }

/* ── Bell button ────────────────────────────────────── */
#nt-bell-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  cursor: pointer;
  color: var(--muted-foreground, #64748b);
  transition: color 0.2s, background 0.2s;
  flex-shrink: 0;
}
#nt-bell-btn:hover { 
  color: var(--primary, hsl(180, 70%, 50%));
  background: rgba(255,255,255,0.05);
}
#nt-bell-badge {
  position: absolute;
  top: 0.1rem;
  right: 0.1rem;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: hsl(0, 80%, 55%);
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  line-height: 1;
  animation: nt-badge-pulse 2s infinite;
}
@keyframes nt-badge-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
  50%       { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
}

/* ── Notification drawer ────────────────────────────── */
#nt-drawer {
  position: fixed;
  top: 0;
  right: -360px;
  width: 360px;
  height: 100vh;
  background: hsl(220, 30%, 6%);
  border-left: 1px solid hsl(215, 30%, 18%);
  z-index: 10001;
  display: flex;
  flex-direction: column;
  transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'JetBrains Mono', monospace;
}
#nt-drawer.nt-open { right: 0; }

#nt-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 10000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
  backdrop-filter: blur(2px);
}
#nt-drawer-overlay.nt-open {
  opacity: 1;
  pointer-events: all;
}

.nt-drawer-header {
  padding: 1.1rem 1.25rem 1rem;
  border-bottom: 1px solid hsl(215, 30%, 15%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.nt-drawer-title {
  font-size: 0.65rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--primary, hsl(180, 70%, 50%));
}
.nt-drawer-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.nt-drawer-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.58rem;
  color: hsl(215, 20%, 50%);
  background: none;
  border: none;
  cursor: pointer;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.2rem 0.4rem;
  border-radius: 2px;
  transition: color 0.15s, background 0.15s;
}
.nt-drawer-btn:hover {
  color: hsl(215, 20%, 80%);
  background: rgba(255,255,255,0.05);
}

.nt-drawer-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}
.nt-drawer-list::-webkit-scrollbar { width: 4px; }
.nt-drawer-list::-webkit-scrollbar-track { background: transparent; }
.nt-drawer-list::-webkit-scrollbar-thumb { background: hsl(215, 30%, 22%); border-radius: 2px; }

.nt-drawer-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: hsl(215, 20%, 35%);
  font-size: 0.65rem;
  letter-spacing: 0.12em;
}

.nt-drawer-item {
  display: flex;
  gap: 0.65rem;
  padding: 0.7rem 0.75rem;
  border-radius: 3px;
  margin-bottom: 0.2rem;
  border-left: 2px solid transparent;
  transition: background 0.15s;
}
.nt-drawer-item:hover { background: rgba(255,255,255,0.03); }
.nt-drawer-item.nt-unread { background: rgba(255,255,255,0.025); }

.nt-drawer-item-icon {
  font-size: 0.75rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
  opacity: 0.75;
}
.nt-drawer-item-body { flex: 1; min-width: 0; }
.nt-drawer-item-label {
  font-size: 0.55rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.5;
  margin-bottom: 0.1rem;
}
.nt-drawer-item-msg {
  font-size: 0.67rem;
  line-height: 1.5;
  color: hsl(210, 20%, 82%);
  word-break: break-word;
}
.nt-drawer-item-time {
  font-size: 0.55rem;
  color: hsl(215, 20%, 38%);
  margin-top: 0.2rem;
}
.nt-drawer-item.nt-unread .nt-drawer-item-msg { color: hsl(210, 20%, 92%); }
.nt-unread-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: hsl(180, 70%, 50%);
  flex-shrink: 0;
  margin-top: 0.4rem;
}

/* Color borders on drawer items */
.nt-drawer-item.nt-xp      { border-color: hsl(180, 70%, 45%); }
.nt-drawer-item.nt-levelup { border-color: hsl(45, 100%, 55%); }
.nt-drawer-item.nt-login   { border-color: hsl(270, 70%, 60%); }
.nt-drawer-item.nt-unlock  { border-color: hsl(150, 70%, 40%); }
.nt-drawer-item.nt-chat    { border-color: hsl(200, 80%, 50%); }
.nt-drawer-item.nt-mission { border-color: hsl(20, 100%, 55%); }
.nt-drawer-item.nt-warn    { border-color: #b45309; }
.nt-drawer-item.nt-error   { border-color: #991b1b; }
.nt-drawer-item.nt-info    { border-color: #334155; }

/* ── Responsive ─────────────────────────────────────── */
@media (max-width: 640px) {
  #nt-toast-container {
    bottom: 1rem;
    right: 0.75rem;
    left: 0.75rem;
    max-width: 100%;
    width: auto;
  }
  #nt-drawer { width: 100%; right: -100%; }
}
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════
   * DOM 構築
   * ═══════════════════════════════════════════ */
  function buildDOM() {
    // Toast container
    if (!document.getElementById('nt-toast-container')) {
      var tc = document.createElement('div');
      tc.id = 'nt-toast-container';
      document.body.appendChild(tc);
    }

    // Drawer overlay
    if (!document.getElementById('nt-drawer-overlay')) {
      var ov = document.createElement('div');
      ov.id = 'nt-drawer-overlay';
      ov.addEventListener('click', closeDrawer);
      document.body.appendChild(ov);
    }

    // Drawer
    if (!document.getElementById('nt-drawer')) {
      var dr = document.createElement('div');
      dr.id = 'nt-drawer';
      dr.innerHTML = `
        <div class="nt-drawer-header">
          <span class="nt-drawer-title">◈ 通知センター</span>
          <div class="nt-drawer-actions">
            <button class="nt-drawer-btn" id="nt-markall-btn">全て既読</button>
            <button class="nt-drawer-btn" id="nt-clear-btn">消去</button>
            <button class="nt-drawer-btn" id="nt-close-drawer-btn">✕</button>
          </div>
        </div>
        <div class="nt-drawer-list" id="nt-drawer-list"></div>
      `;
      document.body.appendChild(dr);

      document.getElementById('nt-markall-btn').addEventListener('click', function () {
        markAllRead();
        renderDrawer();
      });
      document.getElementById('nt-clear-btn').addEventListener('click', function () {
        saveHistory([]);
        renderDrawer();
        updateBadge();
      });
      document.getElementById('nt-close-drawer-btn').addEventListener('click', closeDrawer);
    }
  }

  /* ═══════════════════════════════════════════
   * ベルボタン — サイドバーのフッターに注入
   * ═══════════════════════════════════════════ */
  function injectBellButton() {
    if (document.getElementById('nt-bell-btn')) return;

    // サイドバーフッターのステータスパネルの直後に挿入
    var footer = document.querySelector('.sidebar-footer .status-panel');
    if (!footer) return;

    var btn = document.createElement('div');
    btn.id = 'nt-bell-btn';
    btn.title = '通知センターを開く';
    btn.innerHTML = `
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"
           viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
      <span id="nt-bell-badge" style="display:none"></span>
    `;
    btn.addEventListener('click', openDrawer);

    // "通知" ラベル行として挿入
    var row = document.createElement('div');
    row.className = 'status-row';
    row.style.cssText = 'justify-content:space-between;align-items:center;';
    row.innerHTML = '<span class="status-label">通知:</span>';
    row.appendChild(btn);

    footer.appendChild(row);
    updateBadge();
  }

  /* ═══════════════════════════════════════════
   * バッジ更新
   * ═══════════════════════════════════════════ */
  function updateBadge() {
    var badge = document.getElementById('nt-bell-badge');
    if (!badge) return;
    var cnt = unreadCount();
    if (cnt > 0) {
      badge.style.display = 'flex';
      badge.textContent = cnt > 9 ? '9+' : String(cnt);
    } else {
      badge.style.display = 'none';
    }
  }

  /* ═══════════════════════════════════════════
   * ドロワー開閉
   * ═══════════════════════════════════════════ */
  function openDrawer() {
    buildDOM();
    renderDrawer();
    document.getElementById('nt-drawer').classList.add('nt-open');
    document.getElementById('nt-drawer-overlay').classList.add('nt-open');
  }

  function closeDrawer() {
    var dr = document.getElementById('nt-drawer');
    var ov = document.getElementById('nt-drawer-overlay');
    if (dr) dr.classList.remove('nt-open');
    if (ov) ov.classList.remove('nt-open');
  }

  /* ═══════════════════════════════════════════
   * ドロワー描画
   * ═══════════════════════════════════════════ */
  function renderDrawer() {
    var list = document.getElementById('nt-drawer-list');
    if (!list) return;

    var history = loadHistory().slice().reverse(); // 新着順
    if (history.length === 0) {
      list.innerHTML = '<div class="nt-drawer-empty">通知はありません</div>';
      return;
    }

    list.innerHTML = history.map(function (n) {
      var type = TYPES[n.type] || TYPES.info;
      var timeStr = formatRelativeTime(n.timestamp);
      var unreadClass = n.read ? '' : 'nt-unread';
      return `
        <div class="nt-drawer-item ${type.colorClass} ${unreadClass}">
          ${!n.read ? '<div class="nt-unread-dot"></div>' : ''}
          <div class="nt-drawer-item-icon">${type.icon}</div>
          <div class="nt-drawer-item-body">
            <div class="nt-drawer-item-label">${type.label}</div>
            <div class="nt-drawer-item-msg">${escapeHtml(n.message)}</div>
            <div class="nt-drawer-item-time">${timeStr}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ═══════════════════════════════════════════
   * Toast 表示
   * ═══════════════════════════════════════════ */
  function show(message, type, options) {
    options = options || {};
    var duration = options.duration || TOAST_DURATION;
    var def = TYPES[type] || TYPES.info;

    // ストレージに積む
    var record = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type: type,
      message: message,
      timestamp: Date.now(),
      read: false
    };
    pushToHistory(record);

    // DOM
    buildDOM();
    var container = document.getElementById('nt-toast-container');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'nt-toast ' + def.colorClass;
    toast.style.setProperty('--nt-duration', (duration / 1000) + 's');
    toast.innerHTML = `
      <div class="nt-toast-icon">${def.icon}</div>
      <div class="nt-toast-body">
        <div class="nt-toast-label">${def.label}</div>
        <div class="nt-toast-msg">${escapeHtml(message)}</div>
      </div>
      <div class="nt-toast-close" title="閉じる">✕</div>
    `;

    // クリックで通知センターを開く
    toast.addEventListener('click', function (e) {
      if (!e.target.classList.contains('nt-toast-close')) {
        openDrawer();
      }
    });

    toast.querySelector('.nt-toast-close').addEventListener('click', function (e) {
      e.stopPropagation();
      dismissToast(toast);
    });

    container.appendChild(toast);

    // Animate in (次フレームで)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        toast.classList.add('nt-visible');
      });
    });

    // Auto-dismiss
    var timer = setTimeout(function () { dismissToast(toast); }, duration);
    toast._timer = timer;

    // スタック上限 (5枚)
    var toasts = container.querySelectorAll('.nt-toast');
    if (toasts.length > 5) {
      dismissToast(toasts[0]);
    }
  }

  function dismissToast(el) {
    if (!el || !el.parentNode) return;
    clearTimeout(el._timer);
    el.classList.remove('nt-visible');
    el.classList.add('nt-hiding');
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 350);
  }

  /* ═══════════════════════════════════════════
   * 便利メソッド（各シチュエーション用）
   * ═══════════════════════════════════════════ */

  /** XP獲得 */
  function notifyXP(amount, reason) {
    var msg = '+' + amount + ' EXP';
    if (reason) msg += ' — ' + reason;
    show(msg, 'xp', { duration: 3500 });
  }

  /** レベルアップ */
  function notifyLevelUp(newLevel, title) {
    var msg = 'LEVEL ' + newLevel + ' に昇格';
    if (title) msg += '\n称号: ' + title;
    show(msg, 'levelup', { duration: 8000 });
  }

  /** デイリーログイン報酬 */
  function notifyLoginReward(streak, xp) {
    show(
      '連続ログイン ' + streak + '日目 — ' + xp + ' EXP を獲得',
      'login',
      { duration: 6000 }
    );
  }

  /** 機能解放 */
  function notifyUnlock(pageLabel) {
    show('機能解放: ' + pageLabel, 'unlock', { duration: 7000 });
  }

  /** 未読チャット */
  function notifyChat(senderName, preview) {
    var msg = senderName + ' からの通信';
    if (preview) msg += '\n「' + preview.slice(0, 40) + (preview.length > 40 ? '…」' : '」');
    show(msg, 'chat', { duration: 5000 });
  }

  /** 任務状況更新 */
  function notifyMission(missionId, statusLabel) {
    show('任務更新 [' + missionId + ']\n状態: ' + statusLabel, 'mission', { duration: 6000 });
  }

  /** ARG: story-engine からの system/warn/error */
  function notifySystem(message, level) {
    // level: 'info' | 'warn' | 'error'
    var type = level || 'info';
    show(message, type, { duration: 7000 });
  }

  /* ═══════════════════════════════════════════
   * story-engine の showNotification をインターセプト
   * ═══════════════════════════════════════════ */
  function hookStoryEngine() {
    // story-engine.js が module 外で showNotification を公開していないため
    // window イベント経由でフックする
    window.addEventListener('kaishoku:story:notify', function (e) {
      if (e.detail) {
        notifySystem(e.detail.message, e.detail.level);
      }
    });
  }

  /* ═══════════════════════════════════════════
   * progress.js / daily-login.js イベントの受信
   * ═══════════════════════════════════════════ */
  function hookProgressSystem() {
    // userProgressUpdated: progress.js が dispatch するイベント
    window.addEventListener('userProgressUpdated', function (e) {
      var d = e.detail;
      if (!d) return;

      if (d.leveledUp) {
        var title = '';
        if (typeof LevelMessages !== 'undefined') {
          var ri = LevelMessages.getRankTitle(d.newLevel);
          title = ri ? ri.title : '';
        }
        notifyLevelUp(d.newLevel, title);
      } else if (d.xpGained && d.xpGained > 0) {
        var reason = d.activity ? activityLabel(d.activity) : '';
        notifyXP(d.xpGained, reason);
      }
    });

    // デイリーログイン報酬（daily-login.js が dispatch）
    window.addEventListener('kaishoku:dailylogin', function (e) {
      var d = e.detail;
      if (!d) return;
      notifyLoginReward(d.streak || 1, d.xp || 0);
    });

    // 機能解放
    window.addEventListener('kaishoku:unlock', function (e) {
      var d = e.detail;
      if (!d) return;
      notifyUnlock(d.label || d.page || '新機能');
    });

    // 未読チャット
    window.addEventListener('kaishoku:chat:unread', function (e) {
      var d = e.detail;
      if (!d) return;
      notifyChat(d.senderName || '不明の機関員', d.preview || '');
    });

    // 任務更新
    window.addEventListener('kaishoku:mission:update', function (e) {
      var d = e.detail;
      if (!d) return;
      notifyMission(d.id || '???', d.status || '更新');
    });
  }

  /* ═══════════════════════════════════════════
   * ユーティリティ
   * ═══════════════════════════════════════════ */
  function activityLabel(activity) {
    var map = {
      first_login:    '初回ログイン',
      profile_view:   'プロフィール閲覧',
      chat_message:   'チャット送信',
      division_view:  '部門情報閲覧',
      phenomenon_view:'現象アーカイブ閲覧',
      mission_complete:'任務完了',
      daily_login:    'デイリーログイン'
    };
    return map[activity] || activity;
  }

  function formatRelativeTime(timestamp) {
    var diff = Date.now() - timestamp;
    var s = Math.floor(diff / 1000);
    if (s < 60)  return s + '秒前';
    var m = Math.floor(s / 60);
    if (m < 60)  return m + '分前';
    var h = Math.floor(m / 60);
    if (h < 24)  return h + '時間前';
    return Math.floor(h / 24) + '日前';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  /* ═══════════════════════════════════════════
   * 自動タスク — ミッション状況の定期チェック
   * （mission-data.json の status が変わったタイミングで通知）
   * ═══════════════════════════════════════════ */
  var _missionStatusCache = {};

  function startMissionWatcher() {
    // MissionData が存在する場合のみ
    if (typeof window.MissionData === 'undefined' && !window.__DATA_MISSION_DATA) return;

    function check() {
      var missions = [];
      if (window.__DATA_MISSION_DATA && window.__DATA_MISSION_DATA.missions) {
        missions = window.__DATA_MISSION_DATA.missions;
      }
      missions.forEach(function (m) {
        var prev = _missionStatusCache[m.id];
        if (prev !== undefined && prev !== m.status) {
          var labelMap = {
            active:     '対応中',
            monitoring: '監視中',
            completed:  '収束完了',
            critical:   '緊急対応中'
          };
          notifyMission(m.id, labelMap[m.status] || m.status);
        }
        _missionStatusCache[m.id] = m.status;
      });
    }

    // 初回キャッシュ
    check();
    // 以降は外部からステータス変更があった時のみ通知したいので
    // window イベントに委ねる（自動ポーリングは行わない）
  }

  /* ═══════════════════════════════════════════
   * 初期化
   * ═══════════════════════════════════════════ */
  function init() {
    injectStyles();
    buildDOM();
    hookStoryEngine();
    hookProgressSystem();
    startMissionWatcher();

    // サイドバー描画後にベルボタンを注入
    // (SidebarComponent が DOMContentLoaded で動くため少し待つ)
    var attempts = 0;
    var tryInject = setInterval(function () {
      attempts++;
      injectBellButton();
      if (document.getElementById('nt-bell-btn') || attempts > 20) {
        clearInterval(tryInject);
      }
    }, 150);

    // ESC でドロワーを閉じる
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  /* ═══════════════════════════════════════════
   * Public API
   * ═══════════════════════════════════════════ */
  return {
    init:           init,
    show:           show,
    notifyXP:       notifyXP,
    notifyLevelUp:  notifyLevelUp,
    notifyLoginReward: notifyLoginReward,
    notifyUnlock:   notifyUnlock,
    notifyChat:     notifyChat,
    notifyMission:  notifyMission,
    notifySystem:   notifySystem,
    openDrawer:     openDrawer,
    closeDrawer:    closeDrawer,
    unreadCount:    unreadCount,
    markAllRead:    markAllRead,
  };

})();

// DOMContentLoaded または即時起動
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', NotificationSystem.init);
} else {
  NotificationSystem.init();
}
