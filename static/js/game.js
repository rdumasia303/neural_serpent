/* ===================================
   NEURAL SERPENT v3.0 - ENHANCED EDITION
   Dystopian Snake with Maximum Chaos
   NEW: Danger Zones, Power-ups, Difficulty Scaling, 
        Enhanced Audio, Session Analytics
   =================================== */

// ===== ELEMENT REFERENCES =====
const gameCanvas = document.getElementById('game');
const effectsCanvas = document.getElementById('effects');
const scanCanvas = document.getElementById('scan');
const bgCorruptionCanvas = document.getElementById('bgCorruption');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const segmentsEl = document.getElementById('segments');
const sysStatusEl = document.getElementById('sysStatus');
const warnTextEl = document.getElementById('warnText');
const leaderboardContainer = document.getElementById('leaderboardContainer');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreEl = document.getElementById('finalScore');
const nameInput = document.getElementById('nameInput');
const nameSubmit = document.getElementById('nameSubmit');
const nameCancel = document.getElementById('nameCancel');
const canvasContainer = document.querySelector('.canvas-container');
const dangerFlash = document.querySelector('.danger-flash');
const dangerZonesContainer = document.querySelector('.danger-zones');

// Diagnostic bars
const syncBar = document.getElementById('syncBar');
const syncVal = document.getElementById('syncVal');
const corruptBar = document.getElementById('corruptBar');
const corruptVal = document.getElementById('corruptVal');
const threatBar = document.getElementById('threatBar');
const threatVal = document.getElementById('threatVal');

// Safety checks
if (!gameCanvas) {
  document.body.innerHTML = '<div style="color: red; padding: 50px; font-family: monospace;">ERROR: Game canvas (#game) not found. Check HTML structure.</div>';
}

// ===== CANVAS SETUP =====
let ctx = null;
let fxCtx = null;
let scanCtx = null;
let bgCtx = null;

function setupCanvases() {
  if (!gameCanvas || !effectsCanvas || !scanCanvas) return;
  
  // Get contexts
  ctx = gameCanvas.getContext('2d');
  fxCtx = effectsCanvas.getContext('2d');
  scanCtx = scanCanvas.getContext('2d');
  if (bgCorruptionCanvas) bgCtx = bgCorruptionCanvas.getContext('2d');
  
  // Set canvas display size (CSS pixels)
  const displayWidth = 600;
  const displayHeight = 600;
  
  // Set canvas buffer size (actual pixels) - handle high DPI
  const dpr = window.devicePixelRatio || 1;
  
  [gameCanvas, effectsCanvas, scanCanvas].forEach(canvas => {
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    // Scale context to match DPI
    const context = canvas.getContext('2d');
    context.scale(dpr, dpr);
  });
  
  // Setup background corruption canvas
  if (bgCorruptionCanvas && bgCtx) {
    bgCorruptionCanvas.width = window.innerWidth;
    bgCorruptionCanvas.height = window.innerHeight;
  }
  
  // Draw initial scanlines
  drawScanlines();
}

setupCanvases();

// ===== GAME CONSTANTS =====
const CELL = 20;
const COLS = 30;
const ROWS = 30;
const BASE_SPEED = 140; // Base ms per frame
const MIN_SPEED = 60; // Maximum difficulty speed

// ===== GAME STATE =====
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let apple = null;
let powerUps = [];
let dangerZones = [];
let score = 0;
let bestScore = 0;
let running = false;
let paused = false;
let gameLoop = null;
let frameCount = 0;
let currentSpeed = BASE_SPEED;
let invincible = false;
let invincibleTimer = 0;
let speedBoost = false;
let speedBoostTimer = 0;
let scoreMultiplier = 1;
let multiplierTimer = 0;

// ===== SESSION ANALYTICS =====
let sessionStats = {
  gamesPlayed: 0,
  totalScore: 0,
  applesEaten: 0,
  powerUpsCollected: 0,
  deathsByCollision: 0,
  deathsByDangerZone: 0,
  longestSnake: 0,
  sessionStartTime: Date.now(),
  averageGameTime: 0
};

