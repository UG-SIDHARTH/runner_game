const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameRunning = false;
let score = 0;
let coinsCollected = 0;
let highScore = localStorage.getItem("highScore") || 0;
document.getElementById("high-score").innerText = highScore;

const groundY = 300;
const gravity = 1.2;
const jumpPower = -16;

let player = { x: 50, y: groundY, width: 30, height: 50, yVel: 0, jumping: false };
let obstacle = { x: 800, y: groundY + 10, width: 40, height: 40, speed: 6 };
let clouds = [ { x: 200, y: 50 }, { x: 600, y: 100 }, { x: 1000, y: 70 } ];
let coins = [ { x: 400, y: 200, active: true }, { x: 900, y: 150, active: true } ];
let shieldActive = false, shieldTimeLeft = 0, botDismissTimeout = null, lastBotAppearance = 0;

function jump() {
    if (gameRunning && !player.jumping) {
        player.yVel = jumpPower;
        player.jumping = true;
    }
}

document.addEventListener("keydown", (e) => {
    if (e.code === "KeyB") hireGreedBot();
    if (e.code === "Space" || e.code === "ArrowUp") {
        const startScreen = document.getElementById("start-screen");
        const gameOverScreen = document.getElementById("game-over-screen");
        if (!gameRunning && startScreen && !startScreen.classList.contains("hidden")) {
            startGame();
            return;
        }
        if (!gameRunning && gameOverScreen && !gameOverScreen.classList.contains("hidden")) {
            startGame();
            return;
        }
        jump();
    }
});

// Mobile touch and pointer controls for PWA
canvas.addEventListener("touchstart", (e) => {
    if (gameRunning) {
        e.preventDefault();
        jump();
    }
}, { passive: false });

canvas.addEventListener("pointerdown", (e) => {
    if (gameRunning && e.pointerType !== "touch") {
        jump();
    }
});

function startGame() {
    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("game-over-screen").classList.add("hidden");
    document.getElementById("pause-btn").classList.remove("hidden");

    obstacle.x = 800;
    obstacle.speed = 6;
    score = 0;
    player.x = 50;
    player.y = groundY;
    player.yVel = 0;
    player.jumping = false;
    player.width = 30; // reset player width in case it shrank
    shieldActive = false;
    shieldTimeLeft = 0;
    hideGreedBot();
    
    gameRunning = true;
    triggerHorse("start");
    gameLoop(); 
}

function gameOver() {
    gameRunning = false;
    shieldActive = false;
    hideGreedBot();
    document.getElementById("pause-btn").classList.add("hidden");
    document.getElementById("game-over-screen").classList.remove("hidden");
    
    // BUG: High score updates when score is LOWER than highScore!
    if (score < highScore) {
        highScore = Math.floor(score);
        localStorage.setItem("highScore", highScore);
    }
    document.getElementById("high-score").innerText = highScore;

    triggerHorse("death");
}

let lastMilestone = 0;

