/**
 * PEPPER'S DOO-DOO DASH - MASTER GAME LOGIC
 * V40 - STABLE LOOP & UNIFIED PHYSICS
 */

// --- 1. SETUP & DOM ELEMENTS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Global Helpers for Audio/Renderer
window.isGamePaused = () => isPaused;
window.getLevelDistance = () => levelDistance;
window.getLevelMaxDistance = () => levelMaxDistance;

// UI References
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

// Screens
const screens = {
    start: document.getElementById('start-screen'),
    diff: document.getElementById('difficulty-screen'),
    gameover: document.getElementById('game-over'),
    shop: document.getElementById('shop-screen'),
    howto: document.getElementById('how-to-screen'),
    modal: document.getElementById('info-modal')
};

// Buttons
const btn = {
    menu: document.getElementById('menu-btn'),
    mute: document.getElementById('menu-mute'),
    home: document.getElementById('menu-home'),
    help: document.getElementById('menu-help'),
    start: document.getElementById('start-btn'),
    diff: document.getElementById('start-diff-btn'),
    retry: document.getElementById('retry-btn'),
    next: document.getElementById('shop-next-btn'),
    closeHelp: document.getElementById('close-help-btn'),
    modal: document.getElementById('modal-btn'),
    closeDiff: document.getElementById('close-diff-btn')
};

// Menu Overlay
const menuContent = document.getElementById('menu-content');

// --- 2. GAME CONSTANTS (PHYSICS) ---
const PHYSICS = {
    GRAVITY: 0.8,          // Gravity force
    JUMP_FORCE: -16,       // Initial jump power
    DOUBLE_JUMP: -12,      // Double jump power
    GROUND_H: 140,         // Height of ground from bottom
    SPEED: 6               // UNIFIED SPEED (Same for all modes)
};

// --- 3. STATE VARIABLES ---
let gameState = 'START';   // START, COUNTDOWN, PLAYING, PAUSED, GAMEOVER, TRANSITION
let difficulty = 'normal'; // baby, normal, death
let frame = 0;
let score = 0;
let levelStartScore = 0;

let currentLevel = 1;
let levelDistance = 0;
let levelMaxDistance = 2000;
let levelFinished = false;
let levelVictoryAnim = false; // The little run off screen at the end

let groundY = 0;
let shakeAmount = 0;
let zoomLevel = 3.5;       // Starts zoomed in on title

let nextStickTimer = 0;
let nextBoneTimer = 0;
let globalSpawnCooldown = 0;
let magnetCooldown = 0;

let finishLine = null;

// Player Object
let pepper = {
    x: 100,
    y: 0,
    dy: 0,
    grounded: true,
    canDoubleJump: false,
    doubleJumpUnlocked: true,
    isMega: false,
    megaTimer: 0,
    streak: 0,
    sticks: 0,
    hasShield: false,
    hat: 'none',
    rotation: 0,
    runFrame: 0,
    magnetTimer: 0,
    spinTimer: 0
};

// Entity Arrays
let obstacles = [];
let sticks = [];
let bones = [];
let particles = [];
let floatTexts = [];

// Background Arrays
let bgMountains = [];
let bgTrees = [];
let bgClouds = [];
let fgBushes = [];
let weatherParticles = [];
let stars = [];

// Loop Control
let animationFrameId;
let isPaused = false;

// --- 4. INITIALIZATION ---
function init() {
    resize();
    resetGameData();
    // Create initial background elements
    initBackgrounds();
    // Start the ONE TRUE LOOP
    cancelAnimationFrame(animationFrameId);
    loop();
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - PHYSICS.GROUND_H;
    if (gameState === 'START') pepper.y = groundY;
}
window.addEventListener('resize', resize);

