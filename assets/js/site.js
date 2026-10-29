/* Space Weed design preview. No network calls: the forms are mock and send nothing. */
(() => {
  const doc = document.documentElement;
  doc.classList.remove("no-js");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Age gate: "Have you existed on this earth for 21+ years?" ---------- */
  const gate = document.querySelector("[data-gate]");
  if (gate) {
    let ok = false;
    try { ok = sessionStorage.getItem("sw-21") === "yes"; } catch (e) { ok = false; }
    if (!ok) {
      gate.hidden = false;
      document.body.classList.add("gate-open");
      const yes = gate.querySelector("[data-gate-yes]");
      const focusables = () => [...gate.querySelectorAll("a[href], button")];
      requestAnimationFrame(() => yes && yes.focus());
      gate.addEventListener("keydown", (e) => {
        if (e.key !== "Tab") return;
        const f = focusables();
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
      yes.addEventListener("click", () => {
        try { sessionStorage.setItem("sw-21", "yes"); } catch (e) { /* private mode: the gate just comes back next page */ }
        gate.hidden = true;
        document.body.classList.remove("gate-open");
        const main = document.getElementById("main");
        if (main) main.focus({ preventScroll: true });
      });
    }
  }

  /* ---------- Header: solid once the page scrolls; the sheet on small screens ---------- */
  const nav = document.querySelector(".site-nav");
  const onScrollNav = () => nav && nav.classList.toggle("is-scrolled", window.scrollY > 24);
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });
  const toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    const close = () => { document.body.classList.remove("nav-open"); toggle.setAttribute("aria-expanded", "false"); };
    toggle.addEventListener("click", () => {
      const open = !document.body.classList.contains("nav-open");
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    document.querySelectorAll(".nav-sheet a").forEach((a) => a.addEventListener("click", close));
  }

  /* ---------- Reveal on scroll, staggered ---------- */
  const revealables = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- The floating nug: drifts with the scroll and leans toward the pointer ---------- */
  const nug = document.querySelector(".nug");
  if (nug && !reduced) {
    let tx = 0, ty = 0, sx = 0, sy = 0, raf = 0;
    const apply = () => {
      raf = 0;
      nug.style.setProperty("--px", `${(tx * 18).toFixed(1)}px`);
      nug.style.setProperty("--py", `${(ty * 14 + sy).toFixed(1)}px`);
      nug.style.setProperty("--rot", `${(tx * 4 + sx).toFixed(2)}deg`);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(apply); };
    window.addEventListener("pointermove", (e) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      queue();
    }, { passive: true });
    window.addEventListener("scroll", () => {
      const y = Math.min(window.scrollY, window.innerHeight);
      sy = y * -0.28;
      sx = y * 0.02;
      queue();
    }, { passive: true });
  }

  /* ---------- Starfield: fixed stars that twinkle, a few slow drifting motes ---------- */
  const canvas = document.querySelector(".hero__stars");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, stars = [], motes = [], running = false, last = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const seed = (n) => { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
    const size = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 5200);
      stars = Array.from({ length: count }, (_, i) => ({ x: seed(i) * w, y: seed(i + 999) * h * 0.72, r: seed(i + 77) * 1.1 + 0.25, p: seed(i + 13) * Math.PI * 2, s: 0.4 + seed(i + 5) * 1.4 }));
      motes = Array.from({ length: 26 }, (_, i) => ({ x: seed(i + 300) * w, y: seed(i + 600) * h, r: seed(i + 900) * 1.6 + 0.6, v: 4 + seed(i + 1200) * 10 }));
    };
    const draw = (t) => {
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
      last = t;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const a = reduced ? 0.7 : 0.45 + 0.4 * Math.sin(t / 1000 * s.s + s.p);
        ctx.fillStyle = `rgba(230, 240, 248, ${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      for (const m of motes) {
        if (!reduced) { m.y -= m.v * dt; m.x += Math.sin(t / 2000 + m.v) * 0.08; if (m.y < -10) { m.y = h + 10; } }
        ctx.fillStyle = "rgba(158, 216, 247, 0.32)";
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
      }
      if (running && !reduced) requestAnimationFrame(draw);
    };
    size();
    window.addEventListener("resize", () => { size(); if (!running) draw(performance.now()); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => {
        const was = running;
        running = en.isIntersecting;
        if (running && !was) { last = 0; requestAnimationFrame(draw); }
      }).observe(canvas);
    }
    draw(performance.now());
  }

  /* ---------- Technology: the timeline fills as you read it ---------- */
  const timeline = document.querySelector(".timeline");
  if (timeline) {
    const fill = timeline.querySelector(".timeline__fill");
    const steps = timeline.querySelectorAll(".step");
    const update = () => {
      const r = timeline.getBoundingClientRect();
      const mid = window.innerHeight * 0.55;
      const p = Math.max(0, Math.min(1, (mid - r.top) / r.height));
      if (fill) fill.style.setProperty("--progress", p.toFixed(3));
      steps.forEach((s) => { const sr = s.getBoundingClientRect(); s.classList.toggle("is-in", sr.top + sr.height / 2 < mid); });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ---------- About: the Space Cadet traits light up one at a time ---------- */
  const traits = document.querySelectorAll(".traits span");
  if (traits.length) {
    if (reduced || !("IntersectionObserver" in window)) traits.forEach((t) => t.classList.add("is-lit"));
    else {
      const tio = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-lit"); tio.unobserve(en.target); } });
      }, { rootMargin: "0px 0px -35% 0px" });
      traits.forEach((t) => tio.observe(t));
    }
  }

  /* ---------- Mock forms: check the required fields, then show the confirmation. Nothing is sent. ---------- */
  document.querySelectorAll("form[data-mock]").forEach((form) => {
    const err = form.querySelector(".form-error");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]');
      const age = form.querySelector('input[name="age"]');
      let msg = "";
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) msg = "Enter an email address like example@mysite.com.";
      else if (age && !age.checked) msg = "Check the box to continue.";
      if (err) err.textContent = msg;
      if (msg) { (email && !email.value.trim() ? email : age || email).focus(); return; }
      form.classList.add("is-done");
      const done = form.querySelector(".form-done");
      if (done) { done.setAttribute("tabindex", "-1"); done.focus(); }
    });
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