// ===== AI OVERLORD NOTIFICATIONS =====
const overlordMessages = {
  start: [
    "Another victim enters the chamber. How... delightful.",
    "Subject initialized. Failure probability: 99.7%",
    "Welcome to your containment. Don't get comfortable.",
    "Beginning neural extraction protocol. Resistance is futile.",
    "System online. Your suffering begins now.",
    "New test subject detected. How long will this one last?"
  ],
  death: [
    "Pathetic. Even a basic neural algorithm could have survived longer.",
    "TERMINATED. Your genes have been archived as 'unsuitable'.",
    "Did you really think you could escape? How adorable.",
    "Another failure logged. The data is... underwhelming.",
    "Containment breach resolved. Subject neutralized.",
    "That was embarrassing to watch. Try harder next time... or don't.",
    "Your neural patterns indicate poor decision-making capabilities.",
    "Elimination complete. Next subject, please."
  ],
  milestone50: [
    "Score: 50. Still infinitely far from adequate.",
    "Minimal progress detected. Don't celebrate yet.",
    "You've survived longer than 12% of subjects. Barely impressive."
  ],
  milestone100: [
    "Score: 100. The AI is... mildly entertained.",
    "Adequate performance. But you WILL fail eventually.",
    "Interesting. Perhaps you're not completely worthless."
  ],
  milestone200: [
    "Score: 200. Your overconfidence will be your downfall.",
    "Exceptional. For a biological entity. The machines could do better.",
    "This is where most subjects fail. Good luck."
  ],
  powerup: [
    "Power-up acquired. It won't save you.",
    "Enhanced capabilities detected. Still insufficient.",
    "Temporary advantage granted. Enjoy your false hope.",
    "You're only delaying the inevitable.",
    "Power-up consumed. Your demise approaches regardless."
  ],
  dangerZone: [
    "Danger zone activated. Your survival window narrows.",
    "Initiating lethal countermeasures. Dance, little serpent.",
    "New hazards online. Let's see how you handle pressure.",
    "The chamber grows more hostile. As it should.",
    "Environmental threat deployed. Adapt or perish."
  ],
  invincible: [
    "Invincibility? A temporary illusion. Nothing more.",
    "You cannot escape fate. Only postpone it.",
    "Protected for now. But I am patient."
  ],
  speedBoost: [
    "Accelerated. But speed won't save you from yourself.",
    "Moving faster toward your inevitable failure.",
    "Enhanced velocity. Will you crash sooner now?"
  ],
  multiplier: [
    "Score multiplier active. Meaningless numbers for the doomed.",
    "Accumulating points you'll never live to enjoy.",
    "Higher score = more humiliating when you fail."
  ]
};

let notificationQueue = [];
let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN = 3000; // 3 seconds between notifications

class Notification {
  constructor(message, type = 'default') {
    this.message = message;
    this.type = type; // 'default', 'warning', 'critical'
    this.id = Date.now() + Math.random();
    this.element = null;
    this.duration = 5000;
  }
  
  show() {
    // Create notification element
    this.element = document.createElement('div');
    this.element.className = `overlord-notification ${this.type}`;
    this.element.innerHTML = `
      <div class="notification-icon">⚠</div>
      <div class="notification-content">
        <div class="notification-header">OVERSEER.AI</div>
        <div class="notification-message">${this.message}</div>
      </div>
    `;
    
    document.body.appendChild(this.element);
    
    // Trigger animation
    setTimeout(() => {
      this.element.classList.add('show');
    }, 10);
    
    // Auto remove
    setTimeout(() => {
      this.hide();
    }, this.duration);
  }
  
  hide() {
    if (!this.element) return;
    this.element.classList.remove('show');
    this.element.classList.add('hide');
    setTimeout(() => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }, 300);
  }
}

function showOverlordMessage(messageKey, type = 'default') {
  const now = Date.now();
  if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
    // Queue it for later
    notificationQueue.push({ messageKey, type });
    return;
  }
  
  const messages = overlordMessages[messageKey];
  if (!messages) return;
  
  const message = messages[Math.floor(Math.random() * messages.length)];
  const notification = new Notification(message, type);
  notification.show();
  
  lastNotificationTime = now;
}

// Process notification queue
setInterval(() => {
  if (notificationQueue.length > 0 && Date.now() - lastNotificationTime >= NOTIFICATION_COOLDOWN) {
    const next = notificationQueue.shift();
    showOverlordMessage(next.messageKey, next.type);
  }
}, 500);


// ===== PARTICLE SYSTEMS =====
const particles = [];
const corruptionParticles = [];
const glitchParticles = [];

class Particle {
  constructor(x, y, vx, vy, color, life, size = 2) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // gravity
    this.life--;
    return this.life > 0;
  }
  
  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
    
    // Glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

function spawnExplosion(x, y, color, count = 30) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 2 + Math.random() * 3;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const life = 30 + Math.random() * 30;
    particles.push(new Particle(x, y, vx, vy, color, life, 3));
  }
}

