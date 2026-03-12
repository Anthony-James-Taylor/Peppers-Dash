// --- AUDIO ENGINE ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let musicInterval;
let step = 0;
let isMuted = false;

// Music Tracks Data
const tracks = { 
    1: { bass: [82,0,82,98,0,82,110,0,82,0,123,110,98,82,0,146], lead: [0,0,0,0,0,0,0,0, 392,0,329,0,293,0,0,0], tempo: 142 }, 
    2: { bass: [98,98,196,98,110,110,220,110,123,123,246,123,130,130,261,130], lead: [0,0,0,523,0,0,0,493,0,0,0,440,0,0,392,0], tempo: 120 }, 
    3: { bass: [82,82,87,87,92,92,98,98,110,110,98,98,92,92,87,87], lead: [329,0,349,0,392,0,440,0,392,0,349,0,329,0,0,0], tempo: 110 } 
};

function initAudio() { 
    if (!audioCtx && AudioContext) audioCtx = new AudioContext(); 
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); 
}

// Synthesizer Function
function synth(freq, type, vol, decay, wah=false) { 
    if (!audioCtx || isMuted) return; 
    const osc = audioCtx.createOscillator(); 
    const gain = audioCtx.createGain(); 
    const filter = audioCtx.createBiquadFilter(); 
    
    osc.type = type; 
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime); 
    
    if (wah) { 
        filter.type = 'lowpass'; 
        filter.Q.value = 8; 
        filter.frequency.setValueAtTime(300, audioCtx.currentTime); 
        filter.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.05); 
        filter.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + decay); 
    } else { 
        filter.type = 'allpass'; 
    } 
    
    const now = audioCtx.currentTime; 
    gain.gain.setValueAtTime(0, now); 
    gain.gain.linearRampToValueAtTime(vol, now + 0.01); 
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay); 
    
    osc.connect(filter); 
    filter.connect(gain); 
    gain.connect(audioCtx.destination); 
    
    osc.start(now); 
    osc.stop(now + decay + 0.1); 
}

function playSnare() { 
    if (!audioCtx || isMuted) return; 
    const b = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate); 
    const d = b.getChannelData(0); 
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; 
    
    const n = audioCtx.createBufferSource(); 
    n.buffer = b; 
    const f = audioCtx.createBiquadFilter(); 
    f.type = 'highpass'; 
    f.frequency.value = 1500; 
    const g = audioCtx.createGain(); 
    g.gain.setValueAtTime(0.3, audioCtx.currentTime); 
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08); 
    
    n.connect(f); 
    f.connect(g); 
    g.connect(audioCtx.destination); 
    n.start(); 
}

function playBark() { 
    if (!audioCtx || isMuted) return; 
    const osc = audioCtx.createOscillator(); 
    osc.type = 'triangle'; 
    const gain = audioCtx.createGain(); 
    osc.frequency.setValueAtTime(300, audioCtx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.15); 
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime); 
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15); 
    osc.connect(gain); 
    gain.connect(audioCtx.destination); 
    osc.start(); 
    osc.stop(audioCtx.currentTime + 0.2); 
}

function playClick() { 
    if (!audioCtx || isMuted) return; 
    const osc = audioCtx.createOscillator(); 
    const gain = audioCtx.createGain(); 
    osc.frequency.setValueAtTime(800, audioCtx.currentTime); 
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime); 
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05); 
    osc.connect(gain); 
    gain.connect(audioCtx.destination); 
    osc.start(); 
    osc.stop(audioCtx.currentTime + 0.06); 
}

function startMusic(currentLevel, difficulty, pepper) { 
    if (musicInterval || isMuted) return; 
    let track = tracks[currentLevel] || tracks[3]; 
    let ms = track.tempo; 
    if (difficulty === 'death') ms *= 0.9; 
    step = 0; 
    
    musicInterval = setInterval(() => { 
        if (window.isGamePaused()) return;

        let tick = step % 16; 
        if (pepper.isMega) { 
            let arp = [523, 659, 783, 1046]; 
            synth(arp[step % 4], 'square', 0.08, 0.1); 
            if (step % 2 === 0) synth(130, 'sawtooth', 0.15, 0.1); 
            if (tick % 4 === 2) playSnare(); 
        } else { 
            let b = track.bass[tick]; 
            if (b) synth(b, 'sawtooth', 0.25, 0.25, true); 
            if (tick === 4 || tick === 12) playSnare(); 
            if (tick % 2 === 0) synth(4000, 'square', 0.03, 0.02); 
            if (window.getLevelDistance() > window.getLevelMaxDistance() / 2) { 
                let l = track.lead[tick]; 
                if (l) synth(l * 2, 'square', 0.1, 0.15); 
            }
        } 
        step++; 
    }, ms); 
}

function stopMusic() { 
    clearInterval(musicInterval); 
    musicInterval = null; 
}

function playSfx(type) { 
    if (!audioCtx || isMuted) return; 

    if (type === 'jump') synth(350, 'triangle', 0.1, 0.1); 
    if (type === 'doublejump') synth(600, 'square', 0.1, 0.1); 
    if (type === 'collect') synth(1400, 'sine', 0.1, 0.2); 
    if (type === 'smash') { 
        synth(80, 'sawtooth', 0.3, 0.3); 
        playSnare(); 
    } 
    if (type === 'crash') synth(50, 'sawtooth', 0.4, 0.5); 
    if (type === 'levelup') { 
        synth(440, 'triangle', 0.2, 0.5); 
        setTimeout(() => synth(880, 'triangle', 0.2, 0.5), 100); 
    } 

    if (type === 'splash') { 
        const o = audioCtx.createOscillator(); 
        o.type = 'sawtooth'; 
        o.frequency.setValueAtTime(400, audioCtx.currentTime); 
        o.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3); 
        const g = audioCtx.createGain(); 
        g.gain.setValueAtTime(0.3, audioCtx.currentTime); 
        g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3); 
        o.connect(g); 
        g.connect(audioCtx.destination); 
        o.start(); 
        o.stop(audioCtx.currentTime + 0.31); 
    } 

    if (type === 'spray') {
        const b = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.08, audioCtx.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

        const n = audioCtx.createBufferSource();
        n.buffer = b;

        const f = audioCtx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 1800;

        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.12, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

        n.connect(f); 
        f.connect(g); 
        g.connect(audioCtx.destination); 
        n.start();
    } 

    if (type === 'magnet') synth(2000, 'sine', 0.1, 0.5, true); 
}
