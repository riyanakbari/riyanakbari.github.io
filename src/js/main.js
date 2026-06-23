import '../css/style.css'
import Lenis from 'lenis'

class MouseTrail {
  constructor() {
    this.canvas = document.getElementById('trail-canvas');
    if (!this.canvas) return;

    // Disable mouse trail on tablet and below (screen width < 1024px)
    if (window.innerWidth < 1024) {
      this.canvas.style.display = 'none';
      return;
    }

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

class MarqueeScroll {
  constructor() {
    this.track = document.getElementById('marquee-track');
    if (!this.track) return;

    this.splitText();

    this.position = 0;
    this.baseSpeed = 0.5;    // px/frame baseline (slow auto-scroll)
    this.velocity = 0;        // extra speed added by scroll
    this.lastScrollY = window.scrollY;

    // Listen to scroll events to boost marquee speed
    window.addEventListener('scroll', () => {
      const currentY = window.scrollY;
      const delta = currentY - this.lastScrollY;
      this.velocity += delta * 0.4; // how aggressively scroll boosts speed
      this.lastScrollY = currentY;
    }, { passive: true });

    this.animate();
  }

  splitText() {
    const textElements = this.track.querySelectorAll('.marquee-text');
    textElements.forEach((el) => {
      const text = el.textContent;
      el.textContent = '';
      let charIndex = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const span = document.createElement('span');
        if (char === ' ') {
          span.innerHTML = '&nbsp;';
          span.className = 'marquee-space';
        } else {
          span.textContent = char;
          span.className = 'marquee-char';
          span.style.animationDelay = `${charIndex * 0.08}s`;
          charIndex++;
        }
        el.appendChild(span);
      }
    });
  }

  animate() {
    // Decay scroll velocity toward 0
    this.velocity *= 0.6;

    // Advance position
    this.position += this.baseSpeed + this.velocity;

    // Ensure forward direction only (no reverse on scroll up)
    if (this.position < 0) this.position = 0;

    // Seamless loop: reset at 1/4 of total (4 identical copies)
    const loopWidth = this.track.scrollWidth / 2;
    if (loopWidth > 0 && this.position >= loopWidth) {
      this.position -= loopWidth;
    }

    this.track.style.transform = `translateX(-${this.position}px)`;
    requestAnimationFrame(() => this.animate());
  }
}

class NavHighlighter {
  constructor() {
    this.links = document.querySelectorAll('.nav-link[data-section]');
    this.sections = [];

    // Collect only sections that actually exist in the DOM
    this.links.forEach(link => {
      const id = link.dataset.section;
      const el = document.getElementById(id);
      if (el) this.sections.push({ id, el });
    });

    if (this.sections.length === 0) return;

    this.setActive('home'); // default

    // Observer: trigger when a section crosses 40% from the top of the viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.setActive(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-40% 0px -55% 0px', // fires when section hits the middle band of viewport
        threshold: 0,
      }
    );

    this.sections.forEach(({ el }) => observer.observe(el));
  }

  setActive(id) {
    this.links.forEach(link => {
      const isActive = link.dataset.section === id;
      link.classList.toggle('text-white', isActive);
      link.classList.toggle('text-neutral-400', !isActive);
    });
  }
}

class ScrollTextReveal {
  constructor() {
    this.el = document.getElementById('about-scroll-text');
    if (!this.el) return;

    this.chars = [];
    this.splitText();
    this.onScroll(); // initial state
  }

  splitText() {
    const text = this.el.textContent.trim();
    this.el.textContent = '';

    const words = text.split(/\s+/);

    words.forEach((word, wordIndex) => {
      // Wrap each word in a .word span so line breaks happen between words
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word inline-block whitespace-nowrap';

      for (const char of word) {
        const charSpan = document.createElement('span');
        charSpan.className = 'char inline text-white/15 transition-colors duration-300';
        charSpan.textContent = char;
        wordSpan.appendChild(charSpan);
        this.chars.push(charSpan);
      }

      this.el.appendChild(wordSpan);

      // Add a plain space text node between words (allows natural line wrapping)
      if (wordIndex < words.length - 1) {
        this.el.appendChild(document.createTextNode(' '));
      }
    });
  }

  onScroll() {
    const section = document.getElementById('about');
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const windowH = window.innerHeight;

    // Start reveal when section enters from bottom (60% mark)
    // Complete reveal when section is slightly past (bottom just leaving top of viewport)
    const start = rect.top - windowH * 0.60;
    const end = rect.bottom - windowH * 1;
    const raw = -start / (end - start);
    const progress = Math.min(1, Math.max(0, raw));

    const totalChars = this.chars.length;
    const revealCount = Math.floor(progress * totalChars);

    this.chars.forEach((span, i) => {
      if (i < revealCount) {
        span.classList.add('text-white');
        span.classList.remove('text-white/15');
      } else {
        span.classList.remove('text-white');
        span.classList.add('text-white/15');
      }
    });
  }
}

