// --- GAME LOGIC & STATE ---

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Helper Getters for Audio/Renderer
window.isGamePaused = () => isPaused;
window.getLevelDistance = () => levelDistance;
window.getLevelMaxDistance = () => levelMaxDistance;

// UI Elements
const uiLayer = document.getElementById('ui-layer');
const scoreEl = document.getElementById('score');
const levelInd = document.getElementById('level-indicator');
const stickText = document.getElementById('stick-text');
const progressFill = document.getElementById('progress-fill');
const countdownLayer = document.getElementById('countdown-layer');
const countdownText = document.getElementById('countdown-text');
const megaMeter = document.getElementById('mega-meter');
const megaText = document.getElementById('mega-text');
const megaBarFill = document.getElementById('mega-bar-fill');

// Menu & Screens
const menuBtn = document.getElementById('menu-btn');
const menuContent = document.getElementById('menu-content');
const menuMute = document.getElementById('menu-mute');
const menuHome = document.getElementById('menu-home');
const menuHelp = document.getElementById('menu-help');
const startScreen = document.getElementById('start-screen');
const difficultyScreen = document.getElementById('difficulty-screen');
const gameOverScreen = document.getElementById('game-over');
const shopScreen = document.getElementById('shop-screen');
const howToScreen = document.getElementById('how-to-screen');
const infoModal = document.getElementById('info-modal');

// Buttons
const startBtn = document.getElementById('start-btn');
const startDiffBtn = document.getElementById('start-diff-btn');
const retryBtn = document.getElementById('retry-btn');
const nextLevelBtn = document.getElementById('shop-next-btn');
const closeHelpBtn = document.getElementById('close-help-btn');
const modalBtn = document.getElementById('modal-btn');
const closeDiffBtn = document.getElementById('close-diff-btn');
const endScoreEl = document.getElementById('end-score');
const goTitle = document.getElementById('go-title');
const goMsg = document.getElementById('go-msg');
const goCanvas = document.getElementById('go-canvas');
const flashOverlay = document.getElementById('flash-overlay');
const shopContainer = document.getElementById('shop-container');
const shopBalance = document.getElementById('shop-balance');
const shopTextBox = document.getElementById('shop-text-box');

// --- PHYSICS ---
const GRAVITY = 1.1; 
const JUMP_FORCE = -19; 
const DOUBLE_JUMP_FORCE = -15; 
const GROUND_H = 140; 

// Game State
let difficulty = 'normal';
let gameActive = false;
let isPaused = false;
let isCountingDown = false;
let levelVictoryAnim = false;
let frame = 0;
let score = 0; 
let levelStartScore = 0;

// --- GLOBAL DEFAULT SPEED ---
let speed = 8;     // Default (Normal)
let baseSpeed = 8; // Default (Normal)

let groundY = 0; 
let shakeAmount = 0;
let zoomLevel = 3.5; 
let currentLevel = 1;
let levelDistance = 0;
let levelMaxDistance = 2000; 
let levelFinished = false; 
let menuOpen = false;
let magnetCooldown = 0;
let isDead = false;
let globalSpawnCooldown = 0;

let pepper = {
    x: 100, y: 0, dy: 0,
    grounded: true, canDoubleJump: false, isMega: false,
    streak: 0, megaTimer: 0, sticks: 0, hasShield: false,
    doubleJumpUnlocked: true,
    runFrame: 0, rotation: 0,
    magnetTimer: 0, spinTimer: 0,
    hat: 'none', isStatic: false
};

// Entities
let obstacles = [];
let sticks = [];
let bones = [];
let particles = [];
let bgMountains = [];
let bgTrees = [];
let bgClouds = [];
let fgBushes = [];
let weatherParticles = [];
let stars = [];
let floatTexts = [];
let nextStickTimer = 0;
let nextBoneTimer = 0;
let finishLine = null; 

// --- INITIALIZATION ---
function resize() { 
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
    groundY = canvas.height - GROUND_H;
    if(!gameActive && !frame) pepper.y = groundY;
}
window.addEventListener('resize', resize);

function attachFastClick(element, action) {
    element.addEventListener('touchstart', (e) => { e.stopPropagation(); e.preventDefault(); playClick(); action(); }, {passive:false});
    element.addEventListener('mousedown', (e) => { e.stopPropagation(); playClick(); action(); });
}

