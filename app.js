// Auto-updater: clears caches and unregisters service workers if the app version has updated
const APP_VERSION = '6.3';
if (localStorage.getItem('gamebox_version') !== APP_VERSION) {
  localStorage.setItem('gamebox_version', APP_VERSION);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        registration.unregister();
      }
      caches.keys().then((names) => {
        for (let name of names) {
          caches.delete(name);
        }
        window.location.reload(true);
      });
    });
  }
}

let deferredPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js?v=6.3')
      .then((reg) => {
        console.log('[Service Worker] Registered:', reg.scope);
        
        // Notify the user when assets are fully pre-cached and ready to play offline
        navigator.serviceWorker.ready.then(() => {
          if (!sessionStorage.getItem('offline_ready_notified')) {
            sessionStorage.setItem('offline_ready_notified', 'true');
            setTimeout(() => {
              showToast('Gamebox Pro is fully loaded! Ready to play offline! ✈️✅');
            }, 1500);
          }
        });
      })
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
    practice: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0], levelIndex: 0, completedLevels: [] }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0], levelIndex: 0, completedLevels: [] }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0], levelIndex: 0, completedLevels: [] } },
    daily: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0], lastPlayedDay: -1, lastResult: null, savedGuesses: [] }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0], lastPlayedDay: -1, lastResult: null, savedGuesses: [] }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0], lastPlayedDay: -1, lastResult: null, savedGuesses: [] } }
  },
  octordle: {
    practice: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: Array(13).fill(0), levelIndex: 0, completedLevels: [] }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: Array(13).fill(0), levelIndex: 0, completedLevels: [] }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: Array(13).fill(0), levelIndex: 0, completedLevels: [] } },
    daily: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: Array(13).fill(0), lastPlayedDay: -1, lastResult: null, savedGuesses: [] }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: Array(13).fill(0), lastPlayedDay: -1, lastResult: null, savedGuesses: [] }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: Array(13).fill(0), lastPlayedDay: -1, lastResult: null, savedGuesses: [] } }
  },
  crossword: {
    practice: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] } },
    daily: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null } }
  },
  sudoku: {
    practice: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] } },
    daily: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null } }
  },
  game2048: {
    practice: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] } },
    daily: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null } }
  },
  chess: {
    practice: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] } },
    daily: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null } }
  },
  ludo: {
    practice: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] } },
    daily: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedDay: -1, lastResult: null } }
  },
  othello: {
    practice: { easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] }, medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] }, hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, levelIndex: 0, completedLevels: [] } },
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
  
  // Delegated Level Indicator Click Handler
  document.getElementById('level-indicator').addEventListener('click', (e) => {
    if (GameHubState.gameMode !== 'practice') return;
    const game = GameHubState.activeGame;
    const diff = GameHubState.difficulty;
    if (!game) return;
    
    const prevBtn = e.target.closest('#btn-level-prev');
    const nextBtn = e.target.closest('#btn-level-next');
    const label = e.target.closest('#level-indicator-label');
    
    let statsObj = GameHubState.stats[game].practice[diff];
    
    if (prevBtn) {
      let lvlIdx = statsObj.levelIndex;
      lvlIdx = (lvlIdx - 1 + 500) % 500;
      statsObj.levelIndex = lvlIdx;
      saveStats();
      startActiveGame();
      AudioPlayer.playClick();
    } else if (nextBtn) {
      let lvlIdx = statsObj.levelIndex;
      lvlIdx = (lvlIdx + 1) % 500;
      statsObj.levelIndex = lvlIdx;
      saveStats();
      startActiveGame();
      AudioPlayer.playClick();
    } else if (label) {
      const currentLvl = ((statsObj ? statsObj.levelIndex : 0) % 500) + 1;
      const input = prompt(`Enter Level Number (1-500):`, currentLvl);
      if (input === null) return;
      
      const lvlNum = parseInt(input, 10);
      if (!isNaN(lvlNum) && lvlNum >= 1 && lvlNum <= 500) {
        GameHubState.stats[game].practice[diff].levelIndex = lvlNum - 1;
        saveStats();
        startActiveGame();
        showToast(`Loaded Level ${lvlNum}`);
      } else {
        showToast('Please enter a valid number from 1 to 500');
      }
    }
  });
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
    for (const game of ['wordle', 'octordle', 'crossword', 'sudoku', 'game2048', 'chess', 'ludo', 'othello']) {
      if (!GameHubState.stats[game]) {
        GameHubState.stats[game] = JSON.parse(JSON.stringify(defaultStatsSchema[game]));
      } else {
        // Ensure levelIndex exists in practice stats for each difficulty
        if (!GameHubState.stats[game].practice) {
          GameHubState.stats[game].practice = JSON.parse(JSON.stringify(defaultStatsSchema[game].practice));
        }
        for (const diff of ['easy', 'medium', 'hard']) {
          if (GameHubState.stats[game].practice[diff]) {
            const lvl = GameHubState.stats[game].practice[diff].levelIndex;
            if (lvl === undefined || isNaN(lvl)) {
              GameHubState.stats[game].practice[diff].levelIndex = 0;
            }
            if (!GameHubState.stats[game].practice[diff].completedLevels) {
              GameHubState.stats[game].practice[diff].completedLevels = [];
            }
          }
        }
      }
    }
  } else {
    GameHubState.stats = JSON.parse(JSON.stringify(defaultStatsSchema));
  }
}

function saveStats() {
  localStorage.setItem('gamebox_pro_stats', JSON.stringify(GameHubState.stats));
}

function updateLevelIndicator() {
  const view = GameHubState.activeGame;
  if (!view || GameHubState.gameMode !== 'practice' || view === 'game2048' || view === 'chess' || view === 'ludo' || view === 'othello') {
    document.getElementById('level-indicator').classList.add('hidden');
    return;
  }
  
  const diff = GameHubState.difficulty;
  const statsObj = GameHubState.stats[view].practice[diff];
  const rawLvlIdx = statsObj ? (statsObj.levelIndex || 0) : 0;
  const lvlIdx = (rawLvlIdx % 500) + 1;
  const isCompleted = statsObj && statsObj.completedLevels && statsObj.completedLevels.includes(rawLvlIdx);
  
  document.getElementById('level-indicator-label').innerText = `Level ${lvlIdx}/500${isCompleted ? ' ✅' : ''}`;
  document.getElementById('level-indicator').classList.remove('hidden');
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
      sudoku: 'SUDOKU<span class="logo-accent">PRO</span>',
      game2048: '2048<span class="logo-accent">PRO</span>',
      chess: 'CHESS<span class="logo-accent">PRO</span>',
      ludo: 'LUDO<span class="logo-accent">PRO</span>',
      othello: 'OTHELLO<span class="logo-accent">PRO</span>'
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
    } else if (view === 'game2048' || view === 'chess' || view === 'ludo' || view === 'othello') {
      qwertyKb.classList.add('hidden');
      numericKb.classList.add('hidden');
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
    
    // Manage level badge and crossword clue bar
    const levelInd = document.getElementById('level-indicator');
    const crosswordClueBar = document.getElementById('crossword-clue-bar');
    const diffTabs = document.querySelector('.difficulty-tabs');
    
    if (view === 'crossword') {
      crosswordClueBar.classList.remove('hidden');
    } else {
      crosswordClueBar.classList.add('hidden');
    }
    
    if (view === 'game2048' || view === 'ludo') {
      if (diffTabs) diffTabs.classList.add('hidden');
    } else {
      if (diffTabs) diffTabs.classList.remove('hidden');
    }
    
    updateLevelIndicator();
    
    document.getElementById('sudoku-mistakes-counter').classList.add('hidden');
    
    startActiveGame();
  }
}

