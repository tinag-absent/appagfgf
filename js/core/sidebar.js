/**
 * Sidebar Component
 * すべてのページで共通のサイドバーを表示
 * レスポンシブ対応
 */

class SidebarComponent {
  constructor() {
    this.currentPage = this.getCurrentPage();
    this.basePath = this.getBasePath();
    this.isMobile = this.checkMobile();
    this.isOpen = false;
    
    // Bind methods
    this.toggleMenu = this.toggleMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleOverlayClick = this.handleOverlayClick.bind(this);
    this.handleNavClick = this.handleNavClick.bind(this);
  }

  /**
   * 現在のページを取得 - SPA mode: from hash
   */
  getCurrentPage() {
    // SPA: extract page from hash (e.g. #/divisions -> divisions.html)
    const hash = window.location.hash || '#/';
    const path = hash.slice(1).split('?')[0] || '/';
    if (path === '/' || path === '/index' || path === '') return 'index.html';
    const key = path.slice(1); // remove leading /
    // Map to .html equivalents for backward compat with isActive()
    const divisionMap = {
      'division-foreign': 'divisions.html',
      'division-support': 'divisions.html',
      'division-convergence': 'divisions.html',
      'division-port': 'divisions.html',
      'division-engineering': 'divisions.html',
    };
    if (divisionMap[key]) return divisionMap[key];
    return key + '.html';
  }

  /**
   * ベースパスを取得 - SPA mode: always root
   */
  getBasePath() {
    return './';
  }

  /**
   * モバイルかどうかチェック
   */
  checkMobile() {
    return window.innerWidth <= 768;
  }

  /**
   * ナビゲーションアイテムがアクティブかどうか判定 - SPA mode
   */
  isActive(page) {
    return this.currentPage === page;
  }
  
  /**
   * SPA: Update active nav after navigation
   */
  updateActiveNav(pageKey) {
    this.currentPage = this.getCurrentPage();
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    // Re-apply active based on current hash
    const cur = this.currentPage;
    document.querySelectorAll('.nav-item').forEach(item => {
      const href = item.getAttribute('href') || '';
      // href is now like #/divisions
      const hrefPage = (href.slice(2) || 'index') + '.html';
      if (cur === hrefPage) item.classList.add('active');
    });
  }

  /**
   * サイドバーのHTMLを生成
   */
  render() {
    const base = this.basePath;
    
    return `
      <div class="sidebar-header">
        <img src="${base}images/logo.png" alt="Logo" class="sidebar-logo">
        <div>
          <div class="sidebar-title">海蝕機関</div>
          <div class="sidebar-subtitle">KAISHOKU AGENCY</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <a href="#/" class="nav-item ${this.isActive('index.html') ? 'active' : ''}" data-page="index">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <span>ステータス・ダッシュボード</span>
        </a>
        <a href="#/divisions" class="nav-item ${this.isActive('divisions.html') ? 'active' : ''}" data-page="divisions">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>各部門情報</span>
        </a>
        <a href="#/search" class="nav-item ${this.isActive('search.html') ? 'active' : ''}" data-page="search">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <span>統合データベース検索</span>
        </a>
        <a href="#/history" class="nav-item ${this.isActive('history.html') ? 'active' : ''}" data-page="history">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>アクセス履歴</span>
        </a>
        <a href="#/map" class="nav-item ${this.isActive('map.html') ? 'active' : ''}" data-page="map">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
          </svg>
          <span>海蝕現象マップ</span>
        </a>
        <a href="#/phenomenon" class="nav-item ${this.isActive('phenomenon.html') ? 'active' : ''}" data-page="phenomenon">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
          </svg>
          <span>アーカイブ：海蝕現象</span>
        </a>
        <a href="#/chat" class="nav-item ${this.isActive('chat.html') ? 'active' : ''}" data-page="chat">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <span>機関員チャット</span>
        </a>
        <a href="#/dashboard" class="nav-item ${this.isActive('dashboard.html') ? 'active' : ''}" data-page="dashboard">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span>マイページ</span>
        </a>
        <a href="#/login" class="nav-item ${this.isActive('login.html') ? 'active' : ''}" data-page="login">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <span>機関員アクセス</span>
        </a>
        <a href="#/statistics" class="nav-item ${this.isActive('statistics.html') ? 'active' : ''}" data-page="statistics">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          <span>機関統計</span>
        </a>
        <a href="#/codex" class="nav-item ${this.isActive('codex.html') ? 'active' : ''}" data-page="codex">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          <span>世界観コデックス</span>
        </a>
        <a href="#/agency-history" class="nav-item ${this.isActive('agency-history.html') ? 'active' : ''}" data-page="agency-history">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>機関の歴史</span>
        </a>
        <a href="#/novel" class="nav-item ${this.isActive('novel.html') ? 'active' : ''}" data-page="novel">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.746 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          <span>記録文庫</span>
        </a>
        <a href="#/reports" class="nav-item ${this.isActive('reports.html') ? 'active' : ''}" data-page="reports">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>インシデント報告</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="status-panel">
          <div class="status-row">
            <span class="status-label">機関員:</span>
            <span class="status-value" id="sidebarUserName">---</span>
          </div>
          <div class="status-row">
            <span class="status-label">権限レベル:</span>
            <span class="status-value" id="sidebarUserLevel">LEVEL 0</span>
          </div>
          <div class="status-row">
            <span class="status-label">ステータス:</span>
            <span class="status-value status-active">監視中</span>
          </div>
          <div class="status-row">
            <span class="status-label">次元座標:</span>
            <span class="status-value">PRIME</span>
          </div>
          <div style="margin-top: 1rem; text-align: center;">
            <a href="./console.html" target="_blank" style="font-size: 0.6rem; color: rgba(0, 255, 255, 0.3); text-decoration: none; font-family: 'JetBrains Mono', monospace;" onmouseover="this.style.color='rgba(0, 255, 255, 0.8)'" onmouseout="this.style.color='rgba(0, 255, 255, 0.3)'">
              [SYSTEM_CONSOLE]
            </a>
          </div>
        </div>
        <div style="margin-top: 1.5rem; padding: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center; font-size: 0.65rem; color: var(--muted-foreground); line-height: 1.4;">
          このサイトはフィクションです。<br>
          現実の人物・施設・事件・場所・<br>
          海蝕現象とは一切関係ありません。
        </div>
      </div>
    `;
  }

