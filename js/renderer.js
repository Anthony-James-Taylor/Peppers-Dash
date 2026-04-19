// --- VISUAL RENDERING ---

// Helper to draw the In-Game Husky (Side View)
function drawHusky(ctx, x, y, isMega, hasShield, pepper, difficulty, frame) {
    ctx.save(); ctx.translate(x, y);
    let s = isMega ? 1.4 : 1; ctx.scale(s, s);
    
    if(pepper.spinTimer > 0) {
        pepper.spinTimer--;
        let angle = (pepper.spinTimer / 20) * Math.PI * 2;
        ctx.rotate(angle);
    }

    let bodyC = "#1a1a1a"; let white = "#ffffff"; let eyeC = "#00fbff";
    if(difficulty === 'death') { bodyC = "#2d3436"; eyeC = "#ff0000"; }
    if(isMega) { let hue = (Date.now() / 5) % 360; bodyC = `hsl(${hue}, 80%, 40%)`; white = `hsl(${(hue+180)%360}, 90%, 80%)`; }

    // Internal Hat Helper (Side View)
    function drawHat(ctx) {
        ctx.save(); 
        if(pepper.hat === 'cowboy') { 
            ctx.translate(5, -28); 
            ctx.fillStyle = "#8B4513"; ctx.beginPath(); ctx.ellipse(0, 0, 20, 5, 0, 0, Math.PI*2); ctx.fill(); ctx.fillRect(-10, -15, 20, 15); 
        } 
        else if (pepper.hat === 'tophat') { 
            ctx.translate(5, -28); 
            ctx.fillStyle = "#2d3436"; ctx.fillRect(-12, -25, 24, 25); ctx.fillRect(-18, 0, 36, 4); ctx.fillStyle = "red"; ctx.fillRect(-12, -5, 24, 4); 
        } 
        else if (pepper.hat === 'cap') { 
            ctx.translate(2, -25); 
            ctx.fillStyle = "#d63031"; ctx.beginPath(); ctx.arc(0, 0, 13, Math.PI, 0); ctx.fill(); ctx.fillRect(-12, 0, 24, 3); ctx.fillRect(10, 0, 12, 4); 
        }
        ctx.restore();
    }

    pepper.runFrame = (pepper.runFrame || 0) + 0.3; 
    
    if(!pepper.grounded && pepper.canDoubleJump) { ctx.rotate(pepper.dy * 0.04); } 
    else if (!pepper.grounded && !pepper.canDoubleJump) { pepper.rotation = (pepper.rotation || 0) + 0.3; ctx.rotate(pepper.rotation); } 
    else { pepper.rotation = 0; }

    if(hasShield) { 
        ctx.save(); 
        let shieldSpeed = frame * 0.1;
        for(let i=0; i<5; i++) {
            let angle = shieldSpeed + (i * (Math.PI * 2) / 5);
            let sx = Math.cos(angle) * 45;
            let sy = Math.sin(angle) * 45;
            drawStick(ctx, sx, sy, frame);
        }
        ctx.restore(); 
    }
    
    if(pepper.magnetTimer > 0) { 
        ctx.save(); ctx.translate(0, -40); 
        let wave = (frame % 30) / 30;
        ctx.strokeStyle = `rgba(231, 76, 60, ${1-wave})`; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(0,0, 20 + wave*30, 0, Math.PI*2); ctx.stroke();
        ctx.restore(); 
    }

    let rf = pepper.runFrame; let yOff = -15; ctx.fillStyle = white; 
    if(!pepper.grounded) { ctx.beginPath(); ctx.ellipse(-10, yOff+15, 6, 8, 0.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(10, yOff+15, 6, 8, -0.5, 0, Math.PI*2); ctx.fill(); } 
    else { let leg1 = Math.sin(rf) * 10; let leg2 = Math.sin(rf + Math.PI) * 10; ctx.beginPath(); ctx.ellipse(-10 + leg1, yOff+18, 5, 5, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(10 + leg2, yOff+18, 5, 5, 0, 0, Math.PI*2); ctx.fill(); }

    let tailWag = Math.sin(rf*3)*0.2; ctx.save(); ctx.translate(-15, yOff-5); ctx.rotate(tailWag); 
    ctx.fillStyle = bodyC; ctx.beginPath(); ctx.moveTo(0,0); ctx.bezierCurveTo(-15, -10, -10, -30, 5, -25); ctx.bezierCurveTo(15, -20, 5, 0, 0, 0); ctx.fill();
    ctx.fillStyle = white; ctx.beginPath(); ctx.arc(2, -22, 5, 0, Math.PI*2); ctx.fill(); ctx.restore();

    ctx.fillStyle = bodyC; ctx.beginPath(); ctx.ellipse(0, yOff, 22, 14, 0, 0, Math.PI*2); ctx.fill(); 
    ctx.fillStyle = white; ctx.beginPath(); ctx.ellipse(5, yOff+5, 12, 8, 0, 0, Math.PI*2); ctx.fill(); 

    ctx.save(); ctx.translate(15, yOff-15); 
    ctx.fillStyle = bodyC; ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(-8, -22); ctx.lineTo(2, -12); ctx.fill(); // Ear
    ctx.fillStyle = "pink"; ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-7, -18); ctx.lineTo(0, -10); ctx.fill(); // Ear Pink

    // Head
    ctx.fillStyle = bodyC; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); 
    ctx.fillStyle = white; ctx.beginPath(); ctx.moveTo(5, -8); ctx.lineTo(18, 2); ctx.lineTo(12, 12); ctx.lineTo(0, 10); ctx.lineTo(-5, 0); ctx.fill(); // Muzzle
    ctx.fillStyle = "black"; ctx.beginPath(); ctx.arc(18, 1, 3.5, 0, Math.PI*2); ctx.fill(); // Nose

    // Special Difficulty Features (Side View)
    if(difficulty === 'normal') { 
        drawAviators(ctx, 0, 0, true); 
    } 
    else if (difficulty === 'baby') { 
        ctx.fillStyle = "#FFD700"; ctx.beginPath(); ctx.arc(15, 6, 4, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "white"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(18, 6, 3, 0, Math.PI*2); ctx.stroke();
        ctx.strokeStyle = "pink"; ctx.lineWidth = 4; 
        ctx.beginPath(); ctx.arc(-2, -2, 16, Math.PI*0.8, Math.PI*1.8); ctx.stroke();
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.ellipse(6, -4, 5, 8, 0, 0, Math.PI*2); ctx.fill(); 
        ctx.fillStyle = eyeC; ctx.beginPath(); ctx.ellipse(8, -2, 2.5, 4, 0, 0, Math.PI*2); ctx.fill(); 
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(8.5, -3, 1, 0, Math.PI*2); ctx.fill();
    }
    else { 
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.ellipse(6, -4, 5, 8, 0, 0, Math.PI*2); ctx.fill(); 
        ctx.fillStyle = eyeC; ctx.beginPath(); ctx.ellipse(8, -2, 2.5, 4, 0, 0, Math.PI*2); ctx.fill(); 
        ctx.strokeStyle = "black"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(4, -10); ctx.lineTo(12, -6); ctx.stroke();
    }

    drawHat(ctx); 
    ctx.restore(); ctx.restore();
}

// CUTE BIG FRONT FACING DOG - scaled down for mobile
function drawFrontFacingHusky(ctx, x, y, scale=1.0, difficulty='normal') {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    
    let float = Math.sin(Date.now() / 500) * 2;
    ctx.translate(0, float);

    let bodyC = (difficulty === 'death') ? "#2d3436" : "#1a1a1a";
    let eyeC = (difficulty === 'death') ? "#ff0000" : "#00fbff";

    ctx.fillStyle = bodyC; ctx.beginPath(); ctx.ellipse(0, 40, 35, 30, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "white"; ctx.beginPath(); ctx.ellipse(0, 40, 20, 25, 0, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = "white"; 
    ctx.beginPath(); ctx.arc(-20, 65, 10, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(20, 65, 10, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = bodyC; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(0, 10, 28, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = bodyC; ctx.beginPath(); ctx.moveTo(-25, -20); ctx.lineTo(-35, -55); ctx.lineTo(-5, -30); ctx.fill();
    ctx.fillStyle = bodyC; ctx.beginPath(); ctx.moveTo(25, -20); ctx.lineTo(35, -55); ctx.lineTo(5, -30); ctx.fill();
    ctx.fillStyle = "pink"; ctx.beginPath(); ctx.moveTo(-23, -25); ctx.lineTo(-32, -48); ctx.lineTo(-10, -32); ctx.fill();
    ctx.fillStyle = "pink"; ctx.beginPath(); ctx.moveTo(23, -25); ctx.lineTo(32, -48); ctx.lineTo(10, -32); ctx.fill();

    ctx.fillStyle = "black"; ctx.beginPath(); ctx.arc(0, 5, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = eyeC; ctx.beginPath(); ctx.arc(-12, -8, 7, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = eyeC; ctx.beginPath(); ctx.arc(12, -8, 7, 0, Math.PI*2); ctx.fill();
    
    if(difficulty !== 'death') {
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(-14, -10, 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(10, -10, 2, 0, Math.PI*2); ctx.fill();
    }

    if (difficulty === 'normal') {
        drawAviators(ctx, 0, -8, false); 
    } 
    else if (difficulty === 'baby') {
        ctx.strokeStyle = "pink"; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(0, -5, 42, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = "#FFD700"; ctx.beginPath(); ctx.arc(0, 18, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(0, 18, 3, 0, Math.PI*2); ctx.fill();
    } 
    else if (difficulty === 'death') {
        ctx.strokeStyle = "black"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-20, -20); ctx.lineTo(-5, -15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(20, -20); ctx.lineTo(5, -15); ctx.stroke();
    }
    
    ctx.restore();
}

function drawHeadPreview(c, x, y, mode) {
    drawFrontFacingHusky(c, x, y-10, 0.6, mode); 
}

function drawAviators(ctx, x, y, isSide=false) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.strokeStyle = "#FFD700"; ctx.lineWidth = 2;
    
    if(isSide) {
        ctx.beginPath(); 
        ctx.moveTo(2, -3); ctx.lineTo(12, -5); ctx.stroke();
        ctx.beginPath(); 
        ctx.ellipse(8, 0, 6, 5, -0.2, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();
    } else {
        ctx.beginPath(); 
        ctx.moveTo(-2, -2); 
        ctx.bezierCurveTo(-15, -2, -22, 10, -10, 12); 
        ctx.bezierCurveTo(-2, 12, -2, -2, -2, -2); 
        ctx.fill(); ctx.stroke(); 
        ctx.beginPath();
        ctx.moveTo(2, -2); 
        ctx.bezierCurveTo(15, -2, 22, 10, 10, 12); 
        ctx.bezierCurveTo(2, 12, 2, -2, 2, -2); 
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(2, -2); ctx.stroke();
    }
    ctx.restore();
}

function drawStick(ctx, x, y, frame=0) { 
    ctx.save(); ctx.translate(x, y + Math.sin(frame*0.1)*5); 
    ctx.scale(2.0, 2.0); 
    ctx.strokeStyle = "#8B4513"; ctx.lineWidth = 5; ctx.lineCap = "round"; 
    ctx.beginPath(); ctx.moveTo(-10, 5); ctx.lineTo(10, -5); ctx.stroke(); 
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(5, 5); ctx.stroke(); 
    ctx.fillStyle = "#00b894"; ctx.beginPath(); ctx.arc(10, -5, 3, 0, Math.PI*2); ctx.fill(); 
    ctx.restore(); 
}

function drawBone(ctx, x, y, type, frame) { 
    ctx.save(); ctx.translate(x, y + Math.sin(frame*0.1)*5);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    if(type === 'magnet') {
        ctx.fillStyle = "#e74c3c"; ctx.strokeStyle = "#bdc3c7"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, -5, 12, Math.PI, 0); ctx.lineTo(12, 10); ctx.lineTo(5, 10); ctx.lineTo(5, -5); ctx.arc(0, -5, 5, 0, Math.PI, true); ctx.lineTo(-5, 10); ctx.lineTo(-12, 10); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#bdc3c7"; ctx.fillRect(-12, 5, 7, 5); ctx.fillRect(5, 5, 7, 5);
    } else {
        ctx.fillStyle = (type === 'gold') ? "#FFD700" : "#ffffff"; 
        ctx.strokeStyle = (type === 'gold') ? "#DAA520" : "#b2bec3"; 
        ctx.lineWidth=2;
        if(type === 'gold') { ctx.shadowColor = "#FFD700"; ctx.shadowBlur = 12; }
        ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(10, -4); ctx.lineTo(10, 4); ctx.lineTo(-10, 4); ctx.fill();
        ctx.beginPath(); ctx.arc(-12, -6, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(-12, 6, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(12, -6, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(12, 6, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillRect(-10, -4, 20, 8); 
        if(type === 'gold') {
            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.globalAlpha=0.5;
            ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(5, -2); ctx.lineTo(3, 2); ctx.lineTo(-7, 2); ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
    ctx.restore(); 
}

// Draw a small bone icon on a given canvas context (for HUD)
function drawBoneIcon(ctx, x, y, size=10) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#b2bec3";
    ctx.lineWidth = 1.5;
    let s = size / 10;
    ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-8, -3); ctx.lineTo(8, -3); ctx.lineTo(8, 3); ctx.lineTo(-8, 3); ctx.fill();
    ctx.beginPath(); ctx.arc(-9, -4, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-9, 4, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(9, -4, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(9, 4, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillRect(-8, -3, 16, 6);
    ctx.restore();
}

function drawHydrant(ctx, x, y) { ctx.fillStyle = "#d63031"; ctx.fillRect(x-15, y-40, 30, 40); ctx.fillRect(x-20, y-10, 40, 10); ctx.fillRect(x-20, y-35, 10, 10); ctx.fillRect(x+10, y-35, 10, 10); ctx.beginPath(); ctx.arc(x, y-40, 15, Math.PI, 0); ctx.fill(); ctx.fillStyle = "#b2bec3"; ctx.fillRect(x-5, y-45, 10, 5); }

function drawDooDoo(ctx, x, y, stack) {
    for(let i=0; i<stack; i++) {
        let yOff = -i * 35; ctx.fillStyle = "#8B4513"; ctx.beginPath(); ctx.ellipse(x, y+yOff-5, 22, 10, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, y+yOff-15, 18, 9, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, y+yOff-25, 12, 7, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x-5,y+yOff-25); ctx.quadraticCurveTo(x,y+yOff-38, x+5,y+yOff-25); ctx.fill(); ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(x-7,y+yOff-15,5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+7,y+yOff-15,5,0,Math.PI*2); ctx.fill(); ctx.fillStyle = "black"; ctx.beginPath(); ctx.arc(x-7,y+yOff-15,2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+7,y+yOff-15,2,0,Math.PI*2); ctx.fill();
    }
}

function drawSteamDooDoo(ctx, x, y, frame) {
    ctx.save(); ctx.translate(x, y); ctx.scale(2.0, 2.0); // was 2.5 - scaled down for mobile
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(0, 5, 25, 5, 0, 0, Math.PI*2); ctx.fill();
    drawDooDoo(ctx, 0, 0, 1);
    ctx.fillStyle = "rgba(200,200,200,0.5)";
    let t = Date.now()/500;
    for(let i=0; i<3; i++) { let sx = Math.sin(t + i)*5; let sy = -25 - (t*20 + i*25)%50; let sSize = 3 + (Math.abs(sy)/50)*5; ctx.beginPath(); ctx.arc(sx, sy, sSize, 0, Math.PI*2); ctx.fill(); }
    ctx.restore();
}

function drawFlies(ctx, x, y, frame) { 
    ctx.save(); ctx.translate(x, y); 
    let flap = Math.sin(frame*0.4) * 8;
    ctx.scale(1.5, 1.5); ctx.fillStyle = "#2d3436"; 
    ctx.beginPath(); ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(18, -12+flap); ctx.lineTo(8, 2); ctx.fill(); 
    ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(-18, -12+flap); ctx.lineTo(-8, 2); ctx.fill(); 
    ctx.beginPath(); ctx.arc(-8, -5, 7, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#ff9f43"; ctx.beginPath(); ctx.moveTo(-14, -5); ctx.lineTo(-20, -2); ctx.lineTo(-14, 1); ctx.fill();
    ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(-10, -7, 2, 0, Math.PI*2); ctx.fill();
    ctx.restore(); 
}

function drawStickIcon() {
    const c = document.getElementById('stick-canvas');
    if(!c) return;
    const x = c.getContext('2d'); x.clearRect(0,0,40,40); x.save();
    x.translate(20,20); x.rotate(Math.PI/4);
    x.strokeStyle = "#8B4513"; x.lineWidth = 5; x.lineCap="round";
    x.beginPath(); x.moveTo(-12, 0); x.lineTo(12, 0); x.stroke(); 
    x.beginPath(); x.moveTo(-3, 0); x.lineTo(6, -6); x.stroke(); 
    x.fillStyle = "#00b894"; x.beginPath(); x.arc(7, -7, 2.5, 0, Math.PI*2); x.fill();
    x.restore();
}

let envStyles = [
    { c1: "#81ecec", c2: "#74b9ff", grass: "#00b894", ground: "#5D4037" }, // Day
    { c1: "#ff9f43", c2: "#ee5253", grass: "#e17055", ground: "#3E2723" }, // Sunset
    { c1: "#2c3e50", c2: "#000000", grass: "#192a56", ground: "#2d3436" }, // Night
    { c1: "#81ecec", c2: "#74b9ff", grass: "#00b894", ground: "#5D4037" }  // Loop back
];

function lerpColor(c1, c2, t) {
    let r1 = parseInt(c1.substring(1,3),16), g1 = parseInt(c1.substring(3,5),16), b1 = parseInt(c1.substring(5,7),16);
    let r2 = parseInt(c2.substring(1,3),16), g2 = parseInt(c2.substring(3,5),16), b2 = parseInt(c2.substring(5,7),16);
    let r = Math.round(r1 + (r2-r1)*t), g = Math.round(g1 + (g2-g1)*t), b = Math.round(b1 + (b2-b1)*t);
    return `rgb(${r},${g},${b})`;
}

function getSkyColor(levelDistance, levelMaxDistance, currentLevel) {
    let t = Math.min(levelDistance / levelMaxDistance, 1);
    let s = envStyles[(currentLevel-1) % envStyles.length];
    let e = envStyles[currentLevel % envStyles.length];
    return { 
        c1: lerpColor(s.c1, e.c1, t), 
        c2: lerpColor(s.c2, e.c2, t), 
        grass: lerpColor(s.grass, e.grass, t), 
        ground: lerpColor(s.ground, e.ground, t) 
    };
}

// =====================================================================
// SHOP: Canine Couture - Full boutique UI drawn on canvas
// =====================================================================
const SHOP_HATS = [
    { 
        id: 'cowboy', name: 'COWBOY HAT', cost: 30,
        perk: 'MEGA at 25 bones', icon: '🤠',
        desc: 'Yeehaw! Mega Mode activates faster — only 25 bones needed.',
        color: '#8B4513'
    },
    { 
        id: 'tophat', name: 'TOP HAT', cost: 40,
        perk: 'Start with Shield', icon: '🎩',
        desc: 'Dapper! Begin every level with a full 5-stick shield.',
        color: '#2d3436'
    },
    { 
        id: 'cap', name: 'RED CAP', cost: 25,
        perk: '2x Bone Value', icon: '🧢',
        desc: 'All bones worth double. White = 2, Gold = 10!',
        color: '#d63031'
    }
];

function openShop() {
    const container = document.getElementById('shop-container');
    const shopTextBox = document.getElementById('shop-text-box');
    const shopTitle = document.querySelector('#shop-counter-area h1');
    const nextBtn = document.getElementById('shop-next-btn');

    if (shopTitle) shopTitle.textContent = 'CANINE COUTURE';

    // Draw shopkeeper on the counter canvas
    const shopkeeperCanvas = document.getElementById('shopkeeper-canvas');
    if (shopkeeperCanvas) {
        const skCtx = shopkeeperCanvas.getContext('2d');
        skCtx.clearRect(0, 0, 100, 100);
        drawFrontFacingHusky(skCtx, 50, 55, 0.5, 'normal');
    }

    // Build shop items
    if (!container) return;
    container.innerHTML = '';

    const messages = [
        "Welcome to CANINE COUTURE! The finest hats in the dog park. 🐾",
        "These hats aren't just fashion — they come with PERKS!",
        "Choose wisely, darling. Only one hat at a time!"
    ];
    if (shopTextBox) {
        shopTextBox.textContent = messages[Math.floor(Math.random() * messages.length)];
    }

    SHOP_HATS.forEach(hat => {
        const canAfford = score >= hat.cost;
        const isOwned = pepper.hat === hat.id;

        const item = document.createElement('div');
        item.className = 'shop-item' + (isOwned ? ' selected' : '') + (!canAfford && !isOwned ? ' locked' : '');
        item.innerHTML = `
            <div class="shop-hat-preview" id="preview-${hat.id}"></div>
            <div class="shop-name">${hat.name}</div>
            <div class="shop-perk">${hat.perk}</div>
            <div class="shop-desc">${hat.desc}</div>
            <div class="shop-cost-row">
                ${isOwned 
                    ? '<div class="shop-badge owned">✓ EQUIPPED</div>' 
                    : canAfford 
                        ? `<button class="shop-buy-btn" onclick="buyHat('${hat.id}', ${hat.cost})">BUY ${hat.cost} 🦴</button>`
                        : `<div class="shop-badge locked-badge">🔒 ${hat.cost} 🦴</div>`
                }
            </div>
        `;
        container.appendChild(item);

        // Draw hat preview canvas inside the item
        const previewDiv = document.getElementById(`preview-${hat.id}`);
        if (previewDiv) {
            const cvs = document.createElement('canvas');
            cvs.width = 80; cvs.height = 80;
            cvs.style.cssText = 'display:block; margin:0 auto;';
            previewDiv.appendChild(cvs);
            const pCtx = cvs.getContext('2d');
            pCtx.clearRect(0,0,80,80);
            // Draw small side-profile pepper with hat
            const fakePepper = { hat: hat.id, grounded: true, rotation: 0, runFrame: 0, magnetTimer: 0, hasShield: false, spinTimer: 0, isMega: false };
            drawHusky(pCtx, 40, 60, false, false, fakePepper, 'normal', 0);
        }
    });

    // Next level button style
    if (nextBtn) {
        nextBtn.textContent = '→ NEXT LEVEL';
    }
}

window.buyHat = function(hatId, cost) {
    if (score < cost) return;
    score -= cost;
    pepper.hat = hatId;
    document.getElementById('shop-balance').innerText = score + ' 🦴';
    openShop(); // Re-render
};

function renderDiffPreviews() {
    ['baby','normal','death'].forEach(mode => {
        const cvs = document.getElementById('cvs-' + mode);
        if (!cvs) return;
        const c = cvs.getContext('2d');
        c.clearRect(0,0,100,100);
        drawFrontFacingHusky(c, 50, 60, 0.55, mode);
    });
}
// END OF FILE - renderer.js
