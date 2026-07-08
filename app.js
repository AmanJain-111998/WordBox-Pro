// app.js - Gamebox Pro Orchestrator & Games Engines

// ==========================================================================
// PWA Service Worker Registration & Installation Prompt
// ==========================================================================
let deferredPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then((reg) => console.log('[Service Worker] Registered:', reg.scope))
      .catch((err) => console.error('[Service Worker] Registration failed:', err));
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const banner = document.getElementById('install-banner');
  if (banner) banner.classList.remove('hidden');
});

// ==========================================================================
// Native Web Audio Synthesizer
// ==========================================================================
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  playKey() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  playFlip(index) {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const freq = 200 + (index * 70);
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq + 40, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  playError() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  playWin() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.5);
    });
  }

  playLoss() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [392.00, 370.00, 349.23, 311.13];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.16);
      gain.gain.setValueAtTime(0, now + idx * 0.16);
      gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.16 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 0.7);
    });
  }
}

const AudioPlayer = new SoundSynth();

// ==========================================================================
// Central State & Configuration
// ==========================================================================
const difficultyWordLists = {
  easy: EASY_WORDS,
  medium: MEDIUM_WORDS,
  hard: HARD_WORDS
};

const GameHubState = {
  activeGame: null,        // null (Dashboard), 'wordle', 'octordle', 'crossword', 'sudoku'
  difficulty: 'easy',      // 'easy', 'medium', 'hard'
  gameMode: 'practice',    // 'practice', 'daily'
  stats: {},
  dailyIndex: 0
};

// Initial Multi-Game Stats Blueprint
const defaultStatsSchema = {
  wordle: {
    practice: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0] }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0] }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0] } },
    daily: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0], lastPlayedDay: -1, lastResult: null, savedGuesses: [] }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0], lastPlayedDay: -1, lastResult: null, savedGuesses: [] }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0], lastPlayedDay: -1, lastResult: null, savedGuesses: [] } }
  },
  octordle: {
    practice: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: Array(13).fill(0) }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: Array(13).fill(0) }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: Array(13).fill(0) } },
    daily: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: Array(13).fill(0), lastPlayedDay: -1, lastResult: null, savedGuesses: [] }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: Array(13).fill(0), lastPlayedDay: -1, lastResult: null, savedGuesses: [] }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: Array(13).fill(0), lastPlayedDay: -1, lastResult: null, savedGuesses: [] } }
  },
  crossword: {
    practice: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0 }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0 }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0 } },
    daily: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null } }
  },
  sudoku: {
    practice: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0 }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0 }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0 } },
    daily: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null } }
  }
};

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadUserSettings();
  loadStats();
  bindOrchestratorEvents();
  renderQWERTYKeyboard();
  showView('dashboard');
});

function loadUserSettings() {
  const settings = JSON.parse(localStorage.getItem('wordle_settings')) || {
    darkMode: true,
    colorblind: false,
    sound: true,
    gameMode: 'practice'
  };
  
  document.body.className = '';
  document.body.classList.add(settings.darkMode ? 'dark-theme' : 'light-theme');
  if (settings.colorblind) document.body.classList.add('colorblind');
  
  AudioPlayer.enabled = settings.sound;
  GameHubState.gameMode = settings.gameMode;
  
  document.getElementById('toggle-dark-mode').checked = settings.darkMode;
  document.getElementById('toggle-colorblind').checked = settings.colorblind;
  document.getElementById('toggle-sound').checked = settings.sound;
  document.getElementById('select-game-mode').value = settings.gameMode;
}

function saveUserSettings() {
  const settings = {
    darkMode: document.getElementById('toggle-dark-mode').checked,
    colorblind: document.getElementById('toggle-colorblind').checked,
    sound: document.getElementById('toggle-sound').checked,
    gameMode: document.getElementById('select-game-mode').value
  };
  localStorage.setItem('wordle_settings', JSON.stringify(settings));
}

function loadStats() {
  const saved = localStorage.getItem('gamebox_pro_stats');
  if (saved) {
    GameHubState.stats = JSON.parse(saved);
    // Ensure compatibility with previous formats by merging schemas
    for (const game of ['wordle', 'octordle', 'crossword', 'sudoku']) {
      if (!GameHubState.stats[game]) {
        GameHubState.stats[game] = JSON.parse(JSON.stringify(defaultStatsSchema[game]));
      }
    }
  } else {
    GameHubState.stats = JSON.parse(JSON.stringify(defaultStatsSchema));
  }
}

function saveStats() {
  localStorage.setItem('gamebox_pro_stats', JSON.stringify(GameHubState.stats));
}

function resetAllStats() {
  GameHubState.stats = JSON.parse(JSON.stringify(defaultStatsSchema));
  saveStats();
  showToast('All stats cleared');
  updateStatsModal();
}

