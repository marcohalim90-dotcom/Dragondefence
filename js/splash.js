/* Company splash (2026-11-07, user no. 105: "taro company splash"): the XIONCO Digital Playground intro (4.7 s, no sound,
   assets/splash/xionco_intro.mp4) on white, full screen, before the game; it holds its last frame 0.5 s, then fades out in
   0.35 s. A tap skips it; it never stays longer than 7 s; if the video cannot play, its last frame shows 1.2 s.
   Left out with ?sandbox (tests) and ?nosplash (quick previews). Loaded first, so it covers the game while it starts. */
(function () {
  const q = new URLSearchParams(location.search);
  if (q.has("sandbox") || q.has("nosplash")) return;
  const el = document.createElement("div");
  el.className = "splash";
  el.setAttribute("aria-label", "XIONCO Digital Playground");
  el.innerHTML = '<video class="splash__v" src="assets/splash/xionco_intro.mp4" poster="assets/splash/xionco_final.webp" muted playsinline autoplay preload="auto"></video>';
  document.body.appendChild(el);
  window.DD_SPLASH = true; // js/battle.js holds a battle still while this is true (a new player's first battle starts at once)
  const v = el.querySelector("video");
  let done = false;
  const end = () => {
    if (done) return;
    done = true;
    window.DD_SPLASH = false;
    el.classList.add("is-out");
    setTimeout(() => el.remove(), 400);
  };
  v.addEventListener("ended", () => setTimeout(end, 500));
  v.addEventListener("error", () => setTimeout(end, 1200));
  el.addEventListener("pointerdown", end);
  setTimeout(end, 7000);
  const p = v.play();
  if (p && p.catch) p.catch(() => setTimeout(end, 1200));
})();