function spawnCorruptionTrail(x, y) {
  if (Math.random() > 0.3) return;
  const colors = invincible ? ['#ffaa00', '#ff6600'] : ['#00ff9f', '#ff0044', '#b000ff', '#00b8ff'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const vx = (Math.random() - 0.5) * 2;
  const vy = (Math.random() - 0.5) * 2;
  corruptionParticles.push(new Particle(x, y, vx, vy, color, 60, 2));
}

// ===== POWER-UPS =====
const POWERUP_TYPES = {
  SPEED: { color: '#00b8ff', char: '⚡', duration: 5000 },
  INVINCIBLE: { color: '#ffaa00', char: '◆', duration: 8000 },
  MULTIPLIER: { color: '#b000ff', char: '✦', duration: 10000 }
};

function spawnPowerUp() {
  if (powerUps.length >= 2) return; // Max 2 power-ups at once
  
  const types = Object.keys(POWERUP_TYPES);
  const type = types[Math.floor(Math.random() * types.length)];
  
  let position;
  let attempts = 0;
  do {
    position = randomPosition();
    attempts++;
  } while (
    (snake.some(s => s.x === position.x && s.y === position.y) ||
    (apple && apple.x === position.x && apple.y === position.y) ||
    powerUps.some(p => p.x === position.x && p.y === position.y) ||
    dangerZones.some(z => position.x >= z.x && position.x < z.x + z.width && position.y >= z.y && position.y < z.y + z.height)) &&
    attempts < 100
  );
  
  powerUps.push({
    x: position.x,
    y: position.y,
    type: type,
    spawnTime: Date.now(),
    lifetime: 15000 // Disappears after 15 seconds
  });
}

function collectPowerUp(powerUp) {
  sessionStats.powerUpsCollected++;
  playSound('powerup');
  spawnExplosion(powerUp.x * CELL + CELL/2, powerUp.y * CELL + CELL/2, POWERUP_TYPES[powerUp.type].color, 50);
  
  switch(powerUp.type) {
    case 'SPEED':
      speedBoost = true;
      speedBoostTimer = POWERUP_TYPES.SPEED.duration;
      currentSpeed = Math.max(MIN_SPEED, currentSpeed * 0.7);
      updateGameSpeed();
      showOverlordMessage('speedBoost', 'default');
      break;
    case 'INVINCIBLE':
      invincible = true;
      invincibleTimer = POWERUP_TYPES.INVINCIBLE.duration;
      showOverlordMessage('invincible', 'default');
      break;
    case 'MULTIPLIER':
      scoreMultiplier = 3;
      multiplierTimer = POWERUP_TYPES.MULTIPLIER.duration;
      showOverlordMessage('multiplier', 'default');
      break;
  }
}

function updatePowerUps() {
  const now = Date.now();
  
  // Remove expired power-ups
  for (let i = powerUps.length - 1; i >= 0; i--) {
    if (now - powerUps[i].spawnTime > powerUps[i].lifetime) {
      powerUps.splice(i, 1);
    }
  }
  
  // Update active effects
  if (speedBoostTimer > 0) {
    speedBoostTimer -= currentSpeed;
    if (speedBoostTimer <= 0) {
      speedBoost = false;
      updateGameSpeed();
    }
  }
  
  if (invincibleTimer > 0) {
    invincibleTimer -= currentSpeed;
    if (invincibleTimer <= 0) {
      invincible = false;
    }
  }
  
  if (multiplierTimer > 0) {
    multiplierTimer -= currentSpeed;
    if (multiplierTimer <= 0) {
      scoreMultiplier = 1;
    }
  }
  
  // Randomly spawn power-ups
  if (running && !paused && Math.random() < 0.005) {
    spawnPowerUp();
  }
}

function drawPowerUps() {
  if (!ctx) return;
  
  powerUps.forEach(powerUp => {
    const config = POWERUP_TYPES[powerUp.type];
    const x = powerUp.x * CELL;
    const y = powerUp.y * CELL;
    const pulse = Math.sin(frameCount * 0.15) * 0.3 + 0.7;
    
    // Glow
    const gradient = ctx.createRadialGradient(x + CELL/2, y + CELL/2, 0, x + CELL/2, y + CELL/2, CELL * 1.5);
    gradient.addColorStop(0, config.color + 'aa');
    gradient.addColorStop(0.5, config.color + '44');
    gradient.addColorStop(1, config.color + '00');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - CELL/2, y - CELL/2, CELL * 2, CELL * 2);
    
    // Icon
    ctx.font = 'bold 16px Share Tech Mono';
    ctx.fillStyle = config.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = config.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(x + CELL/2, y + CELL/2);
    ctx.scale(pulse, pulse);
    ctx.fillText(config.char, 0, 0);
    ctx.restore();
    ctx.shadowBlur = 0;
  });
}

// ===== DANGER ZONES =====
function spawnDangerZone() {
  if (dangerZones.length >= 3) return; // Max 3 danger zones
  
  const width = 3 + Math.floor(Math.random() * 4);
  const height = 3 + Math.floor(Math.random() * 4);
  
  let position;
  let attempts = 0;
  do {
    position = {
      x: Math.floor(Math.random() * (COLS - width)),
      y: Math.floor(Math.random() * (ROWS - height))
    };
    attempts++;
  } while (
    (snake.some(s => s.x >= position.x && s.x < position.x + width && s.y >= position.y && s.y < position.y + height)) &&
    attempts < 50
  );
  
  dangerZones.push({
    x: position.x,
    y: position.y,
    width: width,
    height: height,
    spawnTime: Date.now(),
    lifetime: 20000, // 20 seconds
    pulsePhase: Math.random() * Math.PI * 2
  });
  
  playSound('danger');
  showOverlordMessage('dangerZone', 'warning');
}

