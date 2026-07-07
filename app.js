// app.js - Wordle Pro Core Controller

// ==========================================================================
// PWA Service Worker Registration & Installation Prompt
// ==========================================================================
let deferredPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then((reg) => console.log('[Service Worker] Registered successfully:', reg.scope))
      .catch((err) => console.error('[Service Worker] Registration failed:', err));
  });
}

// Handle PWA Install Prompt Banner
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Update UI notify the user they can install the PWA
  const installBanner = document.getElementById('install-banner');
  if (installBanner) {
    installBanner.classList.remove('hidden');
  }
});

// ==========================================================================
// Web Audio Synth Engine
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
    // Pitch goes up slightly for each consecutive letter
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
    
    // Play a happy major scale arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
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
    
    // Play a sad descending minor/dissonant sequence
    const notes = [392.00, 370.00, 349.23, 311.13]; // G4, F#4, F4, D#4
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
// Game Engine Configuration & State
// ==========================================================================
const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

const GameState = {
  difficulty: 'easy',       // 'easy', 'medium', 'hard'
  gameMode: 'practice',     // 'practice', 'daily'
  targetWord: '',
  guesses: [],
  currentInput: '',
  gameStatus: 'IN_PROGRESS', // 'IN_PROGRESS', 'WON', 'LOST'
  stats: {},                // Local statistics loaded from localstorage
  isAnimating: false,
  dailyIndex: 0
};

// Default Statistics Structure
const defaultStats = {
  practice: {
    easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0] },
    medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0] },
    hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0] }
  },
  daily: {
    easy: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0], lastPlayedDay: -1, lastResult: null, savedGuesses: [] },
    medium: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0], lastPlayedDay: -1, lastResult: null, savedGuesses: [] },
    hard: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0,0,0,0,0,0], lastPlayedDay: -1, lastResult: null, savedGuesses: [] }
  }
};

// ==========================================================================
// Word Lists Mapping
// ==========================================================================
const difficultyWordLists = {
  easy: EASY_WORDS,
  medium: MEDIUM_WORDS,
  hard: HARD_WORDS
};

// ==========================================================================
// Initialization & Lifecycle
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadUserSettings();
  loadStats();
  initBoard();
  initKeyboard();
  bindEvents();
  startNewGame();
});

// Load user choices (themes, sound) from LocalStorage
function loadUserSettings() {
  const settings = JSON.parse(localStorage.getItem('wordle_settings')) || {
    darkMode: true,
    colorblind: false,
    sound: true,
    gameMode: 'practice'
  };

  document.body.className = '';
  if (settings.darkMode) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.add('light-theme');
  }
  
  if (settings.colorblind) {
    document.body.classList.add('colorblind');
  }

  AudioPlayer.enabled = settings.sound;
  GameState.gameMode = settings.gameMode;

  // Sync controls UI
  document.getElementById('toggle-dark-mode').checked = settings.darkMode;
  document.getElementById('toggle-colorblind').checked = settings.colorblind;
  document.getElementById('toggle-sound').checked = settings.sound;
  document.getElementById('select-game-mode').value = settings.gameMode;
}

// Save settings to LocalStorage
function saveUserSettings() {
  const settings = {
    darkMode: document.getElementById('toggle-dark-mode').checked,
    colorblind: document.getElementById('toggle-colorblind').checked,
    sound: document.getElementById('toggle-sound').checked,
    gameMode: document.getElementById('select-game-mode').value
  };
  localStorage.setItem('wordle_settings', JSON.stringify(settings));
}

// Load statistics from LocalStorage
function loadStats() {
  const saved = localStorage.getItem('wordle_pro_stats');
  if (saved) {
    // Deep merge to handle migrations/missing properties
    GameState.stats = JSON.parse(saved);
    // Ensure all pathways exist
    if (!GameState.stats.practice) GameState.stats.practice = defaultStats.practice;
    if (!GameState.stats.daily) GameState.stats.daily = defaultStats.daily;
  } else {
    GameState.stats = JSON.parse(JSON.stringify(defaultStats));
  }
}

// Save stats
function saveStats() {
  localStorage.setItem('wordle_pro_stats', JSON.stringify(GameState.stats));
}

