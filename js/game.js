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

// Game Constants
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
let speed = 9;
let baseSpeed = 9;
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
    if(mode === 'baby') label = "DIFFICULTY: CAN I PLAY, DADDY?";
    if(mode === 'death') label = "DIFFICULTY: DEATH INCARNATE";
    startDiffBtn.innerText = label;
    if(mode === 'death') megaText.innerText = "NO MEGA MODE!";
    else megaText.innerText = "COLLECT 50 🦴";
    
    // Refresh start screen rendering when difficulty changes
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
    baseSpeed = (difficulty === 'death') ? 11 : 9; speed = baseSpeed;
    levelDistance=0; levelFinished=false; levelVictoryAnim=false; finishLine=null; isDead = false;
    globalSpawnCooldown = 0;
    
    // MEGA MODE RESET FIX (Always reset streak on death/restart)
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
        else { clearInterval(interval); countdownText.innerText = "GO!"; playBark(); setTimeout(() => { countdownLayer.style.display = 'none'; isCountingDown = false; gameActive = true; startMusic(currentLevel, difficulty, pepper); }, 500); }
    }, 800);
}

function loop() {
    if((gameActive && !isPaused && !isCountingDown)) { frame++; } 
    if(levelVictoryAnim) { frame++; pepper.x += speed * 1.5; }

    groundY = canvas.height - GROUND_H;
    ctx.save();
    
    let targetZoom = (gameActive && pepper.isMega) ? 1.05 : 1.0;
    zoomLevel += (targetZoom - zoomLevel) * 0.05;
    
    ctx.translate(canvas.width/2, canvas.height/2); ctx.scale(zoomLevel, zoomLevel); ctx.translate(-canvas.width/2, -canvas.height/2);
    if(shakeAmount > 0) { ctx.translate((Math.floor(Math.random()*shakeAmount)-shakeAmount/2), (Math.floor(Math.random()*shakeAmount)-shakeAmount/2)); shakeAmount*=0.9; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let sky = getSkyColor(levelDistance, levelMaxDistance, currentLevel);
    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height); grad.addColorStop(0, sky.c1); grad.addColorStop(1, sky.c2); ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Backgrounds
    ctx.fillStyle = "rgba(255,255,255,0.2)"; let celestialY = (currentLevel%3===2) ? canvas.height*0.8 : 100; ctx.beginPath(); ctx.arc(canvas.width*0.8, celestialY, 60, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.1)"; bgMountains.forEach(m => { if(!levelFinished && gameActive && !isPaused && !isCountingDown) m.x -= speed * 0.05; if(m.x < -300) m.x = canvas.width + 100; ctx.beginPath(); ctx.moveTo(Math.floor(m.x), groundY); ctx.lineTo(Math.floor(m.x+150), groundY-300); ctx.lineTo(Math.floor(m.x+300), groundY); ctx.fill(); });
    bgTrees.forEach(t => { if(!levelFinished && gameActive && !isPaused && !isCountingDown) t.x -= speed * 0.2; if(t.x < -50) t.x = canvas.width + Math.random()*300; ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.beginPath(); ctx.moveTo(Math.floor(t.x), groundY); ctx.lineTo(Math.floor(t.x+25), groundY-100); ctx.lineTo(Math.floor(t.x+50), groundY); ctx.fill(); });
    
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    bgClouds.forEach(c => { if(!isPaused && !isCountingDown) c.x -= c.speed; if(c.x < -100) c.x = canvas.width + 100; ctx.beginPath(); ctx.ellipse(c.x, c.y, 40, 20, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(c.x+20, c.y-10, 30, 20, 0, 0, Math.PI*2); ctx.fill(); });
    if(currentLevel % 3 === 0 || (frame % 3000 > 1500)) { ctx.fillStyle = "white"; stars.forEach(s => { let blink = Math.sin(frame*0.1 + s.x) > 0.8 ? 1 : 0.5; ctx.globalAlpha = blink; ctx.fillRect(s.x, s.y, s.size, s.size); }); ctx.globalAlpha = 1; }

    ctx.fillStyle = sky.ground; ctx.fillRect(0, groundY, canvas.width, GROUND_H);
    ctx.fillStyle = "rgba(255,255,255,0.05)"; let stripeOffset = Math.floor((frame * speed) % 100); for(let i = -100; i < canvas.width + 100; i+=100) { ctx.beginPath(); ctx.moveTo(i - stripeOffset, groundY); ctx.lineTo(i - stripeOffset + 40, groundY + GROUND_H); ctx.lineTo(i - stripeOffset + 90, groundY + GROUND_H); ctx.lineTo(i - stripeOffset + 50, groundY); ctx.fill(); }
    if(!levelFinished && pepper.grounded && (gameActive || levelVictoryAnim)) { ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.arc(120 - (frame*speed)%20, groundY+2, 5 * Math.random(), 0, Math.PI*2); ctx.fill(); }
    ctx.fillStyle = sky.grass; ctx.fillRect(0, groundY, canvas.width, 20);
    if(currentLevel >= 3) { ctx.fillStyle = "rgba(255,255,255,0.5)"; weatherParticles.forEach(p => { if(!isPaused && !isCountingDown) { p.y += p.speed; p.x += p.wind; } if(p.y > canvas.height) p.y = 0; if(p.x > canvas.width) p.x = 0; ctx.fillRect(p.x, p.y, p.size, p.size); }); }

    if (gameActive && !levelFinished && !isPaused && !isCountingDown) {
        levelDistance += speed * 0.1;
        let pct = Math.min((levelDistance / levelMaxDistance) * 100, 100); progressFill.style.width = pct + "%";
        if(levelDistance >= levelMaxDistance && !finishLine) finishLine = {x: canvas.width, type: 'finish'};
    }

    [particles, floatTexts].forEach(arr => { for(let i=arr.length-1; i>=0; i--) { let p = arr[i]; if(p.text) { p.y-=2; p.life-=0.02; ctx.globalAlpha=p.life; ctx.fillStyle=p.color; ctx.font="900 30px 'Montserrat'"; ctx.fillText(p.text, p.x, p.y); } else { p.x+=p.vx; p.y+=p.vy; p.life-=0.03; ctx.globalAlpha=p.life; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,5,0,Math.PI*2); ctx.fill(); } if(p.life<=0) arr.splice(i,1); } });
    ctx.globalAlpha=1;

    if(pepper.isMega && (gameActive || levelVictoryAnim)) {
        ctx.save(); ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; ctx.lineWidth = 2;
        for(let i=0; i<10; i++) { let ly = Math.random() * canvas.height; let lx = Math.random() * canvas.width; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 50 + Math.random()*50, ly); ctx.stroke(); }
        ctx.restore();
    }

    if(difficulty !== 'death') {
        if(pepper.isMega && gameActive && !isPaused && !isCountingDown) {
            pepper.megaTimer--; 
            megaMeter.classList.add('mega-active'); 
            let pct = (pepper.megaTimer / 900) * 100;
            megaBarFill.style.width = pct + "%";
            megaText.innerText = "MEGA MODE!";
            if(pepper.megaTimer<=0) { pepper.isMega=false; pepper.streak=0; megaMeter.classList.remove('mega-active'); megaBarFill.style.width = "0%"; updateMegaText(); }
        } else if (!pepper.isMega) {
            let target = (pepper.hat === 'cowboy') ? 25 : 50;
            let remaining = Math.max(0, target - pepper.streak); 
            let pct = (pepper.streak / target) * 100; 
            megaBarFill.style.width = pct + "%"; 
            megaText.innerText = "COLLECT " + remaining + " 🦴";
        }
    }

    if(magnetCooldown > 0) magnetCooldown--;
    if(pepper.magnetTimer > 0 && gameActive) {
        pepper.magnetTimer--;
        bones.forEach(b => {
            let dx = 150 - b.x; let dy = pepper.y - b.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < 400) { b.x += dx * 0.15; b.y += dy * 0.15; }
        });
    }

    if(gameActive && !isPaused && !isCountingDown) { 
        pepper.dy += GRAVITY; pepper.y += pepper.dy; 
        if(pepper.y >= groundY) { pepper.y=groundY; pepper.dy=0; pepper.grounded=true; pepper.canDoubleJump = false; } 
    } else if (!gameActive && !isCountingDown && !levelVictoryAnim) { pepper.y = groundY; }

    // RENDER CHARACTER
    if(!gameActive && !isCountingDown && !levelVictoryAnim) {
        // DRAW START SCREEN DOG (Big & Front Facing, positioned on top of grass)
        drawFrontFacingHusky(ctx, 150, groundY - 130, 2.0, difficulty); 
        drawSteamDooDoo(ctx, canvas.width * 0.75, groundY-15, frame); 
    } else {
        // DRAW IN-GAME DOG (Normal Runner - Side View)
        let drawX = levelVictoryAnim ? pepper.x : 150; 
        drawHusky(ctx, drawX, pepper.y, pepper.isMega, pepper.hasShield, pepper, difficulty, frame);
    }

    if(finishLine && !isDead) {
        finishLine.x -= speed;
        ctx.save(); ctx.translate(finishLine.x, groundY - 150); 
        let wave = Math.sin(frame*0.2) * 10; ctx.fillStyle = "white"; ctx.fillRect(0, 0, 10, 150); 
        for(let r=0; r<4; r++) { for(let c=0; c<6; c++) { ctx.fillStyle = (r+c)%2===0 ? "white" : "black"; ctx.fillRect(10 + c*20, r*20 + (c*wave*0.1), 20, 20); } } ctx.restore();
        if(finishLine.x < 150 && !levelFinished) { levelFinished = true; levelVictoryAnim = true; pepper.x = 150; }
    }
    if(levelVictoryAnim && pepper.x > canvas.width + 100) { completeLevel(); levelVictoryAnim = false; }

    if(!finishLine && gameActive && !isPaused && !isCountingDown) {
        if (globalSpawnCooldown > 0) globalSpawnCooldown--;
        else {
            if(Math.random() < 0.05) { 
                let r = Math.random(); 
                let obj = {x: canvas.width, type: 'poo', stack: 1, y: groundY};
                let cooldownSet = 40; 
                if(currentLevel >= 3 && r > 0.92) { obj.type = 'pond'; cooldownSet = 60; } 
                else if(currentLevel >= 2 && r > 0.85) { obj.type = 'stack'; obj.stack = 3; cooldownSet = 120; } 
                else if(r > 0.75) { obj.type = 'hydrant'; cooldownSet = 50; }
                else if (r > 0.60) { obj.type = 'bird'; obj.y = (Math.random() > 0.5) ? groundY - 40 : groundY - 110; cooldownSet = 50; if(Math.random() > 0.3) bones.push({x: canvas.width, y: (obj.y < groundY-80 ? groundY-40 : groundY-150), type: 'white'}); }
                else { obj.type = 'poo'; obj.stack = Math.floor(Math.random()*2)+1; cooldownSet = 40; if(Math.random() > 0.5) bones.push({x: canvas.width, y: groundY - 120, type: 'white'}); }
                obstacles.push(obj); globalSpawnCooldown = cooldownSet;
            }
        }
        nextBoneTimer--;
        if(nextBoneTimer <= 0) {
             let h = Math.random(); let bY = groundY - 40; if(h > 0.5) bY = groundY - 100; if(h > 0.85) bY = groundY - 180; 
             let bType = 'white'; if(Math.random() > 0.98 && magnetCooldown <= 0) { bType = 'magnet'; magnetCooldown = 2700; } else if(Math.random() > 0.9) bType = 'gold';
             bones.push({x: canvas.width, y: bY, type: bType}); nextBoneTimer = 40 + Math.random() * 80; 
        }
        nextStickTimer--;
        if(nextStickTimer <= 0) { if(Math.random() > 0.5) sticks.push({x: canvas.width, y: groundY - 120}); nextStickTimer = 150 + Math.random() * 200; }
    }

    for(let i=obstacles.length-1; i>=0; i--) {
        let o = obstacles[i]; if(!levelFinished && gameActive && !isPaused && !isCountingDown) o.x -= speed;
        if(o.type === 'poo') drawDooDoo(ctx, o.x, groundY, o.stack);
        else if(o.type === 'stack') { drawDooDoo(ctx, o.x, groundY, 3); drawFlies(ctx, o.x, groundY, frame); }
        else if(o.type === 'bird') { drawFlies(ctx, o.x, o.y, frame); } 
        else if(o.type === 'hydrant') drawHydrant(ctx, o.x, groundY);
        else if(o.type === 'pond') { ctx.fillStyle = "rgba(241, 196, 15, 0.8)"; ctx.beginPath(); ctx.ellipse(o.x, groundY+5, 100, 15, 0, 0, Math.PI*2); ctx.fill(); }
        
        let hit = false;
        if(o.type === 'bird') { if(Math.abs(150-o.x) < 25 && Math.abs(pepper.y - o.y) < 25) hit = true; }
        if(o.type === 'poo' && Math.abs(150-o.x)<20 && pepper.y > groundY-(o.stack*35)+15) hit=true;
        if(o.type === 'hydrant' && Math.abs(150-o.x)<15 && pepper.y > groundY-35) hit=true; 
        if(o.type === 'stack' && Math.abs(150-o.x)<20 && pepper.y > groundY-105) hit=true; 
        if(o.type === 'pond' && o.x < 150+10 && o.x > 150-90 && pepper.y > groundY - 5) hit=true; 

        if(hit && gameActive && !isPaused && !isCountingDown && !levelVictoryAnim) {
            if(o.type === 'hydrant' || o.type === 'pond') {
                if(o.type === 'hydrant' && pepper.isMega) { gameOver('mega-hydrant'); } 
                else { let color = o.type==='hydrant' ? "#00fbff" : "#f1c40f"; spawnParticles(150, groundY, color, 40); playSfx('splash'); playSfx('crash'); flashScreen(color); gameOver('standard'); }
                continue; 
            }
            if(pepper.isMega) { score += 5; spawnParticles(o.x, groundY, "#8B4513", 20); spawnPopup("SMASH!", o.x, o.y-50, "orange"); playSfx('smash'); shakeScreen(15); obstacles.splice(i, 1); continue; }
            if(pepper.hasShield) { pepper.hasShield = false; pepper.sticks=0; stickText.innerText="0/5"; spawnParticles(o.x, groundY, "#8B4513", 25); playSfx('crash'); flashScreen('red'); spawnPopup("SHIELD BROKE!", 150, pepper.y-50, "red"); obstacles.splice(i, 1); continue; }
            gameOver('standard');
        }
        if(o.x < -300) obstacles.splice(i, 1);
    }

    for(let i=sticks.length-1; i>=0; i--) {
        let s = sticks[i]; if(!levelFinished && gameActive && !isPaused && !isCountingDown) s.x -= speed; drawStick(ctx, s.x, s.y, frame);
        if(gameActive && !isPaused && Math.abs(150-s.x)<40 && Math.abs(pepper.y-25-s.y)<40) {
            if(difficulty !== 'death') {
                pepper.sticks++; playSfx('collect'); spawnParticles(s.x, s.y, "#00b894", 15);
                if(pepper.sticks>=5) { pepper.hasShield=true; pepper.sticks=0; spawnPopup("STICK SHIELD!", 150, pepper.y-50, "#00b894"); flashScreen('#00b894'); }
                stickText.innerText=pepper.sticks+"/5";
            } else { spawnPopup("NO SHIELDS", s.x, s.y, "red"); }
            sticks.splice(i,1);
        } else if(s.x<-100) sticks.splice(i,1);
    }

    for(let i=bones.length-1; i>=0; i--) {
        let b = bones[i]; if(!levelFinished && gameActive && !isPaused && !isCountingDown) b.x -= speed; drawBone(ctx, b.x, b.y, b.type, frame);
        if(gameActive && !isPaused && Math.abs(150-b.x)<40 && Math.abs(pepper.y-25-b.y)<40) {
            if(b.type === 'magnet') { pepper.magnetTimer = 600; playSfx('magnet'); spawnPopup("MAGNET!", b.x, b.y, "#e74c3c"); }
            else {
                let val = (b.type === 'gold') ? 5 : 1; let scoreVal = (pepper.hat === 'cap') ? val * 2 : val; 
                score += scoreVal; scoreEl.innerText = score + " 🦴"; 
                playSfx('collect'); spawnParticles(b.x, b.y, "gold", 15); spawnPopup("+"+scoreVal, b.x, b.y, "gold"); 
                if(!pepper.isMega && difficulty !== 'death') { 
                    let target = (pepper.hat === 'cowboy') ? 25 : 50; pepper.streak += val; 
                    if(pepper.streak >= target){ pepper.isMega=true; pepper.megaTimer = 900; pepper.spinTimer = 40; spawnPopup("MEGA MODE!", canvas.width/2, canvas.height/3, "#ff00ff"); flashScreen('white'); shakeScreen(20); } 
                }
            }
            bones.splice(i,1);
        } else if(b.x<-100) bones.splice(i,1);
    }
    
    if (gameActive && !isPaused) {
        fgBushes.forEach(bush => {
            bush.x -= speed * 1.5; if(bush.x < -150) { bush.x = canvas.width + Math.random()*500; }
            ctx.fillStyle = "#0f1519"; ctx.beginPath();
            ctx.arc(bush.x, canvas.height + 20, 60, 0, Math.PI*2);
            ctx.arc(bush.x+50, canvas.height + 30, 50, 0, Math.PI*2);
            ctx.arc(bush.x+30, canvas.height - 10, 40, 0, Math.PI*2);
            ctx.fill();
        });
    }

    ctx.restore();
    requestAnimationFrame(loop);
}