// Deterministic index for daily challenge based on days since Jan 1, 2026
function getDailyIndex() {
  const epoch = new Date(2026, 0, 1).getTime();
  const now = new Date().getTime();
  const diffDays = Math.floor((now - epoch) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// ==========================================================================
// Views Switcher
// ==========================================================================
function showView(view) {
  if (view === 'dashboard') {
    GameHubState.activeGame = null;
    document.getElementById('view-dashboard').classList.remove('hidden');
    document.getElementById('view-game').classList.add('hidden');
    
    // Header tweaks
    document.getElementById('btn-home').classList.add('hidden');
    document.getElementById('btn-stats').classList.add('hidden');
    document.getElementById('logo-main').innerHTML = 'GAMEBOX<span class="logo-accent">PRO</span>';
  } else {
    GameHubState.activeGame = view;
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-game').classList.remove('hidden');
    
    document.getElementById('btn-home').classList.remove('hidden');
    document.getElementById('btn-stats').classList.remove('hidden');
    
    // Set headers
    const gameTitles = {
      wordle: 'WORDLE<span class="logo-accent">PRO</span>',
      octordle: 'OCTORDLE<span class="logo-accent">PRO</span>',
      crossword: 'CROSSWORD<span class="logo-accent">PRO</span>',
      sudoku: 'SUDOKU<span class="logo-accent">PRO</span>'
    };
    document.getElementById('logo-main').innerHTML = gameTitles[view];
    
    // Manage Game View Panels
    document.querySelectorAll('.game-board-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(`game-${view}`).classList.remove('hidden');
    
    // Keyboard layouts
    const qwertyKb = document.getElementById('keyboard-qwerty');
    const numericKb = document.getElementById('keyboard-numeric');
    const octordleShortcuts = document.getElementById('octordle-shortcuts-bar');
    
    if (view === 'sudoku') {
      qwertyKb.classList.add('hidden');
      numericKb.classList.remove('hidden');
      octordleShortcuts.classList.add('hidden');
    } else {
      qwertyKb.classList.remove('hidden');
      numericKb.classList.add('hidden');
      if (view === 'octordle') {
        octordleShortcuts.classList.remove('hidden');
      } else {
        octordleShortcuts.classList.add('hidden');
      }
    }
    
    // Difficulty labels wraps
    document.getElementById('level-indicator').classList.add('hidden');
    document.getElementById('sudoku-mistakes-counter').classList.add('hidden');
    
    startActiveGame();
  }
}

function startActiveGame() {
  GameHubState.dailyIndex = getDailyIndex();
  
  if (GameHubState.activeGame === 'wordle') {
    WordleEngine.start();
  } else if (GameHubState.activeGame === 'octordle') {
    OctordleEngine.start();
  } else if (GameHubState.activeGame === 'crossword') {
    CrosswordEngine.start();
  } else if (GameHubState.activeGame === 'sudoku') {
    SudokuEngine.start();
  }
}

// ==========================================================================
// QWERTY Virtual Keyboard Generator
// ==========================================================================
function renderQWERTYKeyboard() {
  const keyboard = document.getElementById('keyboard-qwerty');
  keyboard.innerHTML = '';
  const rows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
    ['enter']
  ];
  
  rows.forEach(keys => {
    const row = document.createElement('div');
    row.className = 'keyboard-row';
    keys.forEach(key => {
      const btn = document.createElement('button');
      btn.className = 'key-btn';
      btn.dataset.key = key;
      btn.id = `key-${key}`;
      
      if (key === 'enter' || key === 'backspace') {
        btn.classList.add('key-wide');
        if (key === 'backspace') {
          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" /></svg>`;
        } else {
          btn.innerText = 'ENTER';
        }
      } else {
        // Absolute segmented background for Octordle indicators
        const bgGrid = document.createElement('div');
        bgGrid.className = 'key-bg-grid';
        for (let b = 0; b < 8; b++) {
          const seg = document.createElement('div');
          seg.className = 'key-bg-seg';
          seg.id = `key-seg-${key}-${b}`;
          bgGrid.appendChild(seg);
        }
        btn.appendChild(bgGrid);
        
        const label = document.createElement('span');
        label.className = 'key-text';
        label.innerText = key.toUpperCase();
        btn.appendChild(label);
      }
      row.appendChild(btn);
    });
    keyboard.appendChild(row);
  });
}

function clearKeyboardStates() {
  document.querySelectorAll('#keyboard-qwerty .key-btn').forEach(k => {
    k.className = 'key-btn';
    if (k.dataset.key === 'enter' || k.dataset.key === 'backspace') {
      k.classList.add('key-wide');
    }
  });
  // Clear all Octordle grid segment indicators
  document.querySelectorAll('.key-bg-seg').forEach(seg => {
    seg.className = 'key-bg-seg';
  });
}

function updateKeyStyle(keyChar, state) {
  const keyBtn = document.getElementById(`key-${keyChar}`);
  if (!keyBtn) return;
  if (keyBtn.classList.contains('correct-state')) return;
  if (keyBtn.classList.contains('present-state') && state !== 'correct') return;
  
  keyBtn.classList.remove('present-state', 'absent-state');
  keyBtn.classList.add(`${state}-state`);
}

// ==========================================================================
// Unified Core Event Router
// ==========================================================================
function bindOrchestratorEvents() {
  // Main selector cards clicks
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      AudioPlayer.playClick();
      showView(card.dataset.game);
    });
  });
  
  // Navigation Home
  document.getElementById('btn-home').addEventListener('click', () => {
    AudioPlayer.playClick();
    showView('dashboard');
  });

  // Controls tabs switch (difficulty)
  document.querySelectorAll('.difficulty-tabs .tab-button').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const activeTab = e.currentTarget;
      if (activeTab.classList.contains('active')) return;
      AudioPlayer.playClick();
      
      document.querySelectorAll('.difficulty-tabs .tab-button').forEach(b => b.classList.remove('active'));
      activeTab.classList.add('active');
      
      GameHubState.difficulty = activeTab.dataset.difficulty;
      startActiveGame();
    });
  });

  // Menu Modals events
  document.getElementById('btn-help').addEventListener('click', () => openHelpModal());
  document.getElementById('btn-close-help').addEventListener('click', () => closeModal(document.getElementById('modal-help')));
  document.getElementById('btn-stats').addEventListener('click', () => {
    updateStatsModal();
    openModal(document.getElementById('modal-stats'));
  });
  document.getElementById('btn-close-stats').addEventListener('click', () => closeModal(document.getElementById('modal-stats')));
  
  document.getElementById('btn-settings').addEventListener('click', () => openModal(document.getElementById('modal-settings')));
  document.getElementById('btn-close-settings').addEventListener('click', () => closeModal(document.getElementById('modal-settings')));
  
  // Exit buttons
  document.getElementById('btn-prompt-exit').addEventListener('click', () => {
    closeModal(document.getElementById('modal-gameover-prompt'));
    showView('dashboard');
  });

  // Settings selections
  document.getElementById('select-game-mode').addEventListener('change', (e) => {
    GameHubState.gameMode = e.target.value;
    saveUserSettings();
    closeModal(document.getElementById('modal-settings'));
    startActiveGame();
  });
  
  document.getElementById('toggle-dark-mode').addEventListener('change', (e) => {
    const isDark = e.target.checked;
    document.body.className = '';
    document.body.classList.add(isDark ? 'dark-theme' : 'light-theme');
    if (document.getElementById('toggle-colorblind').checked) document.body.classList.add('colorblind');
    saveUserSettings();
    AudioPlayer.playClick();
  });

  document.getElementById('toggle-colorblind').addEventListener('change', (e) => {
    const isColor = e.target.checked;
    if (isColor) document.body.classList.add('colorblind');
    else document.body.classList.remove('colorblind');
    saveUserSettings();
    AudioPlayer.playClick();
  });

  document.getElementById('toggle-sound').addEventListener('change', (e) => {
    AudioPlayer.enabled = e.target.checked;
    saveUserSettings();
    AudioPlayer.playClick();
  });

  document.getElementById('btn-reset-stats').addEventListener('click', () => {
    if (confirm('Permanently clear statistics of all games?')) {
      resetAllStats();
    }
  });

  // Share Stats logic
  document.getElementById('btn-share-stats').addEventListener('click', () => {
    const text = getShareContent();
    if (navigator.share) {
      navigator.share({ title: 'Gamebox Score', text }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(text)
        .then(() => showToast('Results copied to clipboard!'))
        .catch(() => showToast('Copy failed'));
    }
  });

  // Practice Again
  document.getElementById('btn-practice-again').addEventListener('click', () => {
    closeModal(document.getElementById('modal-stats'));
    startActiveGame();
  });

  // QWERTY physical keyboard router
  document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'SELECT' || document.activeElement.tagName === 'INPUT') return;
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(closeModal);
      return;
    }
    
    if (!GameHubState.activeGame) return;
    
    // Route keys
    const key = e.key.toLowerCase();
    if (GameHubState.activeGame === 'sudoku') {
      if (/^[1-9]$/.test(key)) SudokuEngine.handleInput(parseInt(key));
      if (key === 'backspace' || key === 'delete' || key === '0') SudokuEngine.eraseCell();
    } else if (GameHubState.activeGame === 'crossword') {
      if (/^[a-z]$/.test(key)) CrosswordEngine.handleInput(key);
      if (key === 'backspace') CrosswordEngine.handleBackspace();
      // Arrow keys navigation inside crossword
      if (key === 'arrowup') CrosswordEngine.moveSelection(-1, 0);
      if (key === 'arrowdown') CrosswordEngine.moveSelection(1, 0);
      if (key === 'arrowleft') CrosswordEngine.moveSelection(0, -1);
      if (key === 'arrowright') CrosswordEngine.moveSelection(0, 1);
    } else {
      // Wordle and Octordle
      if (/^[a-z]$/.test(key)) handleQWERTYInput(key);
      if (key === 'backspace') handleQWERTYBackspace();
      if (key === 'enter') handleQWERTYSubmit();
    }
  });

  // QWERTY Virtual keyboard router
  document.getElementById('keyboard-qwerty').addEventListener('click', (e) => {
    const btn = e.target.closest('.key-btn');
    if (!btn) return;
    const key = btn.dataset.key;
    
    if (GameHubState.activeGame === 'crossword') {
      if (key === 'backspace') CrosswordEngine.handleBackspace();
      else if (key === 'enter') { /* do nothing for crossword */ }
      else CrosswordEngine.handleInput(key);
    } else {
      if (key === 'backspace') handleQWERTYBackspace();
      else if (key === 'enter') handleQWERTYSubmit();
      else handleQWERTYInput(key);
    }
  });

  // Sudoku numeric pad click
  document.getElementById('keyboard-numeric').addEventListener('click', (e) => {
    const btn = e.target.closest('.key-btn');
    if (!btn) return;
    
    if (btn.classList.contains('num-key')) {
      SudokuEngine.handleInput(parseInt(btn.dataset.num));
    } else if (btn.id === 'key-sudoku-notes') {
      SudokuEngine.toggleNotesMode();
    } else if (btn.id === 'key-sudoku-erase') {
      SudokuEngine.eraseCell();
    }
  });

  // PWA banner close
  document.getElementById('btn-close-install').addEventListener('click', () => {
    document.getElementById('install-banner').classList.add('hidden');
  });
  
  document.getElementById('btn-install-app').addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        deferredPrompt = null;
        document.getElementById('install-banner').classList.add('hidden');
      });
    }
  });
}

