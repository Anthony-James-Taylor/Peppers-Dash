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
    else if (!pepper.grounded && !pepper.canDoubleJump) { pepper.rotation += 0.3; ctx.rotate(pepper.rotation); } 
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
        // Side View Pacifier
        ctx.fillStyle = "#FFD700"; ctx.beginPath(); ctx.arc(15, 6, 4, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "white"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(18, 6, 3, 0, Math.PI*2); ctx.stroke();
        
        // Side View Bonnet
        ctx.strokeStyle = "pink"; ctx.lineWidth = 4; 
        ctx.beginPath(); ctx.arc(-2, -2, 16, Math.PI*0.8, Math.PI*1.8); ctx.stroke();
        
        // Eye
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.ellipse(6, -4, 5, 8, 0, 0, Math.PI*2); ctx.fill(); 
        ctx.fillStyle = eyeC; ctx.beginPath(); ctx.ellipse(8, -2, 2.5, 4, 0, 0, Math.PI*2); ctx.fill(); 
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(8.5, -3, 1, 0, Math.PI*2); ctx.fill();
    }
    else { 
        // Death Mode Eyes (Side)
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.ellipse(6, -4, 5, 8, 0, 0, Math.PI*2); ctx.fill(); 
        ctx.fillStyle = eyeC; ctx.beginPath(); ctx.ellipse(8, -2, 2.5, 4, 0, 0, Math.PI*2); ctx.fill(); 
        
        // Angry Eyebrow
        ctx.strokeStyle = "black"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(4, -10); ctx.lineTo(12, -6); ctx.stroke();
    }

    drawHat(ctx); 
    ctx.restore(); ctx.restore();
}

