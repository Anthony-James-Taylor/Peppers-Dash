// --- VISUAL RENDERING ---

// Helper to draw the Husky
function drawHusky(ctx, x, y, isMega, hasShield, pepper, difficulty, frame) {
    ctx.save(); ctx.translate(x, y);
    let s = isMega ? 1.4 : 1; ctx.scale(s, s);
    
    // Spin Logic
    if(pepper.spinTimer > 0) {
        pepper.spinTimer--;
        let angle = (pepper.spinTimer / 20) * Math.PI * 2;
        ctx.rotate(angle);
    }

    let bodyC = "#1a1a1a"; let white = "#ffffff"; let eyeC = "#00fbff";
    if(difficulty === 'death') { bodyC = "#2d3436"; eyeC = "red"; }
    if(isMega) { let hue = (Date.now() / 5) % 360; bodyC = `hsl(${hue}, 80%, 40%)`; white = `hsl(${(hue+180)%360}, 90%, 80%)`; }

    // Internal Hat Drawing Function
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
    
    // Rotation logic based on jumps
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
    
    // Magnet Visual
    if(pepper.magnetTimer > 0) { 
        ctx.save(); ctx.translate(0, -40); 
        let wave = (frame % 30) / 30;
        ctx.strokeStyle = `rgba(231, 76, 60, ${1-wave})`; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(0,0, 20 + wave*30, 0, Math.PI*2); ctx.stroke();
        ctx.scale(0.6, 0.6);
        ctx.fillStyle = "#e74c3c"; ctx.strokeStyle = "#bdc3c7"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, -5, 12, Math.PI, 0); ctx.lineTo(12, 10); ctx.lineTo(5, 10); ctx.lineTo(5, -5); ctx.arc(0, -5, 5, 0, Math.PI, true); ctx.lineTo(-5, 10); ctx.lineTo(-12, 10); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#bdc3c7"; ctx.fillRect(-12, 5, 7, 5); ctx.fillRect(5, 5, 7, 5);
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
    ctx.fillStyle = bodyC; ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(-8, -22); ctx.lineTo(2, -12); ctx.fill();
    ctx.fillStyle = "pink"; ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-7, -18); ctx.lineTo(0, -10); ctx.fill();
    ctx.fillStyle = bodyC; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = white; ctx.beginPath(); ctx.moveTo(5, -8); ctx.lineTo(18, 2); ctx.lineTo(12, 12); ctx.lineTo(0, 10); ctx.lineTo(-5, 0); ctx.fill();
    ctx.fillStyle = "black"; ctx.beginPath(); ctx.arc(18, 1, 3.5, 0, Math.PI*2); ctx.fill();

    if(difficulty === 'normal') { drawAviators(ctx, 0, 0); } 
    else if (difficulty === 'baby') { ctx.fillStyle = "white"; ctx.beginPath(); ctx.ellipse(6, -4, 5, 8, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = eyeC; ctx.beginPath(); ctx.ellipse(8, -2, 2.5, 4, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(8.5, -3, 1, 0, Math.PI*2); ctx.fill(); }
    else { /* Death Mode Eyes */ ctx.fillStyle = "white"; ctx.beginPath(); ctx.ellipse(6, -4, 5, 8, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = eyeC; ctx.beginPath(); ctx.ellipse(8, -2, 2.5, 4, 0, 0, Math.PI*2); ctx.fill(); }

    drawHat(ctx); 
    if(difficulty === 'baby') { ctx.strokeStyle = "pink"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-2, -5, 14, Math.PI, 0); ctx.stroke(); ctx.fillStyle = "#FFD700"; ctx.beginPath(); ctx.arc(14, 8, 4, 0, Math.PI*2); ctx.fill(); } 
    ctx.restore(); ctx.restore();
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

function drawAviators(ctx, x, y) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.strokeStyle = "#FFD700"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-2, -5); ctx.bezierCurveTo(-15, -5, -18, 5, -10, 10); ctx.bezierCurveTo(-2, 10, -2, -5, -2, -5); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -5); ctx.bezierCurveTo(15, -5, 18, 5, 10, 10); ctx.bezierCurveTo(2, 10, 2, -5, 2, -5); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -5); ctx.lineTo(2, -5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-2, -8); ctx.lineTo(2, -8); ctx.stroke();
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

function drawHeadPreview(c, x, y, mode) {
    c.save(); c.translate(x, y); 
    let bodyC = (mode==='death') ? "#2d3436" : "#1a1a1a";
    let eyeC = (mode==='death') ? "red" : "#00fbff";
    c.fillStyle = bodyC; c.beginPath(); c.arc(0, 0, 30, 0, Math.PI*2); c.fill();
    c.fillStyle = "white"; c.beginPath(); c.arc(0, 8, 22, 0, Math.PI*2); c.fill();
    c.fillStyle = bodyC; c.beginPath(); c.moveTo(-20, -10); c.lineTo(-25, -40); c.lineTo(-5, -20); c.fill(); c.beginPath(); c.moveTo(20, -10); c.lineTo(25, -40); c.lineTo(5, -20); c.fill();
    c.fillStyle = "pink"; c.beginPath(); c.moveTo(-18, -15); c.lineTo(-22, -30); c.lineTo(-10, -20);