// Router forwards for Wordle / Octordle
function handleQWERTYInput(char) {
  if (GameHubState.activeGame === 'wordle') WordleEngine.handleInput(char);
  else if (GameHubState.activeGame === 'octordle') OctordleEngine.handleInput(char);
}

function handleQWERTYBackspace() {
  if (GameHubState.activeGame === 'wordle') WordleEngine.handleBackspace();
  else if (GameHubState.activeGame === 'octordle') OctordleEngine.handleBackspace();
}

function handleQWERTYSubmit() {
  if (GameHubState.activeGame === 'wordle') WordleEngine.submitGuess();
  else if (GameHubState.activeGame === 'octordle') OctordleEngine.submitGuess();
}

// Helper modals
function openModal(el) {
  if (!el) return;
  AudioPlayer.playClick();
  el.classList.remove('hidden');
}

function closeModal(el) {
  if (!el) return;
  AudioPlayer.playClick();
  el.classList.add('hidden');
}

function showToast(msg) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.innerText = msg;
  container.appendChild(toast);
  toast.addEventListener('animationend', (e) => {
    if (e.animationName === 'fadeOutUp') toast.remove();
  });
}

// win affirmation labels
function getWinText(guesses) {
  const words = ['Genius!', 'Magnificent!', 'Splendid', 'Excellent', 'Impressive', 'Phew!'];
  return words[guesses - 1] || 'Victory!';
}

// ==========================================================================
// GAME 1: Wordle Engine
// ==========================================================================
const WordleEngine = {
  target: '',
  guesses: [],
  current: '',
  status: 'IN_PROGRESS',
  isAnimating: false,

  start() {
    this.guesses = [];
    this.current = '';
    this.status = 'IN_PROGRESS';
    this.isAnimating = false;
    
    // Render Board Grid
    const board = document.getElementById('board-wordle');
    board.innerHTML = '';
    for (let r = 0; r < 6; r++) {
      const row = document.createElement('div');
      row.className = 'board-row';
      row.id = `wordle-row-${r}`;
      for (let c = 0; c < 5; c++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.id = `wordle-tile-${r}-${c}`;
        row.appendChild(tile);
      }
      board.appendChild(row);
    }
    
    clearKeyboardStates();
    
    const list = difficultyWordLists[GameHubState.difficulty];
    if (GameHubState.gameMode === 'daily') {
      const idx = GameHubState.dailyIndex % list.length;
      this.target = list[idx];
      
      const statObj = GameHubState.stats.wordle.daily[GameHubState.difficulty];
      if (statObj.lastPlayedDay === GameHubState.dailyIndex) {
        this.guesses = [...statObj.savedGuesses];
        this.status = statObj.lastResult;
        
        // Render instantly
        this.guesses.forEach((guess, rowIdx) => {
          const evals = gradeGuess(guess, this.target);
          evals.forEach((state, colIdx) => {
            const tile = document.getElementById(`wordle-tile-${rowIdx}-${colIdx}`);
            tile.innerText = guess[colIdx].toUpperCase();
            tile.classList.add(`${state}-state`);
            updateKeyStyle(guess[colIdx], state);
          });
        });
        
        setTimeout(() => {
          updateStatsModal();
          openModal(document.getElementById('modal-stats'));
        }, 400);
        return;
      }
    } else {
      this.target = list[Math.floor(Math.random() * list.length)];
    }
    console.log('[Wordle Target]:', this.target.toUpperCase());
  },

  handleInput(char) {
    if (this.status !== 'IN_PROGRESS' || this.isAnimating) return;
    if (this.current.length >= 5) return;
    AudioPlayer.playKey();
    
    const row = this.guesses.length;
    const col = this.current.length;
    this.current += char;
    const tile = document.getElementById(`wordle-tile-${row}-${col}`);
    if (tile) {
      tile.innerText = char.toUpperCase();
      tile.classList.add('active-input', 'pop-effect');
    }
  },

  handleBackspace() {
    if (this.current.length === 0) return;
    AudioPlayer.playClick();
    
    const row = this.guesses.length;
    const col = this.current.length - 1;
    this.current = this.current.slice(0, -1);
    const tile = document.getElementById(`wordle-tile-${row}-${col}`);
    if (tile) {
      tile.innerText = '';
      tile.classList.remove('active-input', 'pop-effect');
    }
  },

  submitGuess() {
    if (this.status !== 'IN_PROGRESS' || this.isAnimating) return;
    const guess = this.current;
    const row = this.guesses.length;
    
    if (guess.length < 5) {
      showToast('Not enough letters');
      this.shake(row);
      AudioPlayer.playError();
      return;
    }
    
    if (!VALID_GUESSES.has(guess)) {
      showToast('Not in word list');
      this.shake(row);
      AudioPlayer.playError();
      return;
    }
    
    this.isAnimating = true;
    this.guesses.push(guess);
    this.current = '';
    
    const evals = gradeGuess(guess, this.target);
    evals.forEach((state, idx) => {
      const tile = document.getElementById(`wordle-tile-${row}-${idx}`);
      tile.classList.remove('active-input', 'pop-effect');
      setTimeout(() => {
        tile.classList.add('flip-animation');
        AudioPlayer.playFlip(idx);
        setTimeout(() => {
          tile.classList.add(`${state}-state`);
          updateKeyStyle(guess[idx], state);
        }, 250);
      }, idx * 150);
    });
    
    setTimeout(() => {
      this.isAnimating = false;
      if (guess === this.target) {
        this.status = 'WON';
        AudioPlayer.playWin();
        showToast(getWinText(this.guesses.length));
        this.bounce(row);
        this.saveResults();
      } else if (this.guesses.length >= 6) {
        this.status = 'LOST';
        AudioPlayer.playLoss();
        showToast(this.target.toUpperCase());
        this.saveResults();
      }
    }, 5 * 150 + 400);
  },

  shake(rowIdx) {
    const row = document.getElementById(`wordle-row-${rowIdx}`);
    if (row) {
      row.classList.add('shake');
      row.addEventListener('animationend', () => row.classList.remove('shake'), { once: true });
    }
  },

  bounce(rowIdx) {
    const row = document.getElementById(`wordle-row-${rowIdx}`);
    if (row) row.classList.add('bounce');
  },

  saveResults() {
    const mode = GameHubState.gameMode;
    const diff = GameHubState.difficulty;
    const statsObj = GameHubState.stats.wordle[mode][diff];
    
    if (mode === 'daily') {
      statsObj.lastPlayedDay = GameHubState.dailyIndex;
      statsObj.lastResult = this.status;
      statsObj.savedGuesses = [...this.guesses];
    }
    
    statsObj.played++;
    if (this.status === 'WON') {
      statsObj.won++;
      statsObj.currentStreak++;
      if (statsObj.currentStreak > statsObj.maxStreak) statsObj.maxStreak = statsObj.currentStreak;
      statsObj.guessDistribution[this.guesses.length - 1]++;
    } else {
      statsObj.currentStreak = 0;
    }
    saveStats();
    
    setTimeout(() => {
      updateStatsModal();
      openModal(document.getElementById('modal-stats'));
    }, 1200);
  }
};