// Reset stats
function resetAllStats() {
  GameState.stats = JSON.parse(JSON.stringify(defaultStats));
  saveStats();
  showToast('Statistics Cleared');
  updateStatsModal();
}

// ==========================================================================
// Board & Keyboard Generators
// ==========================================================================
function initBoard() {
  const board = document.getElementById('game-board');
  board.innerHTML = '';
  
  for (let r = 0; r < MAX_GUESSES; r++) {
    const row = document.createElement('div');
    row.className = 'board-row';
    row.id = `row-${r}`;
    
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.id = `tile-${r}-${c}`;
      row.appendChild(tile);
    }
    board.appendChild(row);
  }
}

function initKeyboard() {
  const keyboard = document.getElementById('game-keyboard');
  keyboard.innerHTML = '';
  
  const layout = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace']
  ];
  
  layout.forEach((rowKeys) => {
    const row = document.createElement('div');
    row.className = 'keyboard-row';
    
    rowKeys.forEach((key) => {
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
        btn.innerText = key.toUpperCase();
      }
      
      row.appendChild(btn);
    });
    
    keyboard.appendChild(row);
  });
}

// ==========================================================================
// Game State Controller Logic
// ==========================================================================

// Calculates unique daily word index deterministically based on date (Epoch)
function getDailyWordIndex() {
  const epoch = new Date(2026, 0, 1).getTime(); // Jan 1, 2026 as seed start
  const now = new Date().getTime();
  const diffDays = Math.floor((now - epoch) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function startNewGame() {
  GameState.currentInput = '';
  GameState.guesses = [];
  GameState.gameStatus = 'IN_PROGRESS';
  GameState.isAnimating = false;
  
  // Clear grid cells
  for (let r = 0; r < MAX_GUESSES; r++) {
    const row = document.getElementById(`row-${r}`);
    row.className = 'board-row';
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.getElementById(`tile-${r}-${c}`);
      tile.className = 'tile';
      tile.innerText = '';
    }
  }

  // Clear keyboard states style
  const keys = document.querySelectorAll('.key-btn');
  keys.forEach((k) => {
    k.className = 'key-btn';
    if (k.dataset.key === 'enter' || k.dataset.key === 'backspace') {
      k.classList.add('key-wide');
    }
  });

  const list = difficultyWordLists[GameState.difficulty];
  const selectModeLabel = document.getElementById('current-mode-label');

  if (GameState.gameMode === 'daily') {
    selectModeLabel.innerText = 'DAILY CHALLENGE';
    selectModeLabel.style.borderColor = 'rgba(239, 68, 68, 0.2)';
    selectModeLabel.style.color = '#ef4444';
    selectModeLabel.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
    
    const dailyDay = getDailyWordIndex();
    GameState.dailyIndex = dailyDay;
    const wordIdx = dailyDay % list.length;
    GameState.targetWord = list[wordIdx];
    
    // Check if daily challenge has already been completed today
    const statObj = GameState.stats.daily[GameState.difficulty];
    if (statObj.lastPlayedDay === dailyDay) {
      // Re-hydrate the board from saved guesses
      GameState.guesses = [...statObj.savedGuesses];
      GameState.gameStatus = statObj.lastResult;
      
      // Paint board instantly (without delay or sound)
      GameState.guesses.forEach((guess, rowIdx) => {
        const evalResult = gradeGuess(guess, GameState.targetWord);
        evalResult.forEach((state, colIdx) => {
          const tile = document.getElementById(`tile-${rowIdx}-${colIdx}`);
          tile.innerText = guess[colIdx].toUpperCase();
          tile.classList.add(`${state}-state`);
          
          const key = document.getElementById(`key-${guess[colIdx]}`);
          updateKeyStyle(key, state);
        });
      });
      
      // Open stats modal automatically
      setTimeout(() => {
        openModal(document.getElementById('modal-stats'));
        updateStatsModal();
      }, 300);
      return;
    }
  } else {
    // Practice Mode - Infinite
    selectModeLabel.innerText = 'PRACTICE MODE';
    selectModeLabel.style.borderColor = 'rgba(94, 234, 212, 0.2)';
    selectModeLabel.style.color = '#14b8a6';
    selectModeLabel.style.backgroundColor = 'rgba(94, 234, 212, 0.1)';
    
    // Random word
    const randIdx = Math.floor(Math.random() * list.length);
    GameState.targetWord = list[randIdx];
  }
  
  console.log(`Wordle target word (${GameState.difficulty}): ${GameState.targetWord.toUpperCase()}`);
}

function updateKeyStyle(keyBtn, state) {
  if (!keyBtn) return;
  // Hierarchical rules: correct (green) overrides present (yellow) overrides absent (gray)
  if (keyBtn.classList.contains('correct-state')) return;
  if (keyBtn.classList.contains('present-state') && state !== 'correct') return;
  
  keyBtn.classList.remove('present-state', 'absent-state');
  keyBtn.classList.add(`${state}-state`);
}

// Precise Wordle coloring logic with duplicate letter constraints
function gradeGuess(guess, target) {
  const evaluation = Array(WORD_LENGTH).fill('absent');
  const targetLettersCount = {};
  
  // Pass 1: Build counter of letters not matched in target, and mark exact correct letters
  for (let i = 0; i < WORD_LENGTH; i++) {
    const char = target[i];
    if (guess[i] === char) {
      evaluation[i] = 'correct';
    } else {
      targetLettersCount[char] = (targetLettersCount[char] || 0) + 1;
    }
  }
  
  // Pass 2: Mark yellow present letters, verifying count thresholds
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (evaluation[i] === 'correct') continue;
    
    const char = guess[i];
    if (targetLettersCount[char] && targetLettersCount[char] > 0) {
      evaluation[i] = 'present';
      targetLettersCount[char]--;
    }
  }
  
  return evaluation;
}