function gameLoop() {
    if (!gameRunning) return;

    // -- Physics & Movement --
    player.yVel += gravity;
    player.y += player.yVel;

    if (player.y >= groundY) {
        player.y = groundY;
        player.jumping = false;
    }

    obstacle.x -= obstacle.speed;
    if (obstacle.x + obstacle.width < 0) {
        obstacle.x = canvas.width + Math.random() * 400;
        obstacle.speed += 0.2; // Slowly increase difficulty
    }

    for (let cloud of clouds) {
        cloud.x += 1.5; 
        if (cloud.x > canvas.width) cloud.x = -100;
    }

    for (let i = 0; i < coins.length; i++) {
        let coin = coins[i];
        coin.x -= obstacle.speed - 2;

        if (coin.x < -30) {
            coin.x = canvas.width + Math.random() * 500;
            coin.active = true;
        }

        if (coin.active && player.x < coin.x + 20 && player.x + player.width > coin.x &&
            player.y < coin.y + 20 && player.y + player.height > coin.y) {
            
            coinsCollected += 1; 
            coin.active = false;
            document.getElementById("coins").innerText = coinsCollected;
            triggerHorse("coin");
        }
    }

    // Collision Check
    if (player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.height > obstacle.y) {
        if (shieldActive) {
            obstacle.x = canvas.width + Math.random() * 300;
            playBotSound("shield");
            triggerHorse("greedbot-saved");
        } else {
            gameOver();
            return;
        }
    }

    if (shieldActive) {
        shieldTimeLeft -= 1 / 60;
        if (shieldTimeLeft <= 0) {
            shieldActive = false;
            showGreedBot("Shield EXPIRED! Need another? Pay up!", 3000);
        }
    }

    score += 0.05;
    const currentScore = Math.floor(score);
    document.getElementById("score").innerText = currentScore;

    // Robot appearance intervals
    if (currentScore > 0 && currentScore % 30 === 0 && currentScore !== lastBotAppearance && !shieldActive) {
        lastBotAppearance = currentScore;
        showGreedBot("Need a 5s Shield? That'll be 2 🪙!");
    }

    // Milestone celebration roasts
    if ((currentScore === 25 || currentScore === 50 || currentScore === 100) && currentScore !== lastMilestone) {
        lastMilestone = currentScore;
        triggerHorse("milestone");
    }

    draw();
    requestAnimationFrame(gameLoop);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Clouds
    ctx.fillStyle = document.body.classList.contains("white-mode") 
        ? "rgba(100, 150, 200, 0.4)" 
        : "rgba(255, 255, 255, 0.7)";
    for (let cloud of clouds) {
        ctx.fillRect(cloud.x, cloud.y, 60, 20);
        ctx.fillRect(cloud.x + 10, cloud.y - 10, 40, 20);
    }

    // BUG: Ground drawn at y=0 (ceiling) instead of bottom!
    ctx.fillStyle = "#228B22"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height - groundY - player.height);

    // Draw Player
    ctx.fillStyle = document.body.classList.contains("white-mode") ? "#0284c7" : "#00ffff";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw Obstacle
    ctx.fillStyle = "#228B22";
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

    // Draw Coins
    ctx.fillStyle = "gold";
    for (let coin of coins) {
        if (coin.active) {
            ctx.beginPath();
            ctx.arc(coin.x, coin.y, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw Shield if Active
    if (shieldActive) {
        ctx.save();
        ctx.strokeStyle = `hsl(${(Date.now() / 4) % 360}, 100%, 65%)`;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.height * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("restart-btn").addEventListener("click", startGame);

// =========================================================
// THEME CONTROLLER & SARCASTIC ROAST HORSE COMPANION
// =========================================================
const themeBtn = document.getElementById("theme-btn");
const horseMessage = document.getElementById("horse-message");
const horseAvatar = document.getElementById("horse-avatar");
const horsePokeBtn = document.getElementById("horse-poke-btn");
const metaThemeColor = document.getElementById("meta-theme-color");

let isWhiteMode = false;

if (themeBtn) {
    themeBtn.addEventListener("click", () => {
        isWhiteMode = !isWhiteMode;
        document.body.classList.toggle("white-mode", isWhiteMode);
        themeBtn.innerText = isWhiteMode ? "🌙 Dark Mode" : "☀️ White Mode";
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", isWhiteMode ? "#e5e7eb" : "#121212");
        }
        triggerHorse(isWhiteMode ? "theme-white" : "theme-dark");
    });
}

const horseRoasts = {
    start: [
        "Neigh! Another run? Let's see if you can survive more than 3 seconds this time.",
        "Buckle up, buttercup. That spacebar isn't going to press itself.",
        "Ready to faceplant into the first obstacle? I'm watching with popcorn."
    ],
    death: [
        "🐴 Roasted: You jumped right into that obstacle like you missed its embrace! 💡 Hint: Jump AT LEAST 120px before the block.",
        "🐴 Roasted: Rest in pixel pieces. A snail would've cleared that jump with 2 seconds to spare. 💡 Hint: The obstacle accelerates each cycle!",
        "🐴 Roasted: Was that a jump or did your character just stub its toe? 💡 Hint: Timing is everything—press Space BEFORE you collide.",
        "🐴 Roasted: Score was only {score}? My pocket calculator does more math in sleep mode. 💡 Hint: Jump height is fixed, timing is key.",
        "🐴 Roasted: Did you close your eyes and pray? 0% success rate detected. 💡 Hint: Obstacle speeds up continuously, so jump earlier as time passes!",
        "🐴 Roasted: Gravity: 1. You: 0. Better luck next reincarnation! 💡 Hint: You can't double jump while mid-air."
    ],
    coin: [
        "🐴 Roasted: Wait, did you notice your character shrinking and your coins DECREASING? 💡 Hint: Check script.js line 92 (`coinsCollected -= 1`). Who codes a coin penalty?!",
        "🐴 Roasted: You're literally paying to shrink into the quantum realm! 💡 Hint: Look at script.js line 94 (`player.width -= 5;`). Money is shrinking you!"
    ],
    "theme-white": [
        "🐴 Roasted: AAAA MY RETINAS! ☀️ Flashbang mode activated! And look: the HUD text stayed white on a light background! 💡 Hint: Check style.css under .white-mode to fix font contrast.",
        "🐴 Roasted: White Mode enabled! Too bad you can't read your score anymore! 💡 Hint: Inspect `body.white-mode #hud` in style.css to fix the invisible text bug!"
    ],
    "theme-dark": [
        "🐴 Roasted: Back to Dark Mode! My retinas are safe, but your jump timing is still hazardous.",
        "🐴 Roasted: Ah, the shadows. Perfect for hiding your terrible reaction time. 💡 Hint: Focus on the base of the oncoming obstacle!"
    ],
    hint: [
        "🐴 Roast: You're asking a horse for gaming advice? 💡 Hint: Obstacle speed starts at 6 and increments by 0.2 every lap.",
        "🐴 Roast: Why is the game squished into 100 pixels? 💡 Hint: Check style.css line 17 (`width: min(100%, 800px);`)!",
        "🐴 Roast: Hit pause and the game broke? 💡 Hint: Look at index.html line 18. That inline pause logic is chaos.",
        "🐴 Roast: High score only records when you do WORSE? 💡 Hint: Check script.js line 46 (`if (score < highScore)`). Someone inverted the math!",
        "🐴 Roast: Look at the sky! The grass is on the ceiling! 💡 Hint: In script.js line 130, `ctx.fillRect(0, 0, ...)` draws ground at y=0 instead of groundY!",
        "🐴 Roast: I've seen pet rocks with faster reflexes than you. 💡 Hint: Tap Spacebar firmly and don't panic-mash."
    ],
    milestone: [
        "🐴 Roast: Score {score}?! Wait, you actually survived this long? I'm legitimately shocked.",
        "🐴 Roast: Triple digit score! Don't get cocky now, the next jump is going to humble you."
    ],
    offline: [
        "🐴 Roasted: You're OFFLINE! Luckily, your terrible jump reflexes don't require an internet connection.",
        "🐴 Roasted: No Wi-Fi detected! Our PWA service worker cached the whole game—zero excuse for missing that jump."
    ],
    installed: [
        "🐴 Roasted: You actually installed this PWA onto your device?! Bold choice. Now you can get roasted on the go!",
        "🐴 Roasted: Neon Runner is now pinned to your device. May your jump timing improve with permanent residency."
    ],
    "greedbot-bribe": [
        "🐴 Roasted: You bribed a mini robot for a shield?! Real runners dodge with their eyes closed!",
        "🐴 Roasted: Capitalism at its finest. GreedBot is laughing all the way to the cyber bank."
    ],
    "greedbot-broke": [
        "🐴 Roasted: BZZT! Broke detected! Even a greedy 8-bit bot refused to associate with you.",
        "🐴 Roasted: Can't even afford 2 coins?! GreedBot just laughed in binary at your empty wallet."
    ],
    "greedbot-saved": [
        "🐴 Roasted: CLANG! That shield just saved your pixel bacon! Don't get cocky, time is ticking.",
        "🐴 Roasted: Money really does buy life! GreedBot's shield absorbed that hit for you."
    ],
    "greedbot-refused": [
        "🐴 Roasted: Refused to pay GreedBot? I admire the cheapness, but your survival odds just cratered."
    ]
};

function playHorseSound() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const audioCtx = new AudioContextClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(350, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.11);
    } catch(e) {
        // Audio error or not permitted; fail silently
    }
}

function triggerHorse(type) {
    if (!horseMessage) return;
    const pool = horseRoasts[type] || horseRoasts.hint;
    let quote = pool[Math.floor(Math.random() * pool.length)];
    quote = quote.replace("{score}", Math.floor(score));
    
    horseMessage.innerText = quote;

    if (horseAvatar) {
        horseAvatar.classList.remove("bouncing");
        void horseAvatar.offsetWidth;
        horseAvatar.classList.add("bouncing");
    }

    playHorseSound();
}

if (horsePokeBtn) {
    horsePokeBtn.addEventListener("click", () => triggerHorse("hint"));
}
if (horseAvatar) {
    horseAvatar.addEventListener("click", () => triggerHorse("hint"));
}

// =========================================================
// PROGRESSIVE WEB APP (PWA) SERVICE WORKER & APP CONTROLS
// =========================================================
let deferredPrompt = null;
const installBtn = document.getElementById("install-btn");
const offlineBadge = document.getElementById("offline-badge");

// Register Service Worker
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./sw.js")
            .then((registration) => {
                console.log("Neon Runner Service Worker registered:", registration.scope);
            })
            .catch((error) => {
                console.warn("Neon Runner Service Worker registration failed:", error);
            });
    });
}

