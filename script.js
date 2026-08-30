/* ==================================================================
   script.js
   Everything interactive on the page. Organized into small,
   independent init functions so you can read/learn/modify each
   feature in isolation. Everything checks prefers-reduced-motion
   or is otherwise cheap, so the page stays fast.
   ================================================================== */

import * as THREE from "three";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFinePointer = window.matchMedia("(pointer: fine)").matches;

/* ------------------------------------------------------------------
   0. Utility: run a fn once the DOM is ready
   ------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();

  initCustomCursor();
  initNavbar();
  initMobileMenu();
  initScrollProgress();
  initScrollReveal();
  initActiveSectionLinks();
  initTiltCards();
  initTabs();
  initSkillBars();
  initStatCounters();
  initContactForm();

  if (!prefersReducedMotion) {
    initHeroScene();
    initParticleBackground();
  } else {
    // Static fallback: hide canvases gracefully, keep layout intact
    document.getElementById("heroCanvas")?.parentElement.classList.add("no-3d");
  }
});

/* ------------------------------------------------------------------
   1. CUSTOM CURSOR
   A small dot + trailing ring that follows the pointer. Only enabled
   on devices with a fine pointer (mouse/trackpad) — mobile/touch
   never sees this, so it never gets in the way there.
   ------------------------------------------------------------------ */
function initCustomCursor() {
  if (!isFinePointer) return;
  document.body.classList.add("has-fine-pointer");

  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  let ringX = 0, ringY = 0;

  window.addEventListener("pointermove", (e) => {
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;
  });

  // Ring eases toward the pointer for a soft "trailing" feel
  function loop() {
    ringX += (parseFloat(dot.style.left || 0) - ringX) * 0.18;
    ringY += (parseFloat(dot.style.top || 0) - ringY) * 0.18;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    requestAnimationFrame(loop);
  }
  loop();

  document.querySelectorAll("a, button, [data-tilt]").forEach((el) => {
    el.addEventListener("mouseenter", () => document.body.classList.add("cursor-active"));
    el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-active"));
  });
}

/* ------------------------------------------------------------------
   2. NAVBAR — adds a glass background once the page is scrolled
   ------------------------------------------------------------------ */
function initNavbar() {
  const nav = document.getElementById("navbar");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ------------------------------------------------------------------
   3. MOBILE HAMBURGER MENU
   ------------------------------------------------------------------ */
function initMobileMenu() {
  const btn = document.getElementById("hamburger");
  const menu = document.getElementById("mobileMenu");

  btn.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    btn.classList.toggle("open", isOpen);
    btn.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      btn.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    })
  );
}

/* ------------------------------------------------------------------
   4. SCROLL PROGRESS BAR (top of page)
   ------------------------------------------------------------------ */