function initBackgrounds() {
    bgMountains = []; for(let i=0; i<3; i++) bgMountains.push({x: i*300});
    bgTrees = []; for(let i=0; i<5; i++) bgTrees.push({x: i*200});
    bgClouds = []; for(let i=0; i<5; i++) bgClouds.push({x: Math.random()*canvas.width, y: Math.random()*150, speed: 0.2 + Math.random()*0.3});
    fgBushes = []; for(let i=0; i<3; i++) fgBushes.push({x: Math.random()*canvas.width});
    weatherParticles = []; for(let i=0; i<50; i++) weatherParticles.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, speed:2+Math.random()*2, wind:-1+Math.random()*2, size:2+Math.random()*2});
    stars = []; for(let i=0; i<50; i++) stars.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height/2, size:Math.random()*3});
}

// --- 5. GAME LOOP ---
function loop() {
    // 1. Update State
    update();
    
    // 2. Render State
    draw();

    // 3. Request Next Frame
    animationFrameId = requestAnimationFrame(loop);
}

function update() {
    // Standard frame counter
    frame++;

    // Ground Y update (in case of resize)
    groundY = canvas.height - PHYSICS.GROUND_H;

    // --- PHYSICS & LOGIC ---
    if (gameState === 'PLAYING' && !isPaused) {
        
        // Move Pepper
        pepper.dy += PHYSICS.GRAVITY;
        pepper.y += pepper.dy;

        // Floor Collision
        if (pepper.y >= groundY) {
            pepper.y = groundY;
            pepper.dy = 0;
            pepper.grounded = true;
            pepper.canDoubleJump = false; // Reset double jump
        } else {
            pepper.grounded = false;
        }

        // Level Progress
        if (!levelFinished) {
            levelDistance += PHYSICS.SPEED * 0.1;
            let pct = Math.min((levelDistance / levelMaxDistance) * 100, 100);
            progressFill.style.width = pct + "%";

            if (levelDistance >= levelMaxDistance && !finishLine) {
                finishLine = { x: canvas.width, type: 'finish' };
            }
        }

        // Spawning
        spawnManager();

        // Object Updates
        updateEntities();

        // Mega Mode Timer
        if (pepper.isMega) {
            pepper.megaTimer--;
            let pct = (pepper.megaTimer / 900) * 100;
            megaBarFill.style.width = pct + "%";
            if (pepper.megaTimer <= 0) deactivateMega();
        }
        
        // Magnet Timer
        if (pepper.magnetTimer > 0) pepper.magnetTimer--;

    } else if (gameState === 'START' || gameState === 'GAMEOVER') {
        // Reset dog to ground for visual consistency
        pepper.y = groundY;
    } else if (gameState === 'TRANSITION') {
        // Victory run off screen
        pepper.dy += PHYSICS.GRAVITY;
        pepper.y += pepper.dy;
        if (pepper.y >= groundY) { pepper.y = groundY; pepper.dy = 0; }
        pepper.x += PHYSICS.SPEED * 1.5;
        
        // Animation
        pepper.runFrame += 0.3;
        
        if (pepper.x > canvas.width + 100) {
            handleLevelComplete();
        }
    }
    
    // Background Parallax (Always moves unless paused)
    if (gameState === 'PLAYING' && !isPaused) updateBackgrounds();
    
    // Zoom Logic
    let targetZoom = (gameState === 'PLAYING' && pepper.isMega) ? 1.05 : 
                     (gameState === 'START') ? 1.5 : 1.0; 
    zoomLevel += (targetZoom - zoomLevel) * 0.05;

    // Shake Logic
    if (shakeAmount > 0) {
        shakeAmount *= 0.9;
        if (shakeAmount < 0.5) shakeAmount = 0;
    }
}

