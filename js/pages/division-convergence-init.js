// Auto-generated inline script for division-convergence
// Check if user has access to this page
    if (!ProgressSystem.checkPageAccess('division-convergence.html')) {
      ModalSystem.warning(
        'このページにアクセスするには LEVEL 2 が必要です。<br><br>部門情報の閲覧やチャット機能を使用して経験値を獲得してください。',
        'ACCESS DENIED'
      ).then(() => {
        Router.navigate('#/divisions');
      });
    }