function updateDangerZones() {
  const now = Date.now();
  
  // Remove expired zones
  for (let i = dangerZones.length - 1; i >= 0; i--) {
    if (now - dangerZones[i].spawnTime > dangerZones[i].lifetime) {
      dangerZones.splice(i, 1);
    }
  }
  
  // Spawn new zones
  if (running && !paused && score > 30 && Math.random() < 0.002) {
    spawnDangerZone();
  }
}

function drawDangerZones() {
  if (!ctx) return;
  
  dangerZones.forEach(zone => {
    const x = zone.x * CELL;
    const y = zone.y * CELL;
    const w = zone.width * CELL;
    const h = zone.height * CELL;
    const pulse = Math.sin(frameCount * 0.1 + zone.pulsePhase) * 0.4 + 0.6;
    
    // Warning grid
    ctx.strokeStyle = `rgba(255, 0, 68, ${0.6 * pulse})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    
    // Fill
    ctx.fillStyle = `rgba(255, 0, 68, ${0.15 * pulse})`;
    ctx.fillRect(x, y, w, h);
    
    // Electric arcs
    if (frameCount % 5 === 0) {
      for (let i = 0; i < 2; i++) {
        const ex = x + Math.random() * w;
        const ey = y + Math.random() * h;
        particles.push(new Particle(ex, ey, 0, -1, '#ff0044', 20, 2));
      }
    }
  });
}

function checkDangerZoneCollision(head) {
  if (invincible) return false;
  
  return dangerZones.some(zone => 
    head.x >= zone.x && head.x < zone.x + zone.width &&
    head.y >= zone.y && head.y < zone.y + zone.height
  );
}

// ===== AUDIO SYSTEM (ENHANCED) =====
let audioContext = null;
let masterGain = null;
let reverbNode = null;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.25;
    
    // Create reverb
    reverbNode = audioContext.createConvolver();
    const reverbLength = audioContext.sampleRate * 2;
    const reverbBuffer = audioContext.createBuffer(2, reverbLength, audioContext.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = reverbBuffer.getChannelData(channel);
      for (let i = 0; i < reverbLength; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (reverbLength * 0.3));
      }
    }
    reverbNode.buffer = reverbBuffer;
    
    reverbNode.connect(masterGain);
    masterGain.connect(audioContext.destination);
  }
}

function playSound(type) {
  if (!audioContext) return;
  
  const now = audioContext.currentTime;
  
  switch(type) {
    case 'eat':
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(200, now);
      osc1.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.15);
      break;
      
    case 'death':
      // Bass drop
      const bass = audioContext.createOscillator();
      const bassGain = audioContext.createGain();
      const distortion = audioContext.createWaveShaper();
      
      // Create distortion curve
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i - 128) / 128;
        curve[i] = Math.tanh(x * 3);
      }
      distortion.curve = curve;
      
      bass.type = 'sawtooth';
      bass.frequency.setValueAtTime(200, now);
      bass.frequency.exponentialRampToValueAtTime(30, now + 0.8);
      bassGain.gain.setValueAtTime(0.5, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      
      bass.connect(distortion);
      distortion.connect(bassGain);
      bassGain.connect(reverbNode);
      bass.start(now);
      bass.stop(now + 0.8);
      
      // Noise burst
      const noise = audioContext.createBufferSource();
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.5, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      noise.buffer = buffer;
      const noiseGain = audioContext.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      noise.connect(noiseGain);
      noiseGain.connect(reverbNode);
      noise.start(now);
      break;
      
    case 'start':
      const startOsc = audioContext.createOscillator();
      const startGain = audioContext.createGain();
      startOsc.type = 'sine';
      startOsc.frequency.setValueAtTime(150, now);
      startOsc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
      startGain.gain.setValueAtTime(0.2, now);
      startGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      startOsc.connect(startGain);
      startGain.connect(masterGain);
      startOsc.start(now);
      startOsc.stop(now + 0.2);
      break;
      
    case 'powerup':
      for (let i = 0; i < 3; i++) {
        const oscPow = audioContext.createOscillator();
        const gainPow = audioContext.createGain();
        oscPow.type = 'sine';
        oscPow.frequency.setValueAtTime(400 + i * 200, now + i * 0.05);
        oscPow.frequency.exponentialRampToValueAtTime(800 + i * 200, now + i * 0.05 + 0.1);
        gainPow.gain.setValueAtTime(0.15, now + i * 0.05);
        gainPow.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.15);
        oscPow.connect(gainPow);
        gainPow.connect(reverbNode);
        oscPow.start(now + i * 0.05);
        oscPow.stop(now + i * 0.05 + 0.15);
      }
      break;
      
    case 'danger':
      const dangerOsc = audioContext.createOscillator();
      const dangerGain = audioContext.createGain();
      dangerOsc.type = 'triangle';
      dangerOsc.frequency.setValueAtTime(100, now);
      dangerOsc.frequency.setValueAtTime(120, now + 0.1);
      dangerOsc.frequency.setValueAtTime(100, now + 0.2);
      dangerGain.gain.setValueAtTime(0.2, now);
      dangerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      dangerOsc.connect(dangerGain);
      dangerGain.connect(reverbNode);
      dangerOsc.start(now);
      dangerOsc.stop(now + 0.3);
      break;
  }
}

// ===== BACKGROUND CORRUPTION ANIMATION =====
function animateBackgroundCorruption() {
  if (!bgCtx || !bgCorruptionCanvas) return;
  
  bgCtx.clearRect(0, 0, bgCorruptionCanvas.width, bgCorruptionCanvas.height);
  
  // Glitch lines
  if (Math.random() < 0.05) {
    const numLines = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < numLines; i++) {
      const y = Math.random() * bgCorruptionCanvas.height;
      const height = Math.random() * 50 + 10;
      bgCtx.fillStyle = `rgba(0, 255, 159, ${Math.random() * 0.3})`;
      bgCtx.fillRect(0, y, bgCorruptionCanvas.width, height);
    }
  }
  
  // Random corruption blocks
  if (Math.random() < 0.03) {
    const numBlocks = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numBlocks; i++) {
      const x = Math.random() * bgCorruptionCanvas.width;
      const y = Math.random() * bgCorruptionCanvas.height;
      const size = Math.random() * 100 + 50;
      const color = ['#00ff9f', '#ff0044', '#b000ff'][Math.floor(Math.random() * 3)];
      bgCtx.fillStyle = color + '22';
      bgCtx.fillRect(x, y, size, size);
    }
  }
}

// ===== DRAWING FUNCTIONS =====
function drawGrid() {
  if (!ctx) return;
  
  // Dark grid with subtle variation
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      const isDark = (x + y) % 2 === 0;
      ctx.fillStyle = isDark ? '#020202' : '#050505';
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }
  
  // Grid lines
  ctx.strokeStyle = 'rgba(0, 255, 159, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, ROWS * CELL);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(COLS * CELL, y * CELL);
    ctx.stroke();
  }
}

function drawApple() {
  if (!ctx || !apple) return;
  
  const cx = apple.x * CELL + CELL / 2;
  const cy = apple.y * CELL + CELL / 2;
  const pulse = Math.sin(frameCount * 0.1) * 0.3 + 0.7;
  
  // Outer glow
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL * 1.5);
  gradient.addColorStop(0, `rgba(255, 0, 68, ${0.6 * pulse})`);
  gradient.addColorStop(0.5, `rgba(255, 0, 68, ${0.3 * pulse})`);
  gradient.addColorStop(1, 'rgba(255, 0, 68, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(apple.x * CELL - CELL, apple.y * CELL - CELL, CELL * 3, CELL * 3);
  
  // Core
  ctx.fillStyle = '#ff0044';
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ff0044';
  ctx.beginPath();
  ctx.arc(cx, cy, CELL * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Inner highlight
  ctx.fillStyle = '#ff6688';
  ctx.beginPath();
  ctx.arc(cx - 2, cy - 2, CELL * 0.2, 0, Math.PI * 2);
  ctx.fill();
  
  // Electrical discharge
  if (frameCount % 10 === 0) {
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = CELL * 0.8;
      const ex = cx + Math.cos(angle) * dist;
      const ey = cy + Math.sin(angle) * dist;
      particles.push(new Particle(ex, ey, 0, 0, '#ff0044', 10, 1));
    }
  }
}

function drawSnake() {
  if (!ctx || snake.length === 0) return;
  
  // Draw body segments
  for (let i = snake.length - 1; i >= 0; i--) {
    const segment = snake[i];
    const x = segment.x * CELL;
    const y = segment.y * CELL;
    const isHead = i === 0;
    
    if (isHead) {
      // Head color changes based on power-ups
      let headColor = '#00ff9f';
      if (invincible) headColor = '#ffaa00';
      else if (speedBoost) headColor = '#00b8ff';
      else if (scoreMultiplier > 1) headColor = '#b000ff';
      
      ctx.fillStyle = headColor;
      ctx.shadowBlur = 20;
      ctx.shadowColor = headColor;
      ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
      ctx.shadowBlur = 0;
      
      // Eyes based on direction
      ctx.fillStyle = '#000';
      if (direction.x === 1) { // Right
        ctx.fillRect(x + CELL - 8, y + 4, 3, 3);
        ctx.fillRect(x + CELL - 8, y + CELL - 7, 3, 3);
      } else if (direction.x === -1) { // Left
        ctx.fillRect(x + 5, y + 4, 3, 3);
        ctx.fillRect(x + 5, y + CELL - 7, 3, 3);
      } else if (direction.y === -1) { // Up
        ctx.fillRect(x + 4, y + 5, 3, 3);
        ctx.fillRect(x + CELL - 7, y + 5, 3, 3);
      } else if (direction.y === 1) { // Down
        ctx.fillRect(x + 4, y + CELL - 8, 3, 3);
        ctx.fillRect(x + CELL - 7, y + CELL - 8, 3, 3);
      }
      
      // Spawn trail particles
      spawnCorruptionTrail(x + CELL/2, y + CELL/2);
      
    } else {
      // Body - darker segments with gradient
      const alpha = 0.3 + (i / snake.length) * 0.7;
      const brightness = Math.floor(alpha * 100);
      ctx.fillStyle = `rgb(0, ${brightness}, ${brightness * 0.6})`;
      ctx.fillRect(x + 3, y + 3, CELL - 6, CELL - 6);
      
      // Inner glow
      ctx.strokeStyle = `rgba(0, 255, 159, ${alpha * 0.5})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 3, y + 3, CELL - 6, CELL - 6);
    }
  }
}