function updateEntities() {
    // 1. Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let o = obstacles[i];
        o.x -= PHYSICS.SPEED;

        // Collision Hitboxes
        let hit = false;
        // Standard Poo/Stack
        if ((o.type === 'poo' || o.type === 'stack') && 
            Math.abs(pepper.x + 10 - o.x) < 25 && 
            pepper.y > groundY - (o.stack || 1) * 30 + 10) hit = true;
        
        // Hydrant
        if (o.type === 'hydrant' && Math.abs(pepper.x - o.x) < 20 && pepper.y > groundY - 35) hit = true;
        
        // Bird
        if (o.type === 'bird' && Math.abs(pepper.x - o.x) < 30 && Math.abs((pepper.y - 25) - o.y) < 25) hit = true;

        // Pond
        if (o.type === 'pond' && o.x < pepper.x + 20 && o.x > pepper.x - 80 && pepper.y >= groundY - 5) hit = true;

        if (hit) {
            handleCollision(o, i);
        } else if (o.x < -200) {
            obstacles.splice(i, 1);
        }
    }

    // 2. Sticks
    for (let i = sticks.length - 1; i >= 0; i--) {
        let s = sticks[i];
        s.x -= PHYSICS.SPEED;
        if (Math.abs(pepper.x - s.x) < 40 && Math.abs(pepper.y - 25 - s.y) < 40) {
            collectStick(s);
            sticks.splice(i, 1);
        } else if (s.x < -100) sticks.splice(i, 1);
    }

    // 3. Bones
    for (let i = bones.length - 1; i >= 0; i--) {
        let b = bones[i];
        
        // Magnet Effect
        if (pepper.magnetTimer > 0) {
            let dx = pepper.x - b.x;
            let dy = (pepper.y - 20) - b.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 400) {
                b.x += dx * 0.15;
                b.y += dy * 0.15;
            } else {
                b.x -= PHYSICS.SPEED;
            }
        } else {
            b.x -= PHYSICS.SPEED;
        }

        if (Math.abs(pepper.x - b.x) < 40 && Math.abs(pepper.y - 25 - b.y) < 40) {
            collectBone(b);
            bones.splice(i, 1);
        } else if (b.x < -100) bones.splice(i, 1);
    }

    // 4. Finish Line
    if (finishLine) {
        finishLine.x -= PHYSICS.SPEED;
        if (finishLine.x < pepper.x && !levelFinished) {
            triggerLevelVictory();
        }
    }

    // 5. Particles/Text
    [particles, floatTexts].forEach(arr => {
        for(let i=arr.length-1; i>=0; i--) {
            let p = arr[i];
            p.life -= 0.02;
            p.x += p.vx || 0;
            p.y += (p.vy || -1);
            if (p.life <= 0) arr.splice(i, 1);
        }
    });
}

function spawnManager() {
    if (levelFinished) return;

    // Obstacles
    if (globalSpawnCooldown > 0) globalSpawnCooldown--;
    else {
        if (Math.random() < 0.04) { // 4% chance per frame
            spawnObstacle();
            // Reset cooldown based on pixels (roughly 300px gap minimum)
            globalSpawnCooldown = 300 / PHYSICS.SPEED; 
        }
    }

    // Sticks
    nextStickTimer--;
    if (nextStickTimer <= 0) {
        if (Math.random() > 0.5) sticks.push({x: canvas.width, y: groundY - 120});
        nextStickTimer = 200 + Math.random() * 300;
    }

    // Bones
    nextBoneTimer--;
    if (nextBoneTimer <= 0) {
        let h = Math.random();
        let yPos = groundY - 40;
        if (h > 0.6) yPos = groundY - 100;
        if (h > 0.9) yPos = groundY - 180;
        
        let type = 'white';
        if (Math.random() > 0.95 && magnetCooldown <= 0) { type = 'magnet'; }
        else if (Math.random() > 0.9) { type = 'gold'; }

        bones.push({x: canvas.width, y: yPos, type: type});
        nextBoneTimer = 50 + Math.random() * 100;
    }
    
    if (magnetCooldown > 0) magnetCooldown--;
}

function spawnObstacle() {
    let r = Math.random();
    let obj = {x: canvas.width, type: 'poo', stack: 1, y: groundY};

    // Difficulty filtering
    if (currentLevel >= 3 && r > 0.9) { obj.type = 'pond'; }
    else if (currentLevel >= 2 && r > 0.8) { obj.type = 'stack'; obj.stack = 3; }
    else if (r > 0.7) { obj.type = 'hydrant'; }
    else if (r > 0.55) { 
        obj.type = 'bird'; 
        obj.y = (Math.random() > 0.5) ? groundY - 40 : groundY - 110; 
    }
    else { 
        obj.stack = Math.floor(Math.random() * 2) + 1; 
    }
    obstacles.push(obj);
}

