const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameRunning = false;
let score = 0;
let coinsCollected = 0;
let highScore = Number(localStorage.getItem("highScore")) || 0;
document.getElementById("high-score").textContent = highScore;

const groundY = 300;
const gravity = 1.2;
const jumpPower = -16;
const coinY = 210;

let player = { x: 50, y: groundY, width: 30, height: 50, yVel: 0, jumping: false };
let obstacle = { x: 800, y: groundY + 10, width: 40, height: 40, speed: 6 };
let clouds = [ { x: 200, y: 115 }, { x: 600, y: 155 }, { x: 1000, y: 100 } ];
let coins = [ { x: 400, y: coinY, active: true }, { x: 900, y: coinY, active: true } ];
let sceneryOffset = 0;
let animationFrame = 0;
let lastMilestone = 0;
let shieldActive = false, shieldTimeLeft = 0, botDismissTimeout = null, lastBotAppearance = 0;

document.addEventListener("keydown", (e) => {
    if (e.code === "KeyB") hireGreedBot();
    if ((e.code === "Space" || e.code === "ArrowUp") && gameRunning && !player.jumping) {
        e.preventDefault();
        player.yVel = jumpPower;
        player.jumping = true;
    }
    if (e.code === "Escape") {
        if (gameRunning) pauseGame();
        else if (!document.getElementById("pause-screen").classList.contains("hidden")) resumeGame();
    }
});

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
    document.getElementById("pause-screen").classList.add("hidden");
    document.getElementById("pause-btn").classList.remove("hidden");

    obstacle.x = 800;
    obstacle.speed = 6;
    score = 0;
    coinsCollected = 0;
    lastMilestone = 0;
    document.getElementById("score").textContent = "0";
    document.getElementById("coins").textContent = "0";
    player.x = 50;
    player.y = groundY;
    player.yVel = 0;
    player.jumping = false;
    player.width = 30; // reset player width in case it shrank
    shieldActive = false;
    shieldTimeLeft = 0;
    hideGreedBot();
    coins[0] = { x: 400, y: coinY, active: true };
    coins[1] = { x: 900, y: coinY, active: true };
    sceneryOffset = 0;
    document.getElementById("pause-btn").setAttribute("aria-label", "Pause game");
    document.getElementById("pause-btn").title = "Pause game";
    gameRunning = true;
    triggerHorse("start");
    gameLoop();
}

function gameOver() {
    gameRunning = false;
    shieldActive = false;
    hideGreedBot();
    document.getElementById("pause-btn").classList.add("hidden");
    document.getElementById("pause-screen").classList.add("hidden");
    document.getElementById("game-over-screen").classList.remove("hidden");
    document.getElementById("final-score").textContent = Math.floor(score);

    if (Math.floor(score) > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem("highScore", highScore);
    }
    document.getElementById("high-score").textContent = highScore;

    triggerHorse("death");
}

function pauseGame() {
    if (!gameRunning) return;
    gameRunning = false;
    document.getElementById("pause-screen").classList.remove("hidden");
    document.getElementById("pause-btn").setAttribute("aria-label", "Resume game");
    document.getElementById("pause-btn").title = "Resume game";
    document.getElementById("pause-btn").textContent = "▶";
}

function resumeGame() {
    if (gameRunning) return;
    document.getElementById("pause-screen").classList.add("hidden");
    document.getElementById("pause-btn").setAttribute("aria-label", "Pause game");
    document.getElementById("pause-btn").title = "Pause game";
    document.getElementById("pause-btn").textContent = "Ⅱ";
    gameRunning = true;
    gameLoop();
}