// Menu Actions
attachFastClick(menuBtn, () => { menuOpen = !menuOpen; menuContent.style.display = menuOpen ? "flex" : "none"; menuBtn.innerText = menuOpen ? "✕" : "☰"; });
attachFastClick(menuMute, () => { isMuted = !isMuted; menuMute.innerText = isMuted ? "🔇 SOUND: OFF" : "🔊 SOUND: ON"; if(isMuted) stopMusic(); else if(gameActive && !isPaused && !isCountingDown) startMusic(currentLevel, difficulty, pepper); });
attachFastClick(menuHome, () => { goHome(); });
attachFastClick(menuHelp, () => { if(gameActive) { isPaused = true; stopMusic(); } menuContent.style.display = 'none'; menuOpen = false; menuBtn.innerText = "☰"; howToScreen.style.display = 'flex'; });
attachFastClick(closeHelpBtn, () => { howToScreen.style.display = 'none'; if(gameActive) { isPaused = false; startMusic(currentLevel, difficulty, pepper); } });
attachFastClick(startBtn, () => { startSequence(false); });
attachFastClick(startDiffBtn, () => { openDifficultyScreen(); });
attachFastClick(retryBtn, () => { if(difficulty === 'baby') { resetLevelState(); startSequence(false); } else { resetGameLogic(); startSequence(false); } });
attachFastClick(nextLevelBtn, () => { goToNextLevel(); });
attachFastClick(modalBtn, () => { closeModal(); });
attachFastClick(closeDiffBtn, () => { difficultyScreen.style.display = 'none'; });

function openDifficultyScreen() { difficultyScreen.style.display = 'flex'; renderDiffPreviews(); }

function setDifficulty(mode) {
    difficulty = mode;
    document.querySelectorAll('.diff-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('diff-'+mode).classList.add('selected');
    let label = "DIFFICULTY: BRING 'EM ON";
    
    // --- UPDATED SPEED LOGIC (BALANCED) ---
    if(mode === 'baby') { 
        label = "DIFFICULTY: CAN I PLAY, DADDY?";
        baseSpeed = 5; // Slow but engaging
    } else if(mode === 'death') {
        label = "DIFFICULTY: DEATH INCARNATE";
        baseSpeed = 12; // Fast but reaction-possible
    } else {
        // Normal
        baseSpeed = 8; // Standard platformer speed
    }
    
    // Force update speed now
    speed = baseSpeed;

    startDiffBtn.innerText = label;
    if(mode === 'death') megaText.innerText = "NO MEGA MODE!";
    else megaText.innerText = "COLLECT 50 🦴";
    
    if(!gameActive) {
        requestAnimationFrame(loop);
    }
}

function resetGameLogic() {
    score = 0; levelStartScore = 0; scoreEl.innerText="0 🦴"; 
    pepper.sticks=0; stickText.innerText="0/5"; 
    pepper.streak=0; currentLevel=1; 
    pepper.hat = 'none';
    resetLevelState(); drawStickIcon();
}

function resetLevelState() {
    obstacles=[]; sticks=[]; bones=[]; floatTexts=[]; 
    
    // --- ENSURE CORRECT SPEED ON RESET ---
    if (difficulty === 'baby') baseSpeed = 5;
    else if (difficulty === 'death') baseSpeed = 12;
    else baseSpeed = 8; // Normal
    speed = baseSpeed;
    
    levelDistance=0; levelFinished=false; levelVictoryAnim=false; finishLine=null; isDead = false;
    globalSpawnCooldown = 0;
    
    pepper.streak = 0;
    pepper.isMega = false;
    pepper.megaTimer = 0;
    
    levelInd.innerText = "LEVEL " + currentLevel; 
    
    pepper.y = groundY; pepper.dy=0; pepper.grounded=true; 
    pepper.magnetTimer = 0; pepper.spinTimer = 0;
    pepper.rotation = 0; pepper.x = 100;
    magnetCooldown = 0; 
    
    if(pepper.hat === 'tophat') { pepper.hasShield = true; pepper.sticks = 5; stickText.innerText="5/5"; } 
    else { pepper.hasShield = false; pepper.sticks = 0; stickText.innerText="0/5"; }

    megaMeter.classList.remove('mega-active');
    megaBarFill.style.width = "0%";
    updateMegaText();

    globalSpawnCooldown = 100; 
    
    bgMountains=[]; for(let i=0; i<3; i++) bgMountains.push({x: i*300});
    bgTrees=[]; for(let i=0; i<5; i++) bgTrees.push({x: i*200});
    bgClouds=[]; for(let i=0; i<5; i++) bgClouds.push({x: Math.random()*canvas.width, y: Math.random()*150, speed: 0.2 + Math.random()*0.3});
    fgBushes=[]; for(let i=0; i<3; i++) fgBushes.push({x: Math.random()*canvas.width});
    weatherParticles=[]; for(let i=0; i<50; i++) weatherParticles.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, speed:2+Math.random()*2, wind:-1+Math.random()*2, size:2+Math.random()*2});
    stars=[]; for(let i=0; i<50; i++) stars.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height/2, size:Math.random()*3});
}

function updateMegaText() {
    if(difficulty === 'death') { megaText.innerText = "NO MEGA MODE!"; return; }
    let target = (pepper.hat === 'cowboy') ? 25 : 50;
    if(pepper.isMega) megaText.innerText = "MEGA MODE!";
    else {
        let remaining = Math.max(0, target - pepper.streak);
        megaText.innerText = "COLLECT " + remaining + " 🦴";
    }
}

function goToNextLevel() { 
    shopScreen.style.display = 'none';
    levelStartScore = score; currentLevel++; levelMaxDistance += 1000; 
    resetLevelState(); 
    startSequence(false); 
}