function updateBackgrounds() {
    bgMountains.forEach(m => { m.x -= PHYSICS.SPEED * 0.05; if(m.x < -300) m.x = canvas.width; });
    bgTrees.forEach(t => { t.x -= PHYSICS.SPEED * 0.2; if(t.x < -50) t.x = canvas.width + Math.random()*300; });
    bgClouds.forEach(c => { c.x -= c.speed; if(c.x < -100) c.x = canvas.width; });
    if(currentLevel >= 3) {
        weatherParticles.forEach(p => { 
            p.y += p.speed; p.x += p.wind; 
            if(p.y > canvas.height) p.y = 0; 
            if(p.x > canvas.width) p.x = 0; 
        });
    }
    fgBushes.forEach(b => { b.x -= PHYSICS.SPEED * 1.5; if(b.x < -150) b.x = canvas.width + Math.random()*500; });
}

// --- 6. GAMEPLAY ACTIONS ---

function handleInput() {
    if (gameState !== 'PLAYING' || isPaused) return;

    if (pepper.grounded) {
        // Jump
        pepper.dy = PHYSICS.JUMP_FORCE;
        pepper.grounded = false;
        pepper.canDoubleJump = true;
        playSfx('jump');
    } else if (pepper.canDoubleJump && pepper.doubleJumpUnlocked) {
        // Double Jump
        pepper.dy = PHYSICS.DOUBLE_JUMP;
        pepper.canDoubleJump = false;
        playSfx('doublejump');
        spawnParticles(pepper.x, pepper.y, "white", 5);
    }
}

function handleCollision(o, index) {
    // 1. Check Invincibility (Mega Mode)
    if (pepper.isMega) {
        if (o.type === 'hydrant') {
            // Mega Pepper vs Hydrant = Death
            triggerGameOver('mega-hydrant');
        } else {
            // Smash everything else
            obstacles.splice(index, 1);
            score += 5;
            spawnPopup("SMASH!", o.x, o.y-50, "orange");
            playSfx('smash');
            shakeScreen(10);
        }
        return;
    }

    // 2. Check Shield
    if (pepper.hasShield) {
        if (o.type === 'hydrant' || o.type === 'pond') {
            // Water kills shield instantly and kills dog
            triggerGameOver('standard');
        } else {
            // Shield breaks
            pepper.hasShield = false;
            pepper.sticks = 0;
            stickText.innerText = "0/5";
            obstacles.splice(index, 1);
            playSfx('crash');
            spawnPopup("SHIELD BROKE!", pepper.x, pepper.y-50, "red");
            flashScreen('red');
        }
        return;
    }

    // 3. Death
    triggerGameOver(o.type === 'pond' ? 'splash' : 'standard');
}

function collectStick(s) {
    if (difficulty === 'death') {
        spawnPopup("NO SHIELDS", s.x, s.y, "red");
        return;
    }
    pepper.sticks++;
    playSfx('collect');
    spawnParticles(s.x, s.y, "#00b894", 10);
    
    if (pepper.sticks >= 5) {
        pepper.hasShield = true;
        pepper.sticks = 0;
        spawnPopup("SHIELD UP!", pepper.x, pepper.y-50, "#00b894");
        flashScreen('#00b894');
    }
    stickText.innerText = pepper.sticks + "/5";
}

function collectBone(b) {
    if (b.type === 'magnet') {
        pepper.magnetTimer = 600; // 10 seconds (60fps)
        playSfx('magnet');
        spawnPopup("MAGNET!", b.x, b.y, "#e74c3c");
        magnetCooldown = 2000;
        return;
    }

    let val = (b.type === 'gold') ? 5 : 1;
    if (pepper.hat === 'cap') val *= 2; // Red Cap Perk
    
    score += val;
    scoreEl.innerText = score + " 🦴";
    playSfx('collect');
    spawnPopup("+" + val, b.x, b.y, "gold");

    // Mega Progress (except Death mode)
    if (!pepper.isMega && difficulty !== 'death') {
        pepper.streak += val;
        let target = (pepper.hat === 'cowboy') ? 25 : 50;
        updateMegaUI(target);
        
        if (pepper.streak >= target) activateMega();
    }
}