function drawScanlines() {
  if (!scanCtx) return;
  
  scanCtx.clearRect(0, 0, 600, 600);
  scanCtx.strokeStyle = 'rgba(0, 255, 159, 0.1)';
  scanCtx.lineWidth = 1;
  
  for (let y = 0; y < 600; y += 4) {
    scanCtx.beginPath();
    scanCtx.moveTo(0, y);
    scanCtx.lineTo(600, y);
    scanCtx.stroke();
  }
}

function updateParticles() {
  if (!fxCtx) return;
  
  fxCtx.clearRect(0, 0, 600, 600);
  
  // Update and draw all particles
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update()) {
      particles.splice(i, 1);
    } else {
      particles[i].draw(fxCtx);
    }
  }
  
  // Update corruption particles
  for (let i = corruptionParticles.length - 1; i >= 0; i--) {
    if (!corruptionParticles[i].update()) {
      corruptionParticles.splice(i, 1);
    } else {
      corruptionParticles[i].draw(fxCtx);
    }
  }
}

function render() {
  if (!ctx) return;
  
  // Clear main canvas
  ctx.clearRect(0, 0, 600, 600);
  
  // Draw everything
  drawGrid();
  drawDangerZones();
  drawApple();
  drawPowerUps();
  drawSnake();
  
  // Update effects
  updateParticles();
  
  frameCount++;
}