function gameLoop() {
    if (!gameRunning) return;
    sceneryOffset += obstacle.speed;

    player.yVel += gravity;
    player.y += player.yVel;

    if (player.y >= groundY) {
        player.y = groundY;
        player.jumping = false;
    }

    obstacle.x -= obstacle.speed;
    if (obstacle.x + obstacle.width < 0) {
        obstacle.x = canvas.width + Math.random() * 400;
        obstacle.speed += 0.2;
    }

    for (let cloud of clouds) {
        cloud.x -= 0.45;
        if (cloud.x < -110) cloud.x = canvas.width + 90;
    }

    for (const coin of coins) {
        coin.x -= obstacle.speed - 2;

        if (coin.x < -30) {
            coin.x = canvas.width + Math.random() * 500;
            coin.active = true;
        }

        if (coin.active && player.x < coin.x + 20 && player.x + player.width > coin.x &&
            player.y < coin.y + 20 && player.y + player.height > coin.y) {
            coinsCollected += 1;
            coin.active = false;
            document.getElementById("coins").textContent = coinsCollected;
            triggerHorse("coin");
        }
    }

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
    document.getElementById("score").textContent = currentScore;
    if (currentScore > highScore) {
        highScore = currentScore;
        document.getElementById("high-score").textContent = highScore;
        localStorage.setItem("highScore", highScore);
    }

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
    animationFrame += 1;

    const sky = ctx.createLinearGradient(0, 75, 0, 355);
    sky.addColorStop(0, document.body.classList.contains("white-mode") ? "#c8edff" : "#91ddf7");
    sky.addColorStop(1, "#e0f7d8");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffe17d";
    ctx.beginPath();
    ctx.arc(690, 128, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 225, 125, .22)";
    ctx.beginPath();
    ctx.arc(690, 128, 48, 0, Math.PI * 2);
    ctx.fill();

    drawHillLayer(275, 235, "#b8e4a0", .22);
    drawHillLayer(315, 175, "#8ed28d", .48);
    drawClouds();
    drawGround();
    drawCoins();
    drawObstacle();
    drawPlayer();
}

function drawHillLayer(baseY, height, color, speed) {
    const width = 270;
    const offset = (sceneryOffset * speed) % width;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-width - offset, baseY);
    for (let x = -width - offset; x <= canvas.width; x += width) {
        ctx.quadraticCurveTo(x + width * .48, baseY - height, x + width, baseY);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
}