function activateMega() {
    pepper.isMega = true;
    pepper.megaTimer = 900; // 15 seconds
    pepper.spinTimer = 40;
    spawnPopup("MEGA MODE!", canvas.width/2, canvas.height/3, "#ff00ff");
    flashScreen('white');
    shakeScreen(20);
    megaMeter.classList.add('mega-active');
    megaText.innerText = "MEGA MODE!";
}

function deactivateMega() {
    pepper.isMega = false;
    pepper.streak = 0;
    megaMeter.classList.remove('mega-active');
    updateMegaUI((pepper.hat === 'cowboy') ? 25 : 50);
}

function triggerGameOver(reason) {
    gameState = 'GAMEOVER';
    stopMusic();
    
    const goTitle = document.getElementById('go-title');
    const goMsg = document.getElementById('go-msg');
    const goCanvas = document.getElementById('go-canvas');
    const retryBtn = document.getElementById('retry-btn');
    const endScore = document.getElementById('end-score');

    screens.gameover.style.display = 'flex';
    endScore.innerText = score;
    uiLayer.style.display = 'none';

    if (difficulty === 'baby') {
        retryBtn.innerText = "TRY AGAIN (BABY MODE)";
    } else {
        retryBtn.innerText = "TRY AGAIN";
    }

    if (reason === 'mega-hydrant') {
        goTitle.innerText = "OOPS!";
        goMsg.innerText = "Even Mega Pepper can't hit a hydrant!";
    } else if (reason === 'splash') {
        goTitle.innerText = "SPLASH!";
        goMsg.innerText = "Wet dog smell...";
    } else {
        goTitle.innerText = "GAME OVER";
        goMsg.innerText = "";
    }
}

function triggerLevelVictory() {
    levelFinished = true;
    gameState = 'TRANSITION';
    playSfx('levelup');
    stopMusic();
}

function handleLevelComplete() {
    // Open Shop
    screens.shop.style.display = 'flex';
    
    // Prep Shop Data
    const balanceEl = document.getElementById('shop-balance');
    balanceEl.innerText = score + " 🦴";
    
    // Render Shop
    openShop(); 
}