function startActiveGame() {
  GameHubState.dailyIndex = getDailyIndex();
  
  const view = GameHubState.activeGame;
  updateLevelIndicator();
  
  if (GameHubState.activeGame === 'wordle') {
    WordleEngine.start();
  } else if (GameHubState.activeGame === 'octordle') {
    OctordleEngine.start();
  } else if (GameHubState.activeGame === 'crossword') {
    CrosswordEngine.start();
  } else if (GameHubState.activeGame === 'sudoku') {
    SudokuEngine.start();
  } else if (GameHubState.activeGame === 'game2048') {
    Game2048Engine.start();
  } else if (GameHubState.activeGame === 'chess') {
    ChessEngine.start();
  } else if (GameHubState.activeGame === 'ludo') {
    LudoEngine.start();
  } else if (GameHubState.activeGame === 'othello') {
    OthelloEngine.start();
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
      if (card.classList.contains('coming-soon') || !card.dataset.game) return;
      AudioPlayer.playClick();
      showView(card.dataset.game);
    });
  });

  // Category tabs switcher
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      AudioPlayer.playClick();
      
      // Deactivate all tabs
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      // Activate clicked tab
      tab.classList.add('active');
      
      // Hide all categories
      document.querySelectorAll('.dashboard-category').forEach(cat => cat.classList.add('hidden'));
      // Show selected category
      const targetCat = tab.dataset.category;
      const targetElement = document.getElementById(`cat-${targetCat}`);
      if (targetElement) {
        targetElement.classList.remove('hidden');
      }
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

  // Inside-settings links
  document.getElementById('btn-settings-help').addEventListener('click', () => {
    closeModal(document.getElementById('modal-settings'));
    openHelpModal();
  });
  document.getElementById('btn-settings-stats').addEventListener('click', () => {
    closeModal(document.getElementById('modal-settings'));
    updateStatsModal();
    openModal(document.getElementById('modal-stats'));
  });
  
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

  document.getElementById('btn-force-refresh').addEventListener('click', () => {
    AudioPlayer.playClick();
    showToast('Clearing cache and reloading...');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }
    caches.keys().then((names) => {
      for (let name of names) {
        caches.delete(name);
      }
    });
    setTimeout(() => {
      window.location.reload(true);
    }, 600);
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
    } else if (btn.id === 'key-sudoku-undo') {
      SudokuEngine.handleUndo();
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

  // Clear Sudoku active highlights when clicking outside the board or controls
  document.addEventListener('click', (e) => {
    if (GameHubState.activeGame === 'sudoku') {
      const grid = document.getElementById('board-sudoku');
      const keyboard = document.getElementById('keyboard-numeric');
      if (grid && !grid.contains(e.target) && keyboard && !keyboard.contains(e.target)) {
        if (!e.target.closest('.app-header') && !e.target.closest('.game-controls')) {
          SudokuEngine.selectedCell = { r: -1, c: -1 };
          SudokuEngine.renderBoard();
        }
      }
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
      const statsObj = GameHubState.stats.wordle.practice[GameHubState.difficulty];
      const lvlIdx = (statsObj.levelIndex || 0) % list.length;
      this.target = list[lvlIdx];
      
      const isCompleted = statsObj.completedLevels && statsObj.completedLevels.includes(statsObj.levelIndex);
      if (isCompleted) {
        this.guesses = [this.target];
        this.status = 'WON';
        
        // Render instantly
        setTimeout(() => {
          this.guesses.forEach((guess, rowIdx) => {
            const evals = gradeGuess(guess, this.target);
            evals.forEach((state, colIdx) => {
              const tile = document.getElementById(`wordle-tile-${rowIdx}-${colIdx}`);
              if (tile) {
                tile.innerText = guess[colIdx].toUpperCase();
                tile.classList.add(`${state}-state`);
                updateKeyStyle(guess[colIdx], state);
              }
            });
          });
        }, 50);
      }
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
      if (mode === 'practice') {
        if (!statsObj.completedLevels) statsObj.completedLevels = [];
        if (!statsObj.completedLevels.includes(statsObj.levelIndex)) {
          statsObj.completedLevels.push(statsObj.levelIndex);
        }
        statsObj.levelIndex++;
      }
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
      // Practice: sequential 8 words based on levelIndex
      this.targets = [];
      const statsObj = GameHubState.stats.octordle.practice[GameHubState.difficulty];
      const startIdx = ((statsObj.levelIndex || 0) * 8) % list.length;
      for (let i = 0; i < 8; i++) {
        this.targets.push(list[(startIdx + i) % list.length]);
      }
      
      const isCompleted = statsObj.completedLevels && statsObj.completedLevels.includes(statsObj.levelIndex);
      if (isCompleted) {
        this.guesses = [...this.targets];
        this.status = 'WON';
        this.solved = Array(8).fill(true);
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
      if (mode === 'practice') {
        if (!statsObj.completedLevels) statsObj.completedLevels = [];
        if (!statsObj.completedLevels.includes(statsObj.levelIndex)) {
          statsObj.completedLevels.push(statsObj.levelIndex);
        }
        statsObj.levelIndex++;
      }
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

// Dictionary of Indianized clues for common crossword words to make it feel localized
const INDIAN_CLUES = {
  "TEA": "Popular Indian hot beverage, often brewed with milk, ginger, and cardamom (Chai)",
  "CAR": "Common sight on Indian roads, like a Maruti or Tata",
  "CUP": "Vessel used to serve hot tea (chai) or filter coffee",
  "STAR": "Bollywood celebrity, like SRK or Amitabh Bachchan",
  "NATION": "A country, like India",
  "BAND": "Musical group, popular in Indian wedding baraat processions",
  "LONDON": "Capital city of UK, a highly popular travel destination for Indians",
  "CENTRE": "Spelled in British English (used in India) for the middle point of something",
  "RULE": "Regulate or govern (like the British Raj in India before 1947)",
  "LAW": "Legal rules, guarded by the Supreme Court of India in New Delhi",
  "YELLOW": "Vibrant color of turmeric (haldi) used in Indian cooking and wedding rituals",
  "WINDOW": "Casement, or the ticket booking counter at an Indian railway station",
  "HOLIDAY": "A day off work, like Diwali, Eid, or Independence Day in India",
  "MONEY": "Rupees and paisa in India",
  "PUT": "Place or set down (e.g., '___ a bindi on the forehead')",
  "DELHI": "Capital territory of India, famous for historical monuments and street food",
  "MUMBAI": "Gateway of India city, home to Bollywood and local trains",
  "CURRY": "A spiced dish with gravy, staple of Indian cuisine",
  "YOGA": "Ancient Indian physical, mental, and spiritual practice celebrated globally on June 21",
  "BREAD": "Flat staple food like Roti, Naan, or Paratha in Indian households",
  "SWEET": "Traditional Indian dessert like Mithai, Laddu, or Gulab Jamun",
  "HOT": "Spicy, like biryani or street food in India",
  "RED": "Color of the bride's traditional wedding lehenga or sari in India",
  "KING": "Raja or Maharaja, like Akbar or Ashoka in Indian history",
  "QUEEN": "Rani, like Rani Lakshmibai of Jhansi",
  "GOLD": "Precious metal worn as jewelry, highly valued during Indian weddings and Dhanteras",
  "COW": "Revered animal in Indian culture, representing motherly gentleness",
  "COCONUT": "Fruit used in coastal Indian curries and offered in temples during puja",
  "CINEMA": "Popular Indian entertainment, spanning Bollywood, Tollywood, and Kollywood",
  "OCEAN": "Large body of water south of India (___ Ocean)",
  "RICE": "Staple grain eaten with sambar, curry, or dal in South and East India",
  "DANCE": "Classical Indian form like Bharatanatyam, Kathak, or folk forms like Bhangra/Garba",
  "MUSIC": "Art form involving ragas, talas, and instruments like Sitar or Tabla",
  "GARDEN": "Lush park, like the Shalimar Bagh in Kashmir",
  "FORT": "Historical stronghold, like the Red Fort in Delhi or Mehrangarh in Jodhpur",
  "VILLAGE": "Rural settlement where a large portion of the Indian population lives",
  "GUITAR": "Stringed instrument, similar to the classical Indian Sitar or Veena",
  "AWARD": "Honor, like the Bharat Ratna or Padma Shri in India",
  "STONE": "Carved material of ancient Indian temples, like Ajanta and Ellora caves",
  "DRY": "Arid region, like the Thar Desert in Rajasthan",
  "BAG": "Jute or cotton sack, commonly used for shopping in Indian local markets (bazaars)",
  "GIFT": "Shorthand for present, often exchanged during Diwali, Rakhi, or weddings",
  "STREET": "Roadway, often filled with street food vendors (thelas) in Indian cities",
  "JUNE": "Summer month when the monsoon rains start arriving in India",
  "WED": "To marry, leading to grand multi-day celebrations in India",
  "MAP": "Geographical layout, showing the states and union territories of India",
  "HEART": "Dil, often romanticized in Bollywood movie songs",
  "VIA": "By way of (e.g., traveling from Pune to Mumbai ___ Express Highway)",
  "FIVE": "Number of rivers in Punjab ('Land of Five Rivers')",
  "PEACOCK": "National bird of India, famous for its majestic tail feathers",
  "TIGER": "Bengal ___, the majestic national animal of India",
  "MANGO": "National fruit of India, highly anticipated summer treat",
  "CHAI": "Popular Indian spiced milk tea",
  "DIWALI": "Indian festival of lights, celebrating the return of Lord Rama",
  "HOLI": "Indian festival of colors, celebrating spring and love",
  "CRICKET": "Sport followed like a religion in India",
  "RUPEE": "Official currency symbol ₹ of India",
  "GANGA": "Holy river of India, flowing from the Himalayas to the Bay of Bengal",
  "RAGA": "Melodic framework in classical Indian music",
  "SAMOSA": "Triangular fried pastry filled with spiced potatoes, a classic Indian snack",
  "NAAN": "Leavened flatbread cooked in a tandoor clay oven",
  "TAJ": "Famous monument in Agra, Taj Mahal"
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
    
    // Create a deep copy of the puzzle to safely modify clues without altering the database array
    const puzzle = JSON.parse(JSON.stringify(db[this.puzzleIndex]));
    
    // Dynamically replace clues with localized Indianized definitions if word matches
    puzzle.forEach((entry) => {
      const upperWord = entry.w.toUpperCase();
      if (INDIAN_CLUES[upperWord]) {
        entry.cl = INDIAN_CLUES[upperWord];
      }
    });

    this.placedWords = puzzle;
    this.size = diff === 'easy' ? 10 : (diff === 'medium' ? 15 : 25);
    this.isChecked = false;
    this.selectedCell = { r: -1, c: -1 };
    
    // Sync indicator badge
    updateLevelIndicator();
    
    // Build grids
    this.solution = Array(this.size).fill(null).map(() => Array(this.size).fill('.'));
    this.gridnums = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.playerGrid = Array(this.size).fill(null).map(() => Array(this.size).fill(''));
    
    const isCompleted = mode === 'practice' && 
                        GameHubState.stats.crossword.practice[diff].completedLevels && 
                        GameHubState.stats.crossword.practice[diff].completedLevels.includes(this.puzzleIndex);

    // Fill solution grid
    puzzle.forEach((entry) => {
      const len = entry.w.length;
      for (let i = 0; i < len; i++) {
        const curr_r = entry.d === 'D' ? entry.r + i : entry.r;
        const curr_c = entry.d === 'D' ? entry.c : entry.c + i;
        this.solution[curr_r][curr_c] = entry.w[i];
        this.playerGrid[curr_r][curr_c] = isCompleted ? entry.w[i] : ' '; // Fill with solution if completed
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
        
        // Fix aspect-ratio collapse in Safari by explicitly setting size
        cell.style.width = `${cellSize}px`;
        cell.style.height = `${cellSize}px`;
        
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
          const isCorrectWord = this.isCellPartOfCorrectWord(r, c);
          if (isCorrectWord) {
            cell.classList.add('checked-correct');
          } else if (this.isChecked && textVal) {
            if (textVal.toUpperCase() === this.solution[r][c].toUpperCase()) {
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
          cell.addEventListener('touchstart', (e) => {
            e.preventDefault();
            AudioPlayer.playClick();
            this.handleCellSelection(r, c);
          }, { passive: false });
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

  isCellPartOfCorrectWord(r, c) {
    return this.placedWords.some((word) => {
      if (!this.isCellPartOfWord(word, r, c)) return false;
      const len = word.w.length;
      for (let i = 0; i < len; i++) {
        const wr = word.d === 'D' ? word.r + i : word.r;
        const wc = word.d === 'D' ? word.c : word.c + i;
        if (!this.playerGrid[wr] || this.playerGrid[wr][wc] === undefined || this.playerGrid[wr][wc].trim().toUpperCase() !== word.w[i].toUpperCase()) {
          return false;
        }
      }
      return true;
    });
  },

  handleCellSelection(r, c) {
    try {
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
    } catch (e) {
      console.error('[Crossword Selection Error]:', e);
      showToast('Selection error: ' + e.message);
    }
  },

  updateActiveClueLabel() {
    const label = document.getElementById('crossword-active-clue-label');
    const word = this.getActiveWordForSelection();
    
    if (word) {
      const startNum = this.gridnums[word.r][word.c];
      const dirText = word.d === 'A' ? 'Across' : 'Down';
      label.innerHTML = `<strong>${startNum} ${dirText}:</strong> ${word.cl}`;
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
      li.innerHTML = `<strong>${num}:</strong> ${entry.cl}`;
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

  isSolved() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.solution[r][c] === '.') continue;
        if (!this.playerGrid[r] || !this.playerGrid[r][c] || this.playerGrid[r][c].trim().toUpperCase() !== this.solution[r][c].toUpperCase()) {
          return false;
        }
      }
    }
    return true;
  },

  handleInput(char) {
    if (this.isSolved()) return;
    if (this.selectedCell.r === -1) return;
    AudioPlayer.playKey();
    
    const r = this.selectedCell.r;
    const c = this.selectedCell.c;
    this.playerGrid[r][c] = char.toLowerCase();
    
    // Auto advance focus to next letter cell in word
    this.advanceFocus(1);
    this.renderBoard();
    this.checkWinOnInput();
  },

  handleBackspace() {
    if (this.isSolved()) return;
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
    
    // Skip already correct cells when advancing
    let nextIdx = wordIdx;
    for (let steps = 0; steps < len; steps++) {
      nextIdx += offset;
      if (nextIdx < 0 || nextIdx >= len) break;
      
      const wr = word.d === 'D' ? word.r + nextIdx : word.r;
      const wc = word.d === 'D' ? word.c : word.c + nextIdx;
      
      if (!this.isCellPartOfCorrectWord(wr, wc)) {
        this.selectedCell.r = wr;
        this.selectedCell.c = wc;
        return;
      }
    }
    
    // Fallback: move to boundary
    const boundIdx = wordIdx + offset;
    if (boundIdx >= 0 && boundIdx < len) {
      this.selectedCell.r = word.d === 'D' ? word.r + boundIdx : word.r;
      this.selectedCell.c = word.d === 'D' ? word.c : word.c + boundIdx;
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

  checkWinOnInput() {
    let allCorrect = true;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.solution[r][c] === '.') continue;
        if (this.playerGrid[r][c].trim().toUpperCase() !== this.solution[r][c].toUpperCase()) {
          allCorrect = false;
          break;
        }
      }
    }
    if (allCorrect) {
      AudioPlayer.playWin();
      showToast('Solved Successfully!');
      this.handleWin();
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
        if (this.playerGrid[r][c].trim().toUpperCase() !== this.solution[r][c].toUpperCase()) {
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
      if (!statObj.completedLevels) statObj.completedLevels = [];
      if (!statObj.completedLevels.includes(statObj.levelIndex)) {
        statObj.completedLevels.push(statObj.levelIndex);
      }
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
  history: [],       // stack of board states for Undo functionality

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
    this.history = [];
    
    // Sync indicator badge & Mistakes Counter
    updateLevelIndicator();
    
    const mistakesEl = document.getElementById('sudoku-mistakes-counter');
    mistakesEl.classList.remove('hidden');
    mistakesEl.innerText = `Mistakes: 0/3`;
    
    const isCompleted = mode === 'practice' && 
                        GameHubState.stats.sudoku.practice[diff].completedLevels && 
                        GameHubState.stats.sudoku.practice[diff].completedLevels.includes(this.puzzleIndex);

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
        this.playerBoard[r][c] = isCompleted ? solutionVal : initialVal; // Fill with solution if completed
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
          const isValueMatch = (focusedValue > 0 && val === focusedValue);
          
          if (r === row && c === col) {
            cell.classList.add('highlight-selected');
          } else if (isValueMatch) {
            cell.classList.add('highlight-match');
          } else if ((isSameRow || isSameCol || isSameBlock) && !isGiven) {
            cell.classList.add('highlight-related');
          }
        }
        
        cell.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent document click listener from immediately unselecting
          AudioPlayer.playClick();
          this.selectedCell = { r: row, c: col };
          this.renderBoard();
        });
        
        board.appendChild(cell);
      }
    }
  },

  pushHistory() {
    this.history.push({
      playerBoard: this.playerBoard.map(row => [...row]),
      notes: this.notes.map(row => row.map(set => new Set(set))),
      mistakes: this.mistakes
    });
    if (this.history.length > 50) this.history.shift();
  },

  handleUndo() {
    if (this.checkSudokuWin()) return;
    if (this.history.length === 0) return;
    AudioPlayer.playClick();
    const prev = this.history.pop();
    this.playerBoard = prev.playerBoard;
    this.notes = prev.notes;
    this.mistakes = prev.mistakes;
    
    const mistakesEl = document.getElementById('sudoku-mistakes-counter');
    mistakesEl.innerText = `Mistakes: ${this.mistakes}/3`;
    
    this.renderBoard();
  },

  toggleNotesMode() {
    if (this.checkSudokuWin()) return;
    AudioPlayer.playClick();
    this.notesMode = !this.notesMode;
    const btn = document.getElementById('key-sudoku-notes');
    if (this.notesMode) btn.classList.add('active');
    else btn.classList.remove('active');
  },

  handleInput(num) {
    if (this.checkSudokuWin()) return;
    if (this.selectedCell.r === -1) return;
    const r = this.selectedCell.r;
    const c = this.selectedCell.c;
    
    // Ignore input on given cells
    if (this.initialBoard[r][c] > 0) return;
    
    this.pushHistory();
    
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
    if (this.checkSudokuWin()) return;
    if (this.selectedCell.r === -1) return;
    const r = this.selectedCell.r;
    const c = this.selectedCell.c;
    if (this.initialBoard[r][c] > 0) return;
    
    this.pushHistory();
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

  // Next level toggles (Practice mode for Sudoku, Crossword, and 2048)
  const isGameOver = (game === 'wordle' ? WordleEngine.status !== 'IN_PROGRESS' :
                     (game === 'octordle' ? OctordleEngine.status !== 'IN_PROGRESS' :
                     (game === 'crossword' ? (CrosswordEngine.isChecked && !document.getElementById('modal-stats').classList.contains('hidden')) :
                     (game === 'sudoku' ? SudokuEngine.checkSudokuWin() :
                     (game === 'game2048' ? Game2048Engine.isGameOver :
                     (game === 'chess' ? !ChessEngine.timerInterval :
                     (game === 'ludo' ? LudoEngine.isGameOver :
                     (game === 'othello' ? OthelloEngine.isGameOver : false))))))));
                     
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
  } else if (game === 'game2048') {
    const res = Game2048Engine.isGameWon ? 'WON' : 'FAILED';
    return `2048 Classic (${diff}) - ${mode} - ${res} with score ${Game2048Engine.score}!\nPlay offline at Gamebox Pro!`;
  }
  return '';
}

// ==========================================================================
// GAME 5: 2048 Engine
// ==========================================================================
const Game2048Engine = {
  grid: [],      // 4x4 grid array of numbers (0 for empty)
  score: 0,
  bestScore: 0,
  isGameOver: false,
  reached2048: false,
  swipeStartX: 0,
  swipeStartY: 0,

  start() {
    // Load best score from local storage
    this.bestScore = parseInt(localStorage.getItem('gamebox_2048_best') || '0', 10);
    document.getElementById('game2048-best').textContent = this.bestScore;

    this.initGame();
    
    // Show toast for level target
    showToast("Welcome to 2048 Classic! 🎯");
  },

  initGame() {
    this.grid = Array(4).fill(null).map(() => Array(4).fill(0));
    this.score = 0;
    this.isGameOver = false;
    this.reached2048 = false;
    
    document.getElementById('game2048-score').textContent = '0';
    
    // Add two random tiles
    this.addRandomTile();
    this.addRandomTile();
    
    this.render();
    this.setupListeners();
  },

  addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }
    if (emptyCells.length > 0) {
      const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      // 90% chance of 2, 10% chance of 4
      this.grid[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
    }
  },

  render() {
    const container = document.getElementById('tiles-container-2048');
    container.innerHTML = '';
    
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = this.grid[r][c];
        if (val > 0) {
          const tile = document.createElement('div');
          tile.className = `tile-2048 tile-2048-${val}`;
          tile.textContent = val;
          
          // Calculate grid positioning (percentage based for perfect responsiveness)
          tile.style.top = `${r * 25}%`;
          tile.style.left = `${c * 25}%`;
          
          container.appendChild(tile);
        }
      }
    }
  },

  // Setup input listeners (keyboard, swipe, dpad)
  listenersBound: false,
  setupListeners() {
    if (this.listenersBound) return;
    this.listenersBound = true;

    // Keyboard Arrow Keys / WASD
    window.addEventListener('keydown', (e) => {
      if (GameHubState.activeGame !== 'game2048' || this.isGameOver) return;
      
      let moved = false;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          moved = this.moveUp();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          moved = this.moveDown();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          moved = this.moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          moved = this.moveRight();
          break;
        default:
          return; // Ignore other keys
      }

      if (moved) {
        e.preventDefault();
        this.afterMove();
      }
    });

    // Touch Swipe gestures
    const board = document.getElementById('board-2048');
    board.addEventListener('touchstart', (e) => {
      if (GameHubState.activeGame !== 'game2048' || this.isGameOver) return;
      this.swipeStartX = e.touches[0].clientX;
      this.swipeStartY = e.touches[0].clientY;
    }, { passive: true });

    board.addEventListener('touchend', (e) => {
      if (GameHubState.activeGame !== 'game2048' || this.isGameOver) return;
      
      const diffX = e.changedTouches[0].clientX - this.swipeStartX;
      const diffY = e.changedTouches[0].clientY - this.swipeStartY;
      
      // Minimum swipe distance threshold
      const threshold = 30;
      let moved = false;
      
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (Math.abs(diffX) > threshold) {
          if (diffX > 0) {
            moved = this.moveRight();
          } else {
            moved = this.moveLeft();
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(diffY) > threshold) {
          if (diffY > 0) {
            moved = this.moveDown();
          } else {
            moved = this.moveUp();
          }
        }
      }

      if (moved) {
        this.afterMove();
      }
    }, { passive: true });

    // D-Pad Click Handlers
    document.getElementById('dpad-up').addEventListener('click', () => this.handleDpadMove('up'));
    document.getElementById('dpad-down').addEventListener('click', () => this.handleDpadMove('down'));
    document.getElementById('dpad-left').addEventListener('click', () => this.handleDpadMove('left'));
    document.getElementById('dpad-right').addEventListener('click', () => this.handleDpadMove('right'));
    document.getElementById('dpad-restart').addEventListener('click', () => {
      AudioPlayer.playClick();
      this.initGame();
    });
  },

  handleDpadMove(dir) {
    if (GameHubState.activeGame !== 'game2048' || this.isGameOver) return;
    
    let moved = false;
    if (dir === 'up') moved = this.moveUp();
    else if (dir === 'down') moved = this.moveDown();
    else if (dir === 'left') moved = this.moveLeft();
    else if (dir === 'right') moved = this.moveRight();

    if (moved) {
      this.afterMove();
    }
  },

  afterMove() {
    AudioPlayer.playClick();
    this.addRandomTile();
    this.render();
    
    // Update Score UI
    document.getElementById('game2048-score').textContent = this.score;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('gamebox_2048_best', this.bestScore);
      document.getElementById('game2048-best').textContent = this.bestScore;
    }

    // Check Win/Loss states
    this.checkGameStatus();
  },

  // Slide & Merge Logic
  slideAndMergeLine(line) {
    let compressed = line.filter(val => val > 0);
    let mergedLine = [];
    let movedOrMerged = false;

    for (let i = 0; i < compressed.length; i++) {
      if (i < compressed.length - 1 && compressed[i] === compressed[i+1]) {
        const mergedVal = compressed[i] * 2;
        mergedLine.push(mergedVal);
        this.score += mergedVal;
        i++; // skip next tile
        movedOrMerged = true;
      } else {
        mergedLine.push(compressed[i]);
      }
    }

    while (mergedLine.length < 4) {
      mergedLine.push(0);
    }

    for (let i = 0; i < 4; i++) {
      if (line[i] !== mergedLine[i]) {
        movedOrMerged = true;
      }
    }

    return { line: mergedLine, changed: movedOrMerged };
  },

  moveLeft() {
    let anyChanged = false;
    for (let r = 0; r < 4; r++) {
      const res = this.slideAndMergeLine(this.grid[r]);
      this.grid[r] = res.line;
      if (res.changed) anyChanged = true;
    }
    return anyChanged;
  },

  moveRight() {
    let anyChanged = false;
    for (let r = 0; r < 4; r++) {
      const reversed = [...this.grid[r]].reverse();
      const res = this.slideAndMergeLine(reversed);
      this.grid[r] = res.line.reverse();
      if (res.changed) anyChanged = true;
    }
    return anyChanged;
  },

  moveUp() {
    let anyChanged = false;
    for (let c = 0; c < 4; c++) {
      const column = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c]];
      const res = this.slideAndMergeLine(column);
      for (let r = 0; r < 4; r++) {
        this.grid[r][c] = res.line[r];
      }
      if (res.changed) anyChanged = true;
    }
    return anyChanged;
  },

  moveDown() {
    let anyChanged = false;
    for (let c = 0; c < 4; c++) {
      const column = [this.grid[3][c], this.grid[2][c], this.grid[1][c], this.grid[0][c]];
      const res = this.slideAndMergeLine(column);
      const reversedLine = res.line.reverse();
      for (let r = 0; r < 4; r++) {
        this.grid[r][c] = reversedLine[r];
      }
      if (res.changed) anyChanged = true;
    }
    return anyChanged;
  },

  checkGameStatus() {
    // 1. Check if reached 2048 for the first time in this game
    if (!this.reached2048) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (this.grid[r][c] === 2048) {
            this.reached2048 = true;
            showToast("You reached the 2048 tile! 🏆 Keep playing to beat your high score! 🎉");
          }
        }
      }
    }

    // 2. Check empty cells
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === 0) return;
      }
    }

    // 3. Check adjacent matching numbers
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = this.grid[r][c];
        if (r < 3 && val === this.grid[r+1][c]) return;
        if (c < 3 && val === this.grid[r][c+1]) return;
      }
    }

    // No moves possible -> Game Over
    this.isGameOver = true;
    setTimeout(() => {
      showToast("No moves left! Game Over. 😢");
    }, 400);
  }
};