function drawClouds() {
    ctx.fillStyle = "rgba(255, 255, 255, .76)";
    for (const cloud of clouds) {
        ctx.beginPath();
        ctx.ellipse(cloud.x + 28, cloud.y + 12, 31, 12, 0, 0, Math.PI * 2);
        ctx.ellipse(cloud.x + 15, cloud.y + 13, 16, 10, 0, 0, Math.PI * 2);
        ctx.ellipse(cloud.x + 42, cloud.y + 13, 17, 9, 0, 0, Math.PI * 2);
        ctx.ellipse(cloud.x + 27, cloud.y + 5, 17, 14, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawGround() {
    ctx.fillStyle = "#72c66b";
    ctx.fillRect(0, groundY + player.height, canvas.width, canvas.height - groundY - player.height);
    ctx.fillStyle = "#4fac64";
    ctx.fillRect(0, groundY + player.height, canvas.width, 8);
    ctx.fillStyle = "#d8f09e";
    for (let x = -((sceneryOffset * 1.5) % 46); x < canvas.width; x += 46) {
        ctx.beginPath();
        ctx.ellipse(x, 369 + (x % 3), 5, 2, -.3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPlayer() {
    const running = !player.jumping && gameRunning;
    const stride = running ? Math.sin(animationFrame * .32) * 5 : 0;
    const lift = player.jumping ? -3 : Math.abs(Math.sin(animationFrame * .32)) * 1.5;

    ctx.fillStyle = "rgba(43, 78, 71, .18)";
    ctx.beginPath();
    ctx.ellipse(player.x + 18, groundY + player.height + 2, player.jumping ? 11 : 17, player.jumping ? 3 : 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(player.x + 1, player.y + lift);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "#43516e";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(13, 38);
    ctx.lineTo(10 + stride, 47);
    ctx.lineTo(8 + stride, 49);
    ctx.moveTo(24, 38);
    ctx.lineTo(26 - stride, 47);
    ctx.lineTo(29 - stride, 49);
    ctx.stroke();
    ctx.fillStyle = "#ffca62";
    ctx.beginPath();
    ctx.ellipse(17, 29, 12, 15, -.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#f6a05a";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(12, 25);
    ctx.lineTo(7 + stride * .5, 32);
    ctx.moveTo(24, 25);
    ctx.lineTo(29 - stride * .5, 30);
    ctx.stroke();

    ctx.fillStyle = "#f6bb83";
    ctx.beginPath();
    ctx.arc(19, 12, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#734b57";
    ctx.beginPath();
    ctx.arc(15, 11, 1.5, 0, Math.PI * 2);
    ctx.arc(23, 11, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#b86755";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(19, 14, 3, .15, Math.PI - .15);
    ctx.stroke();
    ctx.fillStyle = "#f47b5d";
    ctx.beginPath();
    ctx.ellipse(19, 4, 12, 4, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(8, 3, 22, 3);
    ctx.restore();
}

function drawObstacle() {
    const x = obstacle.x;
    const y = obstacle.y;
    ctx.fillStyle = "rgba(43, 78, 71, .16)";
    ctx.beginPath();
    ctx.ellipse(x + 21, groundY + player.height + 2, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#b96e43";
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 40);
    ctx.lineTo(x + 7, y + 16);
    ctx.quadraticCurveTo(x + 7, y + 5, x + 17, y + 8);
    ctx.quadraticCurveTo(x + 24, y + 10, x + 24, y + 19);
    ctx.lineTo(x + 24, y + 40);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#d48753";
    ctx.beginPath();
    ctx.moveTo(x + 21, y + 40);
    ctx.lineTo(x + 21, y + 22);
    ctx.quadraticCurveTo(x + 22, y + 12, x + 32, y + 14);
    ctx.quadraticCurveTo(x + 39, y + 15, x + 37, y + 25);
    ctx.lineTo(x + 36, y + 40);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#995537";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 11, y + 24);
    ctx.lineTo(x + 18, y + 24);
    ctx.moveTo(x + 27, y + 31);
    ctx.lineTo(x + 34, y + 31);
    ctx.stroke();
    ctx.fillStyle = "#5baa65";
    ctx.beginPath();
    ctx.ellipse(x + 20, y + 8, 17, 6, -.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#83ce75";
    ctx.beginPath();
    ctx.ellipse(x + 16, y + 6, 8, 4, -.35, 0, Math.PI * 2);
    ctx.fill();
}

function drawCoins() {
    for (const coin of coins) {
        if (!coin.active) continue;
        const wobble = Math.sin(animationFrame * .12 + coin.x) * .12;
        ctx.save();
        ctx.translate(coin.x + 10, coin.y + 10);
        ctx.scale(Math.max(.35, Math.abs(Math.cos(animationFrame * .08 + coin.x * .01))), 1);
        ctx.fillStyle = "#f0a92f";
        ctx.beginPath();
        ctx.arc(0, 1, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffd75c";
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff2a1";
        ctx.beginPath();
        ctx.ellipse(-2, -3 + wobble * 5, 2, 3, -.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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
document.getElementById("pause-btn").addEventListener("click", () => {
    if (gameRunning) pauseGame();
    else resumeGame();
});
document.getElementById("resume-btn").addEventListener("click", resumeGame);
draw();

// =========================================================
// THEME CONTROLLER & TRAIL BUDDY
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
        themeBtn.innerText = isWhiteMode ? "🌙" : "☀️";
        themeBtn.title = isWhiteMode ? "Switch to dark mode" : "Switch to light mode";
        themeBtn.setAttribute("aria-label", themeBtn.title);
        draw();
        triggerHorse(isWhiteMode ? "theme-light" : "theme-dark");
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", isWhiteMode ? "#e5e7eb" : "#121212");
        }
        triggerHorse(isWhiteMode ? "theme-white" : "theme-dark");
    });
}

const horseRoasts = {
    start: [
        "Ready, runner? A little hop goes a long way. Good luck out there!",
        "Your trail buddy is cheering for you. Watch for those stumps!",
        "Let's see how many shiny coins we can find on this run."
    ],
    death: [
        "Aw, the trail got you! Try jumping a little earlier next time.",
        "What a run! The stumps get quicker as you go, so keep an eye ahead.",
        "Every runner trips sometimes. Tap Space or ↑ to hop over the next one.",
        "You made it {score} points! Let's dust off and give it another go."
    ],
    coin: [
        "Nice catch! Those shiny coins are all yours.",
        "A coin for your pocket and a little sparkle for the trail!"
    ],
    "theme-light": [
        "Sunny colors on! It's a lovely day for a run.",
        "The sky is bright, and so is your next high score."
    ],
    "theme-dark": [
        "Evening colors on. The trail is still yours!",
        "A cozy little twilight run. Keep watching those stumps."
    ],
    hint: [
        "Press Space or ↑ to jump. The stumps get faster as your score grows.",
        "Coins float above the trail, so time your jump to scoop them up.",
        "Need a breather? Use the pause button or tap Escape.",
        "A short hop is enough for the stumps. You can only jump again after landing."
    ],
    milestone: [
        "Look at you go — {score} points and counting!",
        "That's {score}! Your trail buddy is doing a happy little trot.",
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
    
    horseMessage.textContent = quote;

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