// Wordle evaluation algorithm helper
function gradeGuess(guess, target) {
  const evals = Array(5).fill('absent');
  const counts = {};
  
  for (let i = 0; i < 5; i++) {
    if (guess[i] === target[i]) {
      evals[i] = 'correct';
    } else {
      counts[target[i]] = (counts[target[i]] || 0) + 1;
    }
  }
  
  for (let i = 0; i < 5; i++) {
    if (evals[i] === 'correct') continue;
    if (counts[guess[i]] && counts[guess[i]] > 0) {
      evals[i] = 'present';
      counts[guess[i]]--;
    }
  }
  return evals;
}

// ==========================================================================
// GAME 2: Octordle Engine (8 Wordles at once)
// ==========================================================================
const OctordleEngine = {
  targets: [],
  guesses: [],
  current: '',
  solved: [], // array of 8 booleans
  status: 'IN_PROGRESS',
  isAnimating: false,

  start() {
    this.guesses = [];
    this.current = '';
    this.solved = Array(8).fill(false);
    this.status = 'IN_PROGRESS';
    this.isAnimating = false;
    
    // Render 1-8 navigation shortcuts indicators bar
    const shortcuts = document.getElementById('octordle-shortcuts-bar');
    shortcuts.innerHTML = '';
    for (let b = 0; b < 8; b++) {
      const btn = document.createElement('button');
      btn.className = 'octordle-shortcut-btn';
      btn.id = `octordle-shortcut-btn-${b}`;
      btn.innerText = b + 1;
      btn.addEventListener('click', () => {
        AudioPlayer.playClick();
        const targetCard = document.getElementById(`octordle-board-card-${b}`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
      shortcuts.appendChild(btn);
    }

    const list = difficultyWordLists[GameHubState.difficulty];
    if (GameHubState.gameMode === 'daily') {
      // Pick 8 deterministic words
      this.targets = [];
      const startIdx = (GameHubState.dailyIndex * 8) % list.length;
      for (let i = 0; i < 8; i++) {
        this.targets.push(list[(startIdx + i) % list.length]);
      }
      
      const statObj = GameHubState.stats.octordle.daily[GameHubState.difficulty];
      if (statObj.lastPlayedDay === GameHubState.dailyIndex) {
        this.guesses = [...statObj.savedGuesses];
        this.status = statObj.lastResult;
        
        // Recompute solved flags
        this.guesses.forEach((guess) => {
          this.targets.forEach((tar, idx) => {
            if (guess === tar) this.solved[idx] = true;
          });
        });
        
        this.repaintAll();
        setTimeout(() => {
          updateStatsModal();
          openModal(document.getElementById('modal-stats'));
        }, 400);
        return;
      }
    } else {
      // Practice: random 8 words
      this.targets = [];
      for (let i = 0; i < 8; i++) {
        this.targets.push(list[Math.floor(Math.random() * list.length)]);
      }
    }
    
    console.log('[Octordle Targets]:', this.targets.map(t=>t.toUpperCase()));
    this.repaintAll();
  },

  repaintAll() {
    this.renderBoards();
    this.updateKeyboard();
    this.updateShortcutsBar();
  },

  renderBoards() {
    const container = document.getElementById('octordle-boards-container');
    container.innerHTML = '';
    
    for (let b = 0; b < 8; b++) {
      const card = document.createElement('div');
      card.className = 'octordle-board-card';
      card.id = `octordle-board-card-${b}`;
      
      const target = this.targets[b];
      const isSolved = this.solved[b];
      const winIdx = isSolved ? this.guesses.indexOf(target) : -1;
      const isFailed = !isSolved && this.guesses.length >= 13;
      
      if (isSolved) card.classList.add('solved');
      if (isFailed) card.classList.add('failed');
      
      // Board Card Header
      const header = document.createElement('div');
      header.className = 'octordle-board-header';
      
      const titleSpan = document.createElement('span');
      titleSpan.innerText = `BOARD ${b + 1}`;
      header.appendChild(titleSpan);
      
      const statusSpan = document.createElement('span');
      if (isSolved) {
        statusSpan.innerText = `SOLVED IN ${winIdx + 1}`;
      } else if (isFailed) {
        statusSpan.innerText = `FAILED (Word: ${target.toUpperCase()})`;
      } else {
        statusSpan.innerText = `IN PROGRESS`;
      }
      header.appendChild(statusSpan);
      card.appendChild(header);
      
      // Board Grid Layout (CSS Grid of rows)
      const grid = document.createElement('div');
      grid.className = 'octordle-board-grid';
      
      // Render guesses up to solved guess to save scroll space
      const totalRows = isSolved ? (winIdx + 1) : 13;
      
      for (let r = 0; r < totalRows; r++) {
        const row = document.createElement('div');
        row.className = 'board-row';
        
        const guess = this.guesses[r];
        const hasGuess = guess && (!isSolved || r <= winIdx);
        let evals = [];
        if (hasGuess) {
          evals = gradeGuess(guess, target);
        }
        
        for (let c = 0; c < 5; c++) {
          const tile = document.createElement('div');
          tile.className = 'tile';
          
          if (hasGuess) {
            tile.innerText = guess[c].toUpperCase();
            tile.classList.add(`${evals[c]}-state`);
          } else if (r === this.guesses.length && this.status === 'IN_PROGRESS') {
            // Typing letters
            if (c < this.current.length) {
              tile.innerText = this.current[c].toUpperCase();
              tile.classList.add('active-input');
            }
          }
          row.appendChild(tile);
        }
        grid.appendChild(row);
      }
      card.appendChild(grid);
      container.appendChild(card);
    }
  },

  updateKeyboard() {
    clearKeyboardStates();
    
    // Evaluate key statuses segment by segment across all 8 boards
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    for (let char of alphabet) {
      let hasBeenGuessed = false;
      let isPresentOrCorrectAnywhere = false;
      
      for (let b = 0; b < 8; b++) {
        const target = this.targets[b];
        let bestState = null;
        
        this.guesses.forEach((guess) => {
          const evals = gradeGuess(guess, target);
          for (let i = 0; i < 5; i++) {
            if (guess[i] === char) {
              hasBeenGuessed = true;
              const state = evals[i];
              if (state === 'correct') {
                bestState = 'correct';
                isPresentOrCorrectAnywhere = true;
              } else if (state === 'present') {
                isPresentOrCorrectAnywhere = true;
                if (bestState !== 'correct') {
                  bestState = 'present';
                }
              } else if (state === 'absent' && !bestState) {
                bestState = 'absent';
              }
            }
          }
        });
        
        if (bestState) {
          const seg = document.getElementById(`key-seg-${char}-${b}`);
          if (seg) seg.classList.add(bestState);
        }
      }
      
      // If it has been guessed, but never found correct/present on any of the 8 boards
      const keyBtn = document.getElementById(`key-${char}`);
      if (keyBtn) {
        if (hasBeenGuessed && !isPresentOrCorrectAnywhere) {
          keyBtn.classList.add('fully-absent');
        } else {
          keyBtn.classList.remove('fully-absent');
        }
      }
    }
  },

  updateShortcutsBar() {
    for (let b = 0; b < 8; b++) {
      const btn = document.getElementById(`octordle-shortcut-btn-${b}`);
      if (btn) {
        btn.classList.remove('solved', 'failed');
        if (this.solved[b]) {
          btn.classList.add('solved');
        } else if (this.guesses.length >= 13) {
          btn.classList.add('failed');
        }
      }
    }
  },

  handleInput(char) {
    if (this.status !== 'IN_PROGRESS' || this.isAnimating) return;
    if (this.current.length >= 5) return;
    
    AudioPlayer.playKey();
    this.current += char;
    this.renderBoards();
  },

  handleBackspace() {
    if (this.current.length === 0) return;
    
    AudioPlayer.playClick();
    this.current = this.current.slice(0, -1);
    this.renderBoards();
  },

  submitGuess() {
    if (this.status !== 'IN_PROGRESS' || this.isAnimating) return;
    const guess = this.current;
    
    if (guess.length < 5) {
      showToast('Not enough letters');
      AudioPlayer.playError();
      return;
    }
    
    if (!VALID_GUESSES.has(guess)) {
      showToast('Not in word list');
      AudioPlayer.playError();
      return;
    }
    
    this.guesses.push(guess);
    this.current = '';
    
    // Check solved status for all 8 boards
    this.targets.forEach((tar, idx) => {
      if (guess === tar) {
        this.solved[idx] = true;
      }
    });
    
    const allSolved = this.solved.every(val => val === true);
    this.repaintAll();
    
    this.isAnimating = true;
    setTimeout(() => {
      this.isAnimating = false;
      if (allSolved) {
        this.status = 'WON';
        AudioPlayer.playWin();
        showToast('Victory!');
        this.saveResults();
      } else if (this.guesses.length >= 13) {
        this.status = 'LOST';
        AudioPlayer.playLoss();
        showToast('Failed to solve all boards');
        this.saveResults();
      }
    }, 200);
  },

  saveResults() {
    const mode = GameHubState.gameMode;
    const diff = GameHubState.difficulty;
    const statsObj = GameHubState.stats.octordle[mode][diff];
    
    if (mode === 'daily') {
      statsObj.lastPlayedDay = GameHubState.dailyIndex;
      statsObj.lastResult = this.status;
      statsObj.savedGuesses = [...this.guesses];
    }
    
    statsObj.played++;
    if (this.status === 'WON') {
      statsObj.won++;
      statsObj.currentStreak++;
      if (statsObj.currentStreak > statsObj.maxStreak) statsObj.maxStreak = statsObj.currentStreak;
      statsObj.guessDistribution[this.guesses.length - 1]++;
    } else {
      statsObj.currentStreak = 0;
    }
    saveStats();
    
    setTimeout(() => {
      updateStatsModal();
      openModal(document.getElementById('modal-stats'));
    }, 1200);
  }
};

// ==========================================================================
// GAME 3: Crossword Engine
// ==========================================================================
const CrosswordEngine = {
  size: 10,
  puzzleIndex: 0,
  placedWords: [],
  playerGrid: [], // 2D array of chars typed by player
  gridnums: [],   // 2D grid containing cell clue numbers
  solution: [],   // 2D correct answers grid
  selectedCell: { r: -1, c: -1 },
  selectedDir: 'A', // 'A' (Across) or 'D' (Down)
  isChecked: false,

  start() {
    const mode = GameHubState.gameMode;
    const diff = GameHubState.difficulty;
    
    // Set level index
    if (mode === 'daily') {
      this.puzzleIndex = GameHubState.dailyIndex % 500;
    } else {
      this.puzzleIndex = GameHubState.stats.crossword.practice[diff].levelIndex % 500;
    }
    
    // Load puzzle from database
    const db = diff === 'easy' 
      ? EASY_CROSSWORDS 
      : (diff === 'medium' ? MEDIUM_CROSSWORDS : HARD_CROSSWORDS);
    
    const puzzle = db[this.puzzleIndex];
    this.placedWords = puzzle;
    this.size = diff === 'easy' ? 10 : (diff === 'medium' ? 15 : 25);
    this.isChecked = false;
    this.selectedCell = { r: -1, c: -1 };
    
    // Sync indicator badge
    const badge = document.getElementById('level-indicator');
    badge.classList.remove('hidden');
    badge.innerText = `Level ${this.puzzleIndex + 1}/500`;
    
    // Build grids
    this.solution = Array(this.size).fill(null).map(() => Array(this.size).fill('.'));
    this.gridnums = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.playerGrid = Array(this.size).fill(null).map(() => Array(this.size).fill(''));
    
    // Fill solution grid
    puzzle.forEach((entry) => {
      const len = entry.w.length;
      for (let i = 0; i < len; i++) {
        const curr_r = entry.d === 'D' ? entry.r + i : entry.r;
        const curr_c = entry.d === 'D' ? entry.c : entry.c + i;
        this.solution[curr_r][curr_c] = entry.w[i];
        this.playerGrid[curr_r][curr_c] = ' '; // empty space stands for white playable cell
      }
    });
    
    // Calculate cell clue numbers
    let clueNum = 1;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.solution[r][c] === '.') continue;
        
        // Check if this is the start of any Across or Down word
        let isAcrossStart = puzzle.some(p => p.r === r && p.c === c && p.d === 'A');
        let isDownStart = puzzle.some(p => p.r === r && p.c === c && p.d === 'D');
        
        if (isAcrossStart || isDownStart) {
          this.gridnums[r][c] = clueNum;
          clueNum++;
        }
      }
    }
    
    this.renderBoard();
    this.renderCluesModal();
    this.updateActiveClueLabel();
  },

  renderBoard() {
    const board = document.getElementById('board-crossword');
    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
    
    // Set board sizing based on density
    const cellSize = this.size === 10 ? 32 : (this.size === 15 ? 24 : 15);
    board.style.width = `${this.size * cellSize}px`;
    
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cell = document.createElement('div');
        cell.className = 'crossword-cell';
        cell.id = `crossword-cell-${r}-${c}`;
        cell.dataset.r = r;
        cell.dataset.c = c;
        
        if (this.solution[r][c] === '.') {
          cell.classList.add('black-cell');
        } else {
          // Display clue index numbers in corners
          if (this.gridnums[r][c] > 0) {
            const numLabel = document.createElement('span');
            numLabel.className = 'cell-number';
            numLabel.innerText = this.gridnums[r][c];
            cell.appendChild(numLabel);
          }
          
          // Display current text entered
          const textVal = this.playerGrid[r][c].trim();
          if (textVal) {
            const charSpan = document.createElement('span');
            charSpan.innerText = textVal.toUpperCase();
            cell.appendChild(charSpan);
          }
          
          // Selection highlights
          if (this.selectedCell.r !== -1) {
            if (this.selectedCell.r === r && this.selectedCell.c === c) {
              cell.classList.add('highlight-cell');
            } else if (this.isCellInActiveWord(r, c)) {
              cell.classList.add('highlight-word');
            }
          }
          
          // Check validations styling
          if (this.isChecked && textVal) {
            if (textVal === this.solution[r][c]) {
              cell.classList.add('checked-correct');
            } else {
              cell.classList.add('checked-wrong');
            }
          }
          
          // Double click or tap toggles input directions
          cell.addEventListener('click', (e) => {
            AudioPlayer.playClick();
            this.handleCellSelection(r, c);
          });
        }
        board.appendChild(cell);
      }
    }
  },

  isCellInActiveWord(r, c) {
    const activeWord = this.getActiveWordForSelection();
    if (!activeWord) return false;
    
    const len = activeWord.w.length;
    for (let i = 0; i < len; i++) {
      const wr = activeWord.d === 'D' ? activeWord.r + i : activeWord.r;
      const wc = activeWord.d === 'D' ? activeWord.c : activeWord.c + i;
      if (wr === r && wc === c) return true;
    }
    return false;
  },

  getActiveWordForSelection() {
    if (this.selectedCell.r === -1) return null;
    const r = this.selectedCell.r;
    const c = this.selectedCell.c;
    
    // Find placed word matching selected cell and direction
    let match = this.placedWords.find(p => p.d === this.selectedDir && this.isCellPartOfWord(p, r, c));
    if (!match) {
      // Fallback to alternative direction word
      match = this.placedWords.find(p => this.isCellPartOfWord(p, r, c));
      if (match) this.selectedDir = match.d;
    }
    return match;
  },

  isCellPartOfWord(wordPlacement, r, c) {
    const len = wordPlacement.w.length;
    for (let i = 0; i < len; i++) {
      const wr = wordPlacement.d === 'D' ? wordPlacement.r + i : wordPlacement.r;
      const wc = wordPlacement.d === 'D' ? wordPlacement.c : wordPlacement.c + i;
      if (wr === r && wc === c) return true;
    }
    return false;
  },

  handleCellSelection(r, c) {
    this.isChecked = false;
    
    if (this.selectedCell.r === r && this.selectedCell.c === c) {
      // Toggle typing direction if tapped again
      this.selectedDir = this.selectedDir === 'A' ? 'D' : 'A';
    } else {
      this.selectedCell = { r, c };
      // Choose best direction for selected cell
      const fitsAcross = this.placedWords.some(p => p.d === 'A' && this.isCellPartOfWord(p, r, c));
      const fitsDown = this.placedWords.some(p => p.d === 'D' && this.isCellPartOfWord(p, r, c));
      
      if (fitsAcross && !fitsDown) this.selectedDir = 'A';
      else if (fitsDown && !fitsAcross) this.selectedDir = 'D';
    }
    
    this.renderBoard();
    this.updateActiveClueLabel();
  },

  updateActiveClueLabel() {
    const label = document.getElementById('crossword-active-clue-label');
    const word = this.getActiveWordForSelection();
    
    if (word) {
      const startNum = this.gridnums[word.r][word.c];
      const dirText = word.d === 'A' ? 'Across' : 'Down';
      label.innerHTML = `<strong>${startNum} ${dirText}:</strong> ${word.c}`;
    } else {
      label.innerHTML = 'Tap a white cell to see the clue';
    }
  },

  // Builds the full scroll lists of clues
  renderCluesModal() {
    const acrossList = document.getElementById('clues-across-list');
    const downList = document.getElementById('clues-down-list');
    acrossList.innerHTML = '';
    downList.innerHTML = '';
    
    // Sort words by grid numbering
    const sorted = [...this.placedWords].sort((a,b) => this.gridnums[a.r][a.c] - this.gridnums[b.r][b.c]);
    
    sorted.forEach((entry) => {
      const num = this.gridnums[entry.r][entry.c];
      const li = document.createElement('li');
      li.innerHTML = `<strong>${num}:</strong> ${entry.c}`;
      li.addEventListener('click', () => {
        closeModal(document.getElementById('modal-crossword-clues'));
        this.selectedCell = { r: entry.r, c: entry.c };
        this.selectedDir = entry.d;
        this.renderBoard();
        this.updateActiveClueLabel();
      });
      
      if (entry.d === 'A') acrossList.appendChild(li);
      else downList.appendChild(li);
    });
  },

  handleInput(char) {
    if (this.selectedCell.r === -1) return;
    AudioPlayer.playKey();
    
    const r = this.selectedCell.r;
    const c = this.selectedCell.c;
    this.playerGrid[r][c] = char.toLowerCase();
    
    // Auto advance focus to next letter cell in word
    this.advanceFocus(1);
    this.renderBoard();
  },

  handleBackspace() {
    if (this.selectedCell.r === -1) return;
    AudioPlayer.playClick();
    
    const r = this.selectedCell.r;
    const c = this.selectedCell.c;
    this.playerGrid[r][c] = ' ';
    
    // Auto shift focus backward
    this.advanceFocus(-1);
    this.renderBoard();
  },

  advanceFocus(offset) {
    const word = this.getActiveWordForSelection();
    if (!word) return;
    
    // Find index of current cell in word
    let wordIdx = -1;
    const len = word.w.length;
    for (let i = 0; i < len; i++) {
      const wr = word.d === 'D' ? word.r + i : word.r;
      const wc = word.d === 'D' ? word.c : word.c + i;
      if (wr === this.selectedCell.r && wc === this.selectedCell.c) {
        wordIdx = i;
        break;
      }
    }
    
    const nextIdx = wordIdx + offset;
    if (nextIdx >= 0 && nextIdx < len) {
      this.selectedCell.r = word.d === 'D' ? word.r + nextIdx : word.r;
      this.selectedCell.c = word.d === 'D' ? word.c : word.c + nextIdx;
    }
  },

  // Manual grid arrows controller
  moveSelection(rowOffset, colOffset) {
    if (this.selectedCell.r === -1) return;
    let nextR = this.selectedCell.r + rowOffset;
    let nextC = this.selectedCell.c + colOffset;
    
    if (nextR >= 0 && nextR < this.size && nextC >= 0 && nextC < this.size) {
      if (this.solution[nextR][nextC] !== '.') {
        this.selectedCell = { r: nextR, c: nextC };
        this.renderBoard();
        this.updateActiveClueLabel();
      }
    }
  },

  checkBoard() {
    this.isChecked = true;
    this.renderBoard();
    
    // Verify win
    let allCorrect = true;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.solution[r][c] === '.') continue;
        if (this.playerGrid[r][c].trim() !== this.solution[r][c]) {
          allCorrect = false;
          break;
        }
      }
    }
    
    if (allCorrect) {
      AudioPlayer.playWin();
      showToast('Solved Successfully!');
      this.handleWin();
    } else {
      AudioPlayer.playError();
      showToast('Some cells are incorrect');
    }
  },

  handleWin() {
    const mode = GameHubState.gameMode;
    const diff = GameHubState.difficulty;
    const statObj = GameHubState.stats.crossword[mode][diff];
    
    statObj.played++;
    statObj.won++;
    statObj.currentStreak++;
    if (statObj.currentStreak > statObj.maxStreak) statObj.maxStreak = statObj.currentStreak;
    
    if (mode === 'practice') {
      statObj.levelIndex++; // unlock next level
    }
    saveStats();
    
    setTimeout(() => {
      updateStatsModal();
      openModal(document.getElementById('modal-stats'));
    }, 1200);
  }
};