class SmoothScroll {
  constructor(onScrollCb) {
    this.lenis = new Lenis({
      lerp: 0.12,
      smoothTouch: false,
      touchMultiplier: 1.5,
    });

    this.onScrollCb = onScrollCb;

    // Fire scroll callback on every Lenis tick
    this.lenis.on('scroll', () => {
      if (this.onScrollCb) this.onScrollCb();
    });

    this.raf(0);
  }

  raf(time) {
    this.lenis.raf(time);
    requestAnimationFrame((t) => this.raf(t));
  }
}

class AOSManager {
  constructor() {
    this.elements = document.querySelectorAll('.aos-init');
    if (this.elements.length === 0) return;

    this.init();
  }

  init() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = el.dataset.aosDelay;
            const duration = el.dataset.aosDuration;

            if (delay) {
              el.style.transitionDelay = `${delay}ms`;
            }
            if (duration) {
              el.style.transitionDuration = `${duration}ms`;
            }

            el.classList.add('aos-animate');
            observer.unobserve(el);

            // Clean up AOS classes and transitions after the animation is finished
            // to avoid rendering and composting side-effects (e.g. Safari backdrop-filter breakdown)
            const onTransitionEnd = (e) => {
              if (e.propertyName === 'transform' || e.propertyName === 'opacity') {
                el.classList.remove('aos-init', 'aos-animate');
                el.style.transitionDelay = '';
                el.style.transitionDuration = '';
                el.removeEventListener('transitionend', onTransitionEnd);
              }
            };
            el.addEventListener('transitionend', onTransitionEnd);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    this.elements.forEach((el) => observer.observe(el));
  }
}

// Configurable Projects Data Array
const PROJECTS_DATA = [
  {
    year: '2026',
    title: 'GREW',
    description: 'A sports community platform designed to help users find playing partners, join matches, book venues, and coordinate games through a seamless and user-centered experience. Developed as an academic UI/UX project.',
    image: '/images/grew.webp',
    tags: ['Academic Project', 'Mobile App', 'Sports Community'],
    link: '#',
    accentIcon: `<svg class="w-4 h-4 sm:w-5 h-5 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"
                  stroke-linejoin="round">
                  <line x1="17" y1="7" x2="7" y2="17"></line>
                  <polyline points="17 17 7 17 7 7"></polyline>
                </svg>`
  },
  {
    year: '2025',
    title: 'Student Service Center',
    description: 'A web-based administrative service platform developed for Telkom University Surabaya. SSC centralizes various student services into a single access point, making administrative processes more efficient, transparent, and accessible for students.',
    image: '/images/ssc.webp',
    tags: ['Institutional Project', 'Web Platform', 'Student Services'],
    link: 'https://ssc.telu-sby.id/',
    accentIcon: `<svg class="w-4 h-4 sm:w-5 h-5 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"
                  stroke-linejoin="round">
                  <line x1="17" y1="7" x2="7" y2="17"></line>
                  <polyline points="17 17 7 17 7 7"></polyline>
                </svg>`
  }
];

// Stacking Cards Scroll Animation Class
class WorkCardsScroll {
  constructor() {
    this.container = document.getElementById('work-cards-container');
    if (!this.container) return;

    this.renderCards();
    this.cards = Array.from(this.container.querySelectorAll('.work-card-wrapper'));
    this.onScroll(); // Set initial scale & opacity
  }