function completeLevel() { 
    if(isDead) return;
    levelFinished = true; playSfx('levelup'); stopMusic(); setTimeout(openShop, 1500); 
}

function gameOver(reason) { 
    isDead = true; gameActive = false; stopMusic(); endScoreEl.innerText = score; 
    if(difficulty === 'baby') { retryBtn.innerText = "RETRY LEVEL (BABY MODE)"; } else { retryBtn.innerText = "TRY AGAIN"; }
    if(reason === 'mega-hydrant') { goTitle.innerText = "STINKY!"; goMsg.innerText = "EVEN MEGA PEPPER HAS TO HOP A HYDRANT!"; goCanvas.style.display = 'block'; let gCtx = goCanvas.getContext('2d'); gCtx.clearRect(0,0,150,100); drawHydrant(gCtx, 75, 80); } else { goTitle.innerText = "GAME OVER!"; goMsg.innerText = ""; goCanvas.style.display = 'none'; } 
    gameOverScreen.style.display = 'flex'; 
}

function handleInput() { 
    if(!gameActive || isPaused || isCountingDown || levelVictoryAnim) return; 
    initAudio(); 
    if(pepper.grounded) { pepper.dy = JUMP_FORCE; pepper.grounded = false; playSfx('jump'); if(pepper.doubleJumpUnlocked) pepper.canDoubleJump = true; } 
    else if (pepper.canDoubleJump) { pepper.dy = DOUBLE_JUMP_FORCE; pepper.canDoubleJump = false; playSfx('doublejump'); spawnParticles(150, pepper.y, "white", 5); } 
}

window.addEventListener('touchstart', (e) => { if(e.target.className.includes('btn') || e.target.className.includes('menu') || menuOpen || e.target.closest('.diff-card') || e.target.closest('.shop-item')) return; if(e.target !== menuBtn) { e.preventDefault(); handleInput(); } }, {passive: false});
window.addEventListener('mousedown', (e) => { if(e.target.className.includes('btn') || e.target.className.includes('menu') || menuOpen || e.target.closest('.diff-card') || e.target.closest('.shop-item')) return; if(e.target !== menuBtn) handleInput(); });

// Fix for Content Security Policy (Difficulty Buttons)
document.getElementById('diff-baby').addEventListener('click', () => setDifficulty('baby'));
document.getElementById('diff-normal').addEventListener('click', () => setDifficulty('normal'));
document.getElementById('diff-death').addEventListener('click', () => setDifficulty('death'));

// Start
resize(); resetGameLogic(); renderDiffPreviews(); drawStickIcon(); requestAnimationFrame(loop);