// ==========================================================================
// Input Event Handling
// ==========================================================================
function handleKeyPress(key) {
  if (GameState.gameStatus !== 'IN_PROGRESS' || GameState.isAnimating) return;
  
  if (key === 'enter') {
    submitGuess();
  } else if (key === 'backspace') {
    handleBackspace();
  } else if (/^[a-z]$/i.test(key)) {
    handleLetterInput(key.toLowerCase());
  }
}

function handleLetterInput(letter) {
  if (GameState.currentInput.length >= WORD_LENGTH) return;
  
  AudioPlayer.playKey();
  const rowIdx = GameState.guesses.length;
  const colIdx = GameState.currentInput.length;
  
  GameState.currentInput += letter;
  
  const tile = document.getElementById(`tile-${rowIdx}-${colIdx}`);
  if (tile) {
    tile.innerText = letter.toUpperCase();
    tile.classList.add('active-input', 'pop-effect');
  }
}

function handleBackspace() {
  if (GameState.currentInput.length === 0) return;
  
  AudioPlayer.playClick();
  const rowIdx = GameState.guesses.length;
  const colIdx = GameState.currentInput.length - 1;
  
  GameState.currentInput = GameState.currentInput.slice(0, -1);
  
  const tile = document.getElementById(`tile-${rowIdx}-${colIdx}`);
  if (tile) {
    tile.innerText = '';
    tile.classList.remove('active-input', 'pop-effect');
  }
}

function submitGuess() {
  const rowIdx = GameState.guesses.length;
  const guess = GameState.currentInput;
  
  if (guess.length < WORD_LENGTH) {
    showToast('Not enough letters');
    shakeRow(rowIdx);
    AudioPlayer.playError();
    return;
  }
  
  if (!VALID_GUESSES.has(guess)) {
    showToast('Not in word list');
    shakeRow(rowIdx);
    AudioPlayer.playError();
    return;
  }
  
  // Lock input and proceed to evaluations
  GameState.isAnimating = true;
  GameState.guesses.push(guess);
  GameState.currentInput = '';
  
  const evaluation = gradeGuess(guess, GameState.targetWord);
  
  // Staggered tiles flip animation
  evaluation.forEach((state, idx) => {
    const tile = document.getElementById(`tile-${rowIdx}-${idx}`);
    tile.classList.remove('active-input', 'pop-effect');
    
    // Add flip animation
    setTimeout(() => {
      tile.classList.add('flip-animation');
      AudioPlayer.playFlip(idx);
      
      // Update backgrounds halfway through the rotation
      setTimeout(() => {
        tile.classList.add(`${state}-state`);
        const key = document.getElementById(`key-${guess[idx]}`);
        updateKeyStyle(key, state);
      }, 250);
      
    }, idx * 150);
  });
  
  // Complete row reveal callback
  setTimeout(() => {
    GameState.isAnimating = false;
    
    if (guess === GameState.targetWord) {
      handleGameOver('WON');
    } else if (GameState.guesses.length >= MAX_GUESSES) {
      handleGameOver('LOST');
    }
  }, WORD_LENGTH * 150 + 400);
}

