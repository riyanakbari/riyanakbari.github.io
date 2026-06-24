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
  },
  {
    year: '2025',
    title: 'Nuvelo',
    description: 'A gaming top-up platform created to deliver a fast and frictionless purchasing experience. Through intuitive navigation and streamlined user flows, Nuvelo makes accessing digital gaming products simple and convenient.',
    image: '/images/nuvelo.webp',
    tags: ['Freelance Project', 'Web Platform', 'Gaming Commerce'],
    link: 'https://nuvelo.id/',
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
          detailsBox.style.transform = `scale(${scale})`;
          detailsBox.style.opacity = opacity;
          detailsBox.style.transformOrigin = 'center top';
          detailsBox.style.transition = 'transform 0.1s ease-out, opacity 0.1s ease-out';

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

// Configurable Experience Data Array
const EXPERIENCE_DATA = [
  {
    position: 'UI/UX Designer',
    company: 'Pikar Labs',
    duration: 'Dec 2025 - Present',
    location: 'Remote'
  },
  {
    position: 'Graphic Designer',
    company: 'Telkom University Surabaya',
    duration: 'May 2023 - Present',
    location: 'Surabaya'
  },
  {
    position: 'UI/UX Designer Intern',
    company: 'Aptikma Teknologi Indonesia',
    duration: 'Jun 2025 - Aug 2025',
    location: 'Malang'
  },
  {
    position: 'Graphic Designer',
    company: '151 COFFEE',
    duration: 'Dec 2021 - Aug 2023',
    location: 'Remote'
  },
  {
    position: 'Graphic Designer Intern',
    company: 'Restu Guru Promosindo',
    duration: 'Jan 2021 - May 2021',
    location: 'Banjarbaru'
  }
];

// Configurable Skills Badges Data Array
const SKILLS_ROW_1 = [
  { name: 'Graphic Design', iconName: 'mdi:monitor', icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>' },
  { name: 'UI Design', iconName: 'mdi:view-grid', icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/></svg>' },
  { name: 'UX Design', iconName: 'mdi:account-circle', icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="3"/></svg>' },
  { name: 'Prototyping', iconName: 'mdi:layers', icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>' },
  { name: 'Wireframing', iconName: 'mdi:grid', icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
  { name: 'User Research', iconName: 'mdi:magnify', icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' },
  { name: 'Design Systems', iconName: 'mdi:cube', icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>' },
  { name: 'Interaction Design', iconName: 'mdi:gesture-tap', icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
  { name: 'Visual Design', iconName: 'mdi:palette', icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' },
];

const SKILLS_ROW_2 = [
  { name: 'Figma', iconName: 'simple-icons:figma' },
  { name: 'Photoshop', iconName: 'simple-icons:adobephotoshop' },
  { name: 'Illustrator', iconName: 'simple-icons:adobeillustrator' },
  { name: 'Premiere Pro', iconName: 'simple-icons:adobepremierepro' },
  { name: 'After Effects', iconName: 'simple-icons:adobeaftereffects' },
  { name: 'Notion', iconName: 'simple-icons:notion' },
  { name: 'Blender', iconName: 'simple-icons:blender' },
];

// Experience Cards Renderer Class
class ExperienceRenderer {
  constructor() {
    this.container = document.getElementById('experience-container');
    if (!this.container) return;
    this.renderExperience();
  }

  renderExperience() {
    this.container.innerHTML = EXPERIENCE_DATA.map((exp, idx) => {
      const delay = 200 + idx * 100;
      return `
        <div class="group relative py-6 xl:py-8 border-b border-white/[0.05] transition-all duration-500 hover:border-white/20 aos-init" data-aos="fade-up" data-aos-delay="${delay}">
          
          <!-- Mobile/Tablet/Laptop Layout: 2 columns (Position+Company left, Duration+Location right) -->
          <div class="flex justify-between items-start gap-4 xl:hidden">
            <!-- Left Column: Position + Company -->
            <div class="flex flex-col gap-2 flex-1">
              <h3 class="font-['Plus_Jakarta_Sans',sans-serif] text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white leading-tight tracking-tight transition-transform duration-500 group-hover:translate-x-1">${exp.position}</h3>
              <h4 class="font-sans text-sm sm:text-base md:text-lg lg:text-xl font-normal text-white/60 group-hover:text-white transition-colors duration-500">${exp.company}</h4>
            </div>
            
            <!-- Right Column: Duration + Location -->
            <div class="flex flex-col gap-2 items-end text-right">
              <span class="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs sm:text-sm font-medium text-white/50 tracking-wide transition-all duration-500 group-hover:bg-white/[0.08] group-hover:border-white/20 group-hover:text-white/80 whitespace-nowrap">${exp.duration}</span>
              <span class="text-xs sm:text-sm md:text-base lg:text-lg text-white/40 font-light transition-colors duration-500 group-hover:text-white/70">${exp.location}</span>
            </div>
          </div>
          
          <!-- Desktop Layout: 4 column grid (only on xl and up - 1280px+) -->
          <div class="hidden xl:grid xl:grid-cols-[360px_360px_180px_1fr] xl:gap-12 items-center">
            <!-- Position -->
            <div class="flex items-center gap-3">
              <div class="flex w-2 h-2 rounded-full bg-white/20 shrink-0 transition-all duration-500 group-hover:bg-white group-hover:w-3 group-hover:h-3 group-hover:shadow-[0_0_12px_rgba(255,255,255,0.6)]"></div>
              <h3 class="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-white leading-tight tracking-tight transition-transform duration-500 group-hover:translate-x-1">${exp.position}</h3>
            </div>
            
            <!-- Company -->
            <div>
              <h4 class="font-sans text-lg font-normal text-white/60 group-hover:text-white transition-colors duration-500">${exp.company}</h4>
            </div>
            
            <!-- Location -->
            <div>
              <span class="text-base text-white/40 font-light transition-colors duration-500 group-hover:text-white/70">${exp.location}</span>
            </div>
            
            <!-- Duration -->
            <div class="justify-self-end text-right">
              <span class="inline-block px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-sm font-medium text-white/50 tracking-wide transition-all duration-500 group-hover:bg-white/[0.08] group-hover:border-white/20 group-hover:text-white/80 whitespace-nowrap">${exp.duration}</span>
            </div>
          </div>
          
        </div>
      `;
    }).join('');
  }
}

// Skills Cards Renderer Class
class SkillsRenderer {
  constructor() {
    this.container = document.getElementById('skills-container');
    if (!this.container) return;
    this.renderSkills();
  }

  renderSkills() {
    this.container.innerHTML = SKILLS_DATA.map((skill, idx) => {
      const delay = 100 + idx * 50;
      return `
        <div class="group glass-card glass-card-hover bg-white/20 backdrop-blur-[20px] rounded-[16px] p-5 flex flex-col items-center gap-3 text-center transition-all duration-500 hover:-translate-y-1 aos-init" data-aos="fade-up" data-aos-delay="${delay}">
          <div class="w-12 h-12 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
            ${skill.logo}
          </div>
          <span class="text-sm font-medium text-white/70 group-hover:text-white transition-colors duration-300">${skill.name}</span>
        </div>
      `;
    }).join('');
  }
}

// Skills Badges Renderer Class
class SkillsBadgesRenderer {
  constructor() {
    this.marquee1 = document.getElementById('skills-marquee-1');
    this.marquee2 = document.getElementById('skills-marquee-2');
    if (!this.marquee1 || !this.marquee2) return;
    
    this.iconCache = {};
    this.loadIconsAndRender();
  }

  async loadIconsAndRender() {
    // Load all icons from Iconify API
    const iconsToLoad = [...new Set([...SKILLS_ROW_1.map(s => s.iconName), ...SKILLS_ROW_2.map(s => s.iconName)])];
    
    try {
      // Fetch icons from Iconify API
      const promises = iconsToLoad.map(iconName => 
        fetch(`https://api.iconify.design/${iconName}.svg?width=20&height=20`)
          .then(res => res.text())
          .then(svg => {
            this.iconCache[iconName] = svg;
          })
          .catch(err => {
            console.warn(`Failed to load icon: ${iconName}`, err);
            this.iconCache[iconName] = '<div style="width:20px;height:20px"></div>';
          })
      );
      
      await Promise.all(promises);
      this.renderMarquees();
      this.initAnimation();
    } catch (err) {
      console.error('Error loading icons:', err);
      this.renderMarquees();
      this.initAnimation();
    }
  }

  renderMarquees() {
    const createBadge = (item) => `
      <div class="skill-badge inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/[0.02] border border-white/[0.06] text-sm sm:text-base font-medium text-white/50 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:text-white hover:scale-105 whitespace-nowrap shrink-0">
        <span class="inline-flex items-center justify-center w-5 h-5">${this.iconCache[item.iconName] || ''}</span>
        <span>${item.name}</span>
      </div>
    `;

    // Row 1: Duplicate items 3 times for seamless loop
    const row1Content = [...SKILLS_ROW_1, ...SKILLS_ROW_1, ...SKILLS_ROW_1].map(createBadge).join('');
    this.marquee1.innerHTML = row1Content;

    // Row 2: Duplicate items 3 times for seamless loop
    const row2Content = [...SKILLS_ROW_2, ...SKILLS_ROW_2, ...SKILLS_ROW_2].map(createBadge).join('');
    this.marquee2.innerHTML = row2Content;
  }

  initAnimation() {
    this.position1 = 0;
    this.position2 = 0;
    this.speed = 0.5; // pixels per frame

    this.animate();
  }

  animate() {
    // Row 1: Slide left
    this.position1 += this.speed;
    const width1 = this.marquee1.scrollWidth / 3; // Divide by 3 because we duplicated 3 times
    if (this.position1 >= width1) {
      this.position1 -= width1;
    }
    this.marquee1.style.transform = `translateX(-${this.position1}px)`;

    // Row 2: Slide right (reverse direction)
    this.position2 -= this.speed;
    const width2 = this.marquee2.scrollWidth / 3;
    if (Math.abs(this.position2) >= width2) {
      this.position2 += width2;
    }
    this.marquee2.style.transform = `translateX(${this.position2}px)`;

    requestAnimationFrame(() => this.animate());
  }
}

// Contact Word Rotator Class
class ContactWordRotator {
  constructor() {
    this.wordElement = document.getElementById('rotating-word');
    if (!this.wordElement) return;

    this.words = ['Design.', 'Create.', 'Evolve.'];
    this.currentIndex = 0;

    this.wordElement.textContent = this.words[0];
    this.wordElement.style.transform = 'translateY(0)';
    this.wordElement.style.opacity = '1';

    setTimeout(() => this.animate(), 3000);
  }

  animate() {
    this.wordElement.style.transform = 'translateY(100%)';
    this.wordElement.style.opacity = '0';

    setTimeout(() => {
      this.currentIndex = (this.currentIndex + 1) % this.words.length;
      this.wordElement.textContent = this.words[this.currentIndex];
      this.wordElement.style.transition = 'none';
      this.wordElement.style.transform = 'translateY(-100%)';
      this.wordElement.style.opacity = '1';

      // Force reflow
      this.wordElement.offsetHeight;

      // Re-enable transition
      this.wordElement.style.transition = '';
      this.wordElement.style.transform = 'translateY(0)';

      setTimeout(() => this.animate(), 3000);
    }, 700);
  }
}

// Contact Banner Scroll Animation Class
class ContactBannerScroll {
  constructor() {
    this.banner = document.getElementById('contact-banner');
    this.section = document.getElementById('contact');
    if (!this.banner || !this.section) return;

    // Banner is now static, no scroll animation needed
    // Just ensure it's visible
    this.banner.style.opacity = '1';
    this.banner.style.pointerEvents = 'auto';
  }

  onScroll() {
    // No scroll animation needed anymore
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
  new ExperienceRenderer();
  new SkillsBadgesRenderer();
  new ContactWordRotator();
  const contactBanner = new ContactBannerScroll();
  new AOSManager();

  new SmoothScroll(() => {
    textReveal.onScroll();
    workCards.onScroll();
    contactBanner.onScroll();
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
