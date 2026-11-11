/* DREAMDYSIS: Dragon Defence — every sound effect, made in the browser (C28, 2026-11-02, user: "sekarang masukan semua sound
   effect. buat jadi group task"; Ledger Draft 24, Confirmed C28). The way of Roll Game V2's effects (src/ui3d/sfx.ts), which
   the user already heard and corrected: warm, not shrill ("terlalu cempreng"), never startling ("jangan mengagetkan"), big
   sounds in a hall ("buat suaranya punya reverb"). Music stays off (2026-10-24: "musik matiin berisik banget").
   DD.SOUNDS: name → { cat, vol, gap (ms between two plays), vary (pitch spread), hall (send), fade (swell in), layers }.
   A layer: tone { w: wave, f: [from, to], d, g, at, att } · noise { f: band centre, f2: sweep to, q, d, g, at, att, lfo, hp }
   · brass { f, d, g, at } (the V2 trumpet). A name can later carry { file } instead, and nothing else has to change. */
(function () {
  const CAT = { battle: 0.5, ui: 0.6, big: 0.7 }; // levels set 2026-11-02 from DD.sfxMeasure: attacks peak ~0.04–0.07, a scale ~0.07, big events ~0.2–0.3
  const MAX_VOICES = 18;
  let ctx = null, out = null, hallIn = null, noiseBuf = null, voices = 0;
  const last = {};
  const soundOn = () => { try { return !!DD.P.get().sound; } catch (e) { return true; } };

  function ac() {
    if (!soundOn()) return null;
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      // everything through one warm lowpass and a soft compressor, so a busy battle never clips
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 6000; lp.Q.value = 0.5;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
      out = ctx.createGain();
      out.connect(lp).connect(comp).connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }
  // the first tap opens the audio (phones keep it closed until the player touches the page)
  window.addEventListener("pointerdown", () => { if (soundOn()) ac(); }, { once: true, capture: true });

  const noiseOf = (a) => {
    if (!noiseBuf) {
      noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  };
  /** The hall of V2: 25 ms pre-delay into a 2.4 s decaying stereo noise, mixed back into the output. */
  function hall(a) {
    if (hallIn) return hallIn;
    const len = Math.floor(a.sampleRate * 2.4);
    const ir = a.createBuffer(2, len, a.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    const pre = a.createDelay(0.1);
    pre.delayTime.value = 0.025;
    const conv = a.createConvolver();
    conv.buffer = ir;
    pre.connect(conv).connect(out);
    hallIn = pre;
    return pre;
  }
  const done = (node, stopAt) => { voices++; node.onended = () => voices--; node.stop(stopAt); };
  /** A soft envelope: never a click (≥ 5 ms in), an exponential fall to silence at the end. */
  function env(g, t0, att, dur, peak) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + Math.max(0.005, att));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }
  function tone(a, L, bus, k, t0) {
    const o = a.createOscillator(), g = a.createGain();
    o.type = L.w || "sine";
    const [f0, f1] = Array.isArray(L.f) ? L.f : [L.f, L.f];
    o.frequency.setValueAtTime(f0 * k, t0);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * k), t0 + L.d);
    env(g, t0, L.att || 0.006, L.d, L.g);
    if (L.w === "sawtooth" || L.w === "square") {
      // the sharp waves through their own lowpass (warm, not shrill)
      const f = a.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = L.lp || 2200;
      o.connect(f).connect(g);
    } else o.connect(g);
    g.connect(bus);
    o.start(t0);
    done(o, t0 + L.d + 0.03);
  }
  function noise(a, L, bus, k, t0) {
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    src.buffer = noiseOf(a);
    f.type = L.hp ? "highpass" : "bandpass";
    f.Q.value = L.q || 1;
    f.frequency.setValueAtTime(L.f * k, t0);
    if (L.f2) f.frequency.exponentialRampToValueAtTime(L.f2 * k, t0 + L.d);
    env(g, t0, L.att || 0.006, L.d, L.g);
    let tail = f;
    if (L.lfo) {
      // a flutter (a spinning axe, a crackling beam): the level wobbles L.lfo times a second
      const trem = a.createGain(), lfo = a.createOscillator(), depth = a.createGain();
      trem.gain.value = 0.55; lfo.frequency.value = L.lfo; depth.gain.value = 0.45;
      lfo.connect(depth).connect(trem.gain);
      f.connect(trem);
      tail = trem;
      lfo.start(t0); lfo.stop(t0 + L.d + 0.05);
    }
    src.connect(f);
    tail.connect(g).connect(bus);
    src.start(t0, Math.random() * Math.max(0, 1.9 - L.d)); // a random place in the 2 s of noise, so two hits never sound alike
    done(src, t0 + L.d + 0.03);
  }
  /** The V2 trumpet: two detuned saws, a lowpass that opens on the attack, a gentle bump at 1.5 kHz, a scoop up into the note. */
  function brass(a, L, bus, k, t0) {
    const freq = L.f * k, dur = L.d;
    const f = a.createBiquadFilter();
    f.type = "lowpass"; f.Q.value = 1.4;
    f.frequency.setValueAtTime(700, t0);
    f.frequency.exponentialRampToValueAtTime(4000, t0 + 0.05);
    f.frequency.exponentialRampToValueAtTime(2400, t0 + dur);
    const bite = a.createBiquadFilter();
    bite.type = "peaking"; bite.frequency.value = 1500; bite.Q.value = 1; bite.gain.value = 4;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(L.g, t0 + 0.045);
    g.gain.setValueAtTime(L.g, t0 + Math.max(0.05, dur - Math.min(0.3, dur * 0.35)));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    f.connect(bite).connect(g).connect(bus);
    for (const det of [-4, 4]) {
      const o = a.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(freq * 0.97, t0);
      o.frequency.exponentialRampToValueAtTime(freq, t0 + 0.05);
      o.detune.value = det;
      if (dur > 0.3) {
        const lfo = a.createOscillator(), depth = a.createGain();
        lfo.frequency.value = 5.5; depth.gain.value = freq * 0.006;
        lfo.connect(depth).connect(o.frequency);
        lfo.start(t0 + 0.15); lfo.stop(t0 + dur + 0.05);
      }
      o.connect(f);
      o.start(t0);
      done(o, t0 + dur + 0.05);
    }
  }
  const KIND = { tone, noise, brass };

  /** Plays a named sound. o.vol scales it; returns false when it was skipped (Sound off, too soon, too many at once). */
  DD.play = function (name, o) {
    const def = DD.SOUNDS[name];
    if (!def) return false;
    const a = ac();
    if (!a) return false;
    const now = performance.now();
    if (last[name] && now - last[name] < (def.gap ?? 40)) return false;
    if (def.cat === "battle" && voices > MAX_VOICES) return false;
    last[name] = now;
    if (def.file) { const el = new Audio("assets/" + def.file); el.volume = Math.min(1, (def.vol || 1) * CAT[def.cat || "ui"] * (DD.sfxVol ? DD.sfxVol() : 1)); el.play().catch(() => {}); return true; }
    const t0 = a.currentTime + 0.005;
    const bus = a.createGain();
    const vol = (def.vol || 1) * CAT[def.cat || "ui"] * ((o && o.vol) || 1) * (DD.sfxVol ? DD.sfxVol() : 1); // C33 G8: the Sound Effects volume
    if (def.fade) { bus.gain.setValueAtTime(vol * 0.06, t0); bus.gain.setTargetAtTime(vol, t0, def.fade); } // swells in (V2 fanfare)
    else bus.gain.value = vol;
    bus.connect(out);
    if (def.hall) { const send = a.createGain(); send.gain.value = def.hall; bus.connect(send).connect(hall(a)); }
    const k = 1 + (Math.random() * 2 - 1) * (def.vary || 0);
    for (const L of def.layers) KIND[L.t](a, L, bus, L.fixed ? 1 : k, t0 + (L.at || 0));
    return true;
  };

  /** For tests only: renders each named sound offline (no compressor) and returns its peak and loudness (RMS) and length. */
  DD.sfxMeasure = async function (names, secs = 2.6) {
    const keep = [ctx, out, hallIn, noiseBuf], res = {};
    for (const n of names) {
      const oc = new OfflineAudioContext(1, Math.floor(44100 * secs), 44100);
      ctx = oc; out = oc.createGain(); out.connect(oc.destination); hallIn = null; noiseBuf = null; voices = 0;
      delete last[n];
      DD.play(n);
      const d = (await oc.startRendering()).getChannelData(0);
      let peak = 0, sum = 0, end = 0;
      for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; sum += v * v; if (v > 0.002) end = i; }
      res[n] = { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / Math.max(1, end)).toFixed(3), secs: +(end / 44100).toFixed(2) };
    }
    [ctx, out, hallIn, noiseBuf] = keep;
    return res;
  };

  /* ------------------------------------------------------------ building blocks */
  const swish = (f, f2, d, g, at) => ({ t: "noise", f, f2, q: 0.9, d, g, at });
  const thump = (f, f2, d, g, at) => ({ t: "tone", w: "sine", f: [f, f2], d, g, at });
  const ping = (f, d, g, at, w) => ({ t: "tone", w: w || "triangle", f: [f, f * 0.995], d, g, at });
  const sparkle = (at = 0, g = 0.035) => [ping(2093, 0.22, g, at, "sine"), ping(2637, 0.2, g * 0.9, at + 0.04, "sine"), ping(3136, 0.24, g * 0.8, at + 0.08, "sine")];
  const coin = (at = 0, g = 0.06) => [ping(1975, 0.07, g, at), ping(2637, 0.16, g, at + 0.05)];
  const crunch = (g = 0.28) => [{ t: "noise", f: 1100, q: 0.8, d: 0.08, g }, thump(260, 120, 0.09, g * 0.5)];
  const zap = (f = 1400, at = 0, g = 0.05) => [{ t: "tone", w: "square", f: [f, f * 0.2], d: 0.09, g, at, lp: 3000 }, { t: "noise", f: 4500, q: 1.2, d: 0.05, g: g * 2.4, at }];
  const fire = (f, f2, d, g, at) => ({ t: "noise", f, f2, q: 0.6, d, g, at, att: 0.06 });
  const glass = (g = 0.2) => [{ t: "noise", f: 5200, q: 2, d: 0.22, g }, ping(2500, 0.18, g * 0.25, 0.01, "sine"), ping(3300, 0.16, g * 0.2, 0.02, "sine"), ping(4100, 0.14, g * 0.15, 0.03, "sine")];
  const arp = (notes, step, d, g, w, at = 0) => notes.map((f, i) => ping(f, d, g, at + i * step, w || "triangle"));
  const B = (layers, o) => ({ cat: "battle", gap: 40, vary: 0.06, layers, ...o });
  const U = (layers, o) => ({ cat: "ui", gap: 60, layers, ...o });
  const BIG = (layers, o) => ({ cat: "big", gap: 200, hall: 0.35, layers, ...o });

  DD.SOUNDS = {
    /* ---- B · each hero's attack (heroes.js ids), one family per weapon, tinted by element */
    atk_spellsword: B([{ t: "noise", f: 2600, f2: 900, q: 0.8, d: 0.18, g: 0.18, att: 0.015 }, thump(260, 130, 0.16, 0.08), { t: "noise", f: 6500, q: 2.5, d: 0.07, g: 0.035, at: 0.01 }], { gap: 110 }), // Kael: an arcane bolt (C32 G1: no string-like ping)
    "atk_half-goblin": B([swish(2600, 5000, 0.07, 0.16), swish(2400, 4800, 0.07, 0.12, 0.035)], { gap: 110, vary: 0.1 }), // Nim: a fan of daggers
    atk_ebenezer: B([{ t: "noise", f: 2500, f2: 1700, q: 0.8, d: 0.4, g: 0.12, att: 0.05 }, ...arp([600, 760, 900], 0.09, 0.08, 0.035, "sine")], { gap: 260 }), // a sweeping fountain
    atk_enchantress: B([thump(500, 1000, 0.1, 0.09), thump(750, 1500, 0.09, 0.06, 0.05)], { gap: 110, vary: 0.1 }), // Velis: fluttering hearts (water)
    atk_mercenary: B([{ t: "noise", f: 1800, q: 0.5, d: 0.07, g: 0.14 }, thump(160, 50, 0.12, 0.11)], { gap: 140 }), // Garran: a rifle crack
    atk_tracker: B([swish(600, 1500, 0.25, 0.18), { t: "tone", w: "sawtooth", f: [110, 80], d: 0.45, g: 0.06, lp: 700, at: 0.08 }], { gap: 400 }), // Fen: a spirit wolf
    atk_dwarf: B([{ t: "noise", f: 900, q: 1.5, d: 0.4, g: 0.2, lfo: 14 }], { gap: 160 }), // Borrik: a spinning axe
    atk_occultist: B([{ t: "noise", f: 500, f2: 900, q: 3, d: 0.6, g: 0.24, att: 0.15 }, thump(220, 207, 0.6, 0.07)], { gap: 600 }), // Morrow: orbiting skulls
    atk_leprechaun: B([...zap(1400), ping(1975, 0.06, 0.035, 0.03)], { gap: 110 }), // Finnick: a charged coin
    atk_knight: B([{ t: "tone", w: "sawtooth", f: [196, 196], d: 0.4, g: 0.06, lp: 1200 }, { t: "noise", f: 5000, q: 1, d: 0.35, g: 0.07, lfo: 40 }, ping(784, 0.3, 0.03, 0, "sine")], { gap: 300 }), // Sera: a lightning beam
    "atk_jack-frost": B([ping(1568, 0.25, 0.06, 0, "sine"), ping(2349, 0.2, 0.04, 0.03, "sine"), { t: "noise", f: 7000, q: 2, d: 0.15, g: 0.06 }], { gap: 130 }), // ice orbs
    atk_cassandra: B([ping(1047, 0.25, 0.06), { t: "tone", w: "triangle", f: [1047, 784], d: 0.25, g: 0.05 }, swish(1500, 3000, 0.12, 0.12)], { gap: 160 }), // a charm dagger
    atk_sorceress: B([fire(600, 1600, 0.55, 0.28)], { gap: 400 }), // Ysmay: a flame cone
    atk_crusader: B([{ t: "noise", f: 700, q: 1.5, d: 0.5, g: 0.2, lfo: 20 }, fire(900, 1400, 0.4, 0.1)], { gap: 300 }), // Aldous: a burning saw
    "atk_tou-lak": B([...zap(1600), ...zap(1200, 0.06, 0.04), { t: "noise", f: 4000, q: 1, d: 0.3, g: 0.07, lfo: 30 }], { gap: 160 }), // a weaving spear of lightning
    atk_alchemist: B([swish(900, 600, 0.2, 0.26), ping(2637, 0.08, 0.07, 0.02)], { gap: 160 }), // Pell: a thrown flask
    atk_alexandra: B([thump(660, 990, 0.15, 0.07), ping(1320, 0.12, 0.035, 0.02, "sine"), ...zap(2000, 0.04, 0.035)], { gap: 120 }), // an arcane chain
    atk_marpesia: B([swish(1200, 2600, 0.1, 0.24), ping(1760, 0.15, 0.045, 0.02)], { gap: 160 }), // a spear thrust
    "atk_loeg-yllavyre": B([{ t: "tone", w: "sawtooth", f: [180, 120], d: 0.4, g: 0.07, lp: 900 }, fire(700, 1300, 0.3, 0.1, 0.05)], { gap: 500 }), // a small dragon
    "atk_amar-suen": B([{ t: "noise", f: 2500, q: 0.6, d: 0.05, g: 0.24 }, ...coin(0.01, 0.05)], { gap: 120 }), // a golden shot
    // C33 G7: the new heroes
    atk_minstrel: B([...arp([784, 988, 1175], 0.06, 0.16, 0.04, "sine")], { gap: 140, vary: 0.05 }), // Lark: a bright three-note phrase
    atk_scout: B([swish(1400, 3000, 0.09, 0.14), swish(1300, 2800, 0.09, 0.1, 0.03)], { gap: 110, vary: 0.1 }), // Dace: two arrows whistle
    atk_klaus: B([thump(220, 110, 0.18, 0.12), { t: "noise", f: 3500, q: 1.5, d: 0.25, g: 0.06, at: 0.12 }, ping(1568, 0.25, 0.03, 0.14, "sine")], { gap: 300 }), // a gift bursts with a bell
    atk_archaeologist: B([{ t: "noise", f: 1200, q: 1.2, d: 0.35, g: 0.14, lfo: 16 }, ...zap(1800, 0.05, 0.03)], { gap: 160 }), // a humming relic disc
    "atk_sugarplum-faerie": B([...arp([1319, 1568, 2093], 0.04, 0.12, 0.03, "sine")], { gap: 450 }), // sugar chimes
    atk_tristan: B([swish(900, 2400, 0.14, 0.22), fire(700, 1300, 0.2, 0.08, 0.04)], { gap: 160 }), // a burning slash
    "atk_guild-leader": B([{ t: "noise", f: 2200, f2: 900, q: 1, d: 0.12, g: 0.14 }, { t: "tone", w: "sawtooth", f: [520, 380], d: 0.1, g: 0.04, lp: 2200, at: 0.02 }], { gap: 160 }), // a crow's dive and caw
    atk_szopin: B([{ t: "noise", f: 800, q: 1.4, d: 0.3, g: 0.16, lfo: 22 }, fire(900, 1500, 0.25, 0.08)], { gap: 200 }), // chained blades whirl
    "atk_time-traveler": B([ping(1760, 0.08, 0.04, 0, "triangle"), ping(1760, 0.08, 0.04, 0.12, "triangle"), { t: "tone", w: "sine", f: [330, 660], d: 0.35, g: 0.05, at: 0.05 }], { gap: 300 }), // tick-tock and a ray
    atk_viking: B([{ t: "noise", f: 700, q: 1.5, d: 0.5, g: 0.2, lfo: 20 }, thump(140, 60, 0.25, 0.14)], { gap: 300 }), // an axe crashes and whirls
    // C36 G3: Kael, Dragon Ascendance: Kael's blade swish under a dragonfire roar
    "atk_kael-dragon": B([swish(900, 2600, 0.12, 0.2), fire(500, 1100, 0.3, 0.12, 0.02), thump(160, 70, 0.22, 0.1, 0.03)], { gap: 140 }),
    atk_dreamwalker: B([{ t: "tone", w: "sine", f: [440, 660], d: 0.5, g: 0.05 }, { t: "noise", f: 5000, f2: 2500, q: 2, d: 0.4, g: 0.05 }], { gap: 260 }), // a dreamy tide
    /* ---- C · the dragon and the wall */
    pop: B(crunch(0.16), { gap: 35, vary: 0.12 }), // a scale breaks
    crit: B([ping(1760, 0.07, 0.05), { t: "noise", f: 3500, q: 1, d: 0.04, g: 0.1 }], { gap: 60, vary: 0.05 }),
    dragon_enter: BIG([{ t: "tone", w: "sawtooth", f: [110, 38], d: 1.2, g: 0.16, lp: 600, att: 0.2 }, { t: "tone", w: "square", f: [70, 30], d: 1.1, g: 0.06, lp: 400, at: 0.05, att: 0.2 }, { t: "noise", f: 300, q: 0.7, d: 0.9, g: 0.25, att: 0.2 }], { hall: 0.25, vary: 0.04 }), // the V2 dragon, swelling in
    head_die: BIG([thump(120, 40, 0.6, 0.4), { t: "noise", f: 300, q: 0.7, d: 0.8, g: 0.35 }, { t: "tone", w: "sawtooth", f: [160, 50], d: 0.9, g: 0.08, lp: 700 }], { hall: 0.3 }),
    tail_kill: BIG([thump(140, 45, 0.4, 0.35), { t: "noise", f: 600, q: 0.7, d: 0.4, g: 0.3 }, ...coin(0.12), ...coin(0.22), ...coin(0.32)], { hall: 0.2 }),
    wall_bite: B([thump(90, 50, 0.2, 0.17), { t: "noise", f: 400, q: 0.7, d: 0.15, g: 0.13 }], { gap: 380, vary: 0.08 }),
    wall_break: BIG([{ t: "noise", f: 250, q: 0.6, d: 1.0, g: 0.5 }, { t: "noise", f: 900, q: 0.8, d: 0.5, g: 0.25 }, thump(70, 30, 1.0, 0.3)], { hall: 0.3 }),
    revive: BIG([thump(440, 880, 0.5, 0.07), thump(660, 1320, 0.5, 0.045, 0.05), ...sparkle(0.4)], { hall: 0.3 }),
    phoenix: BIG([fire(500, 2500, 0.6, 0.22), ...arp([784, 988, 1175, 1568], 0.08, 0.3, 0.05)], { hall: 0.3 }),
    rx_overload: B([...zap(1500), ...zap(1100, 0.05), ...zap(1800, 0.1, 0.04), { t: "noise", f: 5000, q: 1, d: 0.3, g: 0.08, lfo: 35 }], { gap: 120 }),
    rx_steam: B([{ t: "noise", f: 6500, q: 0.4, d: 0.6, g: 0.15, att: 0.04 }], { gap: 160 }),
    rx_wildfire: B([fire(500, 1500, 0.6, 0.28)], { gap: 160 }),
    rx_shatter: B(glass(0.2), { gap: 120 }),
    /* ---- D · loot in the battle */
    chest_seg: B([...crunch(0.24), ...arp([660, 880, 1320], 0.08, 0.35, 0.1), ...coin(0.25)], { gap: 120, vary: 0 }), // V2 chest
    pearl: B([...arp([1047, 1319, 1568, 2093], 0.05, 0.3, 0.05, "sine")], { gap: 150, hall: 0.3, vary: 0 }),
    shard: B([...glass(0.16), thump(1568, 2093, 0.2, 0.04)], { gap: 150, vary: 0 }),
    coin: B(coin(), { gap: 70, vary: 0.04 }),
    cards: U([{ t: "noise", f: 3000, q: 0.8, d: 0.05, g: 0.14 }, { t: "noise", f: 3000, q: 0.8, d: 0.05, g: 0.14, at: 0.07 }, { t: "noise", f: 3000, q: 0.8, d: 0.05, g: 0.14, at: 0.14 }]),
    card_pick: U([...sparkle(0, 0.03), thump(880, 1320, 0.15, 0.05)]),
    hero_call: U([swish(400, 2400, 0.35, 0.2)]),
    victory: BIG([{ t: "brass", f: 392, d: 0.13, g: 0.12 }, { t: "brass", f: 523, d: 0.13, g: 0.12, at: 0.15 }, { t: "brass", f: 659, d: 0.13, g: 0.12, at: 0.3 }, { t: "brass", f: 784, d: 0.85, g: 0.12, at: 0.45 }], { fade: 0.2, hall: 0.35 }), // the V2 fanfare: G4 C5 E5 G5
    defeat: BIG([{ t: "tone", w: "triangle", f: [440, 110], d: 0.7, g: 0.16 }, thump(110, 45, 0.6, 0.18, 0.1)], { hall: 0.25 }), // V2 fail
    reward: U(arp([660, 880, 1320], 0.08, 0.35, 0.1)), // V2 chest
    /* ---- E · menus */
    tap: U([thump(520, 600, 0.06, 0.06)], { gap: 50 }), // V2 tap
    tab: U([thump(620, 700, 0.07, 0.06), ping(1240, 0.05, 0.02, 0.01, "sine")], { gap: 50 }),
    deny: U([{ t: "tone", w: "square", f: [220, 180], d: 0.12, g: 0.05, lp: 1400 }], { gap: 120 }), // V2 error
    claim: U([...coin(0, 0.05), ...arp([660, 880], 0.07, 0.25, 0.07, "triangle", 0.08)]),
    unlock: BIG([{ t: "brass", f: 523, d: 0.14, g: 0.1 }, { t: "brass", f: 784, d: 0.5, g: 0.1, at: 0.16 }], { fade: 0.15, hall: 0.3 }),
    level_up: U([thump(880, 1760, 0.18, 0.1), ...sparkle(0.12, 0.03)]), // V2 xp + sparkle
    lv_unlock: BIG([{ t: "brass", f: 523, d: 0.12, g: 0.1 }, { t: "brass", f: 659, d: 0.12, g: 0.1, at: 0.13 }, { t: "brass", f: 784, d: 0.45, g: 0.1, at: 0.26 }, ...sparkle(0.4)], { fade: 0.15 }),
    train: U([thump(660, 990, 0.1, 0.07), ping(1760, 0.08, 0.025, 0.03)], { gap: 50 }),
    rank_up: BIG([{ t: "brass", f: 523, d: 0.11, g: 0.1 }, { t: "brass", f: 659, d: 0.11, g: 0.1, at: 0.12 }, { t: "brass", f: 784, d: 0.11, g: 0.1, at: 0.24 }, { t: "brass", f: 1047, d: 0.6, g: 0.1, at: 0.36 }], { fade: 0.15 }),
    /* ---- F · equipment, artifacts, recruit */
    equip: U([{ t: "noise", f: 2500, q: 3, d: 0.06, g: 0.18 }, ping(1100, 0.18, 0.05), ping(1650, 0.14, 0.03, 0.01)]), // a metal clank
    unequip: U([{ t: "noise", f: 1800, q: 2, d: 0.05, g: 0.13 }, ping(700, 0.1, 0.04)]),
    star: U([...sparkle(0, 0.045), thump(1047, 1568, 0.12, 0.04)]),
    tier_up: BIG([{ t: "noise", f: 3000, q: 6, d: 0.3, g: 0.22 }, ...arp([1320, 1760, 2200], 0.03, 0.5, 0.045), { t: "brass", f: 523, d: 0.12, g: 0.09, at: 0.2 }, { t: "brass", f: 784, d: 0.5, g: 0.09, at: 0.33 }], { hall: 0.3 }), // an anvil, then a short call
    fuse: BIG([fire(400, 1400, 0.45, 0.22), { t: "noise", f: 3200, q: 7, d: 0.25, g: 0.2, at: 0.35 }, ...sparkle(0.45, 0.04)], { hall: 0.3 }), // the forge
    salvage: U([...crunch(0.26), { t: "noise", f: 800, q: 0.8, d: 0.1, g: 0.2, at: 0.06 }]),
    forge: U([{ t: "noise", f: 3500, q: 8, d: 0.2, g: 0.18 }, thump(180, 80, 0.12, 0.15)]), // a hammer on the slot
    chest_open: U([{ t: "tone", w: "sawtooth", f: [180, 120], d: 0.3, g: 0.035, lp: 900 }, { t: "noise", f: 400, q: 0.8, d: 0.2, g: 0.18, at: 0.2 }, ...arp([660, 880, 1320], 0.08, 0.35, 0.1, "triangle", 0.3)], { gap: 200 }),
    art_unlock: BIG([...arp([523, 784, 1047], 0.12, 0.5, 0.07, "sine"), ...sparkle(0.35)], { hall: 0.35 }),
    art_up: U([thump(784, 1568, 0.3, 0.07), ...sparkle(0.18, 0.03)], { hall: 0.2 }),
    pull: U([swish(2000, 5000, 0.2, 0.15), thump(440, 880, 0.3, 0.05, 0.05)], { gap: 120 }), // Recruit: a card turns
    // C34 G2: the shrine's holy bell (a bronze toll: a low hum and four bright overtones ringing out in the hall), the light coming down
    // (a rising shimmer) and the Mythic's red storm (thunder under crackling sparks)
    shrine_bell: BIG([{ t: "tone", w: "sine", f: 392, d: 2.6, g: 0.075, att: 0.004 }, { t: "tone", w: "sine", f: 196, d: 2.8, g: 0.04, att: 0.01 },
      { t: "tone", w: "sine", f: 392 * 2.01, d: 1.9, g: 0.035, att: 0.004 }, { t: "tone", w: "sine", f: 392 * 2.42, d: 1.5, g: 0.028, att: 0.004 },
      { t: "tone", w: "sine", f: 392 * 3.01, d: 1.1, g: 0.02, att: 0.004 }, { t: "tone", w: "sine", f: 392, d: 2.2, g: 0.05, at: 0.75, att: 0.004 },
      { t: "tone", w: "sine", f: 392 * 2.42, d: 1.2, g: 0.02, at: 0.75, att: 0.004 }], { hall: 0.55, gap: 400 }),
    shrine_beam: U([{ t: "noise", f: 900, f2: 5000, q: 1.2, d: 0.7, g: 0.12, att: 0.25 }, ...sparkle(0.45, 0.03)], { hall: 0.3 }),
    mythic_storm: BIG([{ t: "noise", f: 110, q: 0.7, d: 2.1, g: 0.4, att: 0.4 }, thump(70, 40, 1.2, 0.12, 0.1), { t: "noise", f: 5200, q: 2, d: 0.12, g: 0.14, at: 0.3 },
      { t: "noise", f: 4200, q: 2, d: 0.1, g: 0.12, at: 0.75 }, { t: "noise", f: 6000, q: 2, d: 0.14, g: 0.14, at: 1.2 }, { t: "noise", f: 4800, q: 2, d: 0.1, g: 0.12, at: 1.7 }], { hall: 0.4, gap: 800 }),
    reveal_rare: U(arp([1047, 1319], 0.07, 0.3, 0.06, "sine")),
    reveal_epic: U(arp([1047, 1319, 1568], 0.07, 0.35, 0.06, "sine"), { hall: 0.2 }),
    reveal_legendary: BIG([{ t: "brass", f: 523, d: 0.12, g: 0.1 }, { t: "brass", f: 659, d: 0.12, g: 0.1, at: 0.13 }, { t: "brass", f: 784, d: 0.5, g: 0.1, at: 0.26 }, ...sparkle(0.35)], { fade: 0.15 }),
    reveal_mythic: BIG([{ t: "brass", f: 392, d: 0.13, g: 0.12 }, { t: "brass", f: 523, d: 0.13, g: 0.12, at: 0.15 }, { t: "brass", f: 659, d: 0.13, g: 0.12, at: 0.3 }, { t: "brass", f: 784, d: 0.85, g: 0.12, at: 0.45 }, ...sparkle(0.6, 0.045)], { fade: 0.2, hall: 0.4 }),
  };
})();