// Row animation triggers
function shakeRow(rowIdx) {
  const row = document.getElementById(`row-${rowIdx}`);
  if (row) {
    row.classList.add('shake');
    row.addEventListener('animationend', () => {
      row.classList.remove('shake');
    }, { once: true });
  }
}

function bounceRow(rowIdx) {
  const row = document.getElementById(`row-${rowIdx}`);
  if (row) {
    row.classList.add('bounce');
  }
}

// ==========================================================================
// Game Over & Stats Record Management
// ==========================================================================
function handleGameOver(result) {
  GameState.gameStatus = result;
  
  if (result === 'WON') {
    AudioPlayer.playWin();
    showToast(getWinAffirmation(GameState.guesses.length));
    bounceRow(GameState.guesses.length - 1);
  } else {
    AudioPlayer.playLoss();
    showToast(GameState.targetWord.toUpperCase());
  }

  // Update statistics
  const mode = GameState.gameMode;
  const diff = GameState.difficulty;
  const statObj = GameState.stats[mode][diff];
  
  if (mode === 'daily') {
    statObj.lastPlayedDay = GameState.dailyIndex;
    statObj.lastResult = result;
    statObj.savedGuesses = [...GameState.guesses];
  }
  
  statObj.played++;
  if (result === 'WON') {
    statObj.won++;
    statObj.currentStreak++;
    if (statObj.currentStreak > statObj.maxStreak) {
      statObj.maxStreak = statObj.currentStreak;
    }
    // Record guess count distribution (0-indexed array representing guesses 1-6)
    const guessIdx = GameState.guesses.length - 1;
    statObj.guessDistribution[guessIdx]++;
  } else {
    statObj.currentStreak = 0;
  }
  
  saveStats();
  
  // Open stats board
  setTimeout(() => {
    openModal(document.getElementById('modal-stats'));
    updateStatsModal();
  }, 1200);
}

function getWinAffirmation(guessesCount) {
  const affirmations = ['Genius!', 'Magnificent!', 'Impressive', 'Splendid', 'Great', 'Phew!'];
  return affirmations[guessesCount - 1] || 'Victory!';
}

// ==========================================================================
// Toast Messaging helper
// ==========================================================================
function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.innerText = message;
  
  container.appendChild(toast);
  // Auto clear DOM
  toast.addEventListener('animationend', (e) => {
    if (e.animationName === 'fadeOutUp') {
      toast.remove();
    }
  });
}

// ==========================================================================
// Modals Controller
// ==========================================================================
function openModal(modalEl) {
  if (!modalEl) return;
  AudioPlayer.playClick();
  modalEl.classList.remove('hidden');
}

function closeModal(modalEl) {
  if (!modalEl) return;
  AudioPlayer.playClick();
  modalEl.classList.add('hidden');
}