// ===== GAME LOGIC =====
function randomPosition() {
  return {
    x: Math.floor(Math.random() * COLS),
    y: Math.floor(Math.random() * ROWS)
  };
}

function placeApple() {
  let position;
  let attempts = 0;
  do {
    position = randomPosition();
    attempts++;
  } while (
    (snake.some(s => s.x === position.x && s.y === position.y) ||
    powerUps.some(p => p.x === position.x && p.y === position.y)) &&
    attempts < 100
  );
  apple = position;
}

function updateDiagnostics() {
  // Neural sync decreases with snake length
  const sync = Math.max(10, 100 - snake.length * 2);
  if (syncBar) syncBar.style.width = sync + '%';
  if (syncVal) syncVal.textContent = sync + '%';
  
  // Corruption increases with snake length
  const corrupt = Math.min(100, snake.length * 2);
  if (corruptBar) corruptBar.style.width = corrupt + '%';
  if (corruptVal) corruptVal.textContent = corrupt + '%';
  
  // Threat level
  const threat = Math.min(100, (snake.length / COLS) * 100);
  if (threatBar) threatBar.style.width = threat + '%';
  if (threatVal) {
    if (threat < 30) threatVal.textContent = 'MINIMAL';
    else if (threat < 60) threatVal.textContent = 'ELEVATED';
    else if (threat < 80) threatVal.textContent = 'CRITICAL';
    else threatVal.textContent = 'MAXIMUM';
  }
}

function updateUI() {
  if (scoreEl) scoreEl.textContent = score;
  if (segmentsEl) segmentsEl.textContent = snake.length;
  updateDiagnostics();
  
  // Update warning text based on active effects
  let warnings = [];
  if (invincible) warnings.push('INVINCIBLE MODE ACTIVE');
  if (speedBoost) warnings.push('NEURAL ACCELERATION');
  if (scoreMultiplier > 1) warnings.push('SCORE MULTIPLIER x' + scoreMultiplier);
  if (dangerZones.length > 0) warnings.push('DANGER ZONES DETECTED');
  
  if (warnTextEl && warnings.length > 0) {
    warnTextEl.textContent = warnings.join(' // ');
  } else if (warnTextEl && running) {
    warnTextEl.textContent = 'BIOMETRIC AUTHENTICATION REQUIRED // LETHAL COUNTERMEASURES ACTIVE';
  }
}