// ==========================================================================
// GAME 6: Chess Engine
// ==========================================================================
const chessWorkerCode = `
  importScripts('https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js');

  const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

  const pawnPST = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ];
  const knightPST = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ];
  const bishopPST = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ];

  function evaluateBoard(game) {
    let totalScore = 0;
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = board[r][c];
        if (cell) {
          let score = pieceValues[cell.type];
          if (cell.type === 'p') {
            score += cell.color === 'w' ? pawnPST[r][c] : pawnPST[7 - r][c];
          } else if (cell.type === 'n') {
            score += knightPST[r][c];
          } else if (cell.type === 'b') {
            score += bishopPST[r][c];
          }
          if (cell.color === 'w') {
            totalScore += score;
          } else {
            totalScore -= score;
          }
        }
      }
    }
    return game.turn() === 'w' ? totalScore : -totalScore;
  }

  function orderMoves(moves) {
    const pVals = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    return moves.map(m => {
      let score = 0;
      if (m.captured) {
        score += 1000 + (pVals[m.captured] * 10) - pVals[m.piece];
      }
      if (m.flags.includes('p')) score += 900;
      if (m.flags.includes('+')) score += 100;
      return { move: m, score: score };
    })
    .sort((a, b) => b.score - a.score)
    .map(x => x.move);
  }

  function minimax(game, depth, alpha, beta, isMaximizing, elo) {
    if (depth === 0) {
      let val = evaluateBoard(game);
      if (elo === 1300) {
        val += (Math.random() * 80) - 40;
      }
      return val;
    }
    let moves = game.moves({ verbose: true });
    if (moves.length === 0) {
      if (game.in_checkmate()) {
        return isMaximizing ? -50000 : 50000;
      }
      return 0;
    }
    moves = orderMoves(moves);
    if (isMaximizing) {
      let bestValue = -999999;
      for (let i = 0; i < moves.length; i++) {
        game.move(moves[i]);
        bestValue = Math.max(bestValue, minimax(game, depth - 1, alpha, beta, false, elo));
        game.undo();
        alpha = Math.max(alpha, bestValue);
        if (beta <= alpha) break;
      }
      return bestValue;
    } else {
      let bestValue = 999999;
      for (let i = 0; i < moves.length; i++) {
        game.move(moves[i]);
        bestValue = Math.min(bestValue, minimax(game, depth - 1, alpha, beta, true, elo));
        game.undo();
        beta = Math.min(beta, bestValue);
        if (beta <= alpha) break;
      }
      return bestValue;
    }
  }

  self.onmessage = function(e) {
    const { fen, elo } = e.data;
    const game = new Chess(fen);
    let moves = game.moves({ verbose: true });
    if (moves.length === 0) {
      self.postMessage(null);
      return;
    }
    moves = orderMoves(moves);
    const depth = elo === 1300 ? 2 : (elo === 1800 ? 3 : 4);
    let bestMove = moves[0];
    let bestValue = -999999;
    let alpha = -999999;
    let beta = 999999;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      game.move(move);
      const boardValue = -minimax(game, depth - 1, -beta, -alpha, false, elo);
      game.undo();
      if (boardValue > bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
      alpha = Math.max(alpha, boardValue);
    }

    self.postMessage({ from: bestMove.from, to: bestMove.to, promotion: bestMove.promotion });
  };
`;