function goHome() {
    gameActive = false; isPaused = false; isCountingDown = false; stopMusic();
    uiLayer.style.display = 'none'; menuContent.style.display = 'none'; menuOpen = false; menuBtn.innerText = "☰";
    startScreen.style.display = 'flex'; gameOverScreen.style.display = 'none'; howToScreen.style.display = 'none'; shopScreen.style.display = 'none';
    resetGameLogic(); pepper.y = groundY; pepper.dy = 0; zoomLevel = 3.5;
}

// --- SHOP ---
const hatData = {
    none: { name: "No Hat", cost: 0, perk: "None", canvasId: 'shop-cvs-none' },
    cap: { name: "Red Cap", cost: 50, perk: "2x 🦴", icon: "🧢" },
    tophat: { name: "Top Hat", cost: 100, perk: "Start w/ 🛡️", icon: "🎩" },
    cowboy: { name: "Cowboy", cost: 200, perk: "Half Price Mega", icon: "🤠" }
};

function openShop() {
    shopScreen.style.display = 'flex';
    shopBalance.innerText = score + " 🦴";
    let sk = document.getElementById('shopkeeper-canvas');
    let skCtx = sk.getContext('2d');
    skCtx.clearRect(0,0,100,100);
    drawHeadPreview(skCtx, 50, 50, 'normal');
    renderShop();
}

function renderShop() {
    shopContainer.innerHTML = '';
    const keys = ['none', 'cap', 'tophat', 'cowboy'];
    keys.forEach(k => {
        let item = hatData[k];
        let div = document.createElement('div');
        div.className = 'shop-item';
        if (pepper.hat === k) div.classList.add('selected');
        let isAffordable = score >= item.cost;
        let alreadyOwn = pepper.hat === k; 
        if (!isAffordable && !alreadyOwn && k !== 'none') div.classList.add('locked');
        else div.classList.remove('locked');

        let iconHtml = `<div class="shop-icon">${item.icon || ''}</div>`;
        if (k === 'none') iconHtml = `<canvas id="shop-cvs-none" width="60" height="60" style="margin-bottom:10px;"></canvas>`;

        div.innerHTML = `${iconHtml}<div class="shop-name">${item.name}</div><div class="shop-perk">${item.perk}</div><div class="shop-cost">${item.cost > 0 ? item.cost + ' 🦴' : 'OWNED'}</div>`;
        div.onclick = () => {
            if (k === 'none') { pepper.hat = 'none'; shopTextBox.innerText = "SOMETIMES NATURAL IS BEST!"; renderShop(); return; }
            if (pepper.hat === k) { shopTextBox.innerText = "YOU ARE ALREADY WEARING THAT!"; return; }
            if (score >= item.cost) {
                score -= item.cost; pepper.hat = k;
                shopBalance.innerText = score + " 🦴"; scoreEl.innerText = score + " 🦴";
                shopTextBox.innerText = "GREAT CHOICE! LOOKING SHARP!";
                renderShop(); playSfx('collect');
            } else { shopTextBox.innerText = "YOU DON'T HAVE ENOUGH BONES!"; playSfx('crash'); }
        };
        shopContainer.appendChild(div);
    });
    let c = document.getElementById('shop-cvs-none');
    if(c) { let x = c.getContext('2d'); x.clearRect(0,0,60,60); drawHeadPreview(x, 30, 30, 'normal'); }
}

function renderDiffPreviews() {
    ['baby', 'normal', 'death'].forEach(mode => {
        let cvs = document.getElementById('cvs-'+mode);
        let c = cvs.getContext('2d'); c.clearRect(0,0,100,100); drawHeadPreview(c, 50, 50, mode);
    });
}

function closeModal() { infoModal.style.display = 'none'; isPaused = false; startMusic(currentLevel, difficulty, pepper); }
function spawnPopup(text, x, y, color) { floatTexts.push({ text, x, y, color, life: 1.0 }); }
function spawnParticles(x, y, color, count, vyMult=1) { for(let i=0;i<count;i++) particles.push({x, y, vx:(Math.random()-0.5)*15, vy:(Math.random()-1)*15*vyMult, life:1, color}); }
function shakeScreen(amount) { shakeAmount = amount; }
function flashScreen(color='white') { flashOverlay.style.background = color; flashOverlay.style.opacity = 0.5; setTimeout(() => flashOverlay.style.opacity = 0, 100); }

// --- GAME LOOP ---
function startSequence(isFullReset = false) {
    if(isFullReset) resetGameLogic(); 
    initAudio(); 
    startScreen.style.display = 'none'; gameOverScreen.style.display = 'none'; uiLayer.style.display = 'flex';
    isCountingDown = true; countdownLayer.style.display = 'flex';
    let count = 3; countdownText.innerText = count;
    let interval = setInterval(() => {
        count--;
        if(count > 0) { countdownText.innerText = count; countdownText.style.animation = 'none'; countdownText.offsetHeight; countdownText.style.animation = 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; playSnare(); } 
        else { clearInterval(interval); countdownText.innerText = "GO!"; playBark(); setTimeout(() => { countdownLayer.style.display = 'none'; isCountingDown = false; gameActive = true; startMusic(currentLevel, difficulty, pepper);