function initScrollProgress() {
  const bar = document.getElementById("scrollProgressBar");
  const onScroll = () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    bar.style.width = `${scrolled}%`;
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ------------------------------------------------------------------
   5. SCROLL-TRIGGERED REVEAL
   Any element with [data-reveal] fades/slides in once it enters the
   viewport. IntersectionObserver is cheap and only fires once per
   element (we unobserve after revealing) so it costs ~nothing after
   the initial pass.
   ------------------------------------------------------------------ */
function initScrollReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (prefersReducedMotion) {
    items.forEach((el) => el.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // small stagger for elements revealing together
          setTimeout(() => entry.target.classList.add("in-view"), i * 60);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  items.forEach((el) => observer.observe(el));
}

/* ------------------------------------------------------------------
   6. ACTIVE NAV LINK ON SCROLL
   Highlights the current section in the navbar as you scroll.
   ------------------------------------------------------------------ */
function initActiveSectionLinks() {
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle("active-link", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  sections.forEach((sec) => observer.observe(sec));
}

/* ------------------------------------------------------------------
   7. 3D TILT ON HOVER
   Any element with [data-tilt] tilts slightly toward the cursor and
   lifts up. Pure CSS transform driven by JS — cheap, GPU-accelerated,
   and skipped entirely on touch devices / reduced motion.
   ------------------------------------------------------------------ */
function initTiltCards() {
  if (prefersReducedMotion || !isFinePointer) return;

  document.querySelectorAll("[data-tilt]").forEach((card) => {
    const strength = 8; // max degrees of tilt

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform =
        `perspective(900px) rotateX(${(-y * strength).toFixed(2)}deg) rotateY(${(x * strength).toFixed(2)}deg) translateY(-4px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(900px) rotateX(0) rotateY(0) translateY(0)";
    });
  });
}

/* ------------------------------------------------------------------
   8. ABOUT SECTION TABS
   ------------------------------------------------------------------ */
function initTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
      panels.forEach((p) => { p.classList.remove("active"); p.hidden = true; });

      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      const target = document.getElementById(`tab-${btn.dataset.tab}`);
      target.hidden = false;
      target.classList.add("active");
    });
  });
}

/* ------------------------------------------------------------------
   9. SKILL BARS — fill from 0% to their target width when scrolled
   into view (target width is set via the --val CSS variable inline
   on each <span> in the HTML).
   ------------------------------------------------------------------ */
function initSkillBars() {
  const bars = document.querySelectorAll(".bar");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("filled");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  bars.forEach((bar) => observer.observe(bar));
}

/* ------------------------------------------------------------------
   10. HERO STAT COUNTERS — count up from 0 to data-count once visible
   ------------------------------------------------------------------ */
function initStatCounters() {
  const counters = document.querySelectorAll("[data-count]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const duration = 900;
        const start = performance.now();

        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          el.textContent = Math.round(progress * target);
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((el) => observer.observe(el));
}

/* ------------------------------------------------------------------
   11. CONTACT FORM
   Front-end only for now: validates and shows a confirmation note.
   EDIT ME — wire this up to Formspree / EmailJS / your own backend
   by replacing the setTimeout block with a real fetch() call.
   ------------------------------------------------------------------ */
function initContactForm() {
  const form = document.querySelector(".contact-form");
  const note = document.getElementById("formNote");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      note.textContent = "Please fill in every field before sending.";
      return;
    }
    note.textContent = "Sending…";
    // Placeholder for a real request — swap this out for your backend/API.
    setTimeout(() => {
      note.textContent = "Message captured locally — connect a backend (e.g. Formspree) to actually send it.";
      form.reset();
    }, 700);
  });
}

/* ==================================================================
   12. HERO 3D SCENE (Three.js)
   A wireframe icosahedron "sensor node" with orbiting satellite
   points, connected by faint lines — a stylized nod to the networked
   sensor work in the Projects section. Reacts gently to the pointer.
   Kept deliberately simple (one mesh + one point cloud) to stay fast.
   ================================================================== */
function initHeroScene() {
  const canvas = document.getElementById("heroCanvas");
  const wrap = canvas.parentElement;
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Core node: wireframe icosahedron, teal, with a subtle inner glow mesh
  const coreGeo = new THREE.IcosahedronGeometry(1.6, 1);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x5eead4, wireframe: true, transparent: true, opacity: 0.85 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  const glowGeo = new THREE.IcosahedronGeometry(1.58, 1);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.05 });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  scene.add(glow);

  // Orbiting "satellite" data points around the core
  const satelliteCount = 40;
  const satGeo = new THREE.BufferGeometry();
  const satPositions = new Float32Array(satelliteCount * 3);
  const satRadii = [];
  for (let i = 0; i < satelliteCount; i++) {
    const r = 2.4 + Math.random() * 1.1;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    satPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    satPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    satPositions[i * 3 + 2] = r * Math.cos(phi);
    satRadii.push(r);
  }
  satGeo.setAttribute("position", new THREE.BufferAttribute(satPositions, 3));
  const satMat = new THREE.PointsMaterial({ color: 0x5eead4, size: 0.045, transparent: true, opacity: 0.9 });
  const satellites = new THREE.Points(satGeo, satMat);
  scene.add(satellites);

  const hudCoords = document.getElementById("hudCoords");

  // Pointer-reactive rotation target
  let targetX = 0, targetY = 0;
  wrap.addEventListener("pointermove", (e) => {
    const rect = wrap.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    targetY = nx * 0.6;
    targetX = ny * 0.6;
    if (hudCoords) hudCoords.textContent = `X:${nx.toFixed(2)} Y:${ny.toFixed(2)}`;
  });

  function resize() {
    const size = wrap.clientWidth;
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Idle ambient rotation, biased by pointer position
    core.rotation.y += (targetY * 0.02 + 0.0025) - core.rotation.y * 0.0;
    core.rotation.x += 0.0012;
    core.rotation.y += 0.0022;
    core.rotation.x += (targetX - core.rotation.x) * 0.02;
    core.rotation.y += (targetY - core.rotation.y) * 0.02;

    glow.rotation.copy(core.rotation);
    satellites.rotation.y = t * 0.06;
    satellites.rotation.x = Math.sin(t * 0.15) * 0.15;

    renderer.render(scene, camera);
  }
  animate();
}

/* ==================================================================
   13. AMBIENT PARTICLE BACKGROUND (Three.js)
   A slow-drifting field of tiny points behind the hero section only
   — gives depth without competing with the foreground content.
   ================================================================== */
function initParticleBackground() {
  const canvas = document.getElementById("particleCanvas");
  const hero = canvas.parentElement;
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, hero.clientWidth / hero.clientHeight, 0.1, 50);
  camera.position.z = 10;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const count = 220;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0x8892a4, size: 0.028, transparent: true, opacity: 0.55 });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  let mouseX = 0, mouseY = 0;
  window.addEventListener("pointermove", (e) => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
  });

  function resize() {
    renderer.setSize(hero.clientWidth, hero.clientHeight, false);
    camera.aspect = hero.clientWidth / hero.clientHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  function animate() {
    requestAnimationFrame(animate);
    points.rotation.y += 0.0006;
    // Gentle parallax drift based on pointer position
    camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 0.8 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }
  animate();
}