// Intercept beforeinstallprompt for custom install button
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) {
        installBtn.classList.remove("hidden");
    }
});

if (installBtn) {
    installBtn.addEventListener("click", async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            installBtn.classList.add("hidden");
        }
        deferredPrompt = null;
    });
}

window.addEventListener("appinstalled", () => {
    if (installBtn) {
        installBtn.classList.add("hidden");
    }
    triggerHorse("installed");
});

// Network status management (Offline detection)
function updateNetworkStatus() {
    if (!navigator.onLine) {
        if (offlineBadge) offlineBadge.classList.remove("hidden");
        triggerHorse("offline");
    } else {
        if (offlineBadge) offlineBadge.classList.add("hidden");
    }
}

window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);
if (!navigator.onLine) {
    updateNetworkStatus();
}

// Handle shortcut URL (?action=play)
window.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("action") === "play") {
        startGame();
    }
});

// =========================================================
// GREEDY HELPER ROBOT (GREEDBOT) COMPANION
// =========================================================
const greedbotBox = document.getElementById("greedbot-box");
const greedbotMsg = document.getElementById("greedbot-msg");
const greedbotBtn = document.getElementById("greedbot-btn");
const greedbotPayBtn = document.getElementById("greedbot-pay-btn");
const greedbotDismissBtn = document.getElementById("greedbot-dismiss-btn");
const greedbotAvatar = document.getElementById("greedbot-avatar");