  renderCards() {
    this.container.innerHTML = PROJECTS_DATA.map((proj, idx) => {
      const isFirst = idx === 0;
      const aosClass = isFirst ? 'aos-init' : '';
      const aosAttrs = isFirst ? 'data-aos="fade-up" data-aos-delay="400" data-aos-duration="1000"' : '';

      return `
        <div class="work-card-wrapper sticky top-20 w-full pb-6 lg:top-[max(100px,calc((100vh-700px)/2))] lg:pb-10 ${aosClass}" ${aosAttrs} style="z-index: 10;">
          <div class="work-card group/card grid grid-cols-1 gap-6 w-full min-h-auto lg:grid-cols-[1.25fr_1fr] lg:gap-10 lg:items-stretch">
            <!-- Left side: image -->
            <div class="work-card-image-box group/img relative w-full h-[280px] sm:h-[380px] lg:h-auto lg:min-h-[520px] rounded-[24px] overflow-hidden border border-white/[0.05] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <img class="work-card-img w-full h-full object-cover transition-transform duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/img:scale-[1.04]" src="${proj.image}" alt="${proj.title}" loading="lazy" />
            </div>
            <!-- Right side: details card -->
            <div class="work-card-details glass-card bg-white/20 backdrop-blur-[20px] glass-card-hover group/details relative rounded-[24px] py-8 px-6 sm:py-10 sm:px-9 flex flex-col justify-between gap-8 z-10">
              <div>
                <div class="work-card-year font-sans text-sm font-medium text-white/40 tracking-wider">(${proj.year})</div>
                <h3 class="work-card-title font-['Plus_Jakarta_Sans',sans-serif] text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold text-white leading-[1.1] tracking-[-0.02em] mt-2">${proj.title}</h3>
                <p class="work-card-desc font-sans text-[0.9375rem] leading-[1.65] text-white/45 font-light mt-4">${proj.description}</p>
              </div>
              <div class="work-card-tags-list flex flex-col w-full">
                ${proj.tags.map(tag => `
                  <div class="work-card-tag-item font-sans text-sm text-white/50 py-3 border-t border-white/[0.05] flex items-center justify-between transition-colors duration-300 hover:text-white/90">
                    <span>${tag}</span>
                  </div>
                `).join('')}
              </div>
              <a href="${proj.link}" class="work-card-accent-btn absolute bottom-6 right-6 sm:bottom-9 sm:right-9 w-9 h-9 sm:w-[42px] sm:h-[42px] rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white hover:text-black hover:border-white hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]" aria-label="View ${proj.title}">
                ${proj.accentIcon}
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  onScroll() {
    const totalCards = this.cards.length;
    if (totalCards === 0) return;

    this.cards.forEach((card, i) => {
      // The last card stays flat and opaque
      if (i === totalCards - 1) return;

      // Get calculated sticky position dynamically from CSS
      const stickyTop = parseFloat(window.getComputedStyle(card).top) || 80;

      const nextCard = this.cards[i + 1];
      const nextCardRect = nextCard.getBoundingClientRect();
      const nextCardTop = nextCardRect.top;
      const nextCardHeight = nextCardRect.height || 500;

      // Overlap range is between next card hitting bottom of current card (stickyTop + height)
      // and next card hitting top sticky position (stickyTop)
      const startThreshold = stickyTop + nextCardHeight;
      const endThreshold = stickyTop;

      const progress = Math.min(
        1,
        Math.max(0, (startThreshold - nextCardTop) / (startThreshold - endThreshold))
      );

      // Fade out completely, scale down to 0.94
      const scale = 1 - progress * 0.06;
      const opacity = 1 - progress;

      // Find the image box and details box inside the card
      const imageBox = card.querySelector('.work-card-image-box');
      const detailsBox = card.querySelector('.work-card-details');

      if (progress === 0) {
        // Clear styles when active to restore pristine backdrop-filter rendering
        if (imageBox) {
          imageBox.style.transform = '';
          imageBox.style.opacity = '';
          imageBox.style.transformOrigin = '';
          imageBox.style.transition = '';
        }
        if (detailsBox) {
          detailsBox.style.transform = '';
          detailsBox.style.opacity = '';
          detailsBox.style.transformOrigin = '';
          detailsBox.style.transition = '';
          detailsBox.style.backgroundColor = '';
          detailsBox.style.borderColor = '';
          detailsBox.style.backdropFilter = '';
          detailsBox.style.webkitBackdropFilter = '';

          // Reset children opacity
          const children = detailsBox.children;
          for (let c = 0; c < children.length; c++) {
            children[c].style.opacity = '';
            children[c].style.transition = '';
          }
        }
      } else {
        // Apply transform and opacity ONLY to the image box to prevent Safari backdrop-filter breakdown on details box!
        if (imageBox) {
          imageBox.style.transform = `scale(${scale})`;
          imageBox.style.opacity = opacity;
          imageBox.style.transformOrigin = 'center top';
          imageBox.style.transition = 'transform 0.1s ease-out, opacity 0.1s ease-out';
        }

        // The details box with glassmorphism stays clean of transform/opacity to keep the backdrop-filter active!
        // Instead, we dynamically fade out its background color, border color, blur filters, and children!
        if (detailsBox) {
          detailsBox.style.transform = '';
          detailsBox.style.opacity = '';
          detailsBox.style.transformOrigin = '';
          detailsBox.style.transition = '';

          detailsBox.style.backgroundColor = `rgba(255, 255, 255, ${0.02 * opacity})`;
          detailsBox.style.borderColor = `rgba(255, 255, 255, ${0.08 * opacity})`;
          detailsBox.style.backdropFilter = `blur(${12 * opacity}px)`;
          detailsBox.style.webkitBackdropFilter = `blur(${12 * opacity}px)`;

          // Fade direct children (excluding absolute buttons if hovered, or just fade all for uniform look)
          const children = detailsBox.children;
          for (let c = 0; c < children.length; c++) {
            children[c].style.opacity = opacity;
            children[c].style.transition = 'opacity 0.1s ease-out';
          }
        }
      }

      // Hide parent container when fully faded out to prevent pointer events overlapping
      const cardInner = card.querySelector('.work-card');
      if (cardInner) {
        if (opacity <= 0.02) {
          cardInner.style.visibility = 'hidden';
          cardInner.style.pointerEvents = 'none';
        } else {
          cardInner.style.visibility = 'visible';
          cardInner.style.pointerEvents = 'auto';
        }
      }
    });
  }
}

// Initialize components on DOM load
const init = () => {
  new MouseTrail();
  new CustomCursor();
  new MarqueeScroll();
  new NavHighlighter();

  const textReveal = new ScrollTextReveal();
  const workCards = new WorkCardsScroll();
  new AOSManager(); // Instantiated after workCards renders its elements in the DOM

  new SmoothScroll(() => {
    textReveal.onScroll();
    workCards.onScroll();
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