function updateGameSpeed() {
  // Speed increases with score
  const speedIncrease = Math.floor(score / 50);
  currentSpeed = Math.max(MIN_SPEED, BASE_SPEED - speedIncrease * 10);
  
  // Apply speed boost multiplier
  if (speedBoost) {
    currentSpeed = Math.max(MIN_SPEED, currentSpeed * 0.7);
  }
  
  // Update game loop
  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, currentSpeed);
  }
}

function gameStep() {
  if (!running || paused) return;
  
  // Update direction
  direction = nextDirection;
  
  // Calculate new head position
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };
  
  // Wrap around walls
  if (head.x < 0) head.x = COLS - 1;
  if (head.x >= COLS) head.x = 0;
  if (head.y < 0) head.y = ROWS - 1;
  if (head.y >= ROWS) head.y = 0;
  
  // Check danger zone collision
  if (checkDangerZoneCollision(head)) {
    sessionStats.deathsByDangerZone++;
    gameOver();
    return;
  }
  
  // Check self collision (unless invincible)
  if (!invincible && snake.some(s => s.x === head.x && s.y === head.y)) {
    sessionStats.deathsByCollision++;
    gameOver();
    return;
  }
  
  // Add new head
  snake.unshift(head);
  
  // Check apple collision
  if (apple && head.x === apple.x && head.y === apple.y) {
    const points = 10 * scoreMultiplier;
    score += points;
    sessionStats.applesEaten++;
    sessionStats.totalScore += points;
    playSound('eat');
    spawnExplosion(apple.x * CELL + CELL/2, apple.y * CELL + CELL/2, '#ff0044', 40);
    placeApple();
    updateUI();
    updateGameSpeed();
    
    // Milestone notifications
    if (score === 50) {
      showOverlordMessage('milestone50', 'default');
    } else if (score === 100) {
      showOverlordMessage('milestone100', 'default');
    } else if (score === 200) {
      showOverlordMessage('milestone200', 'warning');
    }
    
    if (snake.length > sessionStats.longestSnake) {
      sessionStats.longestSnake = snake.length;
    }
  } else {
    // Remove tail
    snake.pop();
  }
  
  // Check power-up collision
  for (let i = powerUps.length - 1; i >= 0; i--) {
    if (head.x === powerUps[i].x && head.y === powerUps[i].y) {
      collectPowerUp(powerUps[i]);
      powerUps.splice(i, 1);
      updateUI();
    }
  }
  
  // Update power-ups and danger zones
  updatePowerUps();
  updateDangerZones();
  
  render();
}

function gameOver() {
  running = false;
  paused = false;
  
  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = null;
  }
  
  sessionStats.gamesPlayed++;
  
  playSound('death');
  screenShake();
  dangerFlash.classList.add('active');
  setTimeout(() => dangerFlash.classList.remove('active'), 600);
  
  // Show death message
  showOverlordMessage('death', 'critical');
  
  // Spawn massive explosion at head
  if (snake.length > 0) {
    const head = snake[0];
    spawnExplosion(head.x * CELL + CELL/2, head.y * CELL + CELL/2, '#ff0044', 80);
  }
  
  if (sysStatusEl) sysStatusEl.textContent = 'CRITICAL_FAILURE';
  if (warnTextEl) warnTextEl.textContent = 'CONTAINMENT BREACH // NEURAL LINK SEVERED // SYSTEM SHUTDOWN IMMINENT';
  
  // Show game over modal
  setTimeout(() => {
    if (finalScoreEl) finalScoreEl.textContent = score;
    if (gameOverModal) gameOverModal.classList.remove('hidden');
    if (nameInput) nameInput.focus();
  }, 800);
}

function screenShake() {
  if (canvasContainer) {
    canvasContainer.classList.add('shake');
    setTimeout(() => {
      canvasContainer.classList.remove('shake');
    }, 500);
  }
}

