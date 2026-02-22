// System Console functionality
(function() {
  const CURRENT_USER_KEY = 'kaishoku_current_user';
  const USERS_KEY = 'kaishoku_users';
  const PROGRESS_KEY = 'kaishoku_progress';
  
  let currentUser = null;
  let commandHistory = [];
  let historyIndex = -1;

  const output = document.getElementById('output');
  const commandInput = document.getElementById('commandInput');

  // ASCII Art
  const asciiLogo = `
    ██╗  ██╗ █████╗ ██╗███████╗██╗  ██╗ ██████╗ ██╗  ██╗██╗   ██╗
    ██║ ██╔╝██╔══██╗██║██╔════╝██║  ██║██╔═══██╗██║ ██╔╝██║   ██║
    █████╔╝ ███████║██║███████╗███████║██║   ██║█████╔╝ ██║   ██║
    ██╔═██╗ ██╔══██║██║╚════██║██╔══██║██║   ██║██╔═██╗ ██║   ██║
    ██║  ██╗██║  ██║██║███████║██║  ██║╚██████╔╝██║  ██╗╚██████╔╝
    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝
                      SYSTEM CONSOLE v2.1.0
  `;

  // Initialize
  function init() {
    currentUser = getCurrentUser();
    
    if (!currentUser) {
      printLine('ERROR: No active user session found.', 'error');
      printLine('Redirecting to login page in 3 seconds...', 'warning');
      setTimeout(() => {
        Router.navigate('#/login');
      }, 3000);
      return;
    }

    // Print welcome message
    printLine(asciiLogo, 'success');
    printLine('═'.repeat(80), 'system');
    printLine(`SYSTEM ACCESS GRANTED`, 'success');
    printLine(`User: ${currentUser.name} [${currentUser.id}]`, 'info');
    printLine(`Clearance Level: ${currentUser.clearance || 1}`, 'info');
    printLine(`Current Level: ${currentUser.level}`, 'info');
    printLine(`Session Start: ${new Date().toLocaleString('ja-JP')}`, 'system');
    printLine('═'.repeat(80), 'system');
    printLine('');
    printLine('Type "help" to see available commands.', 'system');
    printLine('');

    // Event listeners
    commandInput.addEventListener('keydown', handleKeyDown);
  }

  function getCurrentUser() {
    const user = safeStorage.get(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  function saveCurrentUser(user) {
    safeStorage.setJSON(CURRENT_USER_KEY, user);
    currentUser = user;
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const command = commandInput.value.trim();
      
      if (command) {
        commandHistory.push(command);
        historyIndex = commandHistory.length;
        
        printLine(`root@kaishoku:~# ${command}`, 'system');
        processCommand(command);
        commandInput.value = '';
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        commandInput.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        commandInput.value = commandHistory[historyIndex];
      } else {
        historyIndex = commandHistory.length;
        commandInput.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      autocomplete();
    }
  }

  function processCommand(input) {
    const parts = input.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const commands = {
      'help': cmdHelp,
      'clear': cmdClear,
      'exit': cmdExit,
      'whoami': cmdWhoami,
      'status': cmdStatus,
      'level': cmdLevel,
      'clearance': cmdClearance,
      'logout': cmdLogout,
      'users': cmdUsers,
      'reset': cmdReset,
      'grant': cmdGrant,
      'date': cmdDate,
      'history': cmdHistory,
      'echo': cmdEcho,
      'admin': cmdAdmin
    };

    if (commands[command]) {
      commands[command](args);
    } else {
      printLine(`Command not found: ${command}`, 'error');
      printLine(`Type 'help' for available commands.`, 'system');
    }

    printLine('');
  }

  function cmdHelp(args) {
    printLine('Available Commands:', 'info');
    printLine('');
    printLine('  help              - Display this help message', 'success');
    printLine('  clear             - Clear the console screen', 'success');
    printLine('  exit              - Return to dashboard', 'success');
    printLine('  whoami            - Display current user information', 'success');
    printLine('  status            - Show detailed user status', 'success');
    printLine('  level <number>    - Set user level (1-10)', 'success');
    printLine('  clearance <num>   - Set clearance level (1-5)', 'success');
    printLine('  grant <xp>        - Grant XP to current user', 'success');
    printLine('  logout            - Logout current user', 'success');
    printLine('  users             - List all registered users', 'success');
    printLine('  reset             - Reset user progress', 'success');
    printLine('  admin             - Toggle admin privileges', 'success');
    printLine('  date              - Display current date and time', 'success');
    printLine('  history           - Show command history', 'success');
    printLine('  echo <text>       - Echo text to console', 'success');
  }

  function cmdClear(args) {
    output.innerHTML = '';
  }

  function cmdExit(args) {
    printLine('Exiting console...', 'warning');
    setTimeout(() => {
      Router.navigate('#/dashboard');
    }, 500);
  }

  function cmdWhoami(args) {
    printLine(`${currentUser.name} [${currentUser.id}]`, 'info');
  }

  function cmdStatus(args) {
    const progress = getProgress();
    
    printLine('═════════════════ USER STATUS ═════════════════', 'info');
    printLine(`Name:            ${currentUser.name}`, 'success');
    printLine(`ID:              ${currentUser.id}`, 'success');
    printLine(`Division:        ${getDivisionName(currentUser.division)}`, 'success');
    printLine(`Level:           ${currentUser.level}`, 'success');
    printLine(`Clearance:       ${currentUser.clearance || 1}`, 'success');
    printLine(`XP:              ${progress.xp} / ${progress.xpToNext}`, 'success');
    printLine(`Total XP:        ${progress.totalXp}`, 'success');
    printLine(`Admin:           ${currentUser.admin ? 'Yes' : 'No'}`, 'success');
    printLine('═'.repeat(50), 'system');
  }

  function cmdLevel(args) {
    if (args.length === 0) {
      printLine(`Current level: ${currentUser.level}`, 'info');
      printLine('Usage: level <number>', 'system');
      return;
    }

    const newLevel = parseInt(args[0]);
    
    if (isNaN(newLevel) || newLevel < 1 || newLevel > 10) {
      printLine('Invalid level. Must be between 1 and 10.', 'error');
      return;
    }

    const oldLevel = currentUser.level;
    currentUser.level = newLevel;
    saveCurrentUser(currentUser);
    
    // Update progress
    const progress = getProgress();
    progress.level = newLevel;
    safeStorage.setJSON(PROGRESS_KEY, progress);

    printLine(`Level changed: ${oldLevel} → ${newLevel}`, 'success');
    printLine('User data updated successfully.', 'success');
  }

  function cmdClearance(args) {
    if (args.length === 0) {
      printLine(`Current clearance: ${currentUser.clearance || 1}`, 'info');
      printLine('Usage: clearance <number>', 'system');
      return;
    }

    const newClearance = parseInt(args[0]);
    
    if (isNaN(newClearance) || newClearance < 1 || newClearance > 5) {
      printLine('Invalid clearance level. Must be between 1 and 5.', 'error');
      return;
    }

    const oldClearance = currentUser.clearance || 1;
    currentUser.clearance = newClearance;
    saveCurrentUser(currentUser);

    printLine(`Clearance changed: ${oldClearance} → ${newClearance}`, 'success');
    printLine('User data updated successfully.', 'success');
  }

  function cmdGrant(args) {
    if (args.length === 0) {
      printLine('Usage: grant <xp>', 'system');
      return;
    }

    const xpAmount = parseInt(args[0]);
    
    if (isNaN(xpAmount) || xpAmount < 1) {
      printLine('Invalid XP amount.', 'error');
      return;
    }

    const progress = getProgress();
    progress.xp += xpAmount;
    progress.totalXp += xpAmount;
    
    // Check for level up
    while (progress.xp >= progress.xpToNext && progress.level < 10) {
      progress.xp -= progress.xpToNext;
      progress.level++;
      currentUser.level = progress.level;
      progress.xpToNext = Math.floor(100 * Math.pow(1.5, progress.level - 1));
      printLine(`LEVEL UP! You are now level ${progress.level}`, 'warning');
    }
    
    safeStorage.setJSON(PROGRESS_KEY, progress);
    saveCurrentUser(currentUser);

    printLine(`Granted ${xpAmount} XP to ${currentUser.name}`, 'success');
    printLine(`Current XP: ${progress.xp} / ${progress.xpToNext}`, 'info');
  }

  function cmdLogout(args) {
    printLine('Logging out...', 'warning');
    printLine('Session terminated.', 'system');
    
    setTimeout(() => {
      safeStorage.remove(CURRENT_USER_KEY);
      Router.navigate('#/login');
    }, 1000);
  }

  function cmdUsers(args) {
    const usersData = safeStorage.get(USERS_KEY);
    const users = usersData ? JSON.parse(usersData) : [];

    if (users.length === 0) {
      printLine('No users registered.', 'warning');
      return;
    }

    printLine('═════════════════ REGISTERED USERS ═════════════════', 'info');
    printLine('');
    
    users.forEach((user, index) => {
      printLine(`[${index + 1}] ${user.name}`, 'success');
      printLine(`    ID:        ${user.id}`, 'system');
      printLine(`    Division:  ${getDivisionName(user.division)}`, 'system');
      printLine(`    Level:     ${user.level}`, 'system');
      printLine(`    Clearance: ${user.clearance || 1}`, 'system');
      printLine('');
    });
    
    printLine('═'.repeat(55), 'system');
    printLine(`Total users: ${users.length}`, 'info');
  }

  function cmdReset(args) {
    printLine('WARNING: This will reset all progress data!', 'error');
    printLine('Progress has been reset.', 'warning');
    
    const progress = {
      level: 1,
      xp: 0,
      totalXp: 0,
      xpToNext: 100,
      activities: {}
    };
    
    safeStorage.setJSON(PROGRESS_KEY, progress);
    
    currentUser.level = 1;
    currentUser.clearance = 1;
    saveCurrentUser(currentUser);
    
    printLine('User level reset to 1', 'success');
    printLine('XP reset to 0', 'success');
  }

  function cmdAdmin(args) {
    currentUser.admin = !currentUser.admin;
    saveCurrentUser(currentUser);
    
    if (currentUser.admin) {
      printLine('Admin privileges ENABLED', 'success');
      printLine('You now have full system access.', 'info');
    } else {
      printLine('Admin privileges DISABLED', 'warning');
      printLine('System access restricted to normal user level.', 'info');
    }
  }

  function cmdDate(args) {
    const now = new Date();
    printLine(now.toString(), 'info');
  }

  function cmdHistory(args) {
    if (commandHistory.length === 0) {
      printLine('No command history.', 'system');
      return;
    }

    printLine('Command History:', 'info');
    commandHistory.forEach((cmd, index) => {
      printLine(`  ${index + 1}  ${cmd}`, 'system');
    });
  }

  function cmdEcho(args) {
    printLine(args.join(' '), 'success');
  }

  function getProgress() {
    const progressData = safeStorage.get(PROGRESS_KEY);
    return progressData ? JSON.parse(progressData) : {
      level: 1,
      xp: 0,
      totalXp: 0,
      xpToNext: 100,
      activities: {}
    };
  }

  function getDivisionName(divisionId) {
    const divisions = {
      'convergence': '収束部門',
      'support': '支援部門',
      'engineering': '工作部門',
      'foreign': '外事部門',
      'port': '港湾部門'
    };
    return divisions[divisionId] || divisionId;
  }

  function autocomplete() {
    const input = commandInput.value;
    const commands = [
      'help', 'clear', 'exit', 'whoami', 'status', 'level', 
      'clearance', 'logout', 'users', 'reset', 'grant', 
      'date', 'history', 'echo', 'admin'
    ];
    
    const matches = commands.filter(cmd => cmd.startsWith(input));
    
    if (matches.length === 1) {
      commandInput.value = matches[0];
    } else if (matches.length > 1) {
      printLine('Possible commands:', 'system');
      matches.forEach(match => printLine(`  ${match}`, 'info'));
      printLine('');
    }
  }

  function printLine(text, type = 'system') {
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
