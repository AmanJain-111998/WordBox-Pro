# 🧩 Wordle Pro

**Wordle Pro** is a modern, high-fidelity Wordle game featuring three difficulty levels: **Easy**, **Medium**, and **Hard**. Each category features exactly 500 unique 5-letter target words (totaling 1,500 target words) graded by popularity and structure.

The app is built as a **Progressive Web App (PWA)**, which runs 100% offline. Once installed on your mobile home screen, you can turn off your internet (or put your phone in **Airplane Mode**) and play anywhere, anytime!

---

## ✨ Features

- **3 Difficulty Categories:**
  - 🟢 **Easy:** Common everyday words with simple letter structures.
  - 🟡 **Medium:** Standard vocabulary with moderate letter variants.
  - 🔴 **Hard:** Obscure/rare words, double-letter trap words, or rare letter entries (Q, Z, X, J, K).
- **2 Game Modes:**
  -  प्रैक्टिस **Practice Mode:** Infinite practice play with random target words.
  - 📅 **Daily Challenge:** One unique word per difficulty category every day, identical for players worldwide.
- **Procedural Sound Engine:** Synthesizes retro-style clicks, flips, wins, and error sounds using the browser's native **Web Audio API** (requires no external `.mp3` downloads).
- **Aesthetic UI:** Premium Glassmorphism styling, fully responsive grid sizing, smooth 3D flip card animations, Dark Mode, Light Mode, and High Contrast (Colorblind) theme options.
- **Statistics Dashboard:** Track games played, win rate, current/max streaks, and guess counts separate for each difficulty.
- **PWA Packaging:** Fully offline cache service worker, responsive layouts, standalone launch, and custom app icon.

---

## 📱 Mobile Installation & Offline Play

To play the game offline or in **Airplane Mode**:

### On iOS (iPhone / iPad)
1. Open **Safari** and navigate to your deployed website URL.
2. Tap the **Share** button (the square with an up arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Launch **Wordle Pro** from your Home Screen. You can now enable **Airplane Mode** and play 100% offline!

### On Android
1. Open **Chrome** and navigate to your deployed website URL.
2. Tap the **Download App** banner on the page, or tap the three dots in Chrome and select **Install App** / **Add to Home Screen**.
3. Launch **Wordle Pro** from your Home Screen and play offline!

---

## 🛠️ Built With

- **HTML5:** Semantic architecture
- **CSS3:** Responsive layout, HSL variables, and high-fidelity custom animations
- **JavaScript (Vanilla):** Dynamic game loop, stats, and procedural audio synthesis
- **Service Workers & Web Manifest:** Dynamic precaching for offline support