// CUTE BIG FRONT FACING DOG (Used for Start Screen AND Difficulty Cards)
// Now accepts 'difficulty' to change outfit!
function drawFrontFacingHusky(ctx, x, y, scale=1.0, difficulty='normal') {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    
    // Float Animation
    let float = Math.sin(Date.now() / 500) * 2;
    ctx.translate(0, float);

    let bodyC = (difficulty === 'death') ? "#2d3436" : "#1a1a1a";
    let eyeC = (difficulty === 'death') ? "#ff0000" : "#00fbff";

    // Body
    ctx.fillStyle = bodyC; ctx.beginPath(); ctx.ellipse(0, 40, 35, 30, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "white"; ctx.beginPath(); ctx.ellipse(0, 40, 20, 25, 0, 0, Math.PI*2); ctx.fill();
    
    // Feet
    ctx.fillStyle = "white"; 
    ctx.beginPath(); ctx.arc(-20, 65, 10, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(20, 65, 10, 0, Math.PI*2); ctx.fill();

    // Head
    ctx.fillStyle = bodyC; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(0, 10, 28, 0, Math.PI*2); ctx.fill();

    // Ears
    ctx.fillStyle = bodyC; ctx.beginPath(); ctx.moveTo(-25, -20); ctx.lineTo(-35, -55); ctx.lineTo(-5, -30); ctx.fill();
    ctx.fillStyle = bodyC; ctx.beginPath(); ctx.moveTo(25, -20); ctx.lineTo(35, -55); ctx.lineTo(5, -30); ctx.fill();
    ctx.fillStyle = "pink"; ctx.beginPath(); ctx.moveTo(-23, -25); ctx.lineTo(-32, -48); ctx.lineTo(-10, -32); ctx.fill();
    ctx.fillStyle = "pink"; ctx.beginPath(); ctx.moveTo(23, -25); ctx.lineTo(32, -48); ctx.lineTo(10, -32); ctx.fill();

    // Face
    ctx.fillStyle = "black"; ctx.beginPath(); ctx.arc(0, 5, 6, 0, Math.PI*2); ctx.fill(); // Nose
    ctx.fillStyle = eyeC; ctx.beginPath(); ctx.arc(-12, -8, 7, 0, Math.PI*2); ctx.fill(); // Left Eye
    ctx.fillStyle = eyeC; ctx.beginPath(); ctx.arc(12, -8, 7, 0, Math.PI*2); ctx.fill(); // Right Eye
    
    // Pupils (Only for Non-Death mode, Death mode has glowing eyes)
    if(difficulty !== 'death') {
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(-14, -10, 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(10, -10, 2, 0, Math.PI*2); ctx.fill();
    }

    // Outfit Logic
    if (difficulty === 'normal') {
        drawAviators(ctx, 0, -8, false); 
    } 
    else if (difficulty === 'baby') {
        // Bonnet
        ctx.strokeStyle = "pink"; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(0, -5, 42, Math.PI, 0); ctx.stroke();
        // Pacifier
        ctx.fillStyle = "#FFD700"; ctx.beginPath(); ctx.arc(0, 18, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(0, 18, 3, 0, Math.PI*2); ctx.fill();
    } 
    else if (difficulty === 'death') {
        // Angry Eyebrows
        ctx.strokeStyle = "black"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-20, -20); ctx.lineTo(-5, -15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(20, -20); ctx.lineTo(5, -15); ctx.stroke();
    }
    
    ctx.restore();
}

// Head Preview (Difficulty Cards) -> Now uses Front Facing Style
function drawHeadPreview(c, x, y, mode) {
    // Reuse the front-facing logic but just for the head area (by clipping or just scale)
    // We will just draw the whole front facing dog scaled down, it looks cuter as a "doll"
    drawFrontFacingHusky(c, x, y-10, 0.6, mode); 
}

// Updated Aviators (Smoother & Rounder)
function drawAviators(ctx, x, y, isSide=false) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.strokeStyle = "#FFD700"; ctx.lineWidth = 2;
    
    if(isSide) {
        // Side view: Rounder shape
        ctx.beginPath(); 
        ctx.moveTo(2, -3); ctx.lineTo(12, -5); ctx.stroke(); // Arm
        
        ctx.beginPath(); 
        // Smooth rounded lens for side view
        ctx.ellipse(8, 0, 6, 5, -0.2, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();
    } else {
        // Front view: Smooth Aviators
        ctx.beginPath(); 
        // Left Lens
        ctx.moveTo(-2, -2); 
        ctx.bezierCurveTo(-15, -2, -22, 10, -10, 12); 
        ctx.bezierCurveTo(-2, 12, -2, -2, -2, -2); 
        ctx.fill(); ctx.stroke(); 
        
        // Right Lens
        ctx.beginPath();
        ctx.moveTo(2, -2); 
        ctx.bezierCurveTo(15, -2, 22, 10, 10, 12); 
        ctx.bezierCurveTo(2, 12, 2, -2, 2, -2); 
        ctx.fill(); ctx.stroke();
        
        ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(2, -2); ctx.stroke(); // Bridge
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
    if(type === 'magnet') {
        ctx.fillStyle = "#e74c3c"; ctx.strokeStyle = "#bdc3c7"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, -5, 12, Math.PI, 0); ctx.lineTo(12, 10); ctx.lineTo(5, 10); ctx.lineTo(5, -5); ctx.arc(0, -5, 5, 0, Math.PI, true); ctx.lineTo(-5, 10); ctx.lineTo(-12, 10); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#bdc3c7"; ctx.fillRect(-12, 5, 7, 5); ctx.fillRect(5, 5, 7, 5);
    } else {
        ctx.fillStyle = (type === 'gold') ? "#FFD700" : "#ffffff"; ctx.strokeStyle = (type === 'gold') ? "#DAA520" : "#b2bec3"; 
        ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(10, -4); ctx.lineTo(10, 4); ctx.lineTo(-10, 4); ctx.fill();
        ctx.beginPath(); ctx.arc(-12, -6, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(-12, 6, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(12, -6, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(12, 6, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillRect(-10, -4, 20, 8); 
        if(type === 'gold') {
            ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10;
            ctx.fillStyle = "white"; ctx.globalAlpha=0.5;
            ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(5, -2); ctx.lineTo(3, 2); ctx.lineTo(-7, 2); ctx.fill();
        }
    }
    ctx.restore(); 
}

function drawHydrant(ctx, x, y) { ctx.fillStyle = "#d63031"; ctx.fillRect(x-15, y-40, 30, 40); ctx.fillRect(x-20, y-10, 40, 10); ctx.fillRect(x-20, y-35, 10, 10); ctx.fillRect(x+10, y-35, 10, 10); ctx.beginPath(); ctx.arc(x, y-40, 15, Math.PI, 0); ctx.fill(); ctx.fillStyle = "#b2bec3"; ctx.fillRect(x-5, y-45, 10, 5); }

function drawDooDoo(ctx, x, y, stack) {
    for(let i=0; i<stack; i++) {
        let yOff = -i * 35; ctx.fillStyle = "#8B4513"; ctx.beginPath(); ctx.ellipse(x, y+yOff-5, 22, 10, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, y+yOff-15, 18, 9, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, y+yOff-25, 12, 7, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x-5,y+yOff-25); ctx.quadraticCurveTo(x,y+yOff-38, x+5,y+yOff-25); ctx.fill(); ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(x-7,y+yOff-15,5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+7,y+yOff-15,5,0,Math.PI*2); ctx.fill(); ctx.fillStyle = "black"; ctx.beginPath(); ctx.arc(x-7,y+yOff-15,2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+7,y+yOff-15,2,0,Math.PI*2); ctx.fill();
    }
}

function drawSteamDooDoo(ctx, x, y, frame) {
    ctx.save(); ctx.translate(x, y); ctx.scale(2.5, 2.5);
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
// END OF FILE - renderer.js