  /**
   * サイドバーを初期化
   */
  init() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.innerHTML = this.render();
      
      // ProgressSystemが存在する場合、ユーザー情報を更新
      if (typeof ProgressSystem !== 'undefined') {
        this.updateUserInfo();
      }

      // イベントリスナーを設定
      this.setupEventListeners();
    }
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // モバイルメニュートグルボタン
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', this.toggleMenu);
    }

    // オーバーレイクリック
    const overlay = document.querySelector('.mobile-menu-overlay');
    if (overlay) {
      overlay.addEventListener('click', this.handleOverlayClick);
    }

    // ナビゲーションアイテムクリック（モバイル時にメニューを閉じる）
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', this.handleNavClick);
    });

    // ウィンドウリサイズ
    window.addEventListener('resize', this.handleResize);

    // ESCキーでメニューを閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeMenu();
      }
    });
  }

  /**
   * メニューの開閉をトグル
   */
  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  /**
   * メニューを開く
   */
  openMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    if (sidebar) {
      sidebar.classList.add('active');
    }
    if (overlay) {
      overlay.classList.add('active');
    }
    
    this.isOpen = true;
    
    // body のスクロールを無効化（モバイル時）
    if (this.isMobile) {
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * メニューを閉じる
   */
  closeMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    if (sidebar) {
      sidebar.classList.remove('active');
    }
    if (overlay) {
      overlay.classList.remove('active');
    }
    
    this.isOpen = false;
    
    // body のスクロールを有効化
    document.body.style.overflow = '';
  }

  /**
   * オーバーレイクリック時の処理
   */
  handleOverlayClick(e) {
    if (e.target.classList.contains('mobile-menu-overlay')) {
      this.closeMenu();
    }
  }

  /**
   * ナビゲーションアイテムクリック時の処理
   */
  handleNavClick(e) {
    // モバイル時のみメニューを閉じる
    if (this.isMobile) {
      this.closeMenu();
    }
  }

  /**
   * ウィンドウリサイズ時の処理
   */
  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = this.checkMobile();
    
    // モバイルからデスクトップに変わった場合、メニューを閉じる
    if (wasMobile && !this.isMobile && this.isOpen) {
      this.closeMenu();
    }
    
    // デスクトップの場合、強制的にメニューを閉じる
    if (!this.isMobile) {
      this.closeMenu();
    }
  }

  /**
   * ユーザー情報を更新
   */
  updateUserInfo() {
    const userData = ProgressSystem.getUserData();
    if (userData) {
      const nameElement = document.getElementById('sidebarUserName');
      const levelElement = document.getElementById('sidebarUserLevel');
      
      if (nameElement && userData.name) {
        nameElement.textContent = userData.name;
      }
      
      if (levelElement) {
        const userLevel = userData.level || 0;
        
        // LevelMessagesが利用可能な場合、称号を表示
        if (typeof LevelMessages !== 'undefined') {
          const rankInfo = LevelMessages.getRankTitle(userLevel);
          levelElement.textContent = `${rankInfo.title}`;
          levelElement.style.color = rankInfo.color;
        } else {
          levelElement.textContent = `LEVEL ${userLevel}`;
        }
        
        // レベルに応じてクラスを変更
        levelElement.className = 'status-value';
        if (userLevel === 0) {
          levelElement.classList.add('status-critical');
        } else if (userLevel >= 5) {
          levelElement.classList.add('status-active');
        } else if (userLevel >= 3) {
          levelElement.classList.add('status-warning');
        }
      }
    }
  }
}

// ページ読み込み時にサイドバーを初期化
document.addEventListener('DOMContentLoaded', function() {
  const sidebarComponent = new SidebarComponent();
  sidebarComponent.init();
  
  // グローバルにアクセス可能にする（他のスクリプトから使用できるように）
  window.sidebarComponent = sidebarComponent;
});