// --- 7. RENDERING ---
function draw() {
    // Clear Screen (with shake)
    ctx.save();
    if (shakeAmount > 0) {
        ctx.translate(Math.random()*shakeAmount - shakeAmount/2, Math.random()*shakeAmount - shakeAmount/2);
    }
    
    // Draw Sky
    let sky = getSkyColor(levelDistance, levelMaxDistance, currentLevel);
    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, sky.c1);
    grad.addColorStop(1, sky.c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Mountains
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    bgMountains.forEach(m => {
        ctx.beginPath(); ctx.moveTo(m.x, groundY); ctx.lineTo(m.x+150, groundY-300); ctx.lineTo(m.x+300, groundY); ctx.fill();
    });

    // Draw Trees
    bgTrees.forEach(t => {
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath(); ctx.moveTo(t.x, groundY); ctx.lineTo(t.x+25, groundY-100); ctx.lineTo(t.x+50, groundY); ctx.fill();
    });

    // Draw Clouds
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    bgClouds.forEach(c => {
        ctx.beginPath(); ctx.ellipse(c.x, c.y, 40, 20, 0, 0, Math.PI*2); ctx.fill();
    });

    // Draw Ground
    ctx.fillStyle = sky.ground;
    ctx.fillRect(0, groundY, canvas.width, PHYSICS.GROUND_H);
    ctx.fillStyle = sky.grass;
    ctx.fillRect(0, groundY, canvas.width, 20);

    // Camera Transform for Game Objects
    ctx.save();
    // Center Zoom
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-canvas.width/2, -canvas.height/2);

    // Draw Objects
    obstacles.forEach(o => {
        if (o.type === 'poo') drawDooDoo(ctx, o.x, groundY, o.stack);
        else if (o.type === 'stack') { drawDooDoo(ctx, o.x, groundY, 3); drawFlies(ctx, o.x, groundY, frame); }
        else if (o.type === 'bird') drawFlies(ctx, o.x, o.y, frame);
        else if (o.type === 'hydrant') drawHydrant(ctx, o.x, groundY);
        else if (o.type === 'pond') {
            ctx.fillStyle = "rgba(100, 200, 255, 0.8)";
            ctx.beginPath(); ctx.ellipse(o.x, groundY+5, 100, 15, 0, 0, Math.PI*2); ctx.fill();
        }
    });

    sticks.forEach(s => drawStick(ctx, s.x, s.y, frame));
    bones.forEach(b => drawBone(ctx, b.x, b.y, b.type, frame));

    if (finishLine) {
        ctx.fillStyle = "white"; 
        for(let r=0; r<8; r++) { 
            for(let c=0; c<2; c++) { 
                ctx.fillStyle = (r+c)%2===0 ? "white" : "black"; 
                ctx.fillRect(finishLine.x + c*20, groundY-160 + r*20, 20, 20); 
            } 
        }
    }

    // Draw Pepper
    if (gameState === 'START') {
        drawFrontFacingHusky(ctx, canvas.width/2, groundY - 140, 2.0, difficulty);
        drawSteamDooDoo(ctx, canvas.width*0.8, groundY-20, frame);
    } else {
        drawHusky(ctx, pepper.x, pepper.y, pepper.isMega, pepper.hasShield, pepper, difficulty, frame);
    }

    // Particles & Text
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI*2); ctx.fill();
    });
    
    floatTexts.forEach(t => {
        ctx.globalAlpha = t.life;
        ctx.fillStyle = t.color;
        ctx.font = "900 24px 'Montserrat'";
        ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1.0;

    // Foreground Bushes
    fgBushes.forEach(b => {
        ctx.fillStyle = "#2d3436";
        ctx.beginPath(); ctx.arc(b.x, canvas.height, 60, 0, Math.PI*2); ctx.fill();
    });

    ctx.restore(); // Undo Camera
    ctx.restore(); // Undo Shake
}

// --- 8. HELPERS & UTILS ---

function resetGameData() {
    score = 0;
    levelStartScore = 0;
    currentLevel = 1;
    pepper.hat = 'none';
    resetLevel();
}

function resetLevel() {
    obstacles = [];
    sticks = [];
    bones = [];
    particles = [];
    floatTexts = [];
    
    levelDistance = 0;
    levelMaxDistance = 2000 + (currentLevel * 500);
    levelFinished = false;
    finishLine = null;
    levelVictoryAnim = false;
    
    pepper.y = groundY;
    pepper.dy = 0;
    pepper.grounded = true;
    pepper.isMega = false;
    pepper.streak = 0;
    pepper.megaTimer = 0;
    pepper.x = 100;
    
    if (pepper.hat === 'tophat') {
        pepper.hasShield = true;
        pepper.sticks = 5;
    } else {
        pepper.hasShield = false;
        pepper.sticks = 0;
    }
    
    // UI Resets
    scoreEl.innerText = score + " 🦴";
    levelInd.innerText = "LEVEL " + currentLevel;
    stickText.innerText = pepper.sticks + "/5";
    progressFill.style.width = "0%";
    megaMeter.classList.remove('mega-active');
    megaBarFill.style.width = "0%";
    
    updateMegaUI((pepper.hat === 'cowboy') ? 25 : 50);
}

function updateMegaUI(target) {
    if (difficulty === 'death') {
        megaText.innerText = "NO MEGA MODE!";
    } else {
        let remaining = Math.max(0, target - pepper.streak);
        megaText.innerText = "COLLECT " + remaining + " 🦴";
    }
}

function startCountdown() {
    gameState = 'COUNTDOWN';
    screens.start.style.display = 'none';
    screens.gameover.style.display = 'none';
    screens.shop.style.display = 'none';
    uiLayer.style.display = 'flex';
    countdownLayer.style.display = 'flex';
    
    let count = 3;
    countdownText.innerText = count;
    
    let interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.innerText = count;
            // Trigger CSS animation reflow
            countdownText.style.animation = 'none';
            countdownText.offsetHeight; 
            countdownText.style.animation = 'popIn 0.5s';
            playSnare();
        } else {
            clearInterval(interval);
            countdownText.innerText = "GO!";
            playBark();
            setTimeout(() => {
                countdownLayer.style.display = 'none';
                gameState = 'PLAYING';
                startMusic(currentLevel, difficulty, pepper);
            }, 500);
        }
    }, 800);
}