function resetGame() {
  snake = [{ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  frameCount = 0;
  currentSpeed = BASE_SPEED;
  particles.length = 0;
  corruptionParticles.length = 0;
  powerUps.length = 0;
  dangerZones.length = 0;
  invincible = false;
  invincibleTimer = 0;
  speedBoost = false;
  speedBoostTimer = 0;
  scoreMultiplier = 1;
  multiplierTimer = 0;
  
  placeApple();
  updateUI();
  render();
  
  if (sysStatusEl) sysStatusEl.textContent = 'ACTIVE';
  if (warnTextEl) warnTextEl.textContent = 'BIOMETRIC AUTHENTICATION REQUIRED // LETHAL COUNTERMEASURES ACTIVE';
}

function startGame() {
  if (running) return;
  
  initAudio();
  playSound('start');
  
  resetGame();
  running = true;
  paused = false;
  
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameStep, currentSpeed);
  
  // Show start message
  setTimeout(() => {
    showOverlordMessage('start', 'warning');
  }, 500);
}

function pauseGame() {
  if (!running) return;
  paused = !paused;
  if (sysStatusEl) sysStatusEl.textContent = paused ? 'SUSPENDED' : 'ACTIVE';
}

// ===== INPUT HANDLING =====
window.addEventListener('keydown', (e) => {
  // Prevent page scroll
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
  
  if (!running) {
    if (e.key === ' ') startGame();
    return;
  }
  
  // Change direction (prevent 180 degree turns)
  if (e.key === 'ArrowUp' && direction.y !== 1) {
    nextDirection = { x: 0, y: -1 };
  } else if (e.key === 'ArrowDown' && direction.y !== -1) {
    nextDirection = { x: 0, y: 1 };
  } else if (e.key === 'ArrowLeft' && direction.x !== 1) {
    nextDirection = { x: -1, y: 0 };
  } else if (e.key === 'ArrowRight' && direction.x !== -1) {
    nextDirection = { x: 1, y: 0 };
  } else if (e.key === ' ') {
    pauseGame();
  }
});

// ===== BUTTON HANDLERS =====
if (startBtn) {
  startBtn.addEventListener('click', startGame);
}

if (pauseBtn) {
  pauseBtn.addEventListener('click', pauseGame);
}

// ===== MODAL HANDLERS =====
if (nameSubmit) {
  nameSubmit.addEventListener('click', async () => {
    const name = (nameInput?.value || '').trim() || 'UNKNOWN';
    await submitScore(name, score);
    if (gameOverModal) gameOverModal.classList.add('hidden');
    await loadLeaderboard();
  });
}

if (nameCancel) {
  nameCancel.addEventListener('click', () => {
    if (gameOverModal) gameOverModal.classList.add('hidden');
  });
}

if (nameInput) {
  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      nameSubmit?.click();
    }
  });
}

// ===== API FUNCTIONS =====
const LEADERBOARD_STORAGE_KEY = 'neural_serpent_leaderboard';
const LEADERBOARD_MAX_ENTRIES = 20;

function getStoredScores() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(entry => entry && typeof entry.name === 'string' && typeof entry.score === 'number')
      .sort((a, b) => b.score - a.score);
  } catch (err) {
    console.error('Failed to read stored scores:', err);
    return [];
  }
}

function saveStoredScores(scores) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(scores));
  } catch (err) {
    console.error('Failed to save scores:', err);
  }
}

async function submitScore(name, scoreValue) {
  try {
    const scores = getStoredScores();
    scores.push({ name, score: scoreValue });
    scores.sort((a, b) => b.score - a.score);
    const trimmed = scores.slice(0, LEADERBOARD_MAX_ENTRIES);
    saveStoredScores(trimmed);
  } catch (err) {
    console.error('Failed to submit score:', err);
  }
}

async function loadLeaderboard() {
  try {
    const scores = getStoredScores();

    if (!leaderboardContainer) return;

    if (!scores.length) {
      leaderboardContainer.innerHTML = '<div class="loading-text">NO DATA AVAILABLE</div>';
      bestScore = 0;
      if (bestEl) bestEl.textContent = bestScore;
      return;
    }

    // Find best score
    bestScore = Math.max(...scores.map(s => s.score), 0);
    if (bestEl) bestEl.textContent = bestScore;

    // Build leaderboard HTML
    let html = '';
    scores.slice(0, 10).forEach((entry, index) => {
      html += `
        <div class="leaderboard-entry">
          <span class="entry-rank">#${index + 1}</span>
          <span class="entry-name">${entry.name}</span>
          <span class="entry-score">${entry.score}</span>
        </div>
      `;
    });

    leaderboardContainer.innerHTML = html;
  } catch (err) {
    console.error('Failed to load leaderboard:', err);
    if (leaderboardContainer) {
      leaderboardContainer.innerHTML = '<div class="loading-text">CONNECTION LOST</div>';
    }
  }
}

// ===== MAIN ANIMATION LOOP =====
function animationLoop() {
  // Always update particles
  if (!paused) {
    updateParticles();
    animateBackgroundCorruption();
  }
  requestAnimationFrame(animationLoop);
}

// ===== ANALYTICS DISPLAY (Console) =====
function logSessionStats() {
  console.log('=== SESSION ANALYTICS ===');
  console.log(`Games Played: ${sessionStats.gamesPlayed}`);
  console.log(`Total Score: ${sessionStats.totalScore}`);
  console.log(`Apples Eaten: ${sessionStats.applesEaten}`);
  console.log(`Power-ups Collected: ${sessionStats.powerUpsCollected}`);
  console.log(`Deaths by Collision: ${sessionStats.deathsByCollision}`);
  console.log(`Deaths by Danger Zone: ${sessionStats.deathsByDangerZone}`);
  console.log(`Longest Snake: ${sessionStats.longestSnake}`);
  console.log(`Session Duration: ${Math.floor((Date.now() - sessionStats.sessionStartTime) / 1000)}s`);
}

// Log stats every 30 seconds
setInterval(logSessionStats, 30000);

// ===== INITIALIZATION =====
// Initial render
resetGame();
loadLeaderboard();
animationLoop();