// Populate stats modal content
function updateStatsModal() {
  const mode = GameState.gameMode;
  const diff = GameState.difficulty;
  const statObj = GameState.stats[mode][diff];
  
  // Title header text
  document.getElementById('stats-title').innerText = `${mode.toUpperCase()} STATS (${diff.toUpperCase()})`;
  
  // Core stats metrics
  document.getElementById('stat-played').innerText = statObj.played;
  const winPct = statObj.played > 0 ? Math.round((statObj.won / statObj.played) * 100) : 0;
  document.getElementById('stat-win-pct').innerText = `${winPct}%`;
  document.getElementById('stat-streak').innerText = statObj.currentStreak;
  document.getElementById('stat-max-streak').innerText = statObj.maxStreak;
  
  // Draw guess bars distribution
  const barsContainer = document.getElementById('guess-bars');
  barsContainer.innerHTML = '';
  
  const maxDistribution = Math.max(1, ...statObj.guessDistribution);
  
  for (let i = 0; i < MAX_GUESSES; i++) {
    const row = document.createElement('div');
    row.className = 'guess-bar-row';
    
    const count = statObj.guessDistribution[i];
    const pct = Math.round((count / maxDistribution) * 100);
    
    // Highlight if active game row match
    const isHighlight = GameState.gameStatus === 'WON' && GameState.guesses.length === (i + 1);
    
    row.innerHTML = `
      <span class="guess-label">${i+1}</span>
      <div class="guess-track">
        <div class="guess-fill ${isHighlight ? 'highlight' : ''}" style="width: ${pct}%">${count}</div>
      </div>
    `;
    barsContainer.appendChild(row);
  }

  // Daily Challenge timer setup
  const timerContainer = document.getElementById('timer-container');
  const shareAction = document.getElementById('share-action-container');
  const practiceAgainBtn = document.getElementById('btn-practice-again');
  
  if (mode === 'daily') {
    timerContainer.classList.remove('hidden');
    
    if (GameState.gameStatus !== 'IN_PROGRESS') {
      shareAction.classList.remove('hidden');
      practiceAgainBtn.classList.add('hidden');
    } else {
      shareAction.classList.add('hidden');
      practiceAgainBtn.classList.add('hidden');
    }
  } else {
    // Practice Mode
    timerContainer.classList.add('hidden');
    shareAction.classList.add('hidden');
    
    if (GameState.gameStatus !== 'IN_PROGRESS') {
      practiceAgainBtn.classList.remove('hidden');
    } else {
      practiceAgainBtn.classList.add('hidden');
    }
  }
}

// Countdown timer loop for next Daily Challenge
setInterval(() => {
  const countdownEl = document.getElementById('next-daily-countdown');
  if (!countdownEl || document.getElementById('timer-container').classList.contains('hidden')) return;
  
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diffMs = midnight - now;
  
  const h = Math.floor(diffMs / (1000 * 60 * 60)).toString().padStart(2, '0');
  const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
  const s = Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, '0');
  
  countdownEl.innerText = `${h}:${m}:${s}`;
}, 1000);

// Generate share grid format (emojis grid)
function generateShareContent() {
  const resultChar = GameState.gameStatus === 'WON' ? GameState.guesses.length : 'X';
  let shareText = `Wordle Pro (${GameState.difficulty.toUpperCase()}) ${GameState.gameMode === 'daily' ? '#' + GameState.dailyIndex : 'Practice'} ${resultChar}/${MAX_GUESSES}\n\n`;
  
  const correctEmoji = document.body.classList.contains('colorblind') ? '🟧' : '🟩';
  const presentEmoji = document.body.classList.contains('colorblind') ? '🟦' : '🟨';
  const absentEmoji = document.body.classList.contains('dark-theme') ? '⬛' : '⬜';
  
  GameState.guesses.forEach((guess) => {
    const evalResult = gradeGuess(guess, GameState.targetWord);
    const rowEmojis = evalResult.map((state) => {
      if (state === 'correct') return correctEmoji;
      if (state === 'present') return presentEmoji;
      return absentEmoji;
    }).join('');
    shareText += rowEmojis + '\n';
  });
  
  shareText += '\nPlay offline at: Wordle Pro App!';
  return shareText;
}