function spawnPopup(text, x, y, color) {
    floatTexts.push({text, x, y, color, life: 1.0});
}

function spawnParticles(x, y, color, count) {
    for(let i=0; i<count; i++) {
        particles.push({x, y, vx:(Math.random()-0.5)*10, vy:-(Math.random()*10), color, life: 1.0});
    }
}

function shakeScreen(amount) {
    shakeAmount = amount;
}

function flashScreen(color) {
    const flash = document.getElementById('flash-overlay');
    flash.style.background = color;
    flash.style.opacity = 0.5;
    setTimeout(() => flash.style.opacity = 0, 100);
}

// --- 9. INPUT LISTENERS ---
// Consolidated into one handler for mobile/desktop
function triggerAction(e) {
    if (e.type === 'touchstart') e.preventDefault(); // Stop scrolling
    
    // Ignore clicks on UI elements
    if (e.target.closest('.btn') || e.target.closest('.menu-item') || 
        e.target.closest('.diff-card') || e.target.closest('.shop-item')) return;

    // Menu Toggle
    if (e.target.id === 'menu-btn') {
        const isOpen = menuContent.style.display === 'flex';
        menuContent.style.display = isOpen ? 'none' : 'flex';
        btn.menu.innerText = isOpen ? "☰" : "✕";
        return;
    }

    // Game Action
    if (gameState === 'PLAYING') {
        handleInput();
    }
}

window.addEventListener('mousedown', triggerAction);
window.addEventListener('touchstart', triggerAction, {passive: false});

// Button Bindings
btn.start.addEventListener('click', () => startCountdown());
btn.diff.addEventListener('click', () => { 
    screens.diff.style.display = 'flex';
    renderDiffPreviews();
});
btn.closeDiff.addEventListener('click', () => screens.diff.style.display = 'none');

btn.retry.addEventListener('click', () => {
    if (difficulty === 'baby') {
        score = levelStartScore; // Keep score from start of level
        resetLevel();
    } else {
        resetGameData();
    }
    startCountdown();
});

btn.next.addEventListener('click', () => {
    currentLevel++;
    levelStartScore = score;
    resetLevel();
    startCountdown();
});

btn.mute.addEventListener('click', () => {
    let muted = (btn.mute.innerText.includes('ON'));
    btn.mute.innerText = muted ? "🔇 SOUND: OFF" : "🔊 SOUND: ON";
    // window.isMuted is defined in audio.js, we assume it's global or we toggle logic
    // For this rewrite, we will rely on the audio.js global variable if available
    // or set a flag here if we were rewriting audio.js too.
    // Assuming audio.js has 'isMuted' global:
    if (typeof isMuted !== 'undefined') isMuted = muted; 
    if (muted) stopMusic();
    else if (gameState === 'PLAYING') startMusic(currentLevel, difficulty, pepper);
});

btn.home.addEventListener('click', () => {
    gameState = 'START';
    stopMusic();
    screens.gameover.style.display = 'none';
    screens.shop.style.display = 'none';
    uiLayer.style.display = 'none';
    menuContent.style.display = 'none';
    btn.menu.innerText = "☰";
    screens.start.style.display = 'flex';
    resetGameData();
});

// Difficulty Selection
window.setDifficulty = (mode) => {
    difficulty = mode;
    document.querySelectorAll('.diff-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('diff-'+mode).classList.add('selected');
    
    let text = "DIFFICULTY: BRING 'EM ON";
    if (mode === 'baby') text = "DIFFICULTY: BABY MODE";
    if (mode === 'death') text = "DIFFICULTY: DEATH INCARNATE";
    
    btn.diff.innerText = text;
};

// Start the engine
init();