const ChessEngine = {
  game: null,       // chess.js Chess object instance
  elo: 1300,
  timerInterval: null,
  whiteTime: 300,
  blackTime: 300,
  increment: 3,
  activePlayer: 'w',
  selectedSquare: null,
  lastMove: null,
  worker: null,

  start() {
    this.showSetup();
    this.setupListeners();
    this.initWorker();
  },

  initWorker() {
    if (this.worker) {
      this.worker.terminate();
    }
    const blob = new Blob([chessWorkerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
  },

  showSetup() {
    document.getElementById('chess-setup').classList.remove('hidden');
    document.getElementById('chess-play').classList.add('hidden');
  },

  setupListeners() {
    // Tab selectors in setup card
    const eloTabs = document.querySelectorAll('#chess-setup .selector-tabs button');
    eloTabs.forEach(tab => {
      tab.onclick = (e) => {
        AudioPlayer.playClick();
        eloTabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.elo = parseInt(e.target.dataset.elo, 10);
      };
    });

    const presetSelect = document.getElementById('chess-preset-select');
    presetSelect.onchange = (e) => {
      AudioPlayer.playClick();
      const val = e.target.value;
      const customDiv = document.getElementById('chess-custom-time-inputs');
      if (val === 'custom') {
        customDiv.classList.remove('hidden');
      } else {
        customDiv.classList.add('hidden');
      }
    };

    document.getElementById('btn-chess-start').onclick = () => {
      AudioPlayer.playClick();
      this.initGame();
    };

    document.getElementById('btn-chess-resign').onclick = () => {
      AudioPlayer.playClick();
      this.endGame('resign');
    };

    document.getElementById('btn-chess-abort').onclick = () => {
      AudioPlayer.playClick();
      this.endGame('abort');
    };
  },

  initGame() {
    // 1. Determine clock settings
    const preset = document.getElementById('chess-preset-select').value;
    let mins = 5;
    let inc = 3;

    if (preset === 'custom') {
      mins = parseInt(document.getElementById('chess-custom-mins').value, 10) || 10;
      inc = parseInt(document.getElementById('chess-custom-inc').value, 10) || 0;
    } else {
      const parts = preset.split('+');
      mins = parseInt(parts[0], 10);
      inc = parseInt(parts[1], 10);
    }

    this.whiteTime = mins * 60;
    this.blackTime = mins * 60;
    this.increment = inc;
    this.activePlayer = 'w';
    this.selectedSquare = null;
    this.lastMove = null;
    
    // Initialize chess.js
    if (typeof Chess === 'function') {
      this.game = new Chess();
    } else {
      showToast("Error: Chess engine did not load correctly. Reloading...");
      return;
    }

    // Set bot difficulty display label
    document.getElementById('chess-opponent-name').innerText = `Bot (${this.elo} ELO)`;

    // Update Clocks display
    this.updateClockDisplay('w');
    this.updateClockDisplay('b');

    // Switch view
    document.getElementById('chess-setup').classList.add('hidden');
    document.getElementById('chess-play').classList.remove('hidden');

    this.renderBoard();
    this.startClock();
  },

  renderBoard() {
    const boardEl = document.getElementById('board-chess');
    boardEl.innerHTML = '';
    
    const boardState = this.game.board(); // 8x8 array of cells
    const fileNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    // Render from White's perspective (row 8 to 1, col a to h)
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const squareEl = document.createElement('div');
        const squareColorClass = (r + c) % 2 === 0 ? 'light' : 'dark';
        squareEl.className = `chess-square ${squareColorClass}`;
        
        const squareName = fileNames[c] + (8 - r);
        squareEl.dataset.square = squareName;

        // Render file coordinates inside the bottom row cells (row r = 7)
        if (r === 7) {
          const fileLabel = document.createElement('span');
          fileLabel.className = 'chess-coordinate file-coordinate';
          fileLabel.innerText = fileNames[c];
          squareEl.appendChild(fileLabel);
        }

        // Render rank coordinates inside the right column cells (col c = 7)
        if (c === 7) {
          const rankLabel = document.createElement('span');
          rankLabel.className = 'chess-coordinate rank-coordinate';
          rankLabel.innerText = 8 - r;
          squareEl.appendChild(rankLabel);
        }

        const cell = boardState[r][c];
        if (cell) {
          const pieceEl = document.createElement('div');
          pieceEl.className = `chess-piece ${cell.color === 'w' ? 'white-piece' : 'black-piece'}`;
          
          const imgEl = document.createElement('img');
          imgEl.src = `https://lichess1.org/assets/piece/cburnett/${cell.color}${cell.type.toUpperCase()}.svg`;
          imgEl.alt = `${cell.color === 'w' ? 'White' : 'Black'} ${cell.type.toUpperCase()}`;
          imgEl.draggable = false;
          pieceEl.appendChild(imgEl);
          squareEl.appendChild(pieceEl);
        }

        // Selected highlight
        if (this.selectedSquare === squareName) {
          squareEl.classList.add('selected');
        }

        // Last move highlight
        if (this.lastMove && (this.lastMove.from === squareName || this.lastMove.to === squareName)) {
          squareEl.classList.add('last-move');
        }

        // Possible valid moves dot indicators
        if (this.selectedSquare) {
          const moves = this.game.moves({ square: this.selectedSquare, verbose: true });
          const isPossible = moves.some(m => m.to === squareName);
          if (isPossible) {
            const hasOppPiece = cell && cell.color !== this.game.turn();
            if (hasOppPiece) {
              squareEl.classList.add('valid-capture');
            } else {
              squareEl.classList.add('valid-dot');
            }
          }
        }

        // Square click logic
        squareEl.onclick = () => this.handleSquareClick(squareName);

        boardEl.appendChild(squareEl);
      }
    }
  },

  handleSquareClick(square) {
    if (this.game.game_over() || this.activePlayer !== 'w') return;

    const piece = this.game.get(square);

    if (this.selectedSquare === square) {
      // Deselect
      this.selectedSquare = null;
      AudioPlayer.playClick();
      this.renderBoard();
      return;
    }

    if (piece && piece.color === 'w') {
      // Select White piece
      this.selectedSquare = square;
      AudioPlayer.playClick();
      this.renderBoard();
    } else if (this.selectedSquare) {
      // Attempt move to destination square
      const moves = this.game.moves({ square: this.selectedSquare, verbose: true });
      const move = moves.find(m => m.to === square);

      if (move) {
        // Trigger move
        const moveDetails = {
          from: this.selectedSquare,
          to: square
        };

        // Pawn promotion auto-queen for simple playability
        if (move.flags.includes('p')) {
          moveDetails.promotion = 'q';
        }

        const result = this.game.move(moveDetails);
        if (result) {
          AudioPlayer.playClick();
          this.lastMove = { from: moveDetails.from, to: moveDetails.to };
          this.selectedSquare = null;
          this.renderBoard();

          // Add increment and toggle player
          this.whiteTime += this.increment;
          this.updateClockDisplay('w');

          this.checkGameOverState();

          if (!this.game.game_over()) {
            this.activePlayer = 'b';
            setTimeout(() => this.triggerBotMove(), 300);
          }
        }
      } else {
        // Clicked invalid destination -> clear selection
        this.selectedSquare = null;
        AudioPlayer.playClick();
        this.renderBoard();
      }
    }
  },

  triggerBotMove() {
    if (this.game.game_over()) return;

    this.updateStatusText(`Bot (${this.elo} ELO) is thinking...`);

    // Post game state to background thread Worker
    this.worker.postMessage({ fen: this.game.fen(), elo: this.elo });

    this.worker.onmessage = (e) => {
      const bestMove = e.data;
      if (bestMove) {
        const moveDetails = {
          from: bestMove.from,
          to: bestMove.to
        };
        if (bestMove.promotion) {
          moveDetails.promotion = bestMove.promotion;
        }

        const result = this.game.move(moveDetails);
        if (result) {
          AudioPlayer.playClick();
          this.lastMove = { from: moveDetails.from, to: moveDetails.to };
          this.selectedSquare = null;
          this.renderBoard();

          // Add increment and toggle player
          this.blackTime += this.increment;
          this.updateClockDisplay('b');

          this.checkGameOverState();

          if (!this.game.game_over()) {
            this.activePlayer = 'w';
            this.updateStatusText("Your turn!");
          }
        }
      }
    };
  },

  startClock() {
    this.stopClock();
    this.timerInterval = setInterval(() => {
      if (this.activePlayer === 'w') {
        this.whiteTime--;
        this.updateClockDisplay('w');
        if (this.whiteTime <= 0) {
          this.endGame('timeout-black');
        }
      } else {
        this.blackTime--;
        this.updateClockDisplay('b');
        if (this.blackTime <= 0) {
          this.endGame('timeout-white');
        }
      }
    }, 1000);
  },

  stopClock() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  updateClockDisplay(color) {
    const time = color === 'w' ? this.whiteTime : this.blackTime;
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    const clockEl = document.getElementById(color === 'w' ? 'chess-player-clock' : 'chess-opponent-clock');
    clockEl.innerText = formatted;

    if (time <= 20) {
      clockEl.classList.add('low-time');
    } else {
      clockEl.classList.remove('low-time');
    }
  },

  checkGameOverState() {
    if (this.game.game_over()) {
      this.stopClock();
      if (this.game.in_checkmate()) {
        const winner = this.game.turn() === 'w' ? 'Black' : 'White';
        showToast(`Checkmate! ${winner} wins the game! 🏆`);
        this.saveStats(winner === 'White');
      } else if (this.game.in_draw() || this.game.in_stalemate() || this.game.in_threefold_repetition()) {
        showToast("Game ended in a Draw! 🤝");
        this.saveStats(false, true);
      }
    }
  },

  endGame(type) {
    this.stopClock();
    if (type === 'resign') {
      showToast("You resigned! Black wins. 🏳️");
      this.saveStats(false);
    } else if (type === 'abort') {
      showToast("Game aborted.");
    } else if (type === 'timeout-black') {
      showToast("White flagged! Black wins on time. ⏱️");
      this.saveStats(false);
    } else if (type === 'timeout-white') {
      showToast("Black flagged! White wins on time! 🏆");
      this.saveStats(true);
    }
    setTimeout(() => this.showSetup(), 2000);
  },

  saveStats(playerWon, isDraw = false) {
    const diff = GameHubState.difficulty; // easy, medium, hard
    const practiceObj = GameHubState.stats.chess.practice[diff];
    practiceObj.played++;
    if (playerWon) practiceObj.won++;
    saveStats();
  }
};