// ==========================================================================
// GAME 4: Sudoku Engine
// ==========================================================================
const SudokuEngine = {
  puzzleIndex: 0,
  initialBoard: [],  // 2D grid containing original puzzle layout
  playerBoard: [],   // 2D grid tracking player entry values
  solutionBoard: [], // 2D resolved grid answers
  notes: [],         // 3D grid containing Sets of note digits
  selectedCell: { r: -1, c: -1 },
  mistakes: 0,
  notesMode: false,

  start() {
    const mode = GameHubState.gameMode;
    const diff = GameHubState.difficulty;
    
    if (mode === 'daily') {
      this.puzzleIndex = GameHubState.dailyIndex % 500;
    } else {
      this.puzzleIndex = GameHubState.stats.sudoku.practice[diff].levelIndex % 500;
    }
    
    const db = diff === 'easy' 
      ? EASY_SUDOKUS 
      : (diff === 'medium' ? MEDIUM_SUDOKUS : HARD_SUDOKUS);
    
    const puzzleStr = db[this.puzzleIndex];
    this.mistakes = 0;
    this.notesMode = false;
    this.selectedCell = { r: -1, c: -1 };
    
    // Sync indicator badge & Mistakes Counter
    const indicator = document.getElementById('level-indicator');
    indicator.classList.remove('hidden');
    indicator.innerText = `Level ${this.puzzleIndex + 1}/500`;
    
    const mistakesEl = document.getElementById('sudoku-mistakes-counter');
    mistakesEl.classList.remove('hidden');
    mistakesEl.innerText = `Mistakes: 0/3`;
    
    // Parse puzzle layout strings
    this.initialBoard = Array(9).fill(null).map(() => Array(9).fill(0));
    this.playerBoard = Array(9).fill(null).map(() => Array(9).fill(0));
    this.solutionBoard = Array(9).fill(null).map(() => Array(9).fill(0));
    this.notes = Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set()));
    
    const initialPart = puzzleStr.slice(0, 81);
    const solutionPart = puzzleStr.slice(81);
    
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const idx = r * 9 + c;
        const initialVal = parseInt(initialPart[idx]);
        const solutionVal = parseInt(solutionPart[idx]);
        
        this.initialBoard[r][c] = initialVal;
        this.playerBoard[r][c] = initialVal;
        this.solutionBoard[r][c] = solutionVal;
      }
    }
    
    // Reset toggle Notes button styling
    document.getElementById('key-sudoku-notes').classList.remove('active');
    
    this.renderBoard();
  },

  renderBoard() {
    const board = document.getElementById('board-sudoku');
    board.innerHTML = '';
    
    const r = this.selectedCell.r;
    const c = this.selectedCell.c;
    const focusedValue = (r !== -1) ? this.playerBoard[r][c] : 0;
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.id = `sudoku-cell-${row}-${col}`;
        
        // Add divider classes for block borders
        if (row === 2 || row === 5) cell.classList.add('row-divider');
        
        const val = this.playerBoard[row][col];
        const isGiven = this.initialBoard[row][col] > 0;
        
        if (isGiven) {
          cell.classList.add('given');
          cell.innerText = val;
        } else if (val > 0) {
          cell.classList.add('user-entered');
          cell.innerText = val;
          // Check solution match for incorrect values highlight
          if (val !== this.solutionBoard[row][col]) {
            cell.classList.add('incorrect-value');
          }
        } else {
          // Render candidate pencil notes sub-grid
          const notesSet = this.notes[row][col];
          if (notesSet.size > 0) {
            const noteGrid = document.createElement('div');
            noteGrid.className = 'sudoku-cell-note-grid';
            for (let i = 1; i <= 9; i++) {
              const noteDot = document.createElement('span');
              noteDot.className = 'note-digit';
              if (notesSet.has(i)) noteDot.innerText = i;
              noteGrid.appendChild(noteDot);
            }
            cell.appendChild(noteGrid);
          }
        }
        
        // Selection Helpers Highlightings
        if (r !== -1) {
          const isSameRow = (r === row);
          const isSameCol = (c === col);
          const isSameBlock = (Math.floor(r/3) === Math.floor(row/3) && Math.floor(c/3) === Math.floor(col/3));
          
          if (r === row && c === col) {
            cell.classList.add('highlight-selected');
          } else if (isSameRow || isSameCol || isSameBlock || (focusedValue > 0 && val === focusedValue)) {
            cell.classList.add('highlight-cell');
          }
        }
        
        cell.addEventListener('click', () => {
          AudioPlayer.playClick();
          this.selectedCell = { r: row, c: col };
          this.renderBoard();
        });
        
        board.appendChild(cell);
      }
    }
  },

  toggleNotesMode() {
    AudioPlayer.playClick();
    this.notesMode = !this.notesMode;
    const btn = document.getElementById('key-sudoku-notes');
    if (this.notesMode) btn.classList.add('active');
    else btn.classList.remove('active');
  },

  handleInput(num) {
    if (this.selectedCell.r === -1) return;
    const r = this.selectedCell.r;
    const c = this.selectedCell.c;
    
    // Ignore input on given cells
    if (this.initialBoard[r][c] > 0) return;
    
    if (this.notesMode) {
      // Toggle note candidate digit
      if (this.playerBoard[r][c] > 0) {
        this.playerBoard[r][c] = 0;
      }
      const notesSet = this.notes[r][c];
      if (notesSet.has(num)) {
        notesSet.delete(num);
      } else {
        notesSet.add(num);
      }
      AudioPlayer.playKey();
      this.renderBoard();
    } else {
      // Direct number input
      this.notes[r][c].clear();
      this.playerBoard[r][c] = num;
      
      // Validate mistake
      const correctVal = this.solutionBoard[r][c];
      if (num !== correctVal) {
        this.mistakes++;
        document.getElementById('sudoku-mistakes-counter').innerText = `Mistakes: ${this.mistakes}/3`;
        AudioPlayer.playError();
        this.renderBoard();
        
        if (this.mistakes >= 3) {
          setTimeout(() => {
            this.handleSudokuFailure();
          }, 400);
        }
      } else {
        AudioPlayer.playKey();
        this.renderBoard();
        
        // Verify win
        if (this.checkSudokuWin()) {
          AudioPlayer.playWin();
          showToast('Puzzle Solved!');
          this.handleWin();
        }
      }
    }
  },

  eraseCell() {
    if (this.selectedCell.r === -1) return;
    const r = this.selectedCell.r;
    const c = this.selectedCell.c;
    if (this.initialBoard[r][c] > 0) return;
    
    AudioPlayer.playClick();
    this.playerBoard[r][c] = 0;
    this.notes[r][c].clear();
    this.renderBoard();
  },

  checkSudokuWin() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.playerBoard[r][c] !== this.solutionBoard[r][c]) return false;
      }
    }
    return true;
  },

  handleSudokuFailure() {
    openModal(document.getElementById('modal-gameover-prompt'));
    
    // Bind prompt actions
    document.getElementById('btn-prompt-retry').onclick = () => {
      closeModal(document.getElementById('modal-gameover-prompt'));
      this.mistakes = 0;
      document.getElementById('sudoku-mistakes-counter').innerText = `Mistakes: 0/3`;
      // Clear user entries
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          this.playerBoard[r][c] = this.initialBoard[r][c];
          this.notes[r][c].clear();
        }
      }
      this.renderBoard();
    };
    
    document.getElementById('btn-prompt-different').onclick = () => {
      closeModal(document.getElementById('modal-gameover-prompt'));
      
      const mode = GameHubState.gameMode;
      const diff = GameHubState.difficulty;
      if (mode === 'practice') {
        GameHubState.stats.sudoku.practice[diff].levelIndex++;
      } else {
        // Daily wrap
        GameHubState.dailyIndex++;
      }
      startActiveGame();
    };
  },

  handleWin() {
    const mode = GameHubState.gameMode;
    const diff = GameHubState.difficulty;
    const statObj = GameHubState.stats.sudoku[mode][diff];
    
    statObj.played++;
    statObj.won++;
    statObj.currentStreak++;
    if (statObj.currentStreak > statObj.maxStreak) statObj.maxStreak = statObj.currentStreak;
    
    if (mode === 'practice') {
      statObj.levelIndex++; // unlock next level
    }
    saveStats();
    
    setTimeout(() => {
      updateStatsModal();
      openModal(document.getElementById('modal-stats'));
    }, 1200);
  }
};