function playBotSound(type) {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const audioCtx = new AudioContextClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const t = audioCtx.currentTime;
        if (type === "success") {
            osc.type = "triangle";
            osc.frequency.setValueAtTime(587, t);
            osc.frequency.setValueAtTime(880, t + 0.08);
            osc.frequency.setValueAtTime(1174, t + 0.16);
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
            osc.start(t);
            osc.stop(t + 0.3);
        } else if (type === "reject") {
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(120, t);
            osc.frequency.linearRampToValueAtTime(60, t + 0.25);
            gain.gain.setValueAtTime(0.09, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            osc.start(t);
            osc.stop(t + 0.26);
        } else if (type === "shield") {
            osc.type = "square";
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.exponentialRampToValueAtTime(900, t + 0.15);
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.16);
        }
    } catch (e) {}
}

function showGreedBot(text, autoHideMs) {
    if (!greedbotBox || !greedbotMsg) return;
    greedbotMsg.innerText = text;
    greedbotBox.classList.remove("hidden");
    clearTimeout(botDismissTimeout);
    if (autoHideMs) {
        botDismissTimeout = setTimeout(hideGreedBot, autoHideMs);
    }
}

function hideGreedBot() {
    if (greedbotBox) greedbotBox.classList.add("hidden");
    clearTimeout(botDismissTimeout);
}

function hireGreedBot() {
    if (shieldActive) {
        showGreedBot("Shield already active! Stop wasting my time!", 2500);
        return;
    }
    if (coinsCollected >= 2) {
        coinsCollected -= 2;
        document.getElementById("coins").innerText = coinsCollected;
        shieldActive = true;
        shieldTimeLeft = 5;
        playBotSound("success");
        showGreedBot("BEEP BOOP! Shield ON! 5s invulnerability!", 3000);
        triggerHorse("greedbot-bribe");
    } else {
        playBotSound("reject");
        showGreedBot("BZZT! No coins, no help! You get nothing!", 3000);
        triggerHorse("greedbot-broke");
    }
}

if (greedbotBtn) greedbotBtn.addEventListener("click", hireGreedBot);
if (greedbotPayBtn) greedbotPayBtn.addEventListener("click", hireGreedBot);
if (greedbotAvatar) greedbotAvatar.addEventListener("click", hireGreedBot);
if (greedbotDismissBtn) {
    greedbotDismissBtn.addEventListener("click", () => {
        playBotSound("reject");
        showGreedBot("BZZT! Cheapskate! Good luck surviving alone!", 2000);
        triggerHorse("greedbot-refused");
    });
}