// ==========================================================================
// DOM Events Binder
// ==========================================================================
function bindEvents() {
  // On-screen Virtual Keyboard click events
  document.getElementById('game-keyboard').addEventListener('click', (e) => {
    const keyBtn = e.target.closest('.key-btn');
    if (!keyBtn) return;
    const key = keyBtn.dataset.key;
    handleKeyPress(key);
  });
  
  // Physical keyboard keydown listener
  document.addEventListener('keydown', (e) => {
    // Avoid double capture when typing inside selects/settings inputs
    if (document.activeElement.tagName === 'SELECT' || document.activeElement.tagName === 'INPUT') return;
    
    let key = e.key.toLowerCase();
    if (key === 'escape') {
      // Close all active overlays
      document.querySelectorAll('.modal-overlay').forEach(closeModal);
    } else {
      if (key === 'backspace') key = 'backspace';
      if (key === 'enter') key = 'enter';
      handleKeyPress(key);
    }
  });

  // Settings: Switch Game Mode
  document.getElementById('select-game-mode').addEventListener('change', (e) => {
    GameState.gameMode = e.target.value;
    saveUserSettings();
    closeModal(document.getElementById('modal-settings'));
    startNewGame();
  });

  // Settings: Toggle Dark/Light Mode
  document.getElementById('toggle-dark-mode').addEventListener('change', (e) => {
    const isDark = e.target.checked;
    document.body.className = '';
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.add('light-theme');
    }
    
    // Keep colorblind mode if set
    if (document.getElementById('toggle-colorblind').checked) {
      document.body.classList.add('colorblind');
    }
    saveUserSettings();
    AudioPlayer.playClick();
  });

  // Settings: Toggle Colorblind Mode
  document.getElementById('toggle-colorblind').addEventListener('change', (e) => {
    const isColorblind = e.target.checked;
    if (isColorblind) {
      document.body.classList.add('colorblind');
    } else {
      document.body.classList.remove('colorblind');
    }
    saveUserSettings();
    AudioPlayer.playClick();
  });

  // Settings: Toggle Sound FX
  document.getElementById('toggle-sound').addEventListener('change', (e) => {
    AudioPlayer.enabled = e.target.checked;
    saveUserSettings();
    AudioPlayer.playClick();
  });

  // Settings: Reset statistics
  document.getElementById('btn-reset-stats').addEventListener('click', () => {
    if (confirm('Are you sure you want to permanently erase all statistics?')) {
      resetAllStats();
    }
  });

  // Difficulty Tabs Switch
  document.querySelector('.difficulty-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab-button');
    if (!tab || tab.classList.contains('active') || GameState.isAnimating) return;
    
    AudioPlayer.playClick();
    
    // Update active tab styling
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    tab.classList.add('active');
    
    GameState.difficulty = tab.dataset.difficulty;
    startNewGame();
  });

  // Modals Nav Buttons
  document.getElementById('btn-help').addEventListener('click', () => openModal(document.getElementById('modal-help')));
  document.getElementById('btn-close-help').addEventListener('click', () => closeModal(document.getElementById('modal-help')));
  document.getElementById('modal-help').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-help')) closeModal(e.target);
  });
  
  document.getElementById('btn-stats').addEventListener('click', () => {
    openModal(document.getElementById('modal-stats'));
    updateStatsModal();
  });
  document.getElementById('btn-close-stats').addEventListener('click', () => closeModal(document.getElementById('modal-stats')));
  document.getElementById('modal-stats').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-stats')) closeModal(e.target);
  });
  
  document.getElementById('btn-settings').addEventListener('click', () => openModal(document.getElementById('modal-settings')));
  document.getElementById('btn-close-settings').addEventListener('click', () => closeModal(document.getElementById('modal-settings')));
  document.getElementById('modal-settings').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-settings')) closeModal(e.target);
  });

  // Stats: Practice Again Button
  document.getElementById('btn-practice-again').addEventListener('click', () => {
    closeModal(document.getElementById('modal-stats'));
    startNewGame();
  });

  // Stats: Share Stats Grid
  document.getElementById('btn-share-stats').addEventListener('click', () => {
    const shareText = generateShareContent();
    
    if (navigator.share) {
      // Use mobile native share API if available
      navigator.share({
        title: 'Wordle Pro Score',
        text: shareText
      })
      .then(() => showToast('Shared successfully!'))
      .catch((err) => console.log('Share failed:', err));
    } else {
      // Fallback: Copy to Clipboard
      navigator.clipboard.writeText(shareText)
        .then(() => showToast('Copied results to clipboard!'))
        .catch(() => showToast('Failed to copy to clipboard'));
    }
  });

  // Install PWA Prompt actions
  const closeInstallPrompt = () => {
    document.getElementById('install-banner').classList.add('hidden');
  };
  
  document.getElementById('btn-close-install').addEventListener('click', closeInstallPrompt);
  
  document.getElementById('btn-install-app').addEventListener('click', () => {
    if (!deferredPrompt) return;
    
    // Show prompt banner
    deferredPrompt.prompt();
    
    // Wait for resolution
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA Installer] User accepted the installation');
      } else {
        console.log('[PWA Installer] User dismissed the installation');
      }
      deferredPrompt = null;
      closeInstallPrompt();
    });
  });
}
