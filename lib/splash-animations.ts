/**
 * Animated Splash Screen Presets
 * 
 * Pre-designed animated splash screens with CSS/JS animations
 */

export type SplashAnimation = {
  id: string;
  name: string;
  description: string;
  category: 'minimal' | 'dynamic' | 'creative' | 'professional';
  preview: string; // Emoji/Icon preview
  html: string;
  css?: string;
};

export const SPLASH_ANIMATIONS: SplashAnimation[] = [
  {
    id: 'pulse-circle',
    name: 'Pulse Circle',
    description: 'Simple pulsing circle animation',
    category: 'minimal',
    preview: '⚫',
    html: `
<div class="splash-container">
  <div class="pulse-circle"></div>
  <h1 class="splash-title">Redirecting...</h1>
  <p class="splash-subtitle">Please wait a moment</p>
</div>

<style>
.splash-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.pulse-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: white;
  animation: pulse 2s ease-in-out infinite;
  margin-bottom: 2rem;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

.splash-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  animation: fadeIn 0.8s ease-in;
}

.splash-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  animation: fadeIn 1.2s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
`,
  },

  {
    id: 'rotating-squares',
    name: 'Rotating Squares',
    description: 'Modern rotating geometric shapes',
    category: 'dynamic',
    preview: '🔲',
    html: `
<div class="splash-container">
  <div class="rotating-squares">
    <div class="square"></div>
    <div class="square"></div>
    <div class="square"></div>
  </div>
  <h1 class="splash-title">Loading...</h1>
</div>

<style>
.splash-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #1a1a2e;
  color: white;
}

.rotating-squares {
  position: relative;
  width: 100px;
  height: 100px;
  margin-bottom: 2rem;
}

.square {
  position: absolute;
  width: 40px;
  height: 40px;
  border: 4px solid #4ecca3;
  animation: rotate 2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
}

.square:nth-child(2) {
  animation-delay: 0.3s;
  border-color: #f56e8a;
}

.square:nth-child(3) {
  animation-delay: 0.6s;
  border-color: #ffd93d;
}

@keyframes rotate {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
}

.splash-title {
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { text-shadow: 0 0 10px rgba(78, 204, 163, 0.5); }
  50% { text-shadow: 0 0 20px rgba(78, 204, 163, 0.8), 0 0 30px rgba(78, 204, 163, 0.6); }
}
</style>
`,
  },

  {
    id: 'bouncing-dots',
    name: 'Bouncing Dots',
    description: 'Playful bouncing dots loader',
    category: 'minimal',
    preview: '⚪',
    html: `
<div class="splash-container">
  <div class="bouncing-dots">
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
  </div>
  <h1 class="splash-title">Just a second...</h1>
</div>

<style>
.splash-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f7f7f7;
}

.bouncing-dots {
  display: flex;
  gap: 12px;
  margin-bottom: 2rem;
}

.dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #6366f1;
  animation: bounce 1.4s ease-in-out infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
  background: #8b5cf6;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
  background: #ec4899;
}

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-30px); }
}

.splash-title {
  font-size: 1.8rem;
  font-weight: 500;
  color: #1f2937;
}
</style>
`,
  },

  {
    id: 'gradient-wave',
    name: 'Gradient Wave',
    description: 'Smooth gradient wave animation',
    category: 'creative',
    preview: '🌊',
    html: `
<div class="splash-container">
  <div class="wave-container">
    <div class="wave"></div>
    <div class="wave"></div>
    <div class="wave"></div>
  </div>
  <h1 class="splash-title">Taking you there</h1>
  <div class="progress-bar">
    <div class="progress-fill"></div>
  </div>
</div>

<style>
.splash-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(45deg, #4158D0, #C850C0, #FFCC70);
  background-size: 400% 400%;
  animation: gradientShift 8s ease infinite;
  color: white;
  overflow: hidden;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.wave-container {
  position: relative;
  width: 200px;
  height: 100px;
  margin-bottom: 2rem;
}

.wave {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: wave 3s ease-in-out infinite;
}

.wave:nth-child(2) {
  animation-delay: 1s;
}

.wave:nth-child(3) {
  animation-delay: 2s;
}

@keyframes wave {
  0%, 100% { transform: scale(0); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

.splash-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-shadow: 2px 2px 10px rgba(0,0,0,0.3);
}

.progress-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  animation: progress 3s ease-in-out infinite;
}

@keyframes progress {
  0% { width: 0%; }
  100% { width: 100%; }
}
</style>
`,
  },

  {
    id: 'rocket-launch',
    name: 'Rocket Launch',
    description: 'Fun rocket launching animation',
    category: 'creative',
    preview: '🚀',
    html: `
<div class="splash-container">
  <div class="rocket">🚀</div>
  <h1 class="splash-title">Launching...</h1>
  <p class="splash-subtitle">Prepare for takeoff!</p>
</div>

<style>
.splash-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.splash-container::before {
  content: '⭐';
  position: absolute;
  font-size: 2rem;
  animation: twinkle 2s ease-in-out infinite;
  top: 10%;
  left: 20%;
}

.splash-container::after {
  content: '⭐';
  position: absolute;
  font-size: 1.5rem;
  animation: twinkle 3s ease-in-out infinite;
  top: 30%;
  right: 15%;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.rocket {
  font-size: 5rem;
  animation: launch 3s ease-in-out infinite;
  margin-bottom: 2rem;
}

@keyframes launch {
  0%, 100% { transform: translateY(0) rotate(-45deg); }
  50% { transform: translateY(-50px) rotate(-45deg); }
}

.splash-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  animation: slideUp 1s ease-out;
}

.splash-subtitle {
  font-size: 1.2rem;
  opacity: 0.8;
  animation: slideUp 1.2s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
`,
  },

  {
    id: 'typing-text',
    name: 'Typing Effect',
    description: 'Typewriter text animation',
    category: 'professional',
    preview: '⌨️',
    html: `
<div class="splash-container">
  <h1 class="typing-text" id="typingText"></h1>
  <div class="cursor"></div>
</div>

<script>
const text = "Redirecting to your destination...";
let index = 0;

function typeWriter() {
  if (index < text.length) {
    document.getElementById('typingText').innerHTML += text.charAt(index);
    index++;
    setTimeout(typeWriter, 100);
  }
}

setTimeout(typeWriter, 500);
</script>

<style>
.splash-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #0a0a0a;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  position: relative;
}

.typing-text {
  font-size: 2rem;
  font-weight: 400;
  letter-spacing: 0.05em;
}

.cursor {
  display: inline-block;
  width: 3px;
  height: 2rem;
  background: #00ff00;
  margin-left: 5px;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}
</style>
`,
  },

  {
    id: 'particle-explosion',
    name: 'Particle Explosion',
    description: 'Dynamic particle burst effect',
    category: 'creative',
    preview: '💥',
    html: `
<div class="splash-container">
  <div class="particles">
    ${Array(20).fill(0).map((_, i) => `<div class="particle" style="--i: ${i}"></div>`).join('')}
  </div>
  <h1 class="splash-title">Get Ready!</h1>
</div>

<style>
.splash-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #000;
  color: white;
  position: relative;
  overflow: hidden;
}

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: hsl(calc(var(--i) * 18), 100%, 50%);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  animation: explode 2s ease-out infinite;
  animation-delay: calc(var(--i) * 0.1s);
}

@keyframes explode {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc((var(--i) - 10) * 30px),
      calc(sin(var(--i)) * 200px)
    ) scale(0);
    opacity: 0;
  }
}

.splash-title {
  font-size: 3.5rem;
  font-weight: 900;
  z-index: 10;
  animation: zoomIn 1s ease-out;
  text-shadow: 0 0 20px rgba(255,255,255,0.5);
}

@keyframes zoomIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
`,
  },

  {
    id: 'flip-cards',
    name: 'Flip Cards',
    description: 'Cards flipping reveal animation',
    category: 'professional',
    preview: '🎴',
    html: `
<div class="splash-container">
  <div class="cards">
    <div class="card">L</div>
    <div class="card">O</div>
    <div class="card">A</div>
    <div class="card">D</div>
    <div class="card">I</div>
    <div class="card">N</div>
    <div class="card">G</div>
  </div>
</div>

<style>
.splash-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #2c3e50;
}

.cards {
  display: flex;
  gap: 10px;
}

.card {
  width: 60px;
  height: 80px;
  background: linear-gradient(145deg, #3498db, #2980b9);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: white;
  animation: flip 2s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * 0.2s);
}

.card:nth-child(1) { --i: 0; }
.card:nth-child(2) { --i: 1; }
.card:nth-child(3) { --i: 2; }
.card:nth-child(4) { --i: 3; }
.card:nth-child(5) { --i: 4; }
.card:nth-child(6) { --i: 5; }
.card:nth-child(7) { --i: 6; }

@keyframes flip {
  0%, 100% { transform: rotateY(0deg); }
  50% { transform: rotateY(180deg); }
}
</style>
`,
  },
];

/**
 * Get animations by category
 */
export function getAnimationsByCategory(category: SplashAnimation['category']) {
  return SPLASH_ANIMATIONS.filter(anim => anim.category === category);
}

/**
 * Get animation by ID
 */
export function getAnimationById(id: string) {
  return SPLASH_ANIMATIONS.find(anim => anim.id === id);
}

/**
 * Animation categories
 */
export const ANIMATION_CATEGORIES = [
  { value: 'minimal', label: 'Minimal', description: 'Clean and simple' },
  { value: 'dynamic', label: 'Dynamic', description: 'Moving and energetic' },
  { value: 'creative', label: 'Creative', description: 'Fun and playful' },
  { value: 'professional', label: 'Professional', description: 'Business-appropriate' },
] as const;

