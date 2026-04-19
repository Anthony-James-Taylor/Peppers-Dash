/**
 * PEPPER'S DOO-DOO DASH - MASTER GAME LOGIC
 * V41 - BUG-FIXED & POLISHED
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

const menuContent = document.getElementById('menu-content');

// --- 2. GAME CONSTANTS (PHYSICS) ---
const PHYSICS = {
    GRAVITY: 0.8,
    JUMP_FORCE: -16,
    DOUBLE_JUMP: -12,
    GROUND_H: 140,
    SPEED: 9               // FIX: Was 6, increased for better pace
};

// --- 3. STATE VARIABLES ---
let gameState = 'START';
let difficulty = 'normal';
let frame = 0;
let score = 0;
let levelStartScore = 0;

let currentLevel = 1;
let levelDistance = 0;
let levelMaxDistance = 2000;
let levelFinished = false;
let levelVictoryAnim = false;

let groundY = 0;
let shakeAmount = 0;
let zoomLevel = 1.15;

// FIX: Start timers at safe values so nothing spawns immediately
let nextStickTimer = 120;
let nextBoneTimer = 60;
let globalSpawnCooldown = 180;
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
    rotation: 0,       // FIX: explicitly tracked here
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
    initBackgrounds();
    drawStickIcon();   // FIX: draw the stick icon in HUD on start
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
    update();
    draw();
    animationFrameId = requestAnimationFrame(loop);
}

function update() {
    frame++;
    groundY = canvas.height - PHYSICS.GROUND_H;

    if (gameState === 'PLAYING' && !isPaused) {
        
        pepper.dy += PHYSICS.GRAVITY;
        pepper.y += pepper.dy;

        if (pepper.y >= groundY) {
            pepper.y = groundY;
            pepper.dy = 0;
            pepper.grounded = true;
            pepper.canDoubleJump = false;
        } else {
            pepper.grounded = false;
        }

        // Level Progress
        if (!levelFinished) {
            levelDistance += PHYSICS.SPEED * 0.1;
            let pct = Math.min((levelDistance / levelMaxDistance) * 100, 100);
            progressFill.style.width = pct + "%";

            if (levelDistance >= levelMaxDistance && !finishLine) {
                finishLine = { x: canvas.width + 100, type: 'finish' };
                // FIX: stop spawning anything once finish line is placed
                globalSpawnCooldown = 9999;
                nextBoneTimer = 9999;
                nextStickTimer = 9999;
            }
        }

        spawnManager();
        updateEntities();

        // Mega Mode Timer
        if (pepper.isMega) {
            pepper.megaTimer--;
            let pct = (pepper.megaTimer / 900) * 100;
            megaBarFill.style.width = pct + "%";
            if (pepper.megaTimer <= 0) deactivateMega();
        }
        
        if (pepper.magnetTimer > 0) pepper.magnetTimer--;

    } else if (gameState === 'START' || gameState === 'GAMEOVER') {
        pepper.y = groundY;
    } else if (gameState === 'TRANSITION') {
        pepper.dy += PHYSICS.GRAVITY;
        pepper.y += pepper.dy;
        if (pepper.y >= groundY) { pepper.y = groundY; pepper.dy = 0; }
        pepper.x += PHYSICS.SPEED * 1.5;
        pepper.runFrame += 0.3;
        // FIX: background keeps scrolling during victory run
        updateBackgrounds();
        
        if (pepper.x > canvas.width + 100) {
            handleLevelComplete();
        }
    }
    
    if (gameState === 'PLAYING' && !isPaused) updateBackgrounds();
    
    // Zoom Logic
    let startZoom = canvas.width < 768 ? 0.85 : 1.1;  // FIX: smaller zoom on mobile start
    let targetZoom = (gameState === 'PLAYING' && pepper.isMega) ? 1.05 :
                     (gameState === 'START') ? startZoom : 1.0;
    zoomLevel += (targetZoom - zoomLevel) * 0.05;

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

        let hit = false;
        // FIX: Stack collision height - each poo tier is ~35px, 3 stacks ~90px
        if ((o.type === 'poo' || o.type === 'stack') && 
            Math.abs(pepper.x + 10 - o.x) < 25 && 
            pepper.y > groundY - (o.stack || 1) * 38 + 5) hit = true;
        
        if (o.type === 'hydrant' && Math.abs(pepper.x - o.x) < 20 && pepper.y > groundY - 35) hit = true;
        
        if (o.type === 'bird' && Math.abs(pepper.x - o.x) < 30 && Math.abs((pepper.y - 25) - o.y) < 25) hit = true;

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
        
        // Check if magnet buff is active OR if this specific bone is already mid-flight
        if (pepper.magnetTimer > 0 || b.isMagnetized) {
            let dx = pepper.x - b.x;
            let dy = (pepper.y - 20) - b.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            
            // Trigger pull if close enough, or continue pulling if already flagged
            if (dist < 400 || b.isMagnetized) {
                b.isMagnetized = true; // Lock it in so it doesn't stop if the timer expires!
                b.x -= PHYSICS.SPEED;  // Keep the world scroll
                b.x += dx * 0.3;       // Stronger pull
                b.y += dy * 0.3;
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
    if (globalSpawnCooldown > 0) {
        globalSpawnCooldown--;
    } else {
        if (Math.random() < 0.04) {
            // FIX: Make sure the coast is clear of scrolling items before dropping an obstacle
            let clearToSpawn = true;
            for (let i = 0; i < sticks.length; i++) {
                if (Math.abs(canvas.width - sticks[i].x) < 140) clearToSpawn = false;
            }
            for (let i = 0; i < bones.length; i++) {
                if (Math.abs(canvas.width - bones[i].x) < 120) clearToSpawn = false;
            }

            if (clearToSpawn) {
                spawnObstacle();
                globalSpawnCooldown = 300 / PHYSICS.SPEED;
            }
        }
    }

    // Sticks
    nextStickTimer--;
    if (nextStickTimer <= 0) {
        if (Math.random() > 0.5) {
            for (let attempt = 0; attempt < 4; attempt++) {
                const sx = canvas.width + (attempt * 140);
                const sy = groundY - 120;
                if (canSpawnCollectible(sx, sy, 140, 140)) {
                    sticks.push({ x: sx, y: sy });
                    break;
                }
            }
        }
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
        // FIX: Check magnetCooldown BEFORE rolling for magnet type
        if (magnetCooldown <= 0 && Math.random() > 0.95) {
            type = 'magnet';
        } else if (Math.random() > 0.9) {
            type = 'gold';
        }

        for (let attempt = 0; attempt < 4; attempt++) {
            const bx = canvas.width + (attempt * 110);
            if (canSpawnCollectible(bx, yPos, 120, 120)) {
                bones.push({ x: bx, y: yPos, type: type });
                break;
            }
        }

        nextBoneTimer = 50 + Math.random() * 100;
    }

    if (magnetCooldown > 0) magnetCooldown--;
}

function spawnObstacle() {
    let r = Math.random();
    let obj = {x: canvas.width, type: 'poo', stack: 1, y: groundY};

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

function canSpawnCollectible(x, y, xPadding = 140, yPadding = 120) {
    // FIX: Block spawning when finish line is approaching the PLAYER (left half of screen)
    if (finishLine && finishLine.x < canvas.width * 0.7) return false;

    // 1. Check for overlapping obstacles
    for (let i = 0; i < obstacles.length; i++) {
        const o = obstacles[i];
        let ox = o.x;
        let oHeightCenter;

        if (o.type === 'bird') oHeightCenter = o.y;
        else if (o.type === 'hydrant') oHeightCenter = groundY - 35;
        else if (o.type === 'stack') oHeightCenter = groundY - 70;
        else if (o.type === 'pond') oHeightCenter = groundY;
        else oHeightCenter = groundY - 20;

        if (Math.abs(x - ox) < xPadding && Math.abs(y - oHeightCenter) < yPadding) {
            return false;
        }
    }

    // 2. Check for overlapping sticks
    for (let i = 0; i < sticks.length; i++) {
        if (Math.abs(x - sticks[i].x) < xPadding && Math.abs(y - sticks[i].y) < yPadding) {
            return false;
        }
    }

    // 3. Check for overlapping bones
    for (let i = 0; i < bones.length; i++) {
        if (Math.abs(x - bones[i].x) < xPadding && Math.abs(y - bones[i].y) < yPadding) {
            return false;
        }
    }

    return true;
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
    // FIX: init audio on first real interaction
    initAudio();

    if (pepper.grounded) {
        pepper.dy = PHYSICS.JUMP_FORCE;
        pepper.grounded = false;
        pepper.canDoubleJump = true;
        playSfx('jump');
    } else if (pepper.canDoubleJump && pepper.doubleJumpUnlocked) {
        pepper.dy = PHYSICS.DOUBLE_JUMP;
        pepper.canDoubleJump = false;
        playSfx('doublejump');
        spawnParticles(pepper.x, pepper.y, "white", 5);
    }
}

function handleCollision(o, index) {
    if (pepper.isMega) {
        if (o.type === 'hydrant') {
            triggerGameOver('mega-hydrant');
        } else {
            obstacles.splice(index, 1);
            score += 5;
            scoreEl.innerText = score + " 🦴";  // FIX: update score display on smash
            spawnPopup("SMASH!", o.x, o.y-50, "orange");
            playSfx('smash');
            shakeScreen(10);
        }
        return;
    }

    if (pepper.hasShield) {
        if (o.type === 'hydrant' || o.type === 'pond') {
            triggerGameOver('standard');
        } else {
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
    drawStickIcon();
}

function collectBone(b) {
    // FIX: Magnet type check — don't let magnet attract another magnet pickup during cooldown
    if (b.type === 'magnet') {
        pepper.magnetTimer = 600;
        playSfx('magnet');
        spawnPopup("MAGNET!", b.x, b.y, "#e74c3c");
        magnetCooldown = 2000;
        return;
    }

    let val = (b.type === 'gold') ? 5 : 1;
    if (pepper.hat === 'cap') val *= 2;
    
    score += val;
    scoreEl.innerText = score + " 🦴";
    playSfx('collect');
    spawnPopup("+" + val, b.x, b.y, (b.type === 'gold') ? "#FFD700" : "white");

    if (!pepper.isMega && difficulty !== 'death') {
        pepper.streak += val;
        let target = 50;
        updateMegaUI(target);
        if (pepper.streak >= target) activateMega();
    }
}

function activateMega() {
    pepper.isMega = true;
    // FIX: Cowboy Hat now extends Mega Mode from 900 frames (~15s) to 1500 frames (~25s)
    pepper.megaTimer = (pepper.hat === 'cowboy') ? 1500 : 900; 
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
    updateMegaUI(50);
}

function triggerGameOver(reason) {
    gameState = 'GAMEOVER';
    stopMusic();
    
    const goTitle = document.getElementById('go-title');
    const goMsg = document.getElementById('go-msg');
    const retryBtn = document.getElementById('retry-btn');
    const endScore = document.getElementById('end-score');

    screens.gameover.style.display = 'flex';
    endScore.innerText = score;
    uiLayer.style.display = 'none';

    retryBtn.innerText = difficulty === 'baby' ? "TRY AGAIN (BABY MODE)" : "TRY AGAIN";

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
    gameState = 'SHOP';
    screens.shop.style.display = 'flex';
    document.getElementById('shop-balance').innerText = score + " 🦴";
    openShop();
}

// --- 7. RENDERING ---
function draw() {
    ctx.save();
    if (shakeAmount > 0) {
        ctx.translate(Math.random()*shakeAmount - shakeAmount/2, Math.random()*shakeAmount - shakeAmount/2);
    }
    
    let sky = getSkyColor(levelDistance, levelMaxDistance, currentLevel);
    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, sky.c1);
    grad.addColorStop(1, sky.c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.1)";
    bgMountains.forEach(m => {
        ctx.beginPath(); ctx.moveTo(m.x, groundY); ctx.lineTo(m.x+150, groundY-300); ctx.lineTo(m.x+300, groundY); ctx.fill();
    });

    bgTrees.forEach(t => {
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath(); ctx.moveTo(t.x, groundY); ctx.lineTo(t.x+25, groundY-100); ctx.lineTo(t.x+50, groundY); ctx.fill();
    });

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    bgClouds.forEach(c => {
        ctx.beginPath(); ctx.ellipse(c.x, c.y, 40, 20, 0, 0, Math.PI*2); ctx.fill();
    });

    ctx.fillStyle = sky.ground;
    ctx.fillRect(0, groundY, canvas.width, PHYSICS.GROUND_H);
    ctx.fillStyle = sky.grass;
    ctx.fillRect(0, groundY, canvas.width, 20);

// Camera Transform
    ctx.save();
    // 1. Move the 'center' of the world to the ground line
    ctx.translate(canvas.width / 2, groundY);
    // 2. Zoom in/out FROM that ground line
    ctx.scale(zoomLevel, zoomLevel);
    // 3. Move the coordinates back
    ctx.translate(-canvas.width / 2, -groundY);

// FIX: Draw order — obstacles first, then collectibles on top, then Pepper on top of everything
    obstacles.forEach(o => {
        if (o.type === 'poo' || o.type === 'stack') {
            // Draw the poo stack
            drawDooDoo(ctx, o.x, groundY, o.stack);
            // Draw flies hovering right at the top based on how many poos there are!
            drawFlies(ctx, o.x, groundY - (o.stack * 35), frame);
        }
        else if (o.type === 'bird') {
            // FIX: Ensure birds actually use the bird graphic now!
            drawBird(ctx, o.x, o.y, frame); 
        }
        else if (o.type === 'hydrant') {
            drawHydrant(ctx, o.x, groundY);
        }
        else if (o.type === 'pond') {
            ctx.fillStyle = "rgba(100, 200, 255, 0.8)";
            ctx.beginPath(); ctx.ellipse(o.x, groundY + 5, 100, 15, 0, 0, Math.PI * 2); ctx.fill();
        }
    });

    // Sticks and bones AFTER obstacles but BEFORE pepper
    sticks.forEach(s => drawStick(ctx, s.x, s.y, frame));
    bones.forEach(b => drawBone(ctx, b.x, b.y, b.type, frame));

    if (finishLine) {
        ctx.fillStyle = "white";
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 2; c++) {
                ctx.fillStyle = (r + c) % 2 === 0 ? "white" : "black";
                ctx.fillRect(finishLine.x + c * 20, groundY - 160 + r * 20, 20, 20);
            }
        }
        // Pole
        ctx.fillStyle = "#aaa";
        ctx.fillRect(finishLine.x - 3, groundY - 165, 6, 160);
    }

    // Draw Pepper (always on top)
    if (gameState === 'START') {
        const isMobile = canvas.width < 768;
        // FIX: Much smaller scale on mobile to prevent blocking start button
        const startDogX = isMobile ? canvas.width * 0.25 : canvas.width * 0.32;
        const startDogY = isMobile ? groundY - 35 : groundY - 90;
        const startDogScale = isMobile ? 0.55 : 1.3;
        const startPooX = isMobile ? canvas.width * 0.75 : canvas.width * 0.74;
        const startPooY = isMobile ? groundY - 5 : groundY - 14;

        drawFrontFacingHusky(ctx, startDogX, startDogY, startDogScale, difficulty);
        drawSteamDooDoo(ctx, startPooX, startPooY, frame);
    } else {
        drawHusky(ctx, pepper.x, pepper.y, pepper.isMega, pepper.hasShield, pepper, difficulty, frame);
    }

    // Particles & Float Text
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
        // FIX: Increased size and shifted them to overlap the dirt line properly
        ctx.beginPath(); ctx.arc(b.x, canvas.height, 100, 0, Math.PI*2); ctx.fill();
    });

    ctx.restore(); // Undo Camera
    ctx.restore(); // Undo Shake

    // Draw bone icon in score HUD
    drawScoreBoneIcon();
}

// FIX: Draw a bone icon next to the score in the HUD overlay
function drawScoreBoneIcon() {
    const scoreBox = document.getElementById('score-box');
    if (!scoreBox) return;
    // We'll do this with a small inline canvas instead of DOM manipulation
    // Already handled via the score text — bone emoji renders fine natively
    // But we call drawStickIcon to keep the HUD stick icon updated
    drawStickIcon();
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
    
    // FIX: Reset spawn timers on every level to avoid instant spawn
    nextStickTimer = 120;
    nextBoneTimer = 80;
    globalSpawnCooldown = 180;
    magnetCooldown = 0;

    pepper.y = groundY;
    pepper.dy = 0;
    pepper.grounded = true;
    pepper.isMega = false;
    pepper.streak = 0;
    pepper.megaTimer = 0;
    pepper.x = 100;
    pepper.rotation = 0;     // FIX: reset rotation on level restart
    pepper.runFrame = 0;
    pepper.magnetTimer = 0;
    pepper.spinTimer = 0;
    
    if (pepper.hat === 'tophat') {
        pepper.hasShield = true;
        pepper.sticks = 5;
    } else {
        pepper.hasShield = false;
        pepper.sticks = 0;
    }
    
    scoreEl.innerText = score + " 🦴";
    levelInd.innerText = "LEVEL " + currentLevel;
    stickText.innerText = pepper.sticks + "/5";
    progressFill.style.width = "0%";
    megaMeter.classList.remove('mega-active');
    megaBarFill.style.width = "0%";
    
    updateMegaUI(50);
    drawStickIcon(); // FIX: refresh stick icon on reset
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
    // FIX: init audio on user gesture (start button)
    initAudio();

    gameState = 'COUNTDOWN';
    screens.start.style.display = 'none';
    screens.gameover.style.display = 'none';
    screens.shop.style.display = 'none';
    uiLayer.style.display = 'flex';
    countdownLayer.style.display = 'flex';
    
    let count = 3;
    countdownText.innerText = count;
    
    let interval = setInterval(() => {
        // FIX: If the user clicked "Return to Home", kill the countdown immediately!
        if (gameState !== 'COUNTDOWN') { clearInterval(interval); return; }

        count--;
        if (count > 0) {
            countdownText.innerText = count;
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

function shakeScreen(amount) { shakeAmount = amount; }

function flashScreen(color) {
    const flash = document.getElementById('flash-overlay');
    flash.style.background = color;
    flash.style.opacity = 0.5;
    setTimeout(() => flash.style.opacity = 0, 100);
}

// --- 9. INPUT LISTENERS ---
function triggerAction(e) {
    // 1. If the user tapped a button or menu, STOP here and let the browser handle the button click
    if (e.target.closest('.btn, .menu-item, .diff-card, .shop-item, .shop-buy-btn, #menu-btn')) {
        return; 
    }

    // 2. If we got here, they tapped the GAME WORLD. 
    // Prevent zooming/scrolling only for world taps.
    if (e.type === 'touchstart') e.preventDefault();

    // 3. Trigger a jump if the game is running
    if (gameState === 'PLAYING') {
        handleInput();
    }
}

    // Now prevent scrolling/zooming ONLY if we are tapping the actual game canvas
    if (e.type === 'touchstart') e.preventDefault();

    if (e.target.id === 'menu-btn') {
        const isOpen = menuContent.style.display === 'flex';
        menuContent.style.display = isOpen ? 'none' : 'flex';
        btn.menu.innerText = isOpen ? "☰" : "✕";
        
        // FIX: Actually pause the game loop when the menu is open!
        if (gameState === 'PLAYING') {
            isPaused = !isOpen;
        }
        return;
    }

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
        score = levelStartScore;
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
    if (typeof isMuted !== 'undefined') isMuted = muted; 
    if (muted) stopMusic();
    else if (gameState === 'PLAYING') startMusic(currentLevel, difficulty, pepper);
});

btn.home.addEventListener('click', () => {
    gameState = 'START';
    isPaused = false; // FIX: Unpause the game!
    stopMusic();
    screens.gameover.style.display = 'none';
    screens.shop.style.display = 'none';
    uiLayer.style.display = 'none';
    menuContent.style.display = 'none';
    btn.menu.innerText = "☰";
    screens.start.style.display = 'flex';
    resetGameData();
});

btn.help.addEventListener('click', () => {
    screens.howto.style.display = 'flex';
    menuContent.style.display = 'none';
});
btn.closeHelp.addEventListener('click', () => screens.howto.style.display = 'none');

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
