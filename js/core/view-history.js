// ── View History System ───────────────────────────────────────────────────
var ViewHistory = (function() {
  var KEY     = 'kaishoku_view_history';
  var MAX     = 200;

  var TYPE_META = {
    mission:   { label: '収束案件',   color: 'var(--destructive)',    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', href: 'details/mission-detail.html' },
    entity:    { label: '海蝕実体',   color: 'rgb(139,92,246)',        icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', href: 'details/entity-detail.html' },
    module:    { label: 'モジュール', color: 'var(--primary)',         icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', href: 'details/module-detail.html' },
    location:  { label: '場所',       color: 'rgb(16,185,129)',        icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', href: 'details/location-detail.html' },
    personnel: { label: '人員',        color: 'rgb(245,158,11)',        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', href: 'details/personnel-detail.html' }
  };

  function load() {
    try { return safeStorage.getJSON(KEY, []); } catch(e) { return []; }
  }

  function record(type, id, name) {
    if (!type || !id || !name) return;
    var hist = load();
    // 同じエントリが最近にあれば削除（重複排除）
    hist = hist.filter(function(h) { return !(h.type === type && h.id === id); });
    hist.unshift({ type: type, id: id, name: name, at: Date.now() });
    if (hist.length > MAX) hist = hist.slice(0, MAX);
    safeStorage.setJSON(KEY, hist);
    // ── ストーリーエンジン: 閲覧履歴更新を通知 ──
    if (window.StoryEngine) { StoryEngine.onViewHistory(); }
  }

  function clear() { safeStorage.remove(KEY); }

  function getTypeMeta(type) { return TYPE_META[type] || { label: type, color: 'var(--muted-foreground)', icon: '', href: '#' }; }

  return { record: record, load: load, clear: clear, getTypeMeta: getTypeMeta };
})();