// ==========================================================================
// Help Modals Content Builders
// ==========================================================================
function openHelpModal() {
  const title = document.getElementById('help-modal-title');
  const body = document.getElementById('help-modal-body');
  
  const game = GameHubState.activeGame;
  if (!game) {
    // Menu rules
    title.innerText = 'Welcome to Gamebox Pro';
    body.innerHTML = `
      <p>Select any game from the main menu and choose a difficulty (Easy, Medium, Hard) to begin.</p>
      <p>All stats and game progresses are stored locally on your device.</p>
      <h3>Offline Access:</h3>
      <p>To play 100% offline, tap the **Download App** prompt or add the page to your Home Screen in iOS Safari.</p>
    `;
  } else if (game === 'wordle') {
    title.innerText = 'How To Play Wordle';
    body.innerHTML = `
      <p>Guess the word in 6 tries. Each guess must be a valid 5-letter word.</p>
      <p>Tile colors change to show proximity to target:</p>
      <ul>
        <li><span style="color:var(--color-correct)">■</span> <strong>Green:</strong> Letter is correct and in the right spot.</li>
        <li><span style="color:var(--color-present)">■</span> <strong>Yellow:</strong> Letter is in the word but in the wrong spot.</li>
        <li><span style="color:var(--color-absent)">■</span> <strong>Gray:</strong> Letter is not in the word.</li>
      </ul>
    `;
  } else if (game === 'octordle') {
    title.innerText = 'How To Play Octordle';
    body.innerHTML = `
      <p>Guess all <strong>8 Wordle words</strong> at the same time in <strong>13 tries</strong>.</p>
      <p>Each guess applies to all 8 boards simultaneously.</p>
      <p>Tap the tiny board cards at the top of the grid to focus on a board and inspect its row guesses.</p>
    `;
  } else if (game === 'crossword') {
    title.innerText = 'How To Play Crossword';
    body.innerHTML = `
      <p>Fill in the blank grids with letters to form intersecting words based on the clues list.</p>
      <p>Tap any cell to display its Across or Down clue in the top bar.</p>
      <p>Click **Check Answers** to verify. Correct letters turn green, wrong cells turn red.</p>
    `;
  } else if (game === 'sudoku') {
    title.innerText = 'How To Play Sudoku';
    body.innerHTML = `
      <p>Fill the 9x9 grid with numbers 1 to 9 so that each row, column, and 3x3 block contains all digits exactly once.</p>
      <p>Toggle **Notes** mode to enter small candidate pencil notes inside blank cells.</p>
      <p style="color:#ef4444"><strong>Rule:</strong> You are allowed a maximum of 3 mistakes. If you reach 3 mistakes, the game ends!</p>
    `;
  }
  
  openModal(document.getElementById('modal-help'));
}

