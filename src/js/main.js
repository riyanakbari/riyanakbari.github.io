import '../css/style.css'

class MouseTrail {
  constructor() {
    this.canvas = document.getElementById('trail-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.points = [];
    this.mouse = { x: 0, y: 0, active: false };
    this.lastMouse = { x: 0, y: 0 };
    
    // Spotlight variables for a large, soft ambient glow
    this.spotlight = { x: 0, y: 0, active: false, radius: 260 };
    
    this.resizeCanvas();
    this.bindEvents();
    this.animate();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth * window.devicePixelRatio;
    this.canvas.height = window.innerHeight * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());

    const onMove = (clientX, clientY) => {
      if (!this.mouse.active) {
        this.mouse.active = true;
        this.lastMouse.x = clientX;
        this.lastMouse.y = clientY;
        this.spotlight.x = clientX;
        this.spotlight.y = clientY;
        this.spotlight.active = true;
      }
      this.mouse.x = clientX;
      this.mouse.y = clientY;
      this.spotlight.active = true;

      this.spawnTrailPoints();
    };

    window.addEventListener('mousemove', (e) => {
      onMove(e.clientX, e.clientY);
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.active = false;
      this.spotlight.active = false;
    });

    // Touch support for mobile devices
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        onMove(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.active = false;
      this.spotlight.active = false;
    });
  }

  spawnTrailPoints() {
    const dx = this.mouse.x - this.lastMouse.x;
    const dy = this.mouse.y - this.lastMouse.y;
    const distance = Math.hypot(dx, dy);
    
    // Spawns points close together (every 3px) for absolute continuity
    const step = 3;
    const steps = Math.max(1, Math.floor(distance / step));

    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const x = this.lastMouse.x + dx * t;
      const y = this.lastMouse.y + dy * t;
      
      this.points.push({
        x: x,
        y: y,
        size: 30, // Starting size of the soft trail glow
        alpha: 1.0,
        decay: 0.04 // Fades quickly for a clean, short trailing ribbon
      });
    }

    this.lastMouse.x = this.mouse.x;
    this.lastMouse.y = this.mouse.y;
  }

  animate() {
    // Clear canvas
    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;
    this.ctx.clearRect(0, 0, width, height);

    // 1. Draw large spotlight glow that reveals the grid (radius ~350px)
    if (this.spotlight.active) {
      // Lerp spotlight for smooth lagging motion behind cursor
      this.spotlight.x += (this.mouse.x - this.spotlight.x) * 0.12;
      this.spotlight.y += (this.mouse.y - this.spotlight.y) * 0.12;

      this.ctx.beginPath();
      const spotlightGlow = this.ctx.createRadialGradient(
        this.spotlight.x, this.spotlight.y, 0,
        this.spotlight.x, this.spotlight.y, this.spotlight.radius
      );
      
      // Extremely soft white ambient glow that reveals the white grid lines
      spotlightGlow.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      spotlightGlow.addColorStop(0.3, 'rgba(255, 255, 255, 0.07)');
      spotlightGlow.addColorStop(0.7, 'rgba(255, 255, 255, 0.02)');
      spotlightGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      this.ctx.fillStyle = spotlightGlow;
      this.ctx.arc(this.spotlight.x, this.spotlight.y, this.spotlight.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 2. Draw the smooth drift-free trail ribbon
    for (let i = this.points.length - 1; i >= 0; i--) {
      const p = this.points[i];
      
      // Fade and shrink in place (no random movement to prevent particle spray look)
      p.alpha -= p.decay;
      p.size -= p.decay * 30; // Shrinks to 0 just as alpha hits 0

      if (p.alpha <= 0 || p.size <= 0) {
        this.points.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${p.alpha * 0.14})`);
      gradient.addColorStop(0.4, `rgba(255, 255, 255, ${p.alpha * 0.05})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    requestAnimationFrame(() => this.animate());
  }
}

class CustomCursor {
  constructor() {
    this.dot = document.getElementById('custom-cursor-dot');
    this.ring = document.getElementById('custom-cursor-ring');
    if (!this.dot || !this.ring) return;

    this.mouse = { x: -100, y: -100 };
    this.ringPos = { x: -100, y: -100 };
    this.active = false;

    this.bindEvents();
    this.animate();
  }

  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      if (!this.active) {
        this.active = true;
        this.dot.style.opacity = '1';
        this.ring.style.opacity = '1';
      }
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
      this.active = false;
      this.dot.style.opacity = '0';
      this.ring.style.opacity = '0';
    });

    // Event delegation to capture hovered interactive elements dynamically
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('a, button, [role="button"], .group, input, select, textarea');
      if (target) {
        this.ring.classList.add('hovered');
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('a, button, [role="button"], .group, input, select, textarea');
      if (target) {
        this.ring.classList.remove('hovered');
      }
    });
  }

  animate() {
    // Keep dot locked to cursor tip
    this.dot.style.left = `${this.mouse.x}px`;
    this.dot.style.top = `${this.mouse.y}px`;

    // Lerp ring position for trailing inertia effect
    this.ringPos.x += (this.mouse.x - this.ringPos.x) * 0.18;
    this.ringPos.y += (this.mouse.y - this.ringPos.y) * 0.18;

    this.ring.style.left = `${this.ringPos.x}px`;
    this.ring.style.top = `${this.ringPos.y}px`;

    requestAnimationFrame(() => this.animate());
  }
}

// Initialize components on DOM load
const init = () => {
  new MouseTrail();
  new CustomCursor();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