// ==========================================================================
// GAME 7: Ludo Engine
// ==========================================================================
// ==========================================================================
// LUDO RETRO AUDIO SYNTHESIZER
// ==========================================================================
const LudoAudioSynth = {
  ctx: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playDice() {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(130, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, this.ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) { console.warn(e); }
  },
  playHop() {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(840, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.002, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) { console.warn(e); }
  },
  playCapture() {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.002, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) { console.warn(e); }
  },
  playHome() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.06, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.15);
      });
    } catch (e) { console.warn(e); }
  },
  playWin() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const melody = [
        { f: 523.25, d: 0.15 },
        { f: 587.33, d: 0.15 },
        { f: 659.25, d: 0.15 },
        { f: 783.99, d: 0.25 },
        { f: 659.25, d: 0.15 },
        { f: 783.99, d: 0.50 }
      ];
      let time = now;
      melody.forEach((note) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, time);
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + note.d);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + note.d);
        time += note.d * 0.8;
      });
    } catch (e) { console.warn(e); }
  }
};

const LudoEngine = {
  playerCount: 2,   // 2 or 4 players
  diceValue: 1,
  hasRolled: false,
  activeColor: 'red', // red, green, yellow, blue
  turnOrder: ['red', 'green', 'yellow', 'blue'],
  timerValue: 15,
  turnTimerId: null,
  isGameOver: false,
  consecutiveSixes: 0,
  tokens: {
    red: [{ id: 0, pos: -1 }, { id: 1, pos: -1 }, { id: 2, pos: -1 }, { id: 3, pos: -1 }],
    green: [{ id: 0, pos: -1 }, { id: 1, pos: -1 }, { id: 2, pos: -1 }, { id: 3, pos: -1 }],
    yellow: [{ id: 0, pos: -1 }, { id: 1, pos: -1 }, { id: 2, pos: -1 }, { id: 3, pos: -1 }],
    blue: [{ id: 0, pos: -1 }, { id: 1, pos: -1 }, { id: 2, pos: -1 }, { id: 3, pos: -1 }]
  },
  
  // Safe cell coordinates (classic Ludo stars/bases)
  safePositions: [0, 8, 13, 21, 26, 34, 39, 47],

  // Track map (coordinates on 15x15 Ludo board)
  trackCoords: [
    { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 },
    { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
    { r: 0, c: 7 },
    { r: 0, c: 8 }, { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
    { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
    { r: 7, c: 14 },
    { r: 8, c: 14 }, { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 },
    { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
    { r: 14, c: 7 },
    { r: 14, c: 6 }, { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 },
    { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
    { r: 7, c: 0 }, { r: 6, c: 0 }
  ],

  // Base coordinates mapping for tokens (4 tokens inside each home base)
  baseCoords: {
    red: [{ r: 2, c: 2 }, { r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 3 }],
    green: [{ r: 2, c: 11 }, { r: 2, c: 12 }, { r: 3, c: 11 }, { r: 3, c: 12 }],
    yellow: [{ r: 11, c: 11 }, { r: 11, c: 12 }, { r: 12, c: 11 }, { r: 12, c: 12 }],
    blue: [{ r: 11, c: 2 }, { r: 11, c: 3 }, { r: 12, c: 2 }, { r: 12, c: 3 }]
  },

  // Color start paths offsets (where each player starts on track)
  startTrackIndices: {
    red: 0,
    green: 13,
    yellow: 26,
    blue: 39
  },

  // Color home paths coordinates (5 home path cells + 1 center cell)
  homeCoords: {
    red: [{ r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 6 }],
    green: [{ r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }, { r: 6, c: 7 }],
    yellow: [{ r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }, { r: 7, c: 8 }],
    blue: [{ r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }, { r: 8, c: 7 }]
  },

  start() {
    this.showSetup();
    this.setupListeners();
  },

  showSetup() {
    this.stopTurnTimer();
    document.getElementById('ludo-setup').classList.remove('hidden');
    document.getElementById('ludo-play').classList.add('hidden');
  },

  setupListeners() {
    const tabs = document.querySelectorAll('#ludo-setup .selector-tabs button');
    tabs.forEach(tab => {
      tab.onclick = (e) => {
        AudioPlayer.playClick();
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.playerCount = parseInt(e.target.dataset.players, 10);
      };
    });

    document.getElementById('btn-ludo-start').onclick = () => {
      AudioPlayer.playClick();
      this.initGame();
    };

    document.getElementById('btn-ludo-quit').onclick = () => {
      AudioPlayer.playClick();
      this.showSetup();
    };

    document.getElementById('btn-ludo-roll').onclick = () => {
      this.rollDice();
    };
  },

  initGame() {
    this.hasRolled = false;
    this.diceValue = 1;
    this.activeColor = 'red';
    this.isGameOver = false;
    this.consecutiveSixes = 0;
    this.turnOrder = this.playerCount === 2 ? ['red', 'green'] : ['red', 'green', 'yellow', 'blue'];

    // Setup player cards text/avatars (Ludo King look)
    document.querySelector('#ludo-card-red .ludo-name').innerText = 'Red (You)';
    document.querySelector('#ludo-card-red .ludo-avatar').innerText = '🧑‍💻';
    
    document.querySelector('#ludo-card-green .ludo-name').innerText = 'Green (CPU 1)';
    document.querySelector('#ludo-card-green .ludo-avatar').innerText = '🤖';
    
    document.querySelector('#ludo-card-yellow .ludo-name').innerText = 'Yellow (CPU 2)';
    document.querySelector('#ludo-card-yellow .ludo-avatar').innerText = '👽';
    
    document.querySelector('#ludo-card-blue .ludo-name').innerText = 'Blue (CPU 3)';
    document.querySelector('#ludo-card-blue .ludo-avatar').innerText = '👾';

    for (const color of ['red', 'green', 'yellow', 'blue']) {
      this.tokens[color] = [
        { id: 0, pos: -1, isHopping: false },
        { id: 1, pos: -1, isHopping: false },
        { id: 2, pos: -1, isHopping: false },
        { id: 3, pos: -1, isHopping: false }
      ];
    }
    this.updateDiceSlotFace(1);
    const diceSlot = document.getElementById('ludo-dice-central');
    if (diceSlot) {
      diceSlot.classList.remove('active-roll');
      diceSlot.onclick = null;
    }

    document.getElementById('ludo-setup').classList.add('hidden');
    document.getElementById('ludo-play').classList.remove('hidden');

    this.renderBoard();
    this.startPlayerTurn();
  },

  startPlayerTurn() {
    this.hasRolled = false;
    document.getElementById('btn-ludo-roll').disabled = this.activeColor !== 'red';

    // Highlight active card
    for (const col of ['red', 'green', 'yellow', 'blue']) {
      const card = document.getElementById(`ludo-card-${col}`);
      if (card) {
        card.classList.remove('active');
        if (this.playerCount === 2 && (col === 'yellow' || col === 'blue')) {
          card.classList.add('inactive');
        } else {
          card.classList.remove('inactive');
        }
      }
    }

    const diceSlot = document.getElementById('ludo-dice-central');
    if (diceSlot) {
      diceSlot.classList.remove('active-roll');
      diceSlot.onclick = null;
    }

    document.getElementById(`ludo-card-${this.activeColor}`).classList.add('active');

    // Make the central dice display the current color styling and update face to last rolled or default
    this.updateDiceSlotFace(this.diceValue);

    if (this.activeColor === 'red') {
      this.updateStatusText("Your turn! Tap the glowing dice or Roll button.");
      if (diceSlot) {
        diceSlot.classList.add('active-roll');
        diceSlot.onclick = () => this.rollDice();
      }
    } else {
      this.updateStatusText(`${this.activeColor.toUpperCase()} (CPU) is thinking...`);
      setTimeout(() => this.rollDice(), 1200);
    }

    this.startTurnTimer();
  },

  startTurnTimer() {
    this.stopTurnTimer();
    this.timerValue = 15;
    this.updateTimerBars();

    this.turnTimerId = setInterval(() => {
      this.timerValue--;
      this.updateTimerBars();
      if (this.timerValue <= 0) {
        this.stopTurnTimer();
        this.handleTimeout();
      }
    }, 1000);
  },

  stopTurnTimer() {
    if (this.turnTimerId) {
      clearInterval(this.turnTimerId);
      this.turnTimerId = null;
    }
  },

  updateTimerBars() {
    for (const col of ['red', 'green', 'yellow', 'blue']) {
      const fillEl = document.getElementById(`ludo-timer-${col}`);
      if (fillEl) fillEl.style.width = '0%';
    }
    const activeFill = document.getElementById(`ludo-timer-${this.activeColor}`);
    if (activeFill) {
      const pct = (this.timerValue / 15) * 100;
      activeFill.style.width = `${pct}%`;
      if (this.timerValue > 8) {
        activeFill.style.backgroundColor = '#10b981';
      } else if (this.timerValue > 4) {
        activeFill.style.backgroundColor = '#f59e0b';
      } else {
        activeFill.style.backgroundColor = '#ef4444';
      }
    }
  },

  handleTimeout() {
    if (this.isGameOver) return;
    if (!this.hasRolled) {
      // Auto roll
      this.rollDice();
    } else {
      // Auto move first available piece
      const moves = this.tokens[this.activeColor].filter(t => this.canMoveToken(this.activeColor, t, this.diceValue));
      if (moves.length > 0) {
        this.executeMove(this.activeColor, moves[0], this.diceValue);
      } else {
        this.passTurn();
      }
    }
  },

  rollDice() {
    if (this.hasRolled) return;
    this.hasRolled = true;
    this.stopTurnTimer();

    document.getElementById('btn-ludo-roll').disabled = true;
    const diceSlot = document.getElementById('ludo-dice-central');
    if (diceSlot) {
      diceSlot.classList.remove('active-roll');
      diceSlot.classList.add('active-roll');
    }

    LudoAudioSynth.playDice();

    // Spin faces during rolling (Ludo King look)
    let spinInterval = setInterval(() => {
      this.updateDiceSlotFace(Math.floor(Math.random() * 6) + 1);
    }, 60);

    setTimeout(() => {
      clearInterval(spinInterval);
      if (diceSlot) {
        diceSlot.classList.remove('active-roll');
      }

      this.diceValue = Math.floor(Math.random() * 6) + 1;
      this.updateDiceSlotFace(this.diceValue);

      // Check consecutive 6s
      if (this.diceValue === 6) {
        this.consecutiveSixes++;
        if (this.consecutiveSixes === 3) {
          showToast(`Three 6s rolled in a row! Turn passes. 🛑`);
          this.updateStatusText(`Three 6s! Pass turn.`);
          setTimeout(() => this.passTurn(), 1500);
          return;
        }
      } else {
        this.consecutiveSixes = 0;
      }

      const moves = this.tokens[this.activeColor].filter(t => this.canMoveToken(this.activeColor, t, this.diceValue));

      if (moves.length === 0) {
        this.updateStatusText(`${this.activeColor.toUpperCase()} rolled a ${this.diceValue}. No moves!`);
        setTimeout(() => this.passTurn(), 1500);
      } else if (moves.length === 1) {
        // Auto-move single legal option
        if (this.activeColor === 'red') {
          this.updateStatusText(`Auto-moving your only valid piece!`);
          this.renderBoard();
          setTimeout(() => this.executeMove(this.activeColor, moves[0], this.diceValue), 700);
        } else {
          this.updateStatusText(`${this.activeColor.toUpperCase()} auto-moving...`);
          setTimeout(() => this.executeMove(this.activeColor, moves[0], this.diceValue), 700);
        }
      } else {
        if (this.activeColor === 'red') {
          this.updateStatusText(`You rolled a ${this.diceValue}! Select a token.`);
          this.renderBoard();
          this.startTurnTimer();
        } else {
          this.updateStatusText(`${this.activeColor.toUpperCase()} rolled a ${this.diceValue}. Deciding...`);
          setTimeout(() => this.makeComputerMove(moves), 1000);
        }
      }
    }, 500);
  },

  canMoveToken(color, token, steps) {
    if (token.pos === 57) return false;
    if (token.pos === -1) {
      return steps === 6;
    }
    const targetPos = token.pos + steps;
    return targetPos <= 57;
  },

  moveTokenPlayer(token) {
    this.stopTurnTimer();
    this.executeMove(this.activeColor, token, this.diceValue);
  },

  makeComputerMove(validTokens) {
    let chosenToken = validTokens[0];
    for (const t of validTokens) {
      const targetPos = this.calculateTargetPosition(this.activeColor, t, this.diceValue);
      if (this.wouldCaptureOpponent(targetPos, this.activeColor)) {
        chosenToken = t;
        break;
      }
    }
    if (this.diceValue === 6) {
      const baseToken = validTokens.find(t => t.pos === -1);
      if (baseToken) chosenToken = baseToken;
    }
    this.executeMove(this.activeColor, chosenToken, this.diceValue);
  },

  calculateTargetPosition(color, token, steps) {
    if (token.pos === -1) return this.startTrackIndices[color];
    return token.pos + steps;
  },

  wouldCaptureOpponent(targetPos, color) {
    if (targetPos >= 52) return false;
    if (this.safePositions.includes(targetPos)) return false;
    for (const col of this.turnOrder) {
      if (col === color) continue;
      if (this.tokens[col].some(t => t.pos === targetPos)) return true;
    }
    return false;
  },

  executeMove(color, token, steps) {
    this.animateTokenMove(color, token, steps, () => {
      this.checkTokenCaptures(color, token.pos);
      this.renderBoard();

      if (this.checkPlayerWin(color)) {
        this.isGameOver = true;
        this.stopTurnTimer();
        LudoAudioSynth.playWin();
        showToast(`Congratulations! ${color.toUpperCase()} wins the Ludo game! 🏆🎉`);
        this.saveStats(color === 'red');
        setTimeout(() => this.showSetup(), 4000);
        return;
      }

      if (steps === 6) {
        this.updateStatusText(`${color.toUpperCase()} rolled a 6 and gets another roll!`);
        setTimeout(() => this.startPlayerTurn(), 800);
      } else {
        this.passTurn();
      }
    });
  },

  animateTokenMove(color, token, steps, callback) {
    if (token.pos === -1) {
      token.pos = this.startTrackIndices[color];
      LudoAudioSynth.playHop();
      this.renderBoard();
      setTimeout(callback, 250);
      return;
    }

    let remainingSteps = steps;
    const stepInterval = () => {
      if (remainingSteps <= 0) {
        callback();
        return;
      }
      token.pos++;
      token.isHopping = true;
      LudoAudioSynth.playHop();
      this.renderBoard();
      
      setTimeout(() => {
        token.isHopping = false;
        remainingSteps--;
        stepInterval();
      }, 220);
    };
    stepInterval();
  },

  checkTokenCaptures(color, pos) {
    if (pos >= 52 || pos === -1) return;
    if (this.safePositions.includes(pos)) return;

    let captured = false;
    for (const col of this.turnOrder) {
      if (col === color) continue;
      this.tokens[col].forEach(t => {
        if (t.pos === pos) {
          t.pos = -1; // Fly back to base
          captured = true;
        }
      });
    }
    if (captured) {
      LudoAudioSynth.playCapture();
      showToast(`Boom! ${color.toUpperCase()} captured an opponent token! 💥`);
    }
  },

  checkPlayerWin(color) {
    return this.tokens[color].every(t => t.pos === 57);
  },

  passTurn() {
    this.stopTurnTimer();
    this.consecutiveSixes = 0;
    const currentIdx = this.turnOrder.indexOf(this.activeColor);
    const nextIdx = (currentIdx + 1) % this.turnOrder.length;
    this.activeColor = this.turnOrder[nextIdx];
    this.startPlayerTurn();
  },

  renderBoard() {
    const boardEl = document.getElementById('board-ludo');
    boardEl.innerHTML = '';

    // Step 1: Render the static board elements (excluding bases & center finish)
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        // Skip base quadrants (rendered as solid containers)
        if (r < 6 && c < 6) continue;
        if (r < 6 && c > 8) continue;
        if (r > 8 && c < 6) continue;
        if (r > 8 && c > 8) continue;

        // Skip center finish (rendered as diagonal triangles)
        if (r >= 6 && r <= 8 && c >= 6 && c <= 8) continue;

        const cellEl = document.createElement('div');
        cellEl.className = 'ludo-cell';
        cellEl.dataset.r = r;
        cellEl.dataset.c = c;

        // Safe star tiles
        if ((r === 6 && c === 1) || (r === 8 && c === 13) || (r === 1 && c === 8) || (r === 13 && c === 6)) {
          cellEl.classList.add('star-cell');
        }
        if ((r === 2 && c === 6) || (r === 6 && c === 12) || (r === 8 && c === 2) || (r === 12 && c === 8)) {
          cellEl.classList.add('star-cell');
        }

        // Home path inner colors
        if (r === 7 && c > 0 && c < 6) cellEl.classList.add('red-home-inner');
        else if (c === 7 && r > 0 && r < 6) cellEl.classList.add('green-home-inner');
        else if (r === 7 && c > 8 && c < 14) cellEl.classList.add('yellow-home-inner');
        else if (c === 7 && r > 8 && r < 14) cellEl.classList.add('blue-home-inner');

        // Main entry cells for each color with arrows
        if (r === 6 && c === 1) cellEl.classList.add('red-bg', 'start-arrow', 'red-start');
        else if (r === 1 && c === 8) cellEl.classList.add('green-bg', 'start-arrow', 'green-start');
        else if (r === 8 && c === 13) cellEl.classList.add('yellow-bg', 'start-arrow', 'yellow-start');
        else if (r === 13 && c === 6) cellEl.classList.add('blue-bg', 'start-arrow', 'blue-start');

        boardEl.appendChild(cellEl);
      }
    }

    // Step 2: Render solid bases (Ludo King look)
    boardEl.appendChild(this.createBaseElement('red'));
    boardEl.appendChild(this.createBaseElement('green'));
    boardEl.appendChild(this.createBaseElement('yellow'));
    boardEl.appendChild(this.createBaseElement('blue'));

    // Step 3: Render diagonal center finish meeting triangles
    const centerEl = document.createElement('div');
    centerEl.className = 'ludo-center-finish';

    const triGreen = document.createElement('div');
    triGreen.className = 'center-tri tri-green';
    triGreen.dataset.r = 6;
    triGreen.dataset.c = 7;

    const triYellow = document.createElement('div');
    triYellow.className = 'center-tri tri-yellow';
    triYellow.dataset.r = 7;
    triYellow.dataset.c = 8;

    const triBlue = document.createElement('div');
    triBlue.className = 'center-tri tri-blue';
    triBlue.dataset.r = 8;
    triBlue.dataset.c = 7;

    const triRed = document.createElement('div');
    triRed.className = 'center-tri tri-red';
    triRed.dataset.r = 7;
    triRed.dataset.c = 6;

    centerEl.appendChild(triGreen);
    centerEl.appendChild(triYellow);
    centerEl.appendChild(triBlue);
    centerEl.appendChild(triRed);

    boardEl.appendChild(centerEl);

    // Step 4: Inject active tokens stacked
    this.renderTokens();
  },

  createBaseElement(color) {
    const baseEl = document.createElement('div');
    baseEl.className = `ludo-base ${color}-base`;

    const innerEl = document.createElement('div');
    innerEl.className = 'ludo-base-inner';

    const coords = this.baseCoords[color];
    coords.forEach(coord => {
      const slotEl = document.createElement('div');
      slotEl.className = 'ludo-base-slot';
      slotEl.dataset.r = coord.r;
      slotEl.dataset.c = coord.c;

      const dotEl = document.createElement('div');
      dotEl.className = `ludo-base-dot dot-${color}`;
      slotEl.appendChild(dotEl);

      innerEl.appendChild(slotEl);
    });

    baseEl.appendChild(innerEl);
    return baseEl;
  },

  updateDiceSlotFace(value) {
    const diceSlot = document.getElementById('ludo-dice-central');
    if (diceSlot) {
      diceSlot.className = 'ludo-dice-slot';
      if (this.activeColor) {
        diceSlot.classList.add(`${this.activeColor}-glow`);
      }
      diceSlot.innerHTML = `
        <div class="dice-dots-grid val-${value}">
          <div class="dot dot-1"></div><div class="dot dot-2"></div><div class="dot dot-3"></div>
          <div class="dot dot-4"></div><div class="dot dot-5"></div><div class="dot dot-6"></div>
          <div class="dot dot-7"></div><div class="dot dot-8"></div><div class="dot dot-9"></div>
        </div>
      `;
    }
  },

  renderTokens() {
    const boardEl = document.getElementById('board-ludo');
    const coordMap = {};

    for (const color of this.turnOrder) {
      const playerTokens = this.tokens[color];
      playerTokens.forEach(t => {
        const coord = this.getTokenCoords(color, t);
        if (coord) {
          const key = `${coord.r}_${coord.c}`;
          if (!coordMap[key]) coordMap[key] = [];
          coordMap[key].push({ token: t, color: color });
        }
      });
    }

    Object.keys(coordMap).forEach(key => {
      const list = coordMap[key];
      const [r, c] = key.split('_').map(Number);
      const cellEl = boardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
      if (cellEl) {
        const slotEl = cellEl.querySelector('.ludo-base-slot') || cellEl;
        list.forEach((item, index) => {
          const t = item.token;
          const col = item.color;
          const tokenEl = document.createElement('div');
          tokenEl.className = `ludo-token ${col}-token`;
          tokenEl.dataset.tokenId = t.id;
          tokenEl.dataset.color = col;

          if (t.isHopping) {
            tokenEl.classList.add('hopping');
          }
          if (list.length > 1) {
            tokenEl.classList.add(`offset-${index}`);
          }

          if (this.activeColor === 'red' && col === 'red' && this.hasRolled && this.canMoveToken(col, t, this.diceValue)) {
            tokenEl.classList.add('highlight-move');
            tokenEl.onclick = (e) => {
              e.stopPropagation();
              this.moveTokenPlayer(t);
            };
          }

          slotEl.appendChild(tokenEl);
        });
      }
    });
  },

  getTokenCoords(color, token) {
    if (token.pos === -1) {
      return this.baseCoords[color][token.id];
    } else if (token.pos >= 52) {
      const homeIdx = token.pos - 52;
      return this.homeCoords[color][homeIdx];
    } else {
      return this.trackCoords[token.pos];
    }
  },

  updateStatusText(txt) {
    document.getElementById('ludo-turn-indicator').innerText = txt;
  },

  saveStats(playerWon) {
    const practiceObj = GameHubState.stats.ludo.practice.easy;
    practiceObj.played++;
    if (playerWon) practiceObj.won++;
    saveStats();
  }
};

// ==========================================================================
// GAME 8: Othello Engine
// ==========================================================================
const OthelloEngine = {
  board: [], // 8x8 matrix representing cells (0: empty, 1: Black player, 2: White bot)
  botDiff: 'easy',
  activePlayer: 1, // 1 for Black (You), 2 for White (Bot)
  isGameOver: false,

  start() {
    this.showSetup();
    this.setupListeners();
  },

  showSetup() {
    document.getElementById('othello-setup').classList.remove('hidden');
    document.getElementById('othello-play').classList.add('hidden');
  },

  setupListeners() {
    const tabs = document.querySelectorAll('#othello-setup .selector-tabs button');
    tabs.forEach(tab => {
      tab.onclick = (e) => {
        AudioPlayer.playClick();
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.botDiff = e.target.dataset.diff;
      };
    });

    document.getElementById('btn-othello-start').onclick = () => {
      AudioPlayer.playClick();
      this.initGame();
    };

    document.getElementById('btn-othello-quit').onclick = () => {
      AudioPlayer.playClick();
      this.showSetup();
    };

    document.getElementById('btn-othello-restart').onclick = () => {
      AudioPlayer.playClick();
      this.initGame();
    };
  },

  initGame() {
    this.isGameOver = false;
    this.activePlayer = 1; // Black always goes first
    
    // Create empty board
    this.board = Array(8).fill(null).map(() => Array(8).fill(0));
    
    // Standard Othello starting configuration
    this.board[3][3] = 2; // White
    this.board[3][4] = 1; // Black
    this.board[4][3] = 1; // Black
    this.board[4][4] = 2; // White

    document.getElementById('othello-setup').classList.add('hidden');
    document.getElementById('othello-play').classList.remove('hidden');

    this.renderBoard();
    this.updateScorePillHighlights();
  },

  renderBoard() {
    const boardEl = document.getElementById('board-othello');
    boardEl.innerHTML = '';

    const validMoves = this.getValidMoves(this.activePlayer);

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const squareEl = document.createElement('div');
        squareEl.className = 'othello-square';
        squareEl.dataset.r = r;
        squareEl.dataset.c = c;

        const cell = this.board[r][c];

        if (cell > 0) {
          const discEl = document.createElement('div');
          discEl.className = `othello-disc ${cell === 1 ? 'black-piece' : 'white-piece'}`;
          squareEl.appendChild(discEl);
        }

        // Highlight valid movements for player
        if (this.activePlayer === 1 && validMoves.some(m => m.r === r && m.c === c)) {
          squareEl.classList.add('valid-othello-move');
          squareEl.onclick = () => this.handleSquareClick(r, c, validMoves);
        }

        boardEl.appendChild(squareEl);
      }
    }

    this.updateScoreDisplay();
  },

  handleSquareClick(r, c, validMoves) {
    if (this.activePlayer !== 1 || this.isGameOver) return;

    const move = validMoves.find(m => m.r === r && m.c === c);
    if (!move) return;

    this.executeMove(r, c, move.flips, 1);
    AudioPlayer.playClick();

    this.renderBoard();

    // Check next player's turns
    setTimeout(() => this.togglePlayerTurn(), 500);
  },

  executeMove(r, c, flips, player) {
    this.board[r][c] = player;

    // Flip sandwiched opponent discs
    flips.forEach(coord => {
      this.board[coord.r][coord.c] = player;
      
      // Animate disc flips inside UI
      const squareEl = document.querySelector(`.othello-square[data-r="${coord.r}"][data-c="${coord.c}"]`);
      if (squareEl) {
        const disc = squareEl.querySelector('.othello-disc');
        if (disc) {
          disc.classList.add('flipping');
          setTimeout(() => {
            disc.className = `othello-disc ${player === 1 ? 'black-piece' : 'white-piece'}`;
          }, 300);
        }
      }
    });
  },

  togglePlayerTurn() {
    const nextPlayer = this.activePlayer === 1 ? 2 : 1;
    const nextValid = this.getValidMoves(nextPlayer);

    if (nextValid.length > 0) {
      this.activePlayer = nextPlayer;
      this.renderBoard();
      this.updateScorePillHighlights();

      if (this.activePlayer === 2) {
        // Trigger Bot move automatically
        setTimeout(() => this.triggerBotMove(nextValid), 600);
      }
    } else {
      // Pass turn back to current player if opponent has no valid moves
      const currentValid = this.getValidMoves(this.activePlayer);
      if (currentValid.length > 0) {
        showToast(`${nextPlayer === 1 ? 'BLACK' : 'WHITE'} has no valid moves. Pass!`);
        this.renderBoard();
      } else {
        // Neither player has valid moves left -> Game Over
        this.endGame();
      }
    }
  },

  triggerBotMove(validMoves) {
    if (this.isGameOver) return;

    let chosenMove = null;

    if (this.botDiff === 'easy') {
      // Easy AI -> Picks the move that captures the most pieces immediately (Greedy strategy)
      validMoves.sort((a, b) => b.flips.length - a.flips.length);
      chosenMove = validMoves[0];
    } else if (this.botDiff === 'medium') {
      // Medium AI -> Depth 2 search prioritizing corners
      chosenMove = this.getBestBotMove(2, validMoves);
    } else {
      // Hard AI -> Depth 4 search valuing corner stability and mobility
      chosenMove = this.getBestBotMove(4, validMoves);
    }

    if (chosenMove) {
      this.executeMove(chosenMove.r, chosenMove.c, chosenMove.flips, 2);
      AudioPlayer.playClick();
      this.renderBoard();
      
      setTimeout(() => this.togglePlayerTurn(), 500);
    }
  },

  // Simple Minimax search for Othello AI
  getBestBotMove(depth, validMoves) {
    let bestMove = validMoves[0];
    let bestVal = -999999;

    for (const move of validMoves) {
      // Make move
      const originalBoard = this.board.map(row => [...row]);
      this.board[move.r][move.c] = 2;
      move.flips.forEach(f => this.board[f.r][f.c] = 2);

      const val = -this.minimaxOthello(depth - 1, -999999, 999999, false);
      
      // Undo move
      this.board = originalBoard;

      if (val > bestVal) {
        bestVal = val;
        bestMove = move;
      }
    }
    return bestMove;
  },

  minimaxOthello(depth, alpha, beta, isMaximizing) {
    if (depth === 0) {
      return this.evaluateOthelloBoard();
    }

    const player = isMaximizing ? 2 : 1;
    const moves = this.getValidMoves(player);

    if (moves.length === 0) {
      const oppMoves = this.getValidMoves(3 - player);
      if (oppMoves.length === 0) {
        // Terminal node -> Game Over scoring
        const scores = this.getScores();
        return isMaximizing ? (scores.white - scores.black) * 1000 : (scores.black - scores.white) * 1000;
      }
      return -this.minimaxOthello(depth - 1, alpha, beta, !isMaximizing);
    }

    if (isMaximizing) {
      let maxVal = -999999;
      for (const m of moves) {
        const originalBoard = this.board.map(row => [...row]);
        this.board[m.r][m.c] = 2;
        m.flips.forEach(f => this.board[f.r][f.c] = 2);

        maxVal = Math.max(maxVal, this.minimaxOthello(depth - 1, alpha, beta, false));
        this.board = originalBoard;
        alpha = Math.max(alpha, maxVal);
        if (beta <= alpha) break;
      }
      return maxVal;
    } else {
      let minVal = 999999;
      for (const m of moves) {
        const originalBoard = this.board.map(row => [...row]);
        this.board[m.r][m.c] = 1;
        m.flips.forEach(f => this.board[f.r][f.c] = 1);

        minVal = Math.min(minVal, this.minimaxOthello(depth - 1, alpha, beta, true));
        this.board = originalBoard;
        beta = Math.min(beta, minVal);
        if (beta <= alpha) break;
      }
      return minVal;
    }
  },

  evaluateOthelloBoard() {
    // Positional value weights matrix. Corners and edges are highly valuable in Othello
    const weights = [
      [100, -20,  10,   5,   5,  10, -20, 100],
      [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
      [ 10,  -2,   5,   1,   1,   5,  -2,  10],
      [  5,  -2,   1,   1,   1,   1,  -2,   5],
      [  5,  -2,   1,   1,   1,   1,  -2,   5],
      [ 10,  -2,   5,   1,   1,   5,  -2,  10],
      [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
      [100, -20,  10,   5,   5,  10, -20, 100]
    ];

    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.board[r][c] === 2) { // Bot
          score += weights[r][c];
        } else if (this.board[r][c] === 1) { // Player
          score -= weights[r][c];
        }
      }
    }
    return score;
  },

  getScores() {
    let black = 0;
    let white = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.board[r][c] === 1) black++;
        else if (this.board[r][c] === 2) white++;
      }
    }
    return { black, white };
  },

  updateScoreDisplay() {
    const scores = this.getScores();
    document.getElementById('othello-score-black').innerText = scores.black;
    document.getElementById('othello-score-white').innerText = scores.white;
  },

  updateScorePillHighlights() {
    const blackPill = document.getElementById('othello-black-score-card');
    const whitePill = document.getElementById('othello-white-score-card');

    if (this.activePlayer === 1) {
      blackPill.classList.add('active');
      whitePill.classList.remove('active');
    } else {
      whitePill.classList.add('active');
      blackPill.classList.remove('active');
    }
  },

  getValidMoves(player) {
    const moves = [];
    const opp = player === 1 ? 2 : 1;

    // Directions vectors: Up, Down, Left, Right, Diagonals
    const directions = [
      { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 },
      { r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 }
    ];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.board[r][c] !== 0) continue;

        let totalFlips = [];

        // Check if move sandwiches opponent disks in any direction
        for (const dir of directions) {
          let currR = r + dir.r;
          let currC = c + dir.c;
          let possibleFlips = [];

          while (currR >= 0 && currR < 8 && currC >= 0 && currC < 8 && this.board[currR][currC] === opp) {
            possibleFlips.push({ r: currR, c: currC });
            currR += dir.r;
            currC += dir.c;
          }

          if (currR >= 0 && currR < 8 && currC >= 0 && currC < 8 && this.board[currR][currC] === player) {
            totalFlips = totalFlips.concat(possibleFlips);
          }
        }

        if (totalFlips.length > 0) {
          moves.push({ r, c, flips: totalFlips });
        }
      }
    }
    return moves;
  },

  endGame() {
    this.isGameOver = true;
    const scores = this.getScores();
    
    if (scores.black > scores.white) {
      showToast(`Congratulations! You win ${scores.black} to ${scores.white}! 🏆🎉`);
      this.saveStats(true);
    } else if (scores.white > scores.black) {
      showToast(`Othello Over! Bot wins ${scores.white} to ${scores.black}. 😢`);
      this.saveStats(false);
    } else {
      showToast("Draw game! 🤝");
    }
  },

  saveStats(playerWon) {
    const diff = this.botDiff; // easy, medium, hard
    const practiceObj = GameHubState.stats.othello.practice[diff];
    practiceObj.played++;
    if (playerWon) practiceObj.won++;
    saveStats();
  }
};

// Trigger rebuild: 2026-07-09T06:18