// Bind clues modal
document.getElementById('btn-crossword-clues').addEventListener('click', () => {
  openModal(document.getElementById('modal-crossword-clues'));
});
document.getElementById('btn-close-crossword-clues').addEventListener('click', () => {
  closeModal(document.getElementById('modal-crossword-clues'));
});

// Bind check answers button in Crossword
document.getElementById('btn-crossword-check').addEventListener('click', () => {
  CrosswordEngine.checkBoard();
});

// ==========================================================================
// Stats Dashboard Metrics Setup
// ==========================================================================
function updateStatsModal() {
  const game = GameHubState.activeGame || 'wordle';
  const mode = GameHubState.gameMode;
  const diff = GameHubState.difficulty;
  
  const statObj = GameHubState.stats[game][mode][diff];
  
  // Set titles
  document.getElementById('stats-title').innerText = `${game.toUpperCase()} STATS (${diff.toUpperCase()})`;
  document.getElementById('stat-played').innerText = statObj.played;
  
  const winPct = statObj.played > 0 ? Math.round((statObj.won / statObj.played) * 100) : 0;
  document.getElementById('stat-win-pct').innerText = `${winPct}%`;
  document.getElementById('stat-streak').innerText = statObj.currentStreak;
  document.getElementById('stat-max-streak').innerText = statObj.maxStreak;
  
  // Render bars distributions for Wordle & Octordle
  const dist = document.getElementById('guess-distribution-section');
  const bars = document.getElementById('guess-bars');
  const nextLevelBtn = document.getElementById('btn-next-level');
  const practiceAgainBtn = document.getElementById('btn-practice-again');
  
  nextLevelBtn.classList.add('hidden');
  practiceAgainBtn.classList.add('hidden');
  
  if (game === 'wordle' || game === 'octordle') {
    dist.classList.remove('hidden');
    bars.innerHTML = '';
    
    const rowsCount = game === 'wordle' ? 6 : 13;
    const maxVal = Math.max(1, ...statObj.guessDistribution);
    
    // Choose active match guess highlight
    const guessCount = game === 'wordle' ? WordleEngine.guesses.length : OctordleEngine.guesses.length;
    const isWon = game === 'wordle' ? WordleEngine.status === 'WON' : OctordleEngine.status === 'WON';
    
    for (let i = 0; i < rowsCount; i++) {
      const brow = document.createElement('div');
      brow.className = 'guess-bar-row';
      const count = statObj.guessDistribution[i];
      const pct = Math.round((count / maxVal) * 100);
      const isHigh = isWon && guessCount === (i + 1);
      
      brow.innerHTML = `
        <span class="guess-label">${i+1}</span>
        <div class="guess-track">
          <div class="guess-fill ${isHigh ? 'highlight' : ''}" style="width: ${pct}%">${count}</div>
        </div>
      `;
      bars.appendChild(brow);
    }
  } else {
    // Hide distributions for Sudoku and Crossword
    dist.classList.add('hidden');
  }

  // Next level toggles (Practice mode for Sudoku and Crossword)
  const isGameOver = (game === 'wordle' ? WordleEngine.status !== 'IN_PROGRESS' :
                     (game === 'octordle' ? OctordleEngine.status !== 'IN_PROGRESS' :
                     (game === 'crossword' ? (CrosswordEngine.isChecked && !document.getElementById('modal-stats').classList.contains('hidden')) :
                     (SudokuEngine.checkSudokuWin()))));
                     
  if (isGameOver) {
    if (game === 'sudoku' || game === 'crossword') {
      if (mode === 'practice') {
        nextLevelBtn.classList.remove('hidden');
        nextLevelBtn.onclick = () => {
          closeModal(document.getElementById('modal-stats'));
          startActiveGame();
        };
      } else {
        practiceAgainBtn.classList.remove('hidden');
      }
    } else {
      practiceAgainBtn.classList.remove('hidden');
    }
  }

  // Daily Timer setup
  const timer = document.getElementById('timer-container');
  const share = document.getElementById('share-action-container');
  
  if (mode === 'daily') {
    timer.classList.remove('hidden');
    if (isGameOver) share.classList.remove('hidden');
    else share.classList.add('hidden');
  } else {
    timer.classList.add('hidden');
    share.classList.add('hidden');
  }
}

// Generate share score card
function getShareContent() {
  const game = GameHubState.activeGame;
  const diff = GameHubState.difficulty.toUpperCase();
  const mode = GameHubState.gameMode === 'daily' ? `Daily #${GameHubState.dailyIndex}` : 'Practice';
  
  if (game === 'wordle') {
    const res = WordleEngine.status === 'WON' ? WordleEngine.guesses.length : 'X';
    return `Wordle Pro (${diff}) - ${mode} - ${res}/6\nPlay offline at Gamebox Pro!`;
  } else if (game === 'octordle') {
    const res = OctordleEngine.status === 'WON' ? OctordleEngine.guesses.length : 'X';
    return `Octordle Pro (${diff}) - ${mode} - ${res}/13\nPlay offline at Gamebox Pro!`;
  } else if (game === 'crossword') {
    return `Mini Crossword (${diff}) - ${mode} Solved!\nPlay offline at Gamebox Pro!`;
  } else if (game === 'sudoku') {
    return `Sudoku Master (${diff}) - ${mode} Solved with ${SudokuEngine.mistakes} mistakes!\nPlay offline at Gamebox Pro!`;
  }
  return '';
}
