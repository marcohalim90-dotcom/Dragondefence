/* DREAMDYSIS: DRAGON DEFENCE — the battle, design v3 (docs/RANCANGAN.md D3, CONFIRMED C1–C4).
   One dragon per stage crawls out of the broken dungeon toward the city wall until its whole body is gone; every scale
   has its own life. The Commander stands on the wall from the start; Soul Shard scales call the other heroes one by one
   (Hero Call), Dragon Pearl scales give skill cards (Skill Selection). No DOM here besides the canvas: the UI
   (js/screens.js) owns the boxes and reports choices back, so this engine can move to the APK. */
(function () {
  const IMG = {};
  DD.img = function (src) {
    if (DD.skin) src = DD.skin(src);
    if (!IMG[src]) {
      const im = new Image();
      im.src = "assets/" + src;
      IMG[src] = im;
    }
    return IMG[src];
  };
  const ready = (im) => im && im.complete && im.naturalWidth > 0;
  /** Numbers without a top (C27 B, stages without end): K, M, B, T, then aa, ab … az, ba … */
  const SUF = ["", "K", "M", "B", "T"];
  DD.suffix = (e) => (e < SUF.length ? SUF[e] : String.fromCharCode(97 + (Math.floor((e - SUF.length) / 26) % 26)) + String.fromCharCode(97 + ((e - SUF.length) % 26)));
  DD.fmt = function (n) {
    n = Math.max(0, Math.ceil(n));
    if (!isFinite(n)) return "∞";
    if (n < 1000) return String(n);
    const e = Math.floor(Math.log10(n) / 3), v = n / Math.pow(1000, e);
    return v.toFixed(v < 10 ? 1 : 0).replace(/\.0$/, "") + DD.suffix(e);
  };

  const FONT = DD.SKIN ? '"Cinzel", "Crimson Pro", serif' : '"Lilita One", "Fredoka", sans-serif';
  const INK = "#1c121c"; // stone-950
  const SPEED = DD.DRAGON_SPEED || 26; // px per second the dragon crawls at ×1
  const TOP = 120; // under the 44 px HUD band (2026-10-30, audit A8: the head used to start under the menu button; 120 keeps 6 rows at 812)
  const WALL_H = 168; // the wall band at the bottom (vertical stages)
  const DRAG_PAD = 26; // the squad's middle can go this close to the screen edge
  // no. 110 (user: "saat layar dikecilkan pathnya menjadi kecil juga ... naga menjadi lebih cepat sampai"): every battle happens in
  // one fixed world, the 375 x 812 design screen, scaled to fit the phone (anchored at the bottom: the wall stays where it was;
  // spare room above or at the sides shows the hall). Path, speed, scale sizes and reach are then the same on every screen:
  // before, the dragon needed 60 s to the wall at 375 x 667, 88 s at 375 x 812, 114 s at 412 x 915 and 134 s at 480 x 914.
  DD.WORLD_W = DD.WORLD_W || 375;
  DD.WORLD_H = DD.WORLD_H || 812;
  // the squad (dx, dy from the Commander's feet): front row Commander + two beside him, back row four, the 8th (last
  // slot, Stage 25) behind the Commander; overlapping
  /** status + attacking element → reaction (both ways round) */
  const REACTS = { "wet+electric": "overload", "charged+water": "overload", "wet+fire": "steam", "burn+water": "steam", "burn+nature": "wildfire", "tangle+fire": "wildfire" };
  const STATUS_BY_ID = Object.fromEntries(Object.values(DD.STATUS).map((x) => [x.id, x]));
  // painted effects (Ledger Request Asset R5), drawn as light on top of the scale
  const STATUS_FX = { wet: "wet", burn: "burning", charged: "charged", tangle: "entangled", crack: "cracked" };
  const glow = (g, im, x, y, size, a) => {
    if (!ready(im)) return;
    g.save();
    g.globalCompositeOperation = "lighter";
    g.globalAlpha *= a;
    g.drawImage(im, x - size / 2, y - size / 2, size, size);
    g.restore();
  };
  /* C37: painted attack light. ATK(n) = 2a/attack/<n>.webp (light painted on black); RV(n) = the card opening's lights (ring,
     flare, bolts, burst). tinted() recolours a picture to a hero's colour, its brightness kept (a white-hot core stays white),
     its own transparency kept; soft() = one round soft glow in a colour, the only particle shape. */
  const ATK = (n) => DD.img(`2a/attack/${n}.webp`), RV = (n) => DD.img(`2a/reveal/${n}.webp`);
  const TINTED = new Map();
  const tinted = (im, col) => {
    if (!col) return im;
    const key = im.src + col;
    if (TINTED.has(key)) return TINTED.get(key);
    const c = document.createElement("canvas");
    c.width = Math.min(im.naturalWidth, 768); c.height = Math.round((im.naturalHeight * c.width) / im.naturalWidth);
    const x = c.getContext("2d");
    x.drawImage(im, 0, 0, c.width, c.height);
    x.globalCompositeOperation = "color"; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = "destination-in"; x.drawImage(im, 0, 0, c.width, c.height);
    TINTED.set(key, c);
    return c;
  };
  const SOFT = new Map();
  const LITE = new Map();
  const lite = (col) => {
    if (LITE.has(col)) return LITE.get(col);
    const m = /^#([0-9a-f]{6})$/i.exec(col || "");
    const v = m ? "#" + [0, 2, 4].map((i) => Math.round(parseInt(m[1].slice(i, i + 2), 16) * 0.6 + 255 * 0.4).toString(16).padStart(2, "0")).join("") : "#ffc37a";
    LITE.set(col, v);
    return v;
  };
  const soft = (col) => {
    if (SOFT.has(col)) return SOFT.get(col);
    const c = document.createElement("canvas"); c.width = c.height = 48;
    const x = c.getContext("2d"), r = x.createRadialGradient(24, 24, 0, 24, 24, 24);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.22, col); r.addColorStop(0.6, col.length === 7 ? col + "44" : col); r.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = r; x.fillRect(0, 0, 48, 48);
    SOFT.set(col, c);
    return c;
  };
  // no. 110: the soft light around a scale that carries an item (chest, pearl, shard), in that item's colour (#rrggbb)
  const HALO = new Map();
  const halo = (col) => {
    if (HALO.has(col)) return HALO.get(col);
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const x = c.getContext("2d"), r = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, col + "e6"); r.addColorStop(0.38, col + "b3"); r.addColorStop(0.62, col + "4d"); r.addColorStop(0.82, col + "14"); r.addColorStop(1, col + "00");
    x.fillStyle = r; x.fillRect(0, 0, 64, 64);
    HALO.set(col, c);
    return c;
  };
  // no. 110: the portal picture with its blurred rim faded out evenly (the cloudy dark band around the swirl read as a rough
  // purple outline): full from the middle to 60 % of the radius, then down to nothing at the edge
  let RIFT = null;
  const riftArt = (im) => {
    if (RIFT && RIFT.src === im) return RIFT.c;
    const w = im.naturalWidth, h = im.naturalHeight, c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d"); x.drawImage(im, 0, 0);
    const r = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) / 2);
    r.addColorStop(0, "#000"); r.addColorStop(0.6, "#000"); r.addColorStop(0.78, "rgba(0,0,0,0.6)"); r.addColorStop(0.9, "rgba(0,0,0,0.2)"); r.addColorStop(1, "rgba(0,0,0,0)");
    x.globalCompositeOperation = "destination-in"; x.fillStyle = r; x.fillRect(0, 0, w, h);
    RIFT = { src: im, c };
    return c;
  };
  /** A picture repeated along local +x from 0 to len, w high, moving forward by scroll px (a stream, a beam). */
  const tile = (g, im, len, w, scroll) => {
    const tw = (w * (im.width || im.naturalWidth)) / (im.height || im.naturalHeight);
    g.save(); g.beginPath(); g.rect(0, -w, len, w * 2); g.clip();
    for (let x = -(((scroll % tw) + tw) % tw); x < len; x += tw) g.drawImage(im, x, -w / 2, tw + 1, w);
    g.restore();
  };
  /** Still painting → its animation strip, when the user's video has been baked (Database Request Video). */
  const ANIM = {
    "dd/fx_proj_bolt.webp": ["anim_bolt", true], "dd/fx_hit_explosion.webp": ["anim_explosion", false], "dd/fx_hit_shock.webp": ["anim_shock", false],
    "dd/fx_area_firepool.webp": ["anim_firepool", true], "dd/fx_area_vortex.webp": ["anim_vortex", true], "dd/fx_area_lightning.webp": ["anim_lightning", false],
    "dd/fx_area_storm.webp": ["anim_storm", true], "dd/fx_area_goldcloud.webp": ["anim_goldrain", true], "dd/fx_area_slash.webp": ["anim_slash", false],
    "dd/fx_area_crater.webp": ["anim_spear", true], "dd/fx_area_portal.webp": ["anim_portal", true], "dd/fx_unit_beam.webp": ["anim_portal_beam", true],
    "dd/fx_unit_flame.webp": ["anim_flame", true], "dd/fx_unit_dragonling.webp": ["anim_dragonling", true], "dd/fx_unit_wolf.webp": ["anim_wolf", true],
    "dd/fx_proj_axe.webp": ["anim_spin_axe", true], "dd/fx_proj_hammer.webp": ["anim_spin_hammer", true], "dd/fx_proj_dagger.webp": ["anim_spin_dagger", true],
    "dd/fx_proj_ice.webp": ["anim_blizzard", true],
    "dd/fx_hit_phys_s.webp": ["anim_hit_phys", false], "dd/fx_hit_fire_s.webp": ["anim_hit_fire", false], "dd/fx_hit_water_s.webp": ["anim_hit_water", false],
    "dd/fx_hit_elec_s.webp": ["anim_hit_elec", false], "dd/fx_hit_nature_s.webp": ["anim_hit_nature", false],
  };
  /** Draws a painting, or the frame of its animation strip: loops run at 12 fps, one-shots follow prog (0 → 1). */
  function art(g, src, x, y, w, h, prog, time) {
    // only strips listed as baked are asked for (an unbaked one would be a 404 on every battle)
    const a = ANIM[src], strip = a && DD.ANIM_READY.includes(a[0]) && DD.img("dd/" + a[0] + ".webp");
    if (ready(strip)) {
      const n = Math.max(1, Math.round(strip.naturalWidth / strip.naturalHeight)), fw = strip.naturalWidth / n;
      const f = a[1] ? Math.floor((time || 0) * 12) % n : Math.min(n - 1, Math.floor((prog || 0) * n));
      g.drawImage(strip, f * fw, 0, fw, strip.naturalHeight, x, y, w, h);
      return true;
    }
    const im = DD.img(src);
    if (!ready(im)) return false;
    g.drawImage(im, x, y, w, h);
    return true;
  }
  const HIT_EL = { physical: "phys", fire: "fire", water: "water", electric: "elec", nature: "nature" };
  /** The painted projectile of each hero (Request Asset R24), pointing up in the picture. */
  const PROJ = { spellsword: "bolt", ebenezer: "coin", "half-goblin": "dagger", enchantress: "heart", mercenary: "tracer", dwarf: "axe", occultist: "skull",
    leprechaun: "rainbow", "jack-frost": "snowball", cassandra: "claw", crusader: "hammer", "tou-lak": "roar", alchemist: "flask", marpesia: "spear", "amar-suen": "crowncoin", tracker: "ice",
    // C33 G7: the new heroes' painted projectiles (sheet A29)
    minstrel: "note", scout: "arrow", klaus: "gift", archaeologist: "disc", "sugarplum-faerie": "sweet", tristan: "slash", "guild-leader": "crow", szopin: "blade",
    viking: "waxe", dreamwalker: "dream", "kael-dragon": "dragonblade" /* C36 G3 */ };
  /** The dungeon's ground shadow (as under the scales and heroes): a dark ellipse under an object of width w; alt = how
      high it flies, which pushes the shadow down and makes it smaller and lighter. */
  const shade = (g, x, y, w, alt) => {
    const k = Math.max(0.35, 1 - (alt || 0) / 260);
    g.save();
    g.globalAlpha *= 0.3 * k;
    g.fillStyle = "#000";
    g.beginPath();
    g.ellipse(x, y + w * 0.32 + (alt || 0), w * 0.42 * k, w * 0.14 * k, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  };
  const REACT_COL = { overload: "#ffe24a", steam: "#e8f4ff", wildfire: "#ff7a2a", shatter: "#bfefff" };
  const SQUAD = [[0, 0], [-46, -6], [46, -6], [-23, -30], [23, -30], [-69, -30], [69, -30], [0, -52]];
  const HERO_H = DD.SKIN ? { cmd: 118, other: 96 } : { cmd: 96, other: 78 }; // figure heights (Heroes vs Crazy Wiggler: a lone hero is ~120 px)
  const LANE = 15; // px between parallel bolts
  /** C28 (2026-11-02, user: "sekarang masukan semua sound effect"): a named sound from js/sfx.js; silent in the simulator. */
  const snd = (name, o) => DD.play && DD.play(name, o);
  const NO_GEAR = { el: {} };
  const SPECIAL_ICON = { pearl: "icons/icon_currency_dragon_blood.webp", shard: "icons/icon_soul_shard.webp", chest: "icons/icon_game_chest.webp" };
  const SPECIAL_RIM = { pearl: "#ff9a1f", shard: "#49b6ff", chest: "#ffd84a" };
  const BODY_ART = ["warren", "barracks", "springs", "bramble", "ember"];
  let PALETTES = {};
  fetch("assets/creatures/palettes.json").then((r) => r.json()).then((p) => (PALETTES = p)).catch(() => {});
  // C41 (user no. 87: "hero2 pada lair, seharusnya memiliki animasi ... mereka melakukan serangan"): every hero's attack, made
  // from its own back painting, the moving part cut out and turned at its joint (tools/anim-rig.py; no. 89: ChatGPT sheets
  // redrew the whole hero in every frame, "tidak konsisten"). One sheet
  // per hero (2a/heroes/anim/<id>.webp); the manifest gives the grid, the painted figure's place in a frame (fx, fy, figH)
  // and in the still sprite (bb), so a frame lines up with the still, and the frame where the blow lands (hit)
  let HERO_ANIM = {};
  fetch("assets/2a/heroes/anim/anim.json").then((r) => r.json()).then((a) => (HERO_ANIM = a)).catch(() => {});

  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }
  function label(g, txt, x, y, size, col, ol) {
    g.font = `${size}px ${FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineJoin = "round";
    g.strokeStyle = ol || INK;
    // one thin outline, no second (drop) pass (2026-10-30, user: "tulisannya semua ganggu. terlalu berisik"; was
    // 0.24 × size drawn twice: 25 thick black numbers at once)
    g.lineWidth = Math.max(2, size * 0.12);
    g.strokeStyle = ol || "rgba(28,18,28,0.85)";
    g.strokeText(txt, x, y);
    g.fillStyle = col || "#fff";
    g.fillText(txt, x, y);
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function segDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }
  function angDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d);
  }

  class Battle {
    /** opts: stage (DD.stage), formation [heroId] (the first starts on the wall), levels {id: lv}, mods (P.battleMods: dmgMul,
        hpMul, crit, critDmg, haste, area, dur, proj, boss, el), on {} */
    constructor(canvas, opts) {
      this.cv = canvas;
      this.ctx = canvas.getContext("2d");
      this.stage = opts.stage;
      this.on = opts.on || {};
      this.rnd = rng(opts.seed || Date.now());
      this.mods = Object.assign({ dmgMul: 1, hpMul: 1, hpFlat: 0, crit: 0, critDmg: 0, haste: 0, area: 0, dur: 0, proj: 0, boss: 0, el: {} }, opts.mods || {});
      this.speed = 1;
      this.paused = false;
      this.state = "fight";
      this.time = 0;
      this.coins = 0;
      this.kills = 0;
      this.chestGear = 0;
      this.shots = [];
      this.zones = [];
      this.waves = [];
      this.beams = [];
      this.fx = [];
      this.texts = [];
      this.summons = [];
      this.slowT = 0;
      this.slowF = 1;
      this.frozen = 0;
      this.tangleT = 0; // Entangled: the whole dragon ×0.9 (Nature status)
      this.reactAt = {}; // last time each reaction showed its name, so the text does not flood
      this.reacts = {}; // reactions this battle, per kind (pause > Damage Statistics)
      this.shake = 0;
      this.revives = DD.REVIVES;
      this.refresh = DD.FREE_REFRESH + (this.mods.refresh || 0); // C27 G: Royal Seal
      this.takeAll = DD.TAKE_ALL;
      this.callRefresh = DD.CALL_REFRESH + (this.mods.callRefresh || 0); // C27 G: Dragon Compass
      this.formX = 0;
      this.formY = 0;
      this.contact = 0;
      // heroes: the party; its first hero is on the wall from the start, the others wait for Soul Shards (C21: no captain)
      this.heroes = opts.formation.map((id, i) => {
        const def = DD.HERO[id];
        const lv = opts.levels[id] || 1;
        const m = DD.levelMods(def, lv);
        // card pools start at 0 (Lv 4 / Lv 6 extras go in them); the level multipliers stay apart (C12)
        const st = { dmg: 0, rate: 0, count: 0, pierce: 0, size: 0, dur: 0, bounce: 0, crit: 0, gold: 0 };
        for (const [k, v] of Object.entries(m.extra)) st[k] += v;
        // party attributes (C21): Haste → speed, Area → width / radius, Duration → % of the weapon's base time, Projectiles →
        // the hero's count (or bounces, or pierce), Crit DMG → the crit multiplier
        const M = this.mods, w = def.w;
        const G = (M.gear && M.gear[id]) || NO_GEAR; // the hero's own pieces (C29 D)
        st.rate += M.haste + (G.haste || 0);
        st.size += M.area + (G.area || 0);
        st.dur += (M.dur + (G.dur || 0)) * (w.dur || w.life || 2);
        if (M.proj) { if (def.upg.count !== undefined) st.count += M.proj; else if (def.upg.bounce !== undefined) st.bounce += M.proj; else if (def.upg.pierce !== undefined) st.pierce += M.proj; }
        return { def, id, i, lv, st, add: {}, g: G, dmgL: m.dmgL, rateL: m.rateL, critMul: m.critMul + M.critDmg + (G.critDmg || 0), evo: m.lv6, evo2: false, sk: i === 0 ? 1 : 0, onWall: i === 0, // Lv 6 starts evolved (RANCANGAN C5)
          cd: 0.3 + i * 0.1, shotsN: 0, hp: def.hp * m.hpMul, x: 0, y: 0, recoil: 0, dealt: 0,
          sprite: DD.img(`heroes/${id}/figure.webp`), at: -1, adur: 0 }; // at = time in the attack animation (C41), -1 = still
      });
      const hpSum = this.heroes.reduce((a, h) => a + h.hp, 0);
      this.wallMax = hpSum * this.mods.hpMul + this.mods.hpFlat; // C27 B: flat Wall HP (Party Level, equipment, artifacts)
      this.wall = this.wallMax;
      // the dragon's bite (bug list A5, Confirmed C26): WALL_BITE a second of the party's BASE wall (every party hero at Lv 1,
      // no HP bonus), softened by (wall / base)^WALL_HP_EXP, so more HP holds longer: with the square root, 4× the base HP
      // holds twice as long (14.3 s → 28.6 s). Every HP source counts (hero levels, Party Level, HP artifacts and slot levels,
      // Collection); a party without HP bonus holds 14.3 s as before, so the stage curve stays.
      const base = this.heroes.reduce((a, h) => a + h.def.hp, 0);
      this.bite = DD.WALL_BITE * base * Math.pow(Math.max(1, this.wallMax / base), 1 - DD.WALL_HP_EXP);
      this.buildDragon();
      this.resize();
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(canvas.parentElement);
      this.bindDrag();
      this._last = 0;
      this._raf = requestAnimationFrame((t) => this.loop(t));
    }

    destroy() {
      cancelAnimationFrame(this._raf);
      this._ro.disconnect();
      this.dead = true;
    }

    /* ------------------------------------------------------------ the dragon (C1, C2) */
    buildDragon() {
      const st = this.stage, n = st.segments, sp = DD.SPECIAL_EARLY && st.n <= DD.SPECIAL_EARLY.upTo ? { ...DD.SPECIAL, ...DD.SPECIAL_EARLY } : DD.SPECIAL; // C55: closer Pearls and Shards before Kael comes
      const body = [];
      for (let i = 0; i < n; i++) {
        const seg = { type: i === 0 ? "head" : "body", special: null, r: DD.SEG_R, taper: 1 };
        seg.hp = st.base * Math.pow(st.ramp, i / n);
        if (i === 0) { seg.hp *= DD.HEAD_MUL; seg.r = DD.HEAD_R; }
        else if (i < n - 4) {
          if (i >= sp.first && (i - sp.first) % sp.every === 0) seg.special = ((i - sp.first) / sp.every) % 2 === 0 ? "pearl" : "shard";
          else if (i >= sp.chestFirst && (i - sp.chestFirst) % sp.chestEvery === 0) seg.special = "chest";
          if (seg.special) seg.hp *= sp.hpMul;
        }
        body.push(seg);
      }
      // the life the rider and the boss used to carry goes into the body scales, each in proportion to its own life, so the
      // dragon keeps its total; the rider's place becomes a Dragon Pearl (its skill card, coins ×15) and the tail tip pays what
      // the boss paid (coins ×40) and shakes the field
      let extra = 0;
      if (st.rider) extra += st.base * Math.pow(st.ramp, 0.5) * DD.RIDER_MUL;
      if (st.boss) extra += st.base * st.ramp * DD.BOSS_MUL;
      const rest = body.filter((s) => s.type === "body");
      const sum = rest.reduce((a, s) => a + s.hp, 0);
      if (extra > 0 && sum > 0) rest.forEach((s) => (s.hp *= 1 + extra / sum));
      if (st.rider) {
        const mid = body[Math.floor(n * 0.5)];
        if (mid && mid.type === "body") { if (!mid.special) mid.hp *= sp.hpMul; mid.special = "pearl"; mid.coinMul = 15; }
      }
      for (let k = 1; k <= 4; k++) {
        const s = body[body.length - k];
        if (s && s.type === "body") s.taper = 1 - (5 - k) * 0.12;
      }
      const tail = body[body.length - 1];
      if (tail && tail.type === "body") { tail.tail = true; tail.special = null; tail.coinMul = 40; }
      // C27 H (Draft 23.8): the form's feature: a pair of limbs under some segments, or a variant segment in place of a plain one
      const form = DD.SKIN && DD.FORMS[st.form];
      if (form) body.forEach((s, i) => {
        if (s.type !== "body" || s.tail) return;
        for (const f of form.feats) {
          if (!(f.at ? f.at.includes(i) : i % f.every === 0)) continue;
          if (f.swap) { if (!s.special) s.swap = f.part; } else (s.under = s.under || []).push(f);
        }
      });
      // G2 (no. 99, Draft 38): the stage's 2–3 dragons in a row, sharing the life the single body had; the boss 1.5 × as thick
      const D = st.dragons;
      if (D && D.length) {
        const oldTotal = body.reduce((a, s) => a + s.hp, 0);
        const counts = D.map((d) => Math.max(14, Math.round(n * d.share))), N = counts.reduce((a, c) => a + c, 0);
        const nb = [];
        let g = 0;
        D.forEach((d, k) => {
          const c = counts[k];
          for (let i = 0; i < c; i++, g++) {
            const seg = { type: i === 0 ? "head" : "body", special: null, r: DD.SEG_R * (d.boss ? 1.08 : 1), taper: 1, d: k, li: i };
            seg.hp = st.base * Math.pow(st.ramp, g / N);
            if (i === 0) { seg.hp *= DD.HEAD_MUL; seg.r = DD.HEAD_R * (d.boss ? 1.15 : 1); seg.headCoin = 6 / D.length; }
            else if (i < c - 4) {
              if (g >= sp.first && (g - sp.first) % sp.every === 0) seg.special = ((g - sp.first) / sp.every) % 2 === 0 ? "pearl" : "shard";
              else if (g >= sp.chestFirst && (g - sp.chestFirst) % sp.chestEvery === 0) seg.special = "chest";
              if (seg.special) seg.hp *= sp.hpMul;
            }
            if (i >= c - 4 && i > 0) seg.taper = 1 - (4 - (c - 1 - i)) * 0.12;
            if (i === c - 1 && i > 0) { seg.tail = true; seg.special = null; seg.coinMul = Math.ceil(40 / D.length); }
            nb.push(seg);
          }
        });
        if (st.rider) { const mid = nb[Math.floor(nb.length * 0.5)]; if (mid && mid.type === "body" && !mid.tail) { if (!mid.special) mid.hp *= sp.hpMul; mid.special = "pearl"; mid.coinMul = 15; } }
        const f = oldTotal / nb.reduce((a, s) => a + s.hp, 0);
        nb.forEach((s) => { s.hp *= f; if (D[s.d].boss) s.hp *= DD.BOSS_HP; });
        // each dragon's form features, counted along that dragon
        nb.forEach((s) => {
          const fm = DD.SKIN && DD.FORMS[D[s.d].form];
          if (!fm || s.type !== "body" || s.tail) return;
          for (const ft of fm.feats) {
            if (!(ft.at ? ft.at.includes(s.li) : s.li % ft.every === 0)) continue;
            if (ft.swap) { if (!s.special) s.swap = ft.part; } else (s.under = s.under || []).push(ft);
          }
        });
        body.length = 0;
        body.push(...nb);
        this.dragons = D.map((d) => ({ ...d, headImg: DD.img(DD.SKIN ? DD.skinDragon(d.form, "head") : st.head) }));
      }
      body.forEach((s) => (s.max = s.hp));
      this.body = body;
      this.total = body.length;
      this.headImg = DD.img(DD.SKIN ? DD.skinDragon(st.form || st.el, "head") : st.head); // 2A: the stage's dragon form
    }

    get progress() {
      return 1 - this.body.length / this.total;
    }

    /* ------------------------------------------------------------ layout and track */
    resize() {
      // layout pixels (clientWidth), not the zoomed box: under the 375 px design width the page is zoomed (screens.js fit)
      const pe = this.cv.parentElement, box = pe.getBoundingClientRect();
      if (!box.width) return;
      const zoom = pe.clientWidth ? box.width / pe.clientWidth : 1;
      const dpr = Math.min((window.devicePixelRatio || 1) * zoom, 2.5);
      const cw = pe.clientWidth || box.width, ch = pe.clientHeight || box.height;
      this.dpr = dpr;
      this.cv.width = Math.round(cw * dpr);
      this.cv.height = Math.round(ch * dpr);
      this.cv.style.width = cw + "px";
      this.cv.style.height = ch + "px";
      // no. 110: the world (DD.WORLD_W x DD.WORLD_H) and where it sits on the screen
      this.cw = cw;
      this.ch = ch;
      this.ws = Math.min(cw / DD.WORLD_W, ch / DD.WORLD_H);
      this.wox = (cw - DD.WORLD_W * this.ws) / 2;
      this.woy = ch - DD.WORLD_H * this.ws;
      this.W = DD.WORLD_W;
      this.H = DD.WORLD_H;
      const W = this.W, H = this.H;
      if (this.stage.round) {
        // the dragon spirals in around the watchtower in the middle of the field
        this.cx = W / 2;
        this.cy = TOP + (H - TOP - 40) / 2;
        this.towerR = 44;
        const R0 = Math.min(W / 2, (H - TOP) / 2) + 40, R1 = this.towerR + 22, turns = DD.ROUND_TURNS;
        const steps = 900;
        const oval = this.stage.path === "oval", kx = oval ? 0.86 : 1, ky = oval ? 1.14 : 1; // C27 H: a tall oval uses the portrait field
        // no. 102: every dragon spirals in on its own arm from its own portal; K arms turned 360/K degrees apart, each turning
        // turns/K times, so the arms lie between each other as far apart as the turns of the one spiral were; an even count
        // turns a half step so no portal sits at the bottom over the heroes (2 arms: from the right and the left side)
        const arm = (k, K) => {
          const pts = [], a0 = K % 2 ? 0 : Math.PI / K;
          for (let j = 0; j <= steps; j++) {
            const t = j / steps;
            const a = -Math.PI / 2 + DD.roundDir(this.stage.n) * (a0 + (Math.PI * 2 * k) / K + (t * turns * Math.PI * 2) / K); // C27 H: the turning way changes every second round stage
            const r = R0 + (R1 - R0) * t;
            pts.push([this.cx + Math.cos(a) * r * kx, this.cy + Math.sin(a) * r * ky]);
          }
          return this.buildPath(pts, false);
        };
        this.lanePaths(arm);
        this.wallY = this.cy;
        this.fieldBottom = H - 10;
        this.formX = this.cx;
        this.formY = this.cy + 26;
        if (this.aimA === undefined) this.aimA = -Math.PI / 2;
      } else {
        this.wallY = H - WALL_H;
        this.fieldBottom = this.wallY;
        // Heroes vs Crazy Wiggler / Dragon Fever: the body winds back and forth in rows that touch, edge to edge over
        // the top of the field, then one run down to the wall; the lower field stays open ground
        const fh = this.wallY - 40 - TOP;
        const r = DD.SEG_R, gap = r * 2 + 2;
        const rows = Math.max(3, Math.min(DD.COIL_ROWS, Math.floor((fh * DD.COIL_BAND) / gap) + 1));
        const band = gap * (rows - 1);
        // no. 102 ("dungeon yang memiliki lebih dari 1 naga, itu muncul dari portal berbeda"): the field is cut into one lane
        // per dragon; each lane has its portal at its top middle and its own coil, then its own run down to the wall
        const lane = (k, K) => {
        // a lane as wide as the square root of the dragon's share of the body (the boss, and the stage's own dragon, get more room)
        const wd = K === 1 ? [1] : this.dragons.map((d) => Math.sqrt(d.share || 1 / K)), sum = wd.reduce((x, y) => x + y, 0);
        const x0 = (W * wd.slice(0, k).reduce((x, y) => x + y, 0)) / sum, x1 = x0 + (W * wd[k]) / sum, cx = (x0 + x1) / 2;
        const xs = [x0 + r + 6, x1 - r - 6];
        const P = [[cx, TOP - 140], [cx, TOP - 40]];
        this.rowYs = [];
        // C27 H: the shape of the coil changes with the stage (DD.pathKind); every row has the same shape, so the rows stay parallel
        const kind = this.stage.path || "rows", top0 = TOP + r * 0.6;
        const off = kind === "wave" ? (x) => gap * 0.32 * Math.sin((x / W) * Math.PI * 3)
          : kind === "slant" ? (x) => (x / W - 0.5) * gap * 0.9
          : kind === "zigzag" ? (x) => gap * 0.34 * (1 - 4 * Math.abs(((x / W) * 2.5) % 1 - 0.5)) : null;
        if (kind === "column" && K === 1) {
          // up and down the band in columns, left to right (an odd count, so the last one ends low and the run to the wall stays under them)
          let cols = Math.max(3, Math.floor((W - 2 * r - 12) / gap) + 1);
          if (cols % 2 === 0) cols--;
          const dx = (W - 2 * r - 12) / (cols - 1), yBot = top0 + band;
          for (let k = 0; k < cols; k++) { const x = r + 6 + dx * k; P.push(k % 2 ? [x, yBot] : [x, top0], k % 2 ? [x, top0] : [x, yBot]); }
          this.rowYs.push(top0, yBot);
        } else for (let k = 0; k < rows; k++) {
          const y = top0 + gap * k;
          this.rowYs.push(y);
          const a = xs[k % 2], b = xs[(k + 1) % 2];
          if (!off) P.push([a, y], [b, y]);
          else { const steps = kind === "zigzag" ? 30 : 10; for (let j = 0; j <= steps; j++) { const x = a + ((b - a) * j) / steps; P.push([x, y + off(x)]); } } // zigzag: dense points keep its corners sharp
        }
        P.push([cx, TOP + r * 0.6 + band + (fh - band) * 0.55], [cx, this.wallY - 18]);
        return this.buildPath(P, true);
        };
        this.lanePaths(lane);
        if (!this.formSet) { this.formX = W / 2; this.formSet = true; }
        this.formX = Math.max(DRAG_PAD, Math.min(W - DRAG_PAD, this.formX));
        this.formY = this.wallY + 30;
        this.aimA = -Math.PI / 2; // vertical stages: every forward weapon fires straight up; the player aims by dragging
      }
      this.placeHeroes();
    }

    /** no. 102: one track per dragon (lanes or spiral arms), each with its own portal. A dragon on a shorter track crawls
        faster by the same share (sc), so it takes as long from its portal to the wall as the one track did before (the
        stage strength is not compared with the curve, user no. 95). this.path / this.enterS stay the first track's. */
    lanePaths(make) {
      const K = Math.max(1, (this.dragons && this.dragons.length) || 1);
      const ref = make(0, 1);
      ref.enter = this.sAtY(TOP + 10, ref); // the head waits with its painting clear of the HUD (audit A8)
      this.refLen = ref.len;
      const run = Math.max(1, ref.len - ref.enter);
      this.paths = [];
      for (let k = 0; k < K; k++) {
        const p = K === 1 ? ref : make(k, K);
        p.enter = K === 1 ? ref.enter : this.sAtY(TOP + 10, p);
        p.sc = (p.len - p.enter) / run;
        this.paths.push(p);
      }
      this.path = this.paths[0];
      this.enterS = this.path.enter;
    }
    /** the track a scale crawls on, its portal point and its speed share */
    pathOf(e) {
      return (this.paths && e && this.paths[e.d || 0]) || this.path;
    }
    enterOf(e) {
      return this.pathOf(e).enter;
    }
    scOf(e) {
      return this.pathOf(e).sc || 1;
    }
    /** a scale next to e on the same dragon, out of its portal */
    sameOut(n, e) {
      return !!n && n.d === e.d && n.s > this.enterOf(n);
    }

    buildPath(P, smooth) {
      const px = [], py = [];
      if (smooth) {
        const pts = [P[0], ...P, P[P.length - 1]];
        for (let i = 1; i < pts.length - 2; i++) {
          const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
          const steps = Math.max(4, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 4));
          for (let k = 0; k < steps; k++) {
            const t = k / steps, t2 = t * t, t3 = t2 * t;
            const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
            px.push(f(p0[0], p1[0], p2[0], p3[0]));
            py.push(f(p0[1], p1[1], p2[1], p3[1]));
          }
        }
        px.push(P[P.length - 1][0]);
        py.push(P[P.length - 1][1]);
      } else {
        P.forEach(([x, y]) => { px.push(x); py.push(y); });
      }
      const cum = [0];
      for (let i = 1; i < px.length; i++) cum.push(cum[i - 1] + Math.hypot(px[i] - px[i - 1], py[i] - py[i - 1]));
      return { px, py, cum, len: cum[cum.length - 1] };
    }

    /** First point along the track that is inside the field (below y, or inside the screen for the spiral). */
    sAtY(y, path) {
      const { px, py, cum } = path || this.path;
      for (let i = 0; i < px.length; i++) {
        // round: inside the screen; no. 102: 60 px in from the sides so a portal on the edge shows whole, clear of the heroes' bar
        if (this.stage.round ? px[i] > 60 && px[i] < this.W - 60 && py[i] > TOP && py[i] < this.H - 120 : py[i] >= y) return cum[i];
      }
      return 0;
    }

    at(s, k) {
      const { px, py, cum, len } = (this.paths && k !== undefined && this.paths[k]) || this.path;
      if (s <= 0) return { x: px[0], y: py[0] };
      if (s >= len) return { x: px[px.length - 1], y: py[py.length - 1] };
      let lo = 0, hi = cum.length - 1;
      while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        if (cum[m] <= s) lo = m; else hi = m;
      }
      const t = (s - cum[lo]) / (cum[hi] - cum[lo] || 1);
      return { x: px[lo] + (px[hi] - px[lo]) * t, y: py[lo] + (py[hi] - py[lo]) * t };
    }

    gap(p, e) {
      return (p.r * p.taper + e.r * e.taper) * (p.type === "head" || e.type !== "body" || p.type !== "body" ? 0.95 : 0.9) + (p.d !== e.d ? DD.DRAGON_GAP || 0 : 0); // G2: room between two dragons
    }

    /** G2: the painted form of the dragon a scale belongs to */
    formOf(e) {
      const d = this.dragons && e && this.dragons[e.d];
      return (d && d.form) || this.stage.form || this.stage.el;
    }

    placeChain() {
      // at the start every dragon waits in its own portal (no. 102): the first nose at the entrance, the others deep inside
      // until it is their turn (lay())
      this.go = {};
      let s = 0;
      for (let i = 0; i < this.body.length; i++) {
        const e = this.body[i], first = !i || this.body[i - 1].d !== e.d;
        if (first) s = this.enterOf(e) - (i ? 400 : 4);
        else s -= this.gap(this.body[i - 1], e);
        e.s = s;
      }
      if (this.body.length) this.go[this.body[0].d || 0] = true;
      this.placed = true;
    }
    /** lays dragon d out behind its portal, nose at the entrance (when its turn comes) */
    lay(d) {
      let s = 0, prev = null;
      for (const e of this.body) {
        if ((e.d || 0) !== d) continue;
        s = prev ? s - this.gap(prev, e) : this.enterOf(e) - 4;
        e.s = s;
        prev = e;
      }
    }

    placeHeroes() {
      // one squad that moves together (Heroes vs Crazy Wiggler's carpet): the Commander in front in the middle, the
      // called heroes beside and behind him, close enough to overlap
      const onWall = this.heroes.filter((h) => h.onWall);
      onWall.forEach((h, k) => {
        const [dx, dy] = SQUAD[k] || [0, 0];
        h.dx = dx;
        h.dy = dy;
      });
    }

    heroPos(h) {
      if (this.stage.round) {
        // round stages: the squad stands on the tower and turns to face the aim
        const c = Math.cos(this.aimA + Math.PI / 2), s = Math.sin(this.aimA + Math.PI / 2);
        const dx = h.dx * 0.62, dy = h.dy * 0.62;
        return { x: this.formX + dx * c - dy * s, y: this.formY - 30 + dx * s + dy * c };
      }
      return { x: Math.max(18, Math.min(this.W - 18, this.formX + h.dx)), y: this.formY - 30 + h.dy };
    }

    /** The point a forward weapon leaves from: just in front of the hero, along the aim. */
    muzzle(h) {
      const p = this.heroPos(h);
      return { x: p.x + Math.cos(this.aimA) * 22, y: p.y + Math.sin(this.aimA) * 22 };
    }

    /** Offsets a muzzle sideways (perpendicular to the aim) for parallel lanes. */
    side(o, d) {
      return { x: o.x - Math.sin(this.aimA) * d, y: o.y + Math.cos(this.aimA) * d };
    }

    bindDrag() {
      // drag anywhere to move the heroes along the wall (round: around the tower)
      let drag = null;
      const pos = (e) => {
        const r = this.cv.getBoundingClientRect(), k = this.cv.clientWidth ? this.cv.clientWidth / r.width : 1, s = this.ws || 1;
        return { x: ((e.clientX - r.left) * k - (this.wox || 0)) / s, y: ((e.clientY - r.top) * k - (this.woy || 0)) / s }; // no. 110: screen → world
      };
      // vertical stages: drag left/right moves the squad, and so its straight-up lanes (Dragon Fever aims by position);
      // round stages: the squad stays on the tower and faces the finger (the aim stays where it was let go)
      const aimAt = (p) => { if (Math.hypot(p.x - this.cx, p.y - this.cy) > 12) this.aimA = Math.atan2(p.y - this.cy, p.x - this.cx); };
      this.cv.addEventListener("pointerdown", (e) => {
        if (this.paused) return;
        const p = pos(e);
        drag = { x: p.x, y: p.y, fx: this.formX, fy: this.formY };
        this.cv.setPointerCapture(e.pointerId);
        if (this.stage.round) aimAt(p);
        if (this.on.dragged) this.on.dragged();
      });
      this.cv.addEventListener("pointermove", (e) => {
        if (!drag || this.paused) return;
        const p = pos(e);
        if (this.stage.round) aimAt(p);
        else this.formX = Math.max(DRAG_PAD, Math.min(this.W - DRAG_PAD, drag.fx + (p.x - drag.x)));
      });
      const end = () => (drag = null);
      this.cv.addEventListener("pointerup", end);
      this.cv.addEventListener("pointercancel", end);
    }

    /* ------------------------------------------------------------ loop */
    loop(t) {
      if (this.dead) return;
      const real = Math.min(0.05, (t - (this._last || t)) / 1000);
      this._last = t;
      if (this.W && !this.placed) this.placeChain();
      if (this.placed && !this.paused && this.state === "fight" && !window.DD_SPLASH) { // no. 105: still under the company splash
        const dt = real * this.speed;
        const n = this.speed > 1 ? 2 : 1;
        for (let k = 0; k < n; k++) this.step(dt / n);
      }
      if (this.W) this.draw(real);
      if (this.on.frame) this.on.frame(this);
      this._raf = requestAnimationFrame((tt) => this.loop(tt));
    }

    step(dt) {
      this.time += dt;
      this.moveDragon(dt);
      if (this.state !== "fight") return;
      for (const h of this.heroes) if (h.onWall) this.heroAct(h, dt);
      this.moveShots(dt);
      this.moveWaves(dt);
      this.moveSummons(dt);
      if (this.stepC43) this.stepC43(dt); // C43: new attacks, periodic Evo effects, poison and other marks (js/battle-c43.js)
      this.zones = this.zones.filter((z) => {
        z.t -= dt;
        z.tick -= dt;
        if (z.tick <= 0) {
          z.tick = 0.25;
          const zel = z.el2 && (z.n = (z.n || 0) + 1) % 2 ? z.el2 : z.el; // C46 Mixed Brew: every other tick the zone's second element
          if (zel) z.hero._el = zel; // C43: the zone keeps its own element
          for (const e of this.visible()) if (dist(this.pos(e), z) < z.r + e.r * 0.6) this.hit(z.hero, e, z.dps * 0.25, true);
          if (zel) z.hero._el = null;
        }
        return z.t > 0;
      });
      this.burnTick = (this.burnTick || 0) - dt;
      if (this.burnTick <= 0) {
        // Burning: what is left of the burn pool, spread over the time it has left
        this.burnTick = 0.25;
        for (const e of this.body.slice()) {
          if (!e.burnP) continue;
          const left = e.burnT - this.time;
          if (left <= 0 || e.st !== "burn") { e.burnP = 0; continue; }
          const d = e.burnP * Math.min(1, 0.25 / left);
          e.burnP -= d;
          this.sumDamage(e, d, e.burnH && e.burnH.def.col); // C39: burning shows its damage too
          this.deal(e.burnH, e, d);
        }
      }
      for (const e of this.body) if (e.hit > 0) e.hit -= dt;
      this.flushSums();
      this.fx = this.fx.filter((p) => {
        p.t -= dt;
        if (p.wv) {
          // C39: a flame puff stays in its place in the live cone (angle offset, distance from the hand)
          p.u += p.sp * dt;
          const o = p.wv.o, a = p.wv.ang + p.off;
          if (o && a === a) { p.x = o.x + Math.cos(a) * p.u; p.y = o.y + Math.sin(a) * p.u; }
          return p.t > 0;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (p.g || 0) * dt;
        return p.t > 0;
      });
      this.texts = this.texts.filter((p) => ((p.t -= dt), (p.y -= 38 * dt), p.t > 0));
      if (this.blizzard > 0) this.blizzard -= dt;
      this.beams = this.beams.filter((b) => (b.t -= dt) > 0);
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 30);
      if (!this.body.length) this.finish(true);
    }

    moveDragon(dt) {
      if (this.slowT > 0) this.slowT -= dt;
      if (this.frozen > 0) this.frozen -= dt / (1 + (this.mods.freeze || 0)); // C44 Winter Heart
      if (this.tangleT > 0) this.tangleT -= dt;
      const b = this.body;
      if (!b.length) return;
      if (!this.go) this.go = { [b[0].d || 0]: true };
      const v0 = DD.DRAGON_SPEED * (1 - (this.mods.slow || 0)); // C27 G: Void Hourglass
      const f = (this.frozen > 0 ? 0 : this.slowT > 0 ? this.slowF : 1) * (this.tangleT > 0 ? DD.STATUS.nature.slow : 1);
      // no. 102: each dragon crawls its own track from its own portal, all at once: the second leaves its portal
      // DD.DRAGON_STAGGER s after the first, the third after as long again (at once when every dragon before it is dead); on a
      // shorter track a dragon crawls slower by the same share (sc), so all of them together come on as fast as the one body
      // did, and each needs as long to reach the wall; one bite on the wall per dragon touching it
      let biting = 0, bk = 0;
      for (let i = 0; i < b.length; ) {
        const d = b[i].d || 0, P = this.pathOf(b[i]);
        let j = i;
        while (j < b.length && (b[j].d || 0) === d) j++;
        if (!this.go[d] && (i === 0 || this.time >= d * (DD.DRAGON_STAGGER || 10))) { this.go[d] = true; this.lay(d); }
        if (this.go[d]) {
          const v = v0 * P.sc * ((this.rageK && this.rageK[d]) || 1); // G2: Rage, per dragon
          for (let n = i; n < j; n++) {
            const e = b[n];
            if (n === i) e.s = Math.min(P.len, e.s + v * f * dt);
            else {
              const p = b[n - 1];
              const want = p.s - this.gap(p, e);
              // a gap closes fast (Dragon Fever)
              const fast = e.s < want - 2 && f > 0 ? DD.DRAGON_SPEED * 3.4 * P.sc : v * f;
              e.s = Math.min(want, e.s + fast * dt);
            }
          }
          if (b[i].s >= P.len - 0.5) { biting += (this.biteK && this.biteK[d]) || 1; bk = d; } // v4 B2: a boss bites harder, Venom too (js/v4-dragons.js)
        }
        i = j;
      }
      // the front of each dragon bites the wall while it touches it
      this.contact = biting ? this.contact + dt : 0;
      if (this.contact > 0 && this.state === "fight") {
        this.wall -= this.bite * dt * biting;
        this.shake = Math.max(this.shake, 3);
        snd("wall_bite"); // C28 C: one bite every 0.38 s while the head is at the wall
        if (this.rnd() < dt * 6) { const L = (this.paths ? this.paths[bk] : this.path).len, q = this.at(L, bk); this.burst(q.x, q.y, "#ee3c46", 4); } // C45: the seeded random (burst() draws from it too), so a seed replays the same battle
        if (this.wall <= 0 && this.mods.phoenix && !this.phoenixUsed) { this.phoenixUsed = true; this.wall = this.wallMax * this.mods.phoenix; this.shake = 10; snd("phoenix"); } // C27 G: Phoenix Feather
        if (this.wall <= 0) {
          this.wall = 0;
          this.state = "down";
          snd("wall_break");
          if (this.revives > 0 && this.on.down) this.on.down(this);
          else this.finish(false);
        }
      }
    }

    /** Pushes the whole dragon back along the track (the body never tears). */
    knock(d) {
      const b = this.body;
      if (!b.length) return;
      // no. 102: each dragon along its own track, by the same share of it (a dragon still in its portal stays there)
      for (let i = 0; i < b.length; i++) {
        const e = b[i], E = this.enterOf(e);
        if (!i || b[i - 1].d !== e.d) { if (e.s > E + 10) e.s = Math.max(E + 10, e.s - d * this.scOf(e)); continue; }
        const want = b[i - 1].s - this.gap(b[i - 1], e);
        if (e.s > want) e.s = want;
      }
    }

    revive() {
      snd("revive");
      this.revives--;
      this.wall = this.wallMax;
      this.knock((this.refLen || this.path.len) * 0.22);
      this.state = "fight";
      this.contact = 0;
    }

    pos(e) {
      return this.at(e.s, e.d);
    }
    visible() {
      return this.body.filter((e) => e.s > this.enterOf(e));
    }
    nearest(o, list) {
      let best = null, bd = 1e9;
      for (const e of list || this.visible()) {
        const d = dist(this.pos(e), o);
        if (d < bd) { bd = d; best = e; }
      }
      return best;
    }
    randomOf(list) {
      return list.length ? list[Math.floor(this.rnd() * list.length)] : null;
    }
    /** Scales in the upper part of the field, where the zone and flying weapons go (Draft 19); all visible if none. */
    upperVis(frac = 0.85) {
      const vis = this.visible();
      if (this.stage.round) return vis;
      const lim = TOP + (this.fieldBottom - TOP) * frac;
      const up = vis.filter((e) => this.pos(e).y < lim);
      return up.length ? up : vis;
    }
    /** The densest part of the body: the scale with the most scales within r of it, never the head (Draft 19: zones
        land where the body is thickest, not on the face). */
    densest(r, list) {
      const L = list || this.upperVis();
      let best = null, bn = -1;
      const len = this.body.length || 1;
      for (const e of L) {
        if (e === this.body[0] && L.length > 1) continue;
        const p = this.pos(e);
        let n = 0;
        for (const f of L) if (Math.abs(this.pos(f).x - p.x) < r && dist(this.pos(f), p) < r) n++;
        // the front of the body (nearer the wall) counts a little more, so zones do not only grind the far coil
        n += 3 * (1 - this.body.indexOf(e) / len);
        if (n > bn) { bn = n; best = e; }
      }
      return best;
    }
    /** A random scale, leaning toward the front of the body (the part that reaches the wall first); not the head-lock
        the user rejected for Kael (C11.1): any scale can be picked. */
    pickFront(list) {
      if (!list.length) return null;
      const L = list.slice().sort((a, b) => b.s - a.s);
      return L[Math.floor(Math.pow(this.rnd(), 1.8) * L.length)];
    }
    /** A painted effect (Request Asset R24–R27) that grows, turns and fades. */
    fxImg(src, x, y, size, t, o) {
      if (this.fx.length > 140) return;
      this.fx.push({ img: src, x, y, vx: 0, vy: 0, size, t, max: t, rot: 0, ...(o || {}) });
    }

    /* ------------------------------------------------------------ heroes */
    heroAct(h, dt) {
      h.recoil = Math.max(0, h.recoil - dt);
      this.animStep(h, dt);
      const w = h.def.w, st = h.st;
      const rally = 1; // C53: Rallying Cry is in rateOf now (the skull swarm never got it)
      if (h.def.kind === "orbit") {
        if ((h.hum = (h.hum || 0) - dt) <= 0) { h.hum = 2.4; snd("atk_" + h.def.id); this.animStart(h, 0, true); } // C28: the skulls whisper now and then; C41: the hero gestures
        return this.orbit(h, dt);
      }
      h.cd -= dt * this.rateOf(h) * rally;
      // C41: the wind-up starts early enough that the blow lands on the shot
      const an = this.animOf(h);
      if (an && h.at < 0 && h.cd > 0 && h.cd <= this.animLead(h, an) * this.rateOf(h) * rally) this.animStart(h, 0);
      if (h.again > 0 && (h.again -= dt) <= 0) { const vis0 = this.visible(); if (vis0.length) this.fire(h, this.heroPos(h), vis0); if (--h.againN > 0) h.again = 0.14; else h.againN = 0; }
      if (h.cd > 0) return;
      const o = this.heroPos(h);
      const vis = this.visible();
      if (!vis.length) return;
      h.cd = w.cd;
      h.recoil = 0.14;
      h.shotsN++;
      if (h.at < 0) this.animStart(h, 1); // no wind-up was seen (the first shot, a held shot): from the blow
      h.afired = true;
      this.fire(h, o, vis);
      snd("atk_" + h.def.id); // C28 B: the hero's own attack sound
      const tw = this.stacks(h, "twinshot"); // C43: Twin Shot / Wings of Ruin are Repeatable: one more volley per card
      if (tw && !h.againN) { h.again = 0.14; h.againN = tw; }
    }

    /** C41: the hero's attack animation from the manifest (null while it has none or it is not loaded yet). */
    animOf(h) {
      if (h.an) return h.an;
      const A = HERO_ANIM[h.id];
      if (!A) return null;
      h.an = { ...A, img: DD.img("2a/heroes/anim/" + h.id + ".webp"), nat: A.n / (A.fps || 24) };
      return h.an;
    }
    /** How long one attack plays: the clip's own length, at most 85 % of the time between two shots, 0.3 to 0.9 s. */
    animDur(h, an) {
      return Math.max(0.3, Math.min(0.9, an.nat, (0.85 * (h.def.w.cd || 2.4)) / this.rateOf(h)));
    }
    animLead(h, an) {
      return (this.animDur(h, an) * (an.hit + 0.5)) / an.n;
    }
    animStart(h, fromHit, noShot) {
      const an = this.animOf(h);
      if (!an || !ready(an.img)) return;
      h.adur = this.animDur(h, an);
      h.at = fromHit ? (h.adur * (an.hit + 0.5)) / an.n : 0;
      h.afired = !!fromHit || !!noShot;
      h.await = 0;
    }
    /** Wind-up to the blow; at the blow it waits for the shot (at most 0.25 s) and holds while the hero's own stream
        (Ysmay's flame, a jet) still pours; then the recovery back to the still pose. */
    animStep(h, dt) {
      if (h.at < 0) return;
      const an = h.an, hitT = (h.adur * (an.hit + 0.5)) / an.n;
      if (h.at < hitT) { h.at = Math.min(hitT, h.at + dt); return; }
      const pours = this.waves.some((wv) => wv.hero === h && (wv.type === "spray" || wv.type === "jet") && wv.t > 0.08);
      // C41 (no. 88): while the stream pours the blow pose stays, its frames pulsing (hit, hit+1, hit, hit-1) so the hand and fire live
      h.ahold = pours;
      if (pours) { h.aht = (h.aht || 0) + dt; return; }
      if (!h.afired && (h.await += dt) < 0.25) return;
      if ((h.at += dt) >= h.adur) h.at = -1;
    }

    /** Attacks per second multiplier: Lv 3 ×1.3, then (1 + Speed cards). */
    rateOf(h) {
      return h.rateL * (1 + h.st.rate);
    }

    /** Damage of one hit: hero level and cards × team ATK × element weakness × special flags; crit rolled here. */
    dmgOf(h, base, e) {
      // base × level × (1 + DMG cards) × team (ATK and Damage groups, from the meta) — C12
      // × the pattern coefficient (DD.PATTERN_K, Draft 19 / C20): the new patterns hit more or fewer scales, so each hit
      // is scaled until the hero deals the same DPS as before the rework (sim-node heroes, 2026-10-30)
      let d = base * DD.DMG_SCALE * (DD.PATTERN_K[h.def.id] || 1) * ((h.evo && DD.PATTERN_KE[h.def.id]) || 1) * h.dmgL * (1 + h.st.dmg) * (this.mods.dmgMul + (h.g.atk || 0)); // party ATK + the hero's own pieces (C29 D)
      if (this.stage.weak && h.def.el === this.stage.weak) d *= DD.WEAK_MULT;
      d *= 1 + (this.mods.el[h.def.el] || 0) + ((h.g.el || {})[h.def.el] || 0); // party element DMG (C21) + the hero's Edge effect
      if (e && e.type !== "body") d *= 1 + this.mods.boss + (h.g.boss || 0); // party Head DMG on the head (the only non-body piece since C24)
      if (e) {
        if (e.type !== "body" && this.has(h, "bounty")) d *= 2;
        if (e.gold && this.heroes.some((x) => x.onWall && this.has(x, "crown"))) d *= 2;
      }
      const crit = this.rnd() < (h.def.w.crit || 0) + h.st.crit + this.mods.crit + (h.g.crit || 0);
      return { d: crit ? d * h.critMul : d, crit };
    }

    /** One attack. Aim (user 2026-10-24: no more "auto ke muka"; per-hero geometry from the design panel in
       docs/RANCANGAN.md D15): a weapon leaves from its own hero along the squad's aim — straight up on vertical stages,
       so the player aims by dragging (Dragon Fever / Heroes vs Crazy Wiggler). Nothing picks a target across the
       field: the marksman picks the strongest scale IN HIS COLUMN, bounces and chains run along the body after the
       first hit. A weapon with nothing in its lane holds its shot. */
    fire(h, o, vis) {
      const w = h.def.w, st = h.st, k = h.def.kind, A = this.aimA;
      const m = this.muzzle(h);
      const base = { hero: h, x: m.x, y: m.y, col: h.def.col, kind: k, t: 0 };
      const evo = (flag) => this.has(h, flag); // C43: any of the hero's Evo Cards
      const lanes = (n, gap) => Array.from({ length: n }, (_, i) => this.side(m, (i - (n - 1) / 2) * gap));
      const fly = (q, a, extra) => this.shots.push({ ...base, x: q.x, y: q.y, ang: a, vx: Math.cos(a) * w.speed, vy: Math.sin(a) * w.speed, fly: true, hits: new Set(), ...extra });
      const hold = () => (h.cd = 0.15); // nothing in the lane: try again in a moment, the cooldown is kept
      if (k === "pierce") {
        const n = w.count + st.count, pierce = w.pierce + st.pierce;
        if (w.fanStep) {
          // Nim: a fan, 8° a dagger; Heist = three times the daggers spread evenly over a fixed 80° cone
          // Nim (Draft 19, Terbang): daggers fly curved paths to scales in the upper field, then curve on to the next one
          const N = evo("fan") ? n * 3 : n;
          const pool = this.upperVis(0.6);
          for (let i = 0; i < N; i++) {
            const t = this.pickFront(pool);
            if (!t) return hold();
            this.shots.push({ ...base, kind: "curve", p0: { x: m.x, y: m.y }, side: (i % 2 ? 1 : -1) * (70 + this.rnd() * 90), target: t, u: 0, dur: 0.5, pierce, hits: new Set(), spin: 0, trail: [] });
          }
        } else {
          // Kael: count = parallel bolts LANE px apart; pierce = scales one bolt passes through
          for (const q of lanes(n * (h.countMul || 1), LANE)) fly(q, A, { pierce, split: evo("split"), edge: this.has(h, "edgeBounce") ? 1 : 0, trail: [] });
          this.fxImg("dd/fx_hit_flash.webp", m.x, m.y - 6, 34, 0.12, { grow: 0.6 });
        }
      } else if (k === "jet") {
        // a straight stream up its own lane, stopping at the first scale; count = parallel streams 16 px apart
        const n = (w.count || 1) + st.count;
        // Ebenezer (Draft 19, Sapuan): the coin fountain sweeps left and right while it sprays
        for (let i = 0; i < n; i++) this.waves.push({ type: "jet", hero: h, lat: (i - (n - 1) / 2) * 16, t: w.dur + st.dur, dur: w.dur + st.dur, ph: i * 1.3, tick: 0, width: w.width * (1 + st.size) * (evo("widejet") ? 1.5 : 1) });
      } else if (k === "pin") {
        // Marpesia: the spear falls from the top of her column onto the scale furthest along it (the back of the body,
        // where riders and the boss crawl) and stays pinned in it, burning, even when the squad moves
        // Draft 19 (Area): the spear of light falls from the sky onto the densest part of the body
        // C53 (no. 114): Spears cards were never read — now one spear per count, each on the densest spot away from the others
        const n = (w.count || 1) + st.count, picks = [];
        for (let i = 0; i < n; i++) {
          const t = i ? this.densest(60, this.visible().filter((x) => picks.every((q) => dist(this.pos(x), this.pos(q)) > 2 * DD.SEG_R))) : this.densest(60);
          if (!t) { if (!i) return hold(); break; }
          picks.push(t);
          this.waves.push({ type: "pin", hero: h, target: t, t: w.dur + st.dur + 0.3, drop: 0.3 + 0.08 * i, tick: 0, r: 12 * (1 + st.size), ox: m.x, oy: m.y, oa: A });
        }
      } else if (k === "beam") {
        // Sera (Draft 19, Lintas layar): a golden portal opens at the screen edge and the beam crosses the whole field
        // through the densest part of the body; Skyfall = three beams fanned through the same point
        const wd = w.width * (1 + st.size);
        const t = this.densest(60);
        if (!t) return hold();
        const P = this.pos(t), from = h.shotsN % 2 ? 1 : -1, tilt = (0.15 + this.rnd() * 0.3) * (this.rnd() < 0.5 ? -1 : 1);
        const n = evo("skyfall") ? 3 : 1;
        for (let i = 0; i < n; i++) this.crossLance(h, P, tilt + (i - (n - 1) / 2) * 0.55, wd, from);
      } else if (k === "spray") {
        const dirs = evo("triple") ? [-0.45, 0, 0.45] : [0];
        // Ysmay (Draft 19, Sapuan): the flame sweeps 120° left to right and back while it burns
        for (const d of dirs) this.waves.push({ type: "spray", hero: h, off: d, t: w.dur + st.dur, dur: w.dur + st.dur, tick: 0, len: w.len, angle: w.angle * (1 + (st.size * 2) / 3) });
      } else if (k === "bounce") {
        const jumps = w.bounces + st.bounce;
        if (w.diag) {
          // Finnick: an instant arc 30° off the aim, left and right in turn (Pot of Gold: both), then it runs along
          // the body both ways from the scale it hits
          // Finnick (Draft 19, Terbang): a rainbow arcs high onto a scale in the upper field, then runs along the body
          const sides = evo("twin") ? [-1, 1] : [h.shotsN % 2 ? 1 : -1];
          const pool = this.upperVis(0.7);
          for (const sd of sides) {
            const first = this.pickFront(pool);
            if (!first) return hold();
            const p = this.pos(first);
            this.beams.push({ x1: m.x, y1: m.y, x2: p.x, y2: p.y, w: 5, t: 0.35, max: 0.35, col: h.def.col, arc: sd, rainbow: true });
            this.fxImg("dd/fx_hit_sparkle.webp", p.x, p.y, 54, 0.3, { grow: 0.5 });
            this.chainBody(h, p, first, jumps, "both");
          }
        } else if (w.chain) {
          // Alexandra: lightning up her lane, then jumps to the nearest unhit scale within 160 px (a web)
          // Alexandra (Draft 19, Layar penuh): a storm cloud, then strikes on random scales anywhere on the field, each
          // jumping on to its neighbours (Infinite Library: twice the strikes)
          const strikes = (evo("twin") ? 2 : 1) * 3;
          let sx = 0, any = 0;
          for (let i = 0; i < strikes; i++) {
            const t = this.pickFront(vis);
            if (!t) break;
            const p = this.pos(t);
            sx += p.x; any++;
            this.beams.push({ x1: p.x + (this.rnd() - 0.5) * 40, y1: Math.max(0, p.y - 260), x2: p.x, y2: p.y, w: 4, t: 0.28, max: 0.28, col: h.def.col, bolt: true });
            this.fxImg("dd/fx_hit_elec_l.webp", p.x, p.y, 70, 0.3, { grow: 0.4 });
            this.chain(h, p, t, jumps);
          }
          if (!any) return hold();
          this.fxImg("dd/fx_area_storm.webp", sx / any, TOP - 14, 200, 0.7, { fade: true, alpha: 0.6 });
          this.shake = Math.max(this.shake, 3);
        } else {
          // Velis: the heartdrop flies up her lane; after the first scale it hops along the body toward the head
          // Velis (Draft 19, Terbang): the heart flutters up in a sine wave and dives onto a scale in the upper field
          const t = this.pickFront(this.upperVis(0.6));
          if (!t) return hold();
          this.shots.push({ ...base, target: t, speed: w.speed * 0.85, bounces: jumps, hits: new Set(), wob: 1, trail: [] });
        }
      } else if (k === "boomerang") {
        // thrown straight up the lane and back to Borrik; count = axes in parallel lanes 24 px apart
        // Borrik (Draft 19, Terbang): the axe flies a wide loop over the field (out on the roomier side, across the top,
        // back down the other side) and passes through every scale on the way; extra axes follow 0.15 s apart
        const roomy = m.x < this.W / 2 ? -1 : 1;
        lanes(w.count + st.count, 24).forEach((q, i) => {
          this.shots.push({ ...base, x: q.x, y: q.y, ox: q.x, oy: q.y, ell: true, dir: roomy, th: -i * 0.06, T: (w.range * 2) / w.speed, half: false,
            r: 18 * (1 + st.size) * (evo("bigaxe") ? 2 : 1), hits: new Set(), spin: 0 });
        });
      } else if (k === "hunter") {
        // Garran: the strongest scale in his own column (±30 px of his lane), straight through the weaker ones
        const col = vis.filter((e) => this.onRay(m, A, this.pos(e), 60 * (1 + st.size)));
        if (!col.length) return hold();
        const t = col.reduce((a, e) => (e.hp > a.hp ? e : a), col[0]);
        // Draft 19: a red reticle marks the scale for 0.35 s, then the tracer streaks in
        this.shots.push({ ...base, target: t, speed: w.speed, hits: new Set(), wait: 0.35, trail: [] });
      } else if (k === "charm") {
        // Cassandra: an instant lash straight ahead (w.range px) on the first scale in her lane
        // Cassandra (Draft 19, Area): three giant claw slashes cross the densest part of the body
        const t = this.densest(70);
        if (!t) return hold();
        const p = this.pos(t), rot = this.rnd() * Math.PI;
        // C37: the painted claw marks in the hero's colour (Cassandra violet, Tristan ember), three crossing strokes
        // (the picture already holds three strokes; with the Evo that strikes twice, a second set crosses it)
        for (let i = 0; i < (this.has(h, "double") ? 2 : 1); i++) this.fx.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: 0.45, max: 0.45, col: h.def.col, claw: 60, ang: rot + i * 1.5 });
        const times = this.has(h, "double") ? 2 : 1;
        for (const e of vis) if (!e.dead && dist(this.pos(e), p) < 70 + e.r * 0.5) for (let i = 0; i < times; i++) this.hit(h, e, w.dmg);
        this.frozen = Math.max(this.frozen, w.stun + st.dur * 0.2 + (this.danger && this.danger() ? st.stun || 0 : 0)); // C43 Stun Time card; C53: the card's part only near the wall
      } else if (k === "gold") {
        // Amar-Suen (Draft 19, Layar penuh): golden rain, crowned coins fall from the sky onto random scales anywhere
        const drops = 3 + Math.floor(st.count || 0);
        for (let i = 0; i < drops; i++) {
          const t = this.pickFront(vis);
          if (!t) break;
          this.shots.push({ ...base, kind: "drop", target: t, x: this.pos(t).x, y: -30, sy: -30, flyT: 0.45 + i * 0.09, dmgK: 1 / 3, wob: this.rnd() * 6 });
        }
        if (this.rnd() < 0.35) this.fxImg("dd/fx_area_goldcloud.webp", this.W / 2 + (this.rnd() - 0.5) * 120, TOP - 20, 200, 0.6, { fade: true, alpha: 0.6 });
      } else if (k === "lob") {
        // Pell: lobbed over the front onto the first scale in his column (60 px); Transmute adds the columns 50 px aside
        // Pell (Draft 19, Area): flasks lobbed high onto the densest part of the body (more flasks: other dense spots)
        const n = (evo("triple") ? 3 : 1) + st.count;
        const first = this.densest(60);
        if (!first) return hold();
        for (let i = 0; i < n; i++) {
          const t = i === 0 ? first : this.randomOf(this.upperVis());
          const land = this.at(t.s + SPEED * 0.42 * this.scOf(t), t.d);
          this.shots.push({ ...base, sx: m.x, sy: m.y, tx: land.x, ty: land.y, fly: false, flyT: 0.7 + i * 0.08 });
        }
      } else if (k === "summon") {
        const n = (evo("twin") ? 2 : 1) + st.count;
        for (let i = 0; i < n; i++) {
          const s = { hero: h, mode: w.mode, k: i, t: w.life + st.dur, x: m.x, y: m.y, tick: 0, img: DD.img(h.def.icon), seed: this.rnd() * 6, hitAt: new Map() };
          if (w.mode === "sweep") {
            // Loeg: from the screen edge on the squad's side (Brood: one from each edge), one row higher per extra
            s.dir = (this.formX < this.W / 2 ? 1 : -1) * (evo("twin") && i % 2 ? -1 : 1);
            s.x = s.dir > 0 ? -20 : this.W + 20;
            s.y = this.sweepRow() - (evo("twin") ? Math.floor(i / 2) : i) * (DD.SEG_R * 2 + 2);
          }
          this.summons.push(s);
        }
      } else if (k === "saw") {
        // rolls up its lane; count = hammers side by side 36 px apart
        // Aldous (Draft 19, Area): the hammer is thrown high onto the densest part of the body, slams down with a
        // shockwave, then spins and grinds there
        const n = 1 + st.count, first = this.densest(70);
        if (!first) return hold();
        for (let i = 0; i < n; i++) {
          const t = i === 0 ? first : this.randomOf(this.upperVis());
          const P = this.pos(t);
          this.shots.push({ ...base, x: m.x, y: m.y, sx: m.x, sy: m.y, tx: P.x, ty: P.y, air: true, flyT: 0.55, ang: A, speed: w.speed, life: w.life + st.dur, r: w.r * (1 + st.size), tick: 0, spin: 0, split: evo("splitsaw"), touched: false, stop: false });
        }
      } else if (k === "weave") {
        // Tou'lak: weaves up his column (±40 px), bounces off the top and weaves back down; extra orbs 30 px apart,
        // weaving the other way so they braid
        // Tou'lak (Draft 19, Lintas layar): the roar orb bounces off every edge of the field, through every scale
        const n = (w.count || 1) + st.count;
        for (let i = 0; i < n; i++) {
          const a = A + (0.45 + this.rnd() * 0.4) * (i % 2 ? 1 : -1) * (h.shotsN % 2 ? 1 : -1);
          this.shots.push({ ...base, vx: Math.cos(a) * w.speed * 1.5, vy: Math.sin(a) * w.speed * 1.5, r: 16 * (1 + st.size), life: w.life + st.dur, hitAt: new Map(), trail: [] }); // C53: size read
        }
      } else if (k === "ricochet") {
        // Jack: thrown 30° off the aim, the side flips every throw; extra balls at 15° and 6°; bounces off the edges
        const seq = [0.52, -0.52, 0.26, -0.26, 0.1, -0.1];
        const flip = h.shotsN % 2 ? -1 : 1;
        for (let i = 0; i < (w.count || 1) + st.count; i++) {
          const a = A + seq[i % seq.length] * flip;
          this.shots.push({ ...base, vx: Math.cos(a) * w.speed * 1.25, vy: Math.sin(a) * w.speed * 1.25, life: w.life + st.dur, r: w.r * 1.7 * (1 + st.size), hitAt: new Map(), trail: [] }); // C53: size read
        }
      }
    }

    /** True when point p lies ahead of o along angle a, within `width` px of that line. */
    onRay(o, a, p, width) {
      const cx = Math.cos(a), cy = Math.sin(a);
      const t = (p.x - o.x) * cx + (p.y - o.y) * cy;
      return t > 0 && Math.abs((p.x - o.x) * cy - (p.y - o.y) * cx) < width;
    }

    /** The visible scale furthest along a ray (the back of the body in that column). */
    lastOnRay(o, a, width) {
      let best = null, bt = -1;
      const cx = Math.cos(a), cy = Math.sin(a);
      for (const e of this.visible()) {
        const p = this.pos(e);
        const t = (p.x - o.x) * cx + (p.y - o.y) * cy;
        if (t <= 0 || p.y < TOP - 10) continue;
        if (Math.abs((p.x - o.x) * cy - (p.y - o.y) * cx) < width + e.r * 0.6 && t > bt) { bt = t; best = e; }
      }
      return best;
    }

    /** A hit that runs along the body: "head" = toward the head one scale a jump (Velis), "both" = both ways (Finnick). */
    chainBody(h, from, first, jumps, way) {
      const b = this.body, i0 = b.indexOf(first);
      if (i0 < 0) return;
      const list = [first];
      for (let j = 1; list.length <= jumps; j++) {
        const pick = way === "head" ? [i0 - j] : [i0 - j, i0 + j];
        let any = false;
        for (const i of pick) {
          const e = b[i];
          if (e && e.s > this.enterOf(e) && list.length <= jumps) { list.push(e); any = true; }
        }
        if (!any) break;
      }
      let p0 = from;
      for (const e of list) {
        const p = this.pos(e);
        this.beams.push({ x1: p0.x, y1: p0.y, x2: p.x, y2: p.y, w: 2.5, t: 0.22, max: 0.22, col: h.def.col, zig: true });
        this.hit(h, e, h.def.w.dmg);
        p0 = p;
      }
    }

    /** The y of the lowest coil row that still has body in it (Loeg's sweep starts there). */
    sweepRow() {
      const rows = this.rowYs || [TOP + 40];
      const vis = this.visible().map((e) => this.pos(e).y);
      for (let i = rows.length - 1; i >= 0; i--) if (vis.some((y) => Math.abs(y - rows[i]) < DD.SEG_R)) return rows[i];
      return rows[0];
    }

    lance(h, x, y, a, width, until) {
      const len = until ? until - y : 1600;
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      this.beams.push({ x1: x, y1: y, x2, y2, w: width, t: 0.3, max: 0.3, col: h.def.col });
      for (const e of this.visible()) {
        const p = this.pos(e);
        if (segDist(p.x, p.y, x, y, x2, y2) < width + e.r * 0.8) this.hit(h, e, h.def.w.dmg);
      }
    }

    /** Sera's beam: a straight line through P at angle a (from the horizontal) across the whole field, the portal on the
        `from` side (1 = left). Hits everything along it. */
    crossLance(h, P, a, width, from) {
      const W = this.W, k = Math.tan(a);
      let x1 = -10, y1 = P.y + k * (x1 - P.x), x2 = W + 10, y2 = P.y + k * (x2 - P.x);
      if (from < 0) [x1, y1, x2, y2] = [x2, y2, x1, y1];
      this.beams.push({ x1, y1, x2, y2, w: width, t: 0.5, max: 0.5, col: h.def.col, sun: true });
      for (const e of this.visible()) {
        const p = this.pos(e);
        if (segDist(p.x, p.y, x1, y1, x2, y2) < width + e.r * 0.8 * (1 + h.st.size)) this.hit(h, e, h.def.w.dmg); // C53: the whole band grows
      }
    }

    chain(h, o, first, jumps) {
      let from = o, e = first;
      const hit = new Set();
      for (let i = 0; i <= jumps && e; i++) {
        const p = this.pos(e);
        this.beams.push({ x1: from.x, y1: from.y, x2: p.x, y2: p.y, w: 2.5, t: 0.22, max: 0.22, col: h.def.col, zig: true });
        hit.add(e);
        this.hit(h, e, h.def.w.dmg * (this.has(h, "overcharge") ? 1 + 0.1 * i : 1));
        from = p;
        e = this.nearest(p, this.visible().filter((x) => !hit.has(x) && dist(this.pos(x), p) < 160));
      }
    }

    orbit(h, dt) {
      const w = h.def.w, st = h.st;
      h.spin = (h.spin || 0) + dt * w.spin * this.rateOf(h);
      h.tick = (h.tick || 0) - dt * this.rateOf(h);
      // Draft 19 (Area): the skull swarm drifts over the densest part of the body, picking a new spot every 1.2 s
      if (!h.oE || h.oE.dead || (h.oT = (h.oT || 0) - dt) <= 0) { h.oT = 1.2; h.oE = this.densest(70); }
      if (!h.oE) { h.orbitPts = []; return; }
      const tp = this.pos(h.oE);
      h.oc = h.oc ? { x: h.oc.x + (tp.x - h.oc.x) * Math.min(1, dt * 2.5), y: h.oc.y + (tp.y - h.oc.y) * Math.min(1, dt * 2.5) } : { ...tp };
      const o = h.oc;
      const n = w.n + st.count;
      // C53 (no. 114): the swarm covers a disc whose AREA grows with Ring Size and Lich (a ring that doubled in radius left the body)
      const R = w.r * Math.sqrt((1 + st.size) * (this.has(h, "wide") ? 2 : 1));
      h.orbitPts = [];
      for (let i = 0; i < n; i++) {
        const a = h.spin + (i * Math.PI * 2) / n;
        h.orbitPts.push({ x: o.x + Math.cos(a) * R, y: o.y + Math.sin(a) * R });
      }
      if (h.tick > 0) return;
      h.tick = w.tick;
      // C53: every scale inside the swarm is bitten, harder the more skulls there are
      for (const e of this.visible()) if (dist(this.pos(e), o) < R + e.r * 0.5) this.hit(h, e, (w.dmg * n) / w.n, true);
    }

    outOfField(b, pad) {
      return b.x < -pad || b.x > this.W + pad || b.y < -pad || b.y > this.H + pad;
    }

    moveShots(dt) {
      const keep = [];
      const vis = this.visible();
      for (const b of this.shots) {
        b.t += dt;
        const k = b.kind;
        // the marksman's reticle sits on its scale before the tracer leaves (Draft 19)
        if (b.wait > 0) {
          b.wait -= dt;
          // C37: the moment it leaves, a streak of light from the hero to the marked scale (the tracer and the crow are too fast to see)
          if (b.wait <= 0 && b.target && !b.target.dead) { const q = this.pos(b.target); this.beams.push({ x1: b.x, y1: b.y, x2: q.x, y2: q.y, w: 3, t: 0.2, max: 0.2, col: b.col }); }
          keep.push(b); continue;
        }
        if (b.trail) { b.trail.push(b.x, b.y); if (b.trail.length > 14) b.trail.splice(0, 2); }
        if (k === "pierce") {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          for (const e of vis) {
            if (b.hits.has(e) || e.dead) continue;
            const p = this.pos(e);
            if (dist(p, b) < e.r + 8) {
              b.hits.add(e);
              this.hit(b.hero, e, b.sub ? b.hero.def.w.dmg * 0.5 : b.hero.def.w.dmg);
              if (b.split && !b.sub) {
                b.split = false;
                for (const s of [-0.55, 0.55]) {
                  const a = b.ang + s;
                  this.shots.push({ ...b, ang: a, vx: Math.cos(a) * 600, vy: Math.sin(a) * 600, pierce: 3, hits: new Set([e]), sub: true, split: false });
                }
              }
              if (b.pierce-- <= 0) { b.done = true; break; }
            }
          }
          if (b.edge > 0 && !b.done && (b.x < 6 || b.x > this.W - 6 || b.y < TOP - 30)) {
            // C43 Edge Bounce: off the side it mirrors left-right, off the top it comes back down; it can hit every scale again
            if (b.x < 6 || b.x > this.W - 6) { b.vx = -b.vx; b.x = Math.max(6, Math.min(this.W - 6, b.x)); } else { b.vy = -b.vy; b.y = TOP - 30; }
            b.ang = Math.atan2(b.vy, b.vx); b.edge--; b.hits = new Set(); b.pierce = Math.max(b.pierce, 1);
          }
          if (this.outOfField(b, 40)) b.done = true;
        } else if (k === "curve") {
          // Nim (Draft 19): a quadratic curve to its scale; after a hit it curves on to the next one while pierce lasts
          b.spin += dt * 20;
          if (!b.target || b.target.dead) {
            b.target = this.nearest(b, vis.filter((x) => !b.hits.has(x)));
            b.p0 = { x: b.x, y: b.y }; b.u = 0; b.dur = 0.35;
            if (!b.target) { b.done = true; continue; }
          }
          const p = this.pos(b.target);
          b.u = Math.min(1, b.u + dt / b.dur);
          const dx = p.x - b.p0.x, dy = p.y - b.p0.y, dd = Math.hypot(dx, dy) || 1;
          const cx = (b.p0.x + p.x) / 2 - (dy / dd) * b.side, cy = (b.p0.y + p.y) / 2 + (dx / dd) * b.side, u = b.u, px = b.x, py = b.y;
          b.x = (1 - u) * (1 - u) * b.p0.x + 2 * (1 - u) * u * cx + u * u * p.x;
          b.y = (1 - u) * (1 - u) * b.p0.y + 2 * (1 - u) * u * cy + u * u * p.y;
          b.ang = Math.atan2(b.y - py, b.x - px);
          if (b.u >= 1) {
            b.hits.add(b.target);
            this.hit(b.hero, b.target, b.hero.def.w.dmg);
            if (b.pierce-- <= 0) b.done = true;
            else {
              b.p0 = { x: b.x, y: b.y }; b.u = 0; b.dur = 0.3; b.side = -b.side;
              b.target = this.nearest(b, vis.filter((x) => !b.hits.has(x) && dist(this.pos(x), b) < 220));
              if (!b.target) b.done = true;
            }
          }
        } else if (k === "drop") {
          // Amar-Suen's golden rain: falls straight onto its scale, which keeps moving
          if (b.target.dead) b.target = this.randomOf(vis);
          if (!b.target) { b.done = true; continue; }
          const p = this.pos(b.target), q = Math.min(1, b.t / b.flyT);
          b.x = p.x + Math.sin(b.t * 9 + b.wob) * 4 * (1 - q);
          b.y = b.sy + (p.y - b.sy) * q * q;
          if (q >= 1) { this.impact({ ...b, kind: "gold" }, b.target, p, vis); b.done = true; this.fxImg("dd/fx_hit_coins.webp", p.x, p.y, 64, 0.35, { grow: 0.4 }); }
        } else if (k === "boomerang" && b.ell) {
          // Borrik (Draft 19): a wide loop; the hit list resets half way so a scale can be cut on the way out and back
          b.spin += dt * 16;
          b.th += dt / b.T;
          if (b.th < 0) { const home = this.heroPos(b.hero); b.x = home.x; b.y = home.y - 10; keep.push(b); continue; }
          const ax = Math.min(150, this.W * 0.4), by = Math.min(230, (this.formY - TOP) * 0.45);
          const an = Math.PI / 2 + b.dir * b.th * Math.PI * 2;
          b.x = Math.max(b.r, Math.min(this.W - b.r, b.ox + Math.cos(an) * ax));
          b.y = b.oy - by + Math.sin(an) * by;
          if (!b.half && b.th >= 0.5) { b.half = true; b.hits = new Set(); }
          for (const e of vis) {
            if (b.hits.has(e) || e.dead) continue;
            if (dist(this.pos(e), b) < e.r + b.r) { b.hits.add(e); this.hit(b.hero, e, b.hero.def.w.dmg); }
          }
          if (b.th >= 1) b.done = true;
        } else if (k === "boomerang") {
          b.spin += dt * 16;
          const home = this.heroPos(b.hero);
          if (b.out) {
            b.x += Math.cos(b.ang) * b.speed * dt;
            b.y += Math.sin(b.ang) * b.speed * dt;
            b.travelled += b.speed * dt;
            if (b.travelled >= b.range) { b.out = false; b.hits = new Set(); }
          } else {
            const dx = home.x - b.x, dy = home.y - b.y, d = Math.hypot(dx, dy);
            if (d < 18) b.done = true;
            else { b.x += (dx / d) * b.speed * 1.1 * dt; b.y += (dy / d) * b.speed * 1.1 * dt; }
          }
          for (const e of vis) {
            if (b.hits.has(e) || e.dead) continue;
            if (dist(this.pos(e), b) < e.r + b.r) { b.hits.add(e); this.hit(b.hero, e, b.hero.def.w.dmg); }
          }
        } else if (k === "lob") {
          const q = Math.min(1, b.t / b.flyT);
          b.x = b.sx + (b.tx - b.sx) * q;
          b.y = b.sy + (b.ty - b.sy) * q - Math.sin(q * Math.PI) * 80;
          if (q >= 1) {
            b.done = true;
            const h = b.hero;
            this.zones.push({ x: b.tx, y: b.ty, r: h.def.w.radius * (1 + h.st.size), dps: h.def.w.dps, t: h.def.w.dur + h.st.dur, max: h.def.w.dur + h.st.dur, tick: 0, hero: h, col: h.def.col, img: DD.zoneImg ? DD.zoneImg(b.el || h.hitEl) : "dd/fx_area_firepool.webp", el: b.el, el2: b.el2}); // G1 (no. 99): the pool of the hit element
            this.fxImg("dd/fx_hit_explosion.webp", b.tx, b.ty, 96, 0.35, { grow: 0.3 });
            this.burst(b.tx, b.ty, h.def.col, 8);
          }
        } else if (k === "saw" && b.air) {
          // Aldous (Draft 19): the thrown hammer flies high, then slams down with a shockwave
          b.spin += dt * 14;
          const q = Math.min(1, b.t / b.flyT);
          b.x = b.sx + (b.tx - b.sx) * q;
          b.y = b.sy + (b.ty - b.sy) * q - Math.sin(q * Math.PI) * 140;
          if (q >= 1) {
            b.air = false; b.stop = true; b.tick = 0;
            this.fxImg("dd/fx_hit_shock.webp", b.x, b.y, 150, 0.4, { grow: 0.6 });
            this.fxImg("dd/fx_hit_phys_l.webp", b.x, b.y, 90, 0.3, { grow: 0.3 });
            this.shake = Math.max(this.shake, 6);
            for (const e of vis) if (!e.dead && dist(this.pos(e), b) < 70 + e.r * 0.5) this.hit(b.hero, e, b.hero.def.w.dps * 0.5, true);
          }
        } else if (k === "saw") {
          b.spin += dt * 14;
          b.tick -= dt;
          // rolling: the duration only runs once it has stopped on a scale (Ledger TD: Duration past 2.2 s was useless)
          if (!b.stop) {
            b.x += Math.cos(b.ang) * b.speed * dt;
            b.y += Math.sin(b.ang) * b.speed * dt;
            if (vis.some((e) => !e.dead && dist(this.pos(e), b) < b.r + e.r * 0.6)) { b.stop = true; b.tick = 0; }
          } else b.life -= dt;
          if (b.stop && b.tick <= 0) {
            b.tick = 0.2;
            let any = false;
            for (const e of vis) {
              if (e.dead || dist(this.pos(e), b) >= b.r + e.r * 0.6) continue;
              any = true;
              this.hit(b.hero, e, b.hero.def.w.dps * 0.2, true);
            }
            if (any && b.split && !b.touched && !b.sub) {
              b.touched = true;
              for (const s of [-0.7, 0.7]) this.shots.push({ ...b, ang: b.ang + s, life: b.life * 0.6, sub: true, split: false, tick: 0.1, stop: false, x: b.x + Math.cos(b.ang + s) * (b.r + 30), y: b.y + Math.sin(b.ang + s) * (b.r + 30) });
            }
          }
          if (b.life <= 0 || this.outOfField(b, 30)) b.done = true;
        } else if (k === "weave") {
          b.life -= dt;
          // Draft 19: bounces off every edge of the field like Jack's snowball, through every scale
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.x < b.r || b.x > this.W - b.r) { b.vx *= -1; b.x = Math.max(b.r, Math.min(this.W - b.r, b.x)); }
          if (b.y < TOP + b.r || b.y > this.fieldBottom - b.r) { b.vy *= -1; b.y = Math.max(TOP + b.r, Math.min(this.fieldBottom - b.r, b.y)); }
          for (const e of vis) {
            if (e.dead || (b.hitAt.get(e) || -9) > this.time - 0.4) continue;
            if (dist(this.pos(e), b) < e.r + b.r * 0.625) { b.hitAt.set(e, this.time); this.hit(b.hero, e, b.hero.def.w.dmg); } // C53: 10 px at base, grows with size
          }
          if (b.life <= 0) {
            b.done = true;
            if (this.has(b.hero, "boom")) {
              // C53 (no. 114): the fading orb drops onto the nearest scale and explodes there (it went off wherever it was, mostly off the body)
              const nt = this.nearest(b, vis.filter((e) => !e.dead)), c = nt ? this.pos(nt) : b;
              this.fx.push({ x: c.x, y: c.y, vx: 0, vy: 0, t: 0.35, max: 0.35, col: b.col, ring: 60 });
              for (const e of vis) if (!e.dead && dist(this.pos(e), c) < 60 + e.r) this.hit(b.hero, e, b.hero.def.w.dmg * 2);
            }
          }
        } else if (k === "rocket") {
          b.life -= dt;
          if (!b.target || b.target.dead) b.target = this.randomOf(vis);
          if (b.target) {
            const p = this.pos(b.target);
            const want = Math.atan2(p.y - b.y, p.x - b.x);
            let d = want - b.ang;
            while (d > Math.PI) d -= Math.PI * 2;
            while (d < -Math.PI) d += Math.PI * 2;
            b.ang += Math.max(-4 * dt, Math.min(4 * dt, d));
          }
          b.x += Math.cos(b.ang) * b.speed * dt;
          b.y += Math.sin(b.ang) * b.speed * dt;
          for (const e of vis) {
            if (e.dead || (b.hitAt.get(e) || -9) > this.time - 0.4) continue;
            if (dist(this.pos(e), b) < e.r + 8) {
              b.hitAt.set(e, this.time);
              this.hit(b.hero, e, b.hero.def.w.dmg);
              if (e === b.target) b.target = this.randomOf(vis);
            }
          }
          if (b.life <= 0) {
            b.done = true;
            if (this.has(b.hero, "boom")) {
              this.fx.push({ x: b.x, y: b.y, vx: 0, vy: 0, t: 0.35, max: 0.35, col: b.col, ring: 60 });
              for (const e of vis) if (!e.dead && dist(this.pos(e), b) < 70 + e.r) this.hit(b.hero, e, b.hero.def.w.dmg * 5);
            }
          }
        } else if (k === "ricochet") {
          b.life -= dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.x < b.r || b.x > this.W - b.r) { b.vx *= -1; b.x = Math.max(b.r, Math.min(this.W - b.r, b.x)); }
          if (b.y < TOP + b.r || b.y > this.fieldBottom - b.r) { b.vy *= -1; b.y = Math.max(TOP + b.r, Math.min(this.fieldBottom - b.r, b.y)); }
          for (const e of vis) {
            if (e.dead || (b.hitAt.get(e) || -9) > this.time - 0.3) continue;
            if (dist(this.pos(e), b) < e.r + b.r) {
              b.hitAt.set(e, this.time);
              const h = b.hero;
              this.hit(h, e, h.def.w.dmg * (b.grow && b.r0 ? b.r / b.r0 : 1)); // C53: Snowman, a bigger snowball hits harder
              this.slowT = Math.max(this.slowT, 1);
              this.slowF = Math.min(this.slowF < 1 && this.slowT > 0 ? this.slowF : 1, 0.75);
              h.iceHits = (h.iceHits || 0) + 1;
              if (this.has(h, "freeze") && h.iceHits % 8 === 0) {
                // Frost Storm (Draft 19, Layar penuh): a blizzard over the whole field and the dragon freezes a moment
                if (this.danger && this.danger()) this.frozen = Math.max(this.frozen, 0.4); // C53: freezes only near the wall
                for (const t of this.visible()) this.hit(h, t, h.def.w.dmg * 0.2, true); // C53: the blizzard hurts every scale, 20 %
                this.blizzard = 1.4;
                for (let i = 0; i < 14; i++) this.fxImg("dd/fx_proj_ice.webp", this.rnd() * this.W, TOP + this.rnd() * (this.fieldBottom - TOP) * 0.6, 34, 0.9 + this.rnd() * 0.5, { vx: -60, vy: 220, rot: 0.6 });
              }
            }
          }
          if (b.life <= 0) b.done = true;
        } else if (b.fly) {
          // a straight shot up its lane until it touches a scale (heartdrop, lash, Midas touch)
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          for (const e of vis) {
            if (e.dead) continue;
            const p = this.pos(e);
            if (dist(p, b) < e.r + 8) { b.fly = false; this.impact(b, e, p, vis); break; }
          }
          if (b.fly && this.outOfField(b, 40)) b.done = true;
        } else {
          // homing: the marksman, wolf needles, and a heartdrop after its first hit
          let t = b.target;
          if (!t || t.dead) {
            t = b.target = this.nearest(b, vis.filter((x) => !b.hits.has(x)));
            if (!t) { b.done = true; continue; }
          }
          const p = this.pos(t);
          const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy);
          b.ang = Math.atan2(dy, dx);
          const step = b.speed * dt;
          if (d <= step + t.r * 0.6) this.impact(b, t, p, vis);
          else {
            b.x += (dx / d) * step; b.y += (dy / d) * step;
            // Velis' heart flutters sideways in a sine wave on its way (Draft 19)
            if (b.wob && d > 40) { const s = Math.sin(b.t * 9) * 150 * dt; b.x += (-dy / d) * s; b.y += (dx / d) * s; }
          }
        }
        if (!b.done) keep.push(b);
      }
      this.shots = keep;
    }

    impact(b, t, p, vis) {
      const h = b.hero, w = h.def.w, k = b.kind;
      if (k === "hunter" || k === "needle") {
        this.hit(h, t, k === "needle" ? w.dmg : w.dmg);
        b.done = true;
      } else if (k === "charm") {
        const times = this.has(h, "double") ? 2 : 1;
        for (let i = 0; i < times; i++) this.hit(h, t, w.dmg);
        this.frozen = Math.max(this.frozen, w.stun + h.st.dur * 0.2 + (this.danger && this.danger() ? h.st.stun || 0 : 0)); // C53
        this.fx.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: 0.3, max: 0.3, col: h.def.col, claw: 22, ang: b.ang || 0 });
        b.done = true;
      } else if (k === "gold") {
        this.hit(h, t, w.dmg * (b.dmgK || 1));
        if (!t.dead) t.gold = (t.gold || 0) + w.gold + h.st.gold;
        b.done = true;
      } else if (k === "bounce") {
        b.hits.add(t);
        const i0 = this.body.indexOf(t);
        this.hit(h, t, w.dmg * ((w.multi || 1) + (h.st.multi || 0))); // C43 Hits per Scale card
        if (this.has(h, "charm") && this.danger && this.danger()) this.frozen = Math.max(this.frozen, 0.3); // C53: Mass Charm stops it only near the wall
        if (b.bounces-- > 0 && i0 > 0) {
          // the next scale toward the head (the body order, not the nearest scale)
          const next = this.body[i0 - 1];
          if (next && !next.dead) { b.target = next; b.x = p.x; b.y = p.y; return; }
        }
        b.done = true;
      }
      this.spark(p.x, p.y, h.def.col, 4);
    }

    /** The first visible scale along a ray from o at angle a (for jets). */
    firstOnRay(o, a, width) {
      const cx = Math.cos(a), cy = Math.sin(a);
      let best = null, bt = 1e9;
      for (const e of this.visible()) {
        const p = this.pos(e);
        const t = (p.x - o.x) * cx + (p.y - o.y) * cy;
        if (t < 0 || t > 900) continue;
        const perp = Math.abs((p.x - o.x) * cy - (p.y - o.y) * cx);
        if (perp < width + e.r * 0.8 && t < bt) { bt = t; best = e; }
      }
      return best ? { e: best, t: bt } : null;
    }

    moveWaves(dt) {
      this.waves = this.waves.filter((wv) => {
        const h = wv.hero;
        wv.t -= dt;
        wv.tick -= dt;
        // a jet keeps to its own lane and a flame to its own cone, both along the squad's aim (they follow the drag)
        const o = wv.type === "jet" ? this.side(this.muzzle(h), wv.lat) : this.muzzle(h);
        // Draft 19 (Sapuan): Ebenezer's fountain and Ysmay's flame sweep across while they last
        const sweep = wv.type === "jet" ? 0.87 : wv.type === "spray" ? 1.05 : 0;
        wv.ang = this.aimA + (wv.off || 0) + (sweep && wv.dur ? Math.sin((1 - wv.t / wv.dur) * Math.PI * 2 + (wv.ph || 0)) * sweep : 0);
        if (wv.type === "spray" && this.fx.length < 300) {
          // Ysmay's breath (user 2026-10-30: "buat serangannya menarik"): a living stream of fire puffs that leave her hand
          // small, billow out along the cone and burn away, with embers flying off
          wv.emit = (wv.emit || 0) + dt * 52;
          while (wv.emit >= 1) {
            wv.emit--;
            // C39 (user no. 84: "serangan ysmay, terlalu ambigu"): the puff rides the live cone (wv, off, u), so the fire on screen is
            // exactly where the flame hurts, and it ends at the hit length
            const off = (this.rnd() * 2 - 1) * wv.angle * 0.85, a = wv.ang + off, sp = 360 + this.rnd() * 180, life = ((wv.len - 16) / sp) * (0.8 + this.rnd() * 0.2);
            this.fx.push({ img: this.rnd() < 0.55 ? "dd/fx_hit_fire_l.webp" : "dd/fx_hit_fire_s.webp", x: o.x + Math.cos(a) * 16, y: o.y + Math.sin(a) * 16, vx: 0, vy: 0,
              wv, off, u: 16, sp, size: 24, grow: 3.2, t: life, max: life, rot: this.rnd() * 6, spin: (this.rnd() - 0.5) * 5, add: true, flow: true });
          }
          if (this.rnd() < dt * 14) {
            const a = wv.ang + (this.rnd() * 2 - 1) * wv.angle * 1.4, sp = 200 + this.rnd() * 260;
            this.fx.push({ img: "dd/fx_hit_sparkle.webp", x: o.x, y: o.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, size: 14, grow: 0.2, t: 0.7, max: 0.7, rot: 0, add: true, flow: true, tint: true });
          }
        }
        if (wv.type === "jet" && this.fx.length < 300) {
          // Ebenezer's fountain: real coins spin out along the stream and spark where it lands
          wv.emit = (wv.emit || 0) + dt * 30;
          const len = wv.len || 600;
          while (wv.emit >= 1) {
            wv.emit--;
            const a = wv.ang + (this.rnd() - 0.5) * 0.12, sp = 560 + this.rnd() * 120, life = len / sp;
            this.fx.push({ img: `dd/fx_proj_${PROJ[h.def.id] || "coin"}.webp`, x: o.x, y: o.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, size: 15 + this.rnd() * 5, grow: 0.15, t: life, max: life, rot: this.rnd() * 6, spin: 14, flow: true, solid: true });
          }
          if (wv.len < 880 && this.rnd() < dt * 10) this.fxImg("dd/fx_hit_sparkle.webp", o.x + Math.cos(wv.ang) * wv.len, o.y + Math.sin(wv.ang) * wv.len, 40, 0.25, { grow: 0.5, add: true });
        }
        wv.o = o;
        if (wv.type === "pin") {
          // when its scale breaks the spear moves to the next scale furthest along the same column (time left is kept)
          if (wv.target.dead) { const was = wv.at || this.pos(wv.target); wv.target = this.nearest(was, this.visible().filter((x) => dist(this.pos(x), was) < 90)); }
          const e = wv.target;
          if (!e) return false;
          wv.at = this.pos(e);
          if (wv.drop > 0) {
            // the spear is still falling from the sky
            wv.drop -= dt;
            if (wv.drop <= 0) {
              this.fxImg("dd/fx_hit_flash.webp", wv.at.x, wv.at.y, 110, 0.3, { grow: 0.4 });
              this.fxImg("dd/fx_hit_shock.webp", wv.at.x, wv.at.y, 130, 0.35, { grow: 0.5 });
              this.shake = Math.max(this.shake, 5);
            }
            return true;
          }
          if (wv.tick <= 0) {
            wv.tick = 0.1;
            this.hit(h, e, h.def.w.dps * 0.1, true);
            // a bigger burn (size cards) scorches the scales next to it on the body
            // C53: in step with Spear Width (the same as before at +100 %); Holy Pin marks the pinned scale
            if (h.st.size > 0) { const i = this.body.indexOf(e); for (const n of [this.body[i - 1], this.body[i + 1]]) if (this.sameOut(n, e)) this.hit(h, n, h.def.w.dps * 0.05 * Math.min(2, h.st.size), true); }
            if (this.has(h, "holyPin")) e.pinT = this.time + 0.25;
          }
          return wv.t > 0;
        }
        if (wv.type === "spray") {
          if (wv.tick <= 0 && wv.ang !== undefined) {
            wv.tick = 0.2;
            for (const e of this.visible()) {
              const p = this.pos(e);
              const d = dist(p, o);
              if (d < wv.len && angDiff(Math.atan2(p.y - o.y, p.x - o.x), wv.ang) < wv.angle + e.r / Math.max(d, 1)) this.hit(h, e, h.def.w.dps * 0.2, true);
            }
          }
        } else if (wv.type === "jet") {
          const hitInfo = wv.ang !== undefined ? this.firstOnRay(o, wv.ang, wv.width) : null;
          wv.len = hitInfo ? hitInfo.t : 900;
          if (wv.tick <= 0 && hitInfo) {
            wv.tick = 0.1;
            const k = this.has(h, "widejet") ? 2 : 1;
            this.hit(h, hitInfo.e, h.def.w.dps * 0.1 * k, true);
            // C53 (no. 114): Jet / Tide Width also hits the scales side by side at that depth
            const ex = DD.SEG_R * (h.st.size + (this.has(h, "widejet") ? 0.5 : 0));
            if (ex > 0) {
              const cx = Math.cos(wv.ang), cy = Math.sin(wv.ang);
              for (const e of this.visible()) {
                if (e === hitInfo.e) continue;
                const p = this.pos(e), t = (p.x - o.x) * cx + (p.y - o.y) * cy, pp = Math.abs((p.x - o.x) * cy - (p.y - o.y) * cx);
                if (Math.abs(t - hitInfo.t) < e.r && pp < h.def.w.width + e.r * 0.8 + ex) this.hit(h, e, h.def.w.dps * 0.1 * k, true);
              }
            }
          }
        }
        return wv.t > 0;
      });
    }

    moveSummons(dt) {
      this.summons = this.summons.filter((s) => {
        s.t -= dt;
        s.tick -= dt;
        const h = s.hero, w = h.def.w;
        if (s.mode === "wolf") {
          // Draft 19 (Pemanggil terbang): the spirit wolf leaps from scale to scale over the body and bites where it
          // lands (scales within 40 px); Alpha throws 3 needles at the scales around each landing
          const vis = this.visible();
          if (!s.to || s.u >= 1) {
            if (s.to && !s.to.dead) {
              const p = this.pos(s.to);
              for (const e of vis) if (!e.dead && dist(this.pos(e), p) < 40 + e.r * 0.5) this.hit(h, e, w.dmg);
              this.fxImg("dd/fx_hit_nature_l.webp", p.x, p.y, 70, 0.3, { grow: 0.3 });
              if (this.has(h, "alpha")) for (let i = 0; i < 3; i++) { const t = this.randomOf(vis); if (t) this.shots.push({ hero: h, x: p.x, y: p.y, col: h.def.col, kind: "needle", t: 0, target: t, speed: 700, hits: new Set() }); }
            }
            // C55: it stays on the body (a head only when no body scale is near): bites on the head broke nothing, so a lone Fen never called a hero
            const near = vis.filter((e) => dist(this.pos(e), s) < 200), up = this.upperVis(), bodyOf = (l) => l.filter((e) => e.type === "body");
            const pool = bodyOf(near).length ? bodyOf(near) : bodyOf(up).length ? bodyOf(up) : near.length ? near : up;
            s.to = this.pickFront(pool);
            s.from = { x: s.x, y: s.y }; s.u = 0; s.jt = (w.fire * 1.25) / this.rateOf(h);
            if (!s.to) return s.t > 0;
          }
          const p = this.pos(s.to);
          s.u = Math.min(1, s.u + dt / s.jt);
          s.face = p.x >= s.from.x ? 1 : -1;
          s.x = s.from.x + (p.x - s.from.x) * s.u;
          s.y = s.from.y + (p.y - s.from.y) * s.u - Math.sin(s.u * Math.PI) * 70;
          return s.t > 0;
        }
        if (s.mode === "sweep") {
          if (this.stage.round) {
            // round stages: it circles the tower on the ring where the body is
            s.a = (s.a === undefined ? this.aimA : s.a) + dt * (250 / 150);
            s.x = this.cx + Math.cos(s.a) * 150;
            s.y = this.cy + Math.sin(s.a) * 150;
          } else {
            s.x += s.dir * 250 * dt;
            if ((s.dir > 0 && s.x > this.W - 22) || (s.dir < 0 && s.x < 22)) {
              s.dir *= -1;
              s.y = Math.max(TOP + DD.SEG_R * 0.6, s.y - (DD.SEG_R * 2 + 2)); // one row up, like the coil
            }
          }
          for (const e of this.visible()) {
            if (e.dead || (s.hitAt.get(e) || -9) > this.time - 0.3) continue;
            if (dist(this.pos(e), s) < e.r + 18) { s.hitAt.set(e, this.time); this.hit(h, e, w.dmg, true); }
          }
          if (this.fx.length < 300 && this.rnd() < dt * 22) {
            // fire breath on the row below its wings
            this.fx.push({ img: "dd/fx_hit_fire_s.webp", x: s.x + (s.dir || 1) * 18, y: s.y + 10, vx: (s.dir || 1) * 90, vy: 150 + this.rnd() * 60, size: 18, grow: 2.2, t: 0.4, max: 0.4, rot: this.rnd() * 6, spin: 3, add: true, flow: true });
          }
          return s.t > 0;
        }
        const t = this.nearest(s);
        if (t) {
          const p = this.pos(t);
          const tx = p.x + Math.sin(this.time * 2 + s.seed) * 40, ty = Math.min(this.fieldBottom - 30, p.y + 80);
          s.x += (tx - s.x) * Math.min(1, dt * 1.5);
          s.y += (ty - s.y) * Math.min(1, dt * 1.5);
          if (s.tick <= 0) {
            s.tick = s.hero.def.w.fire / this.rateOf(s.hero);
            const n = this.has(s.hero, "alpha") ? 3 : 1;
            for (let i = 0; i < n; i++) this.shots.push({ hero: s.hero, x: s.x + (i - (n - 1) / 2) * 10, y: s.y, col: s.hero.def.col, kind: "needle", t: 0, target: t, speed: 700, hits: new Set() });
          }
        }
        return s.t > 0;
      });
    }

    /** One hit from a hero: damage, then the reaction its element makes with the scale's status, then its own status. */
    hit(h, e, base, quiet) {
      if (e.dead) return;
      let { d, crit } = this.dmgOf(h, base, e);
      const r = this.reaction(h, e);
      if (r) d *= r.mul * (1 + (this.mods.react || 0)); // C27 G: Frostfire Ember
      if (e.crack && e.crackT > this.time) d *= 1 + DD.STATUS.physical.per * e.crack;
      e.hp -= d;
      h.dealt += d;
      if (!r) this.mark(h, e, d);
      if (r) this.react(h, e, d, r);
      if (quiet && !crit) {
        // C39: a continuous hit (flame, jet, pool, spear, orbit) is seen: the scale glows in the hero's colour while it is being hit,
        // and its damage is summed into one number per scale every half second (see sumDamage / flushSums)
        e.heatT = this.time + 0.22;
        e.heatC = h.def.col || "#ffb050";
        this.sumDamage(e, d, h.def.col);
      }
      if (!quiet || crit) {
        e.hit = 0.1;
        if (crit) snd("crit");
        // a painted impact in the hero's element (Request Asset R25), bigger on a crit
        if (this.fx.length < 90 && (crit || this.rnd() < 0.55)) {
          const p = this.pos(e), el = HIT_EL[h.def.el] || "phys";
          this.fxImg(`dd/fx_hit_${el}_${crit ? "l" : "s"}.webp`, p.x + (this.rnd() - 0.5) * 12, p.y + (this.rnd() - 0.5) * 12, crit ? 74 : 46, 0.24, { grow: 0.35, rot: this.rnd() * 6 });
        }
        if (this.texts.length < 40 && (crit || this.rnd() < 0.5)) {
          const p = this.pos(e);
          this.texts.push({ x: p.x + (this.rnd() - 0.5) * 22, y: p.y - e.r * 0.4, txt: DD.fmt(d), t: 0.6, max: 0.6, crit });
        }
      }
      if (e.hp <= 0) this.kill(e, h);
    }

    /** C39: adds continuous damage to the scale's running total; the first number shows 0.25 s after the first tick. */
    sumDamage(e, d, col) {
      e.acc = (e.acc || 0) + d;
      if (col) e.accC = col;
      if (!e.accT || e.accT < this.time - 0.5) e.accT = this.time + 0.25;
    }

    /** C39: one merged number per scale every 0.5 s while it keeps taking continuous damage (a dying scale shows what is left). */
    flushSums() {
      for (const e of this.body) {
        if (!e.acc || (this.time < e.accT && !e.dead && e.hp > 0)) continue;
        if (e.acc >= 0.5 && this.texts.length < 48) {
          const p = this.pos(e);
          this.texts.push({ x: p.x + (this.rnd() - 0.5) * 16, y: p.y - e.r * 0.4, txt: DD.fmt(e.acc), t: 0.7, max: 0.7, sum: true, col: lite(e.accC || "#ff9a3c") });
        }
        e.acc = 0;
        e.accT = this.time + 0.5;
      }
    }

    /** Damage that is already worked out (burn ticks, reaction splash): no crit, no status, no reaction. */
    deal(h, e, d) {
      if (e.dead || !h) return;
      if (e.crack && e.crackT > this.time) d *= 1 + DD.STATUS.physical.per * e.crack;
      e.hp -= d;
      h.dealt += d;
      if (e.hp <= 0) this.kill(e, h);
    }

    /** The reaction a hit makes, or null. Wet/Charged/Burning/Entangled meet their partner element; Physical shatters a
        frozen or slowed dragon. The status used is gone (Ledger TD Rules 4). */
    reaction(h, e) {
      const el = h.def.el, R = DD.REACT;
      if (el === "physical") {
        if (this.frozen > 0) return { k: "shatter", mul: R.shatter.frozen };
        if (this.slowT > 0) return { k: "shatter", mul: R.shatter.slowed };
        return null;
      }
      const st = e.st && e.stT > this.time ? e.st : null;
      if (!st) return null;
      const k = REACTS[st + "+" + el];
      if (!k) return null;
      e.st = null;
      return { k, mul: R[k].mul || 1 };
    }

    /** Leaves the hero's element status on the scale: one element status at a time; Cracked stacks on its own. */
    mark(h, e, d) {
      const S = DD.STATUS[h.def.el];
      if (!S) return;
      if (S.id === "crack") {
        e.crack = e.crackT > this.time ? Math.min(S.max, (e.crack || 0) + 1) : 1;
        e.crackT = this.time + S.t;
        return;
      }
      e.st = S.id;
      e.stT = this.time + S.t;
      if (S.id === "burn") this.ignite(h, e, d * S.dot * (1 + (this.mods.burn || 0))); // C27 G: Alchemist's Flask
      if (S.id === "tangle") this.tangleT = Math.max(this.tangleT, S.t);
    }

    ignite(h, e, pool) {
      if (e.st !== "burn" || e.stT <= this.time) e.burnP = 0;
      e.st = "burn";
      e.stT = Math.max(e.stT || 0, this.time + DD.STATUS.fire.t);
      e.burnP = (e.burnP || 0) + pool;
      e.burnT = e.stT;
      e.burnH = h;
    }

    react(h, e, d, r) {
      const R = DD.REACT[r.k], p = this.pos(e), i = this.body.indexOf(e);
      const next = (n) => [this.body[i - n], this.body[i + n]].filter((x) => x && !x.dead && this.sameOut(x, e));
      if (r.k === "overload") {
        // a spark jumps to the next scale on the body for the same damage
        const t = next(1)[0];
        if (t) { const q = this.pos(t); this.beams.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y, w: 2.5, t: 0.2, max: 0.2, col: DD.STATUS.electric.col, zig: true }); this.deal(h, t, d); }
      } else if (r.k === "steam") {
        this.fx.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: 0.3, max: 0.3, col: "#e8f4ff", ring: R.splash });
        for (const t of this.visible()) if (t !== e && dist(this.pos(t), p) < R.splash + t.r) this.deal(h, t, d * 0.5);
      } else if (r.k === "wildfire") {
        // the burn left on the scale flares up at once (×1.5) and a quarter of it catches each scale next to it. The
        // fire shrinks every time it spreads, so a chain of Wildfires stays under 3× the burn (2026-10-29: copying the
        // whole burn to both neighbours grew without end, +2665 % for a Fire + Nature team)
        const pool = h.def.el === "fire" ? d * DD.STATUS.fire.dot : e.burnP || 0;
        const owner = e.burnH || h;
        e.burnP = 0;
        this.deal(owner, e, pool * R.burst);
        for (const t of next(1)) this.ignite(owner, t, pool * R.share);
      }
      snd("rx_" + r.k); // C28 C: Overload, Steam, Wildfire, Shatter
      this.reacts[r.k] = (this.reacts[r.k] || 0) + 1;
      if (this.reacts[r.k] === 1 && this.on.react) this.on.react(r.k); // the first one of a kind: the screen may explain it
      if ((this.reactAt[r.k] || -9) < this.time - 0.8 && this.texts.length < 40) {
        this.reactAt[r.k] = this.time;
        this.texts.push({ x: p.x, y: p.y - e.r - 6, txt: R.name, t: 0.8, max: 0.8, react: r.k });
      }
    }

    kill(e) {
      // once only: a reaction inside the same hit could kill the scale a second time (kills 102/100, coins twice; C25 group 2)
      if (e.dead) return;
      e.dead = true;
      const i = this.body.indexOf(e);
      if (i >= 0) this.body.splice(i, 1);
      this.kills++;
      const p = this.pos(e);
      const pal = this.palette();
      this.burst(p.x, p.y, e.type === "body" ? (e.special ? SPECIAL_RIM[e.special] : pal.hi) : "#ffe27a", e.type === "body" ? 7 : 26);
      let coins = 1 + Math.floor(this.stage.n / 3);
      if (e.type === "head") coins *= e.headCoin || 6; // G2: the heads of 2–3 dragons share what one head paid
      if (e.coinMul) coins *= e.coinMul;
      if (e.gold) coins += e.gold;
      if (e.special === "chest") {
        coins += 20 * this.stage.n * (1 + (this.mods.chestCoin || 0)); // C27 G: Thief's Lockpick
        if (this.rnd() < 0.5) { this.chestGear++; this.texts.push({ x: p.x, y: p.y - 40, txt: "+1 Gear", t: 1.1, max: 1.1, coin: true }); }
      }
      this.addCoins(coins, p, e.type !== "body" || e.gold || e.special === "chest" || e.coinMul);
      snd(e.type === "head" ? "head_die" : e.tail ? "tail_kill" : e.special === "chest" ? "chest_seg" : e.special === "pearl" ? "pearl" : e.special === "shard" ? "shard" : "pop"); // C28 C, D
      if (this.body.length) { // the last scale ends the battle: no card or Hero Call after it (bug list C6)
        if (e.special === "pearl") this.queueChoice("skill");
        if (e.special === "shard") this.queueChoice("call");
      }
      if (e.tail) this.shake = 12;
      if (this.on.kill) this.on.kill(e);
    }

    addCoins(n, p, show) {
      n = Math.round(n * (1 + (this.mods.coin || 0))); // C27 G: Lucky Coin
      this.coins += n;
      if (show && p) { this.texts.push({ x: p.x, y: p.y - 24, txt: "+" + n, t: 1, max: 1, coin: true }); snd("coin"); }
    }

    /* ------------------------------------------------------------ choices: Hero Call and Skill Selection (C4) */
    queueChoice(type) {
      this.pending = this.pending || [];
      this.pending.push({ type });
      if (!this.paused) this.nextChoice();
    }

    nextChoice() {
      if (!this.pending || !this.pending.length || this.state !== "fight" || !this.body.length) return;
      const c = this.pending.shift();
      const waiting = this.heroes.filter((h) => !h.onWall);
      if (c.type === "call" && waiting.length) {
        this.paused = true;
        this.on.choice({ type: "call", options: this.rollCall() });
      } else {
        const cards = this.rollCards();
        if (!cards.length) return this.nextChoice();
        this.paused = true;
        snd("cards");
        this.on.choice({ type: "skill", options: cards });
      }
    }

    rollCall() {
      const pool = this.heroes.filter((h) => !h.onWall);
      const pick = [];
      while (pick.length < (this.mods.callPick || 3) && pool.length) pick.push(pool.splice(Math.floor(this.rnd() * pool.length), 1)[0]);
      return pick;
    }

    callHero(h) {
      snd("hero_call");
      h.onWall = true;
      h.sk = 1;
      h.cd = 0.4;
      this.placeHeroes();
      this.resume();
    }

    rollCards() {
      const left = (h, stat) => h.def.upg[stat] - (h.add[stat] || 0);
      const stats = (h) => Object.keys(h.def.upg).filter((k) => left(h, k) > 1e-9);
      const core = (h) => (h.def.core || []).every((k) => (h.add[k] || 0) > 0); // combo inside one hero (Ledger TD Rules 3)
      const evoReady = (h) => (!h.evo && h.sk >= h.def.evoAt && core(h)) || (h.evo && !h.evo2 && h.def.evo2 && h.sk >= h.def.evo2.at);
      const open = this.heroes.filter((h) => h.onWall && h.sk < DD.SKILL_MAX && (stats(h).length || evoReady(h)));
      if (!open.length) return [];
      const cards = [], used = new Set();
      let guard = 0;
      while (cards.length < 3 && guard++ < 80) {
        const tier = pickTier(this.rnd());
        const h = open[Math.floor(this.rnd() * open.length)];
        let c;
        const list = stats(h);
        if (evoReady(h) && (this.rnd() < DD.EVO_CHANCE || !list.length)) {
          c = !h.evo ? { hero: h, evo: true, tier: "mythic", key: h.id + "evo" } : { hero: h, evo2: true, tier: "mythic", key: h.id + "evo2" };
        } else {
          if (!list.length) continue;
          const stat = list[Math.floor(this.rnd() * list.length)];
          const v = Math.min(DD.CARD_STATS[stat].v[DD.TIER_STEP[tier]], left(h, stat));
          c = { hero: h, stat, tier, v: Math.round(v * 1000) / 1000, max: v >= left(h, stat) - 1e-9, key: h.id + stat };
        }
        if (used.has(c.key)) continue;
        used.add(c.key);
        cards.push(c);
      }
      return cards;
    }

    /** Applies one card without resuming (Take All applies three). */
    giveCard(c) {
      if (c.hero.sk >= DD.SKILL_MAX) return;
      if (c.evo) c.hero.evo = true;
      else if (c.evo2) c.hero.evo2 = true;
      else { c.hero.st[c.stat] += c.v; c.hero.add[c.stat] = (c.hero.add[c.stat] || 0) + c.v; }
      c.hero.sk++;
    }
    applyCard(c) {
      snd("card_pick");
      this.giveCard(c);
      this.resume();
    }
    applyAll(cards) {
      snd("card_pick");
      cards.forEach((c) => this.giveCard(c));
      this.resume();
    }

    resume() {
      this.paused = false;
      if (this.pending && this.pending.length) this.nextChoice();
    }

    finish(win) {
      if (this.state === "over") return;
      this.state = "over";
      snd(win ? "victory" : "defeat"); // C28 D: the V2 fanfare, or the falling note
      if (this.on.end) this.on.end({ win, progress: win ? 1 : this.progress, coins: this.coins, kills: this.kills, chestGear: this.chestGear });
    }

    palette() {
      return PALETTES[this.stage.dragon] || { hi: "#8fe85a", mid: "#4f9a2a", lo: "#1f5a16", belly: "#f1d58a", spike: "#c9a052" };
    }

    /* ------------------------------------------------------------ fx */
    spark(x, y, col, n) {
      for (let i = 0; i < n; i++) {
        const a = this.rnd() * Math.PI * 2, v = 40 + this.rnd() * 90;
        this.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.28, max: 0.28, col, size: 2.5 });
      }
    }
    burst(x, y, col, n) {
      for (let i = 0; i < n; i++) {
        const a = this.rnd() * Math.PI * 2, v = 50 + this.rnd() * 150;
        this.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 260, t: 0.5, max: 0.5, col, size: 3.5 });
      }
    }

    /* ------------------------------------------------------------ draw */
    sprite(e) {
      // a scale drawn once per kind and size, then stamped
      this.sprites = this.sprites || {};
      const key = `${this.formOf(e)}:${e.special || e.swap || e.type}:${Math.round(e.r * e.taper)}:${e.gold ? "g" : ""}`; // G2: each dragon its own form
      if (this.sprites[key]) return this.sprites[key];
      const pal = this.palette();
      const r = e.r * e.taper, S = Math.ceil(r * 2 + 10), c = document.createElement("canvas");
      const k = 2;
      c.width = c.height = S * k;
      const g = c.getContext("2d");
      g.scale(k, k);
      g.translate(S / 2, S / 2);
      // painted round segments for the first five worlds (Request Asset R7–R11); pearls and shards keep their faces
      const world = (this.stage.dragon || "").replace(/_dragon$/, "");
      if (DD.SKIN) {
        const art = DD.img(DD.skinDragon(this.formOf(e), e.special === "chest" ? "chest" : e.special === "pearl" ? "pearl" : e.gold ? "elite" : e.swap || "seg"));
        const face = e.special === "shard" && DD.img(SPECIAL_ICON.shard);
        if (!ready(art) || (face && !ready(face))) return null; // draw again when the pictures have loaded
        const f = r * 2.3, fit = f / Math.max(art.naturalWidth, art.naturalHeight), aw = art.naturalWidth * fit, ah = art.naturalHeight * fit;
        g.drawImage(art, -aw / 2, -ah / 2, aw, ah); // C27 H: kept in proportion (the forms have long and wide segments)
        if (face) { const fh = r * 1.5, fw = (fh * face.naturalWidth) / face.naturalHeight; g.drawImage(face, -fw / 2, -fh / 2, fw, fh); }
        // no. 110: an item scale has no hard ring any more; drawDragon gives it a soft glow of its colour and a bigger size
        this.sprites[key] = c;
        return c;
      }
      if (BODY_ART.includes(world) && (!e.special || e.special === "chest")) {
        const art = DD.img(`dd/body_${world}_${e.special === "chest" ? "chest" : e.gold ? "elite" : "seg"}.webp`);
        if (!ready(art)) return null; // draw again when the picture has loaded
        const f = r * 2.3;
        g.drawImage(art, -f / 2, -f / 2, f, f);
        if (e.special) {
          g.lineWidth = 2.5;
          g.strokeStyle = SPECIAL_RIM[e.special];
          g.beginPath();
          g.arc(0, 0, r, 0, Math.PI * 2);
          g.stroke();
        }
        this.sprites[key] = c;
        return c;
      }
      const grd = g.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.05);
      grd.addColorStop(0, e.gold ? "#ffe27a" : pal.hi);
      grd.addColorStop(0.6, e.gold ? "#f5c030" : pal.mid);
      grd.addColorStop(1, e.gold ? "#9a6a08" : pal.lo);
      g.fillStyle = grd;
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = e.special ? 2.5 : 2;
      g.strokeStyle = e.special ? SPECIAL_RIM[e.special] : pal.lo;
      g.stroke();
      // a thin light rim just outside the edge keeps dark scales apart from dark lair backgrounds (UI phase
      // 2026-10-29: the old black ring broke the "lines are never black" rule and sank into purple worlds)
      g.lineWidth = 1.5;
      g.globalAlpha = 0.5;
      g.strokeStyle = e.gold ? "#ffe27a" : pal.hi;
      g.beginPath();
      g.arc(0, 0, r + 1.4, 0, Math.PI * 2);
      g.stroke();
      g.globalAlpha = 1;
      // overlapping scale arcs
      g.strokeStyle = "rgba(255,255,255,0.28)";
      g.lineWidth = 1.4;
      for (const yy of [-r * 0.35, r * 0.2]) {
        g.beginPath();
        g.arc(0, yy, r * 0.7, Math.PI * 1.15, Math.PI * 1.85);
        g.stroke();
      }
      if (e.special) {
        const face = DD.img(SPECIAL_ICON[e.special]);
        if (!ready(face)) return null; // draw again when the picture has loaded
        const f = r * 1.75;
        g.drawImage(face, -f / 2, -f / 2, f, f);
      }
      this.sprites[key] = c;
      return c;
    }

    draw() {
      const g = this.ctx;
      g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      g.clearRect(0, 0, this.cw || this.W, this.ch || this.H);
      g.save();
      g.translate(this.wox || 0, this.woy || 0); // no. 110: the fixed world on this screen
      g.scale(this.ws || 1, this.ws || 1);
      if (this.shake > 0) g.translate((this.rnd() - 0.5) * this.shake, (this.rnd() - 0.5) * this.shake);
      if (DD.SKIN_BG) this.drawBg(g);
      this.drawRift(g);
      if (this.stage.round) this.drawTower(g);
      else if (!DD.SKIN_BG) this.drawWall(g);
      for (const z of this.zones) {
        const a = Math.min(1, z.t / 0.4);
        const im = z.img && DD.img(z.img);
        if (ready(im)) {
          // Pell's fire pool (Request Asset R26), flickering
          const s = z.r * 2.6 * (1 + Math.sin(this.time * 14 + z.x) * 0.04);
          g.globalAlpha = 0.95 * a;
          g.save(); g.translate(z.x, z.y); g.rotate(this.time * 0.6); art(g, z.img, -s / 2, -s / 2, s, s, 0, this.time); g.restore();
        } else {
          g.globalAlpha = 0.5 * a;
          g.fillStyle = z.col;
          g.beginPath();
          g.ellipse(z.x, z.y, z.r, z.r * 0.7, 0, 0, Math.PI * 2);
          g.fill();
        }
        g.globalAlpha = 1;
      }
      this.drawDragon(g);
      for (const s of this.summons) this.drawSummon(g, s);
      for (const wv of this.waves) this.drawWave(g, wv);
      for (const b of this.beams) this.drawBeam(g, b);
      for (const b of this.shots) this.drawShot(g, b);
      if (this.drawC43) this.drawC43(g); // C43 (js/battle-c43.js)
      this.drawFx(g);
      this.drawHeroes(g);
      for (const t of this.texts) {
        g.globalAlpha = Math.min(1, t.t / (t.max * 0.5));
        // damage numbers at Heroes vs Crazy Wiggler size (22–25 px there); a crit pops bigger
        const pop = 1 + Math.max(0, (t.t - t.max * 0.8) / (t.max * 0.2)) * 0.35;
        if (t.coin) label(g, t.txt, t.x, t.y, 19, "#ffe27a");
        else if (t.react) {
          glow(g, DD.img(`dd/fx_${t.react}.webp`), t.x, t.y + 14, 64 * pop, 0.9);
          label(g, t.txt, t.x, t.y, 19 * pop, REACT_COL[t.react]);
        }
        else if (t.sum) label(g, t.txt, t.x, t.y, 18 * pop, t.col); // C39: continuous damage, in the hero's colour
        else label(g, t.txt, t.x, t.y, (t.crit ? 25 : 18) * pop, t.crit ? "#ffbe12" : "#fff");
      }
      g.globalAlpha = 1;
      g.restore();
      // C37: no flat cyan over the whole screen while the dragon is stopped any more (the frost on each scale shows it)
    }

    drawRift(g) {
      // the broken dungeon's mouth the dragon crawls out of; no. 102: one per dragon, each at the top of its own track
      const P = this.paths || [this.path];
      const dt = Math.max(0, Math.min(0.1, this.time - (this._riftT === undefined ? this.time : this._riftT)));
      this._riftT = this.time;
      this.riftA = this.riftA || P.map(() => 1);
      const alive = new Set(this.body.map((e) => e.d || 0));
      const R0 = this.stage.round || P.length < 2 ? 100 : Math.min(100, (this.W / P.length) * 0.5);
      P.forEach((path, k) => {
        this.riftA[k] = alive.has(k) ? 1 : Math.max(0, (this.riftA[k] === undefined ? 1 : this.riftA[k]) - dt * 1.2); // a dead dragon's portal closes in 0.8 s
        if (this.riftA[k] <= 0) return;
        g.save();
        g.globalAlpha = this.riftA[k];
        this.drawRiftAt(g, this.at(path.enter, k), R0 * (0.6 + 0.4 * this.riftA[k]));
        g.restore();
      });
    }
    drawRiftAt(g, p, R0) {
      const y = this.stage.round ? p.y : p.y - (10 * R0) / 100;
      // C34 G4 (user no. 77: "buat juga asset portal berwarna ungu, dimana dragon di lair keluar"): a purple portal (2a/fx/portal.webp),
      // lying on the field (squashed to 62 % high, 176 px wide so its ring shows around the body), its swirl turning slowly,
      // breathing, a violet glow under it; the body fades in
      // out of it as before
      // C39 (user no. 84: "portal pada saat naga keluar seharusnya memiliki edging yang blurry, tidak kaku seperti itu"): the soft
      // portal (tools/make-portal-soft.py): the swirl sharp, the stone rim blurred and fading out, so no hard outline; drawn a
      // little larger (R 100) because its edge now melts away
      const im = DD.SKIN ? DD.img("2a/fx/portal_soft.webp") : null;
      if (ready(im)) {
        const R = R0 + Math.sin(this.time * 2.2) * 4 * (R0 / 100);
        g.save();
        g.translate(p.x, y);
        g.scale(1, 0.62);
        // no. 110 (user: "portal ungu ... outline ungu juga itu terlalu kasar edgenya"): the glow was a round gradient cut by a
        // flatter ellipse, so its top and bottom ended in a hard purple line; now the gradient itself is flattened and fades to
        // nothing at its own edge, in soft steps
        const glow = g.createRadialGradient(0, 0, 0, 0, 0, R * 1.7);
        glow.addColorStop(0, "rgba(186,96,255,0.40)");
        glow.addColorStop(0.35, "rgba(170,82,245,0.26)");
        glow.addColorStop(0.65, "rgba(145,56,220,0.10)");
        glow.addColorStop(0.85, "rgba(125,44,205,0.03)");
        glow.addColorStop(1, "rgba(120,40,200,0)");
        g.fillStyle = glow;
        g.beginPath();
        g.arc(0, 0, R * 1.7, 0, Math.PI * 2);
        g.fill();
        g.rotate(this.time * 0.6);
        g.drawImage(riftArt(im), -R, -R, R * 2, R * 2);
        g.restore();
        return;
      }
      const r = 30 + Math.sin(this.time * 2) * 2;
      const grd = g.createRadialGradient(p.x, y, 2, p.x, y, r * 1.7);
      grd.addColorStop(0, "rgba(6,4,10,0.95)");
      grd.addColorStop(0.55, "rgba(60,30,40,0.75)");
      grd.addColorStop(1, "rgba(60,30,40,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(p.x, y, r * 1.7, r, 0, 0, Math.PI * 2);
      g.fill();
    }

    /** 2A (docs/TEMA_2A.md): the dungeon hall of the stage's element covers the field; on vertical stages it is scaled and placed so the
        top of its painted battlement (wallAt of its height) sits on the wall line, and it always covers the whole canvas. */
    drawBg(g) {
      const hall = DD.skinHall(this.stage.el), im = DD.img(hall.src);
      // no. 110: the hall covers the whole screen, also the room around the world (vx, vy = the screen's corner in the world)
      const k = this.ws || 1, vx = -(this.wox || 0) / k, vy = -(this.woy || 0) / k, W = (this.cw || this.W) / k, H = (this.ch || this.H) / k;
      if (!ready(im)) { g.fillStyle = "#0d0f12"; g.fillRect(vx, vy, W, H); return; }
      const iw = im.naturalWidth, ih = im.naturalHeight;
      let s = Math.max(W / iw, H / ih), y0 = vy + (H - ih * s) / 2;
      if (!this.stage.round) {
        const line = this.wallY - 10;
        s = Math.max(s, (line - vy) / (hall.wallAt * ih), (vy + H - line) / ((1 - hall.wallAt) * ih));
        y0 = line - hall.wallAt * ih * s;
      }
      g.drawImage(im, vx + (W - iw * s) / 2, y0, iw * s, ih * s);
    }

    drawWall(g) {
      // the city wall: code-drawn stone below, the painted battlement and towers on top (Request Asset R6)
      const y = this.wallY, W = this.W, H = this.H;
      const art = DD.img("dd/dd_wall.webp");
      if (ready(art)) {
        // dd_wall.webp is 1080 × 400; the middle battlement starts 252 px down: put it where the drawn one was. Below the
        // painting the painted tray (DOM .bt__band, under the canvas) carries the heroes and the wall HP (audit A11)
        // no. 110: across the whole screen (the world can be narrower than a short phone's screen), same battlement line
        const k = this.ws || 1, vx = -(this.wox || 0) / k, vw = Math.max(W, (this.cw || W) / k), s = vw / art.naturalWidth;
        g.drawImage(art, vx, y - 8 - 252 * s, vw, art.naturalHeight * s);
        return;
      }
      const grd = g.createLinearGradient(0, y, 0, H);
      grd.addColorStop(0, "#6e5d63");
      grd.addColorStop(0.18, "#54434c");
      grd.addColorStop(1, "#2c2029");
      g.fillStyle = grd;
      g.fillRect(0, y + 10, W, H - y - 10);
      g.strokeStyle = "rgba(28,18,28,0.55)";
      g.lineWidth = 1.5;
      for (let row = 0, yy = y + 34; yy < H; row++, yy += 22) {
        g.beginPath(); g.moveTo(0, yy); g.lineTo(W, yy); g.stroke();
        for (let x = (row % 2) * 24; x < W; x += 48) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x, yy + 22); g.stroke(); }
      }
      for (let x = 6; x < W; x += 36) {
        g.fillStyle = "#6e5d63";
        g.fillRect(x, y - 6, 24, 18);
        g.fillStyle = "#d99a10";
        g.fillRect(x, y - 8, 24, 4);
        g.strokeStyle = "#1c121c";
        g.lineWidth = 1.5;
        g.strokeRect(x, y - 8, 24, 20);
      }
      g.fillStyle = "#d99a10";
      g.fillRect(0, y + 10, W, 4);
      g.fillStyle = "#1c121c";
      g.fillRect(0, y + 14, W, 1.5);
    }

    drawTower(g) {
      // the round stages' watchtower in the middle of the field (painted tower requested in the Ledger)
      const { cx, cy, towerR: r } = this;
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.beginPath();
      g.ellipse(cx, cy + 10, r + 8, r * 0.75, 0, 0, Math.PI * 2);
      g.fill();
      const grd = g.createRadialGradient(cx - r * 0.3, cy - r * 0.4, 4, cx, cy, r);
      grd.addColorStop(0, "#8d7c7e");
      grd.addColorStop(1, "#3e2f39");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 4;
      g.strokeStyle = "#d99a10";
      g.stroke();
      g.lineWidth = 1.5;
      g.strokeStyle = INK;
      g.beginPath();
      g.arc(cx, cy, r + 2.5, 0, Math.PI * 2);
      g.stroke();
    }

    drawDragon(g) {
      const b = this.body;
      if (!b.length) return;
      const pal = this.palette();
      const vis = [];
      for (let i = b.length - 1; i >= 0; i--) if (b[i].s > this.enterOf(b[i]) - b[i].r * 2) vis.push(b[i]);
      vis.sort((x, y) => (x.special ? 1 : 0) - (y.special ? 1 : 0)); // no. 110: a scale carrying an item lies over its neighbours
      // no. 110 (user: "ada sedikit widgeting halus"): every scale sways a little across its path, a slow wave running down
      // the body (1.8 px; looks only: hits use the path point)
      const sway = (e) => {
        const p = this.pos(e), q = this.at(e.s + 4, e.d), ang = Math.atan2(q.y - p.y, q.x - p.x), w = Math.sin(this.time * 3.2 - e.s * 0.045) * 1.8;
        return { p: { x: p.x - Math.sin(ang) * w, y: p.y + Math.cos(ang) * w }, ang };
      };
      // C27 H: the form's limbs (legs, fins, wings, ribs …) under their segments, turned along the body, moving a little
      if (DD.SKIN) for (const e of vis) {
        if (!e.under) continue;
        const { p, ang } = sway(e);
        g.globalAlpha = Math.min(1, (e.s - (this.enterOf(e) - e.r * 2)) / (e.r * 2));
        for (const f of e.under) {
          const im = DD.img(DD.skinDragon(this.formOf(e), f.part));
          if (!ready(im)) continue;
          const w = e.r * e.taper * f.w, h = (w * im.naturalHeight) / im.naturalWidth;
          g.save(); g.translate(p.x, p.y); g.rotate(ang - Math.PI / 2 + Math.sin(this.time * 3 + e.s * 0.05) * 0.06); g.drawImage(im, -w / 2, -h / 2, w, h); g.restore();
        }
      }
      g.globalAlpha = 1;
      // body from the tail up, then the head on top
      const labels = [];
      for (const e of vis) {
        const { p, ang } = sway(e);
        const a = Math.min(1, (e.s - (this.enterOf(e) - e.r * 2)) / (e.r * 2)) * (e.mistT > this.time ? 0.35 : 1); // v4 B2: Phantom mist
        g.globalAlpha = a;
        if (e.type === "body" || e.type === "head") {
          const r = e.r * e.taper;
          if (!DD.SKIN) {
          g.fillStyle = pal.spike;
          g.beginPath();
          g.moveTo(p.x + Math.cos(ang - 1.9) * r * 1.5, p.y + Math.sin(ang - 1.9) * r * 1.5);
          g.lineTo(p.x + Math.cos(ang - 1.2) * r * 0.8, p.y + Math.sin(ang - 1.2) * r * 0.8);
          g.lineTo(p.x + Math.cos(ang - 2.6) * r * 0.8, p.y + Math.sin(ang - 2.6) * r * 0.8);
          g.closePath();
          g.fill();
          }
          // 2A: the last scale is the tail tip (painted, pointing back along the body) instead of a round scale
          const tim = DD.SKIN && e.tail && DD.img(DD.skinDragon(this.formOf(e), "tail"));
          const sp = tim ? null : this.sprite(e);
          // no. 110 (user: "badan naga yang membawa item di buat lebih besar, dan bercahaya halus"): a scale that carries
          // something (treasure chest, pearl, hero shard) is drawn 1.22 x as big with a soft breathing glow of its colour
          const sc = (e.hit > 0 ? 1.08 : 1) * (e.special ? 1.22 : 1);
          if (e.special && DD.SKIN) {
            const ga = g.globalAlpha;
            g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = ga * (0.55 + 0.15 * Math.sin(this.time * 2.6 + e.s * 0.1));
            g.drawImage(halo(SPECIAL_RIM[e.special]), p.x - r * 2.8, p.y - r * 2.8, r * 5.6, r * 5.6); g.restore();
          }
          if (tim && ready(tim)) {
            const h = e.r * e.taper * 3.6 * sc, w = (h * tim.naturalWidth) / tim.naturalHeight;
            g.save(); g.translate(p.x, p.y); g.rotate(ang - Math.PI / 2); g.drawImage(tim, -w / 2, -h * 0.82, w, h); g.restore();
          }
          if (sp) {
            const S = sp.width / 2;
            if (DD.SKIN && e.type === "body" && e.special !== "shard") {
              // C27 H: the segment turns with the body, so its back ridge follows the path (the shard face stays upright)
              g.save(); g.translate(p.x, p.y); g.rotate(ang - Math.PI / 2); g.drawImage(sp, -(S * sc) / 2, -(S * sc) / 2, S * sc, S * sc); g.restore();
            } else g.drawImage(sp, p.x - (S * sc) / 2, p.y - (S * sc) / 2, S * sc, S * sc);
          }
          if (e.hp < e.max * 0.5 && !e.special) {
            // a damaged scale darkens red (Dragon Fever); C37: a soft shadow, not a flat disc
            const ga = g.globalAlpha; g.globalAlpha = ga * 0.6 * (1 - e.hp / e.max);
            g.drawImage(soft("#500008"), p.x - r * 1.1, p.y - r * 1.1, r * 2.2, r * 2.2); g.globalAlpha = ga;
          }
          if (e.heatT > this.time) {
            // C39: being hit right now by a continuous attack = a soft glow in that hero's colour, gone 0.22 s after the last tick
            const k = Math.min(1, (e.heatT - this.time) / 0.12), ga = g.globalAlpha;
            g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = ga * 0.9 * k;
            g.drawImage(soft(e.heatC), p.x - r * 1.5, p.y - r * 1.5, r * 3, r * 3); g.restore();
          }
          if (this.frozen > 0 || this.slowT > 0) {
            // C37: stopped or slowed = a crust of painted frost on each scale (was a flat cyan disc)
            const fr = ATK("frost");
            if (ready(fr)) glow(g, fr, p.x, p.y, r * 2.5, this.frozen > 0 ? 0.85 : 0.4);
          }
          if (e.st && e.stT > this.time) {
            // element status: its painted light (Wet, Burning, Charged, Entangled); C37: no line ring under it any more
            glow(g, DD.img(`dd/fx_${STATUS_FX[e.st]}.webp`), p.x, p.y, r * 2.7, 0.95);
          }
          if (e.crack && e.crackT > this.time) glow(g, DD.img("dd/fx_cracked.webp"), p.x, p.y, r * 2, 0.45 + 0.2 * e.crack);
          if (e.type === "body") labels.push([e, p]);
        }
      }
      g.globalAlpha = 1;
      // the head leads (whatever scale is in front wears it); G2: every dragon wears its own head on its front scale
      const heads = [];
      if (this.dragons) { const seen = new Set(); for (const e of b) if (!seen.has(e.d)) { seen.add(e.d); heads.push([e, this.dragons[e.d]]); } }
      else heads.push([b[0], null]);
      const headBoxes = [];
      this.headAng = this.headAng || {};
      for (const [head, dg] of heads) {
        if (head.s <= this.enterOf(head) - 30) continue;
        const { p } = sway(head);
        const form = dg ? dg.form : this.stage.form;
        const size = (DD.SKIN ? 92 * ((DD.FORMS[form] || {}).headScale || 1) : 140) * (head.r / DD.HEAD_R);
        headBoxes.push({ x: p.x, y: p.y, rx: size * 0.5, ry: size * 0.55 });
        // Rage: a red glow one second before (the roar) and while it runs
        const rg = dg && (dg.raging ? 1 : dg.warned ? 0.6 : 0);
        if (rg) { const ga = g.globalAlpha; g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = ga * rg * (0.75 + 0.25 * Math.sin(this.time * 18)); g.drawImage(soft("#ff2a2a"), p.x - size, p.y - size, size * 2, size * 2); g.restore(); }
        const img = dg ? dg.headImg : this.headImg;
        if (ready(img)) {
          const h = (size * img.naturalHeight) / img.naturalWidth;
          // no. 110 (user: "naga harusnya tidak kaku rotasi kepalanya"): the head looks where its body goes (painted heading
          // down = no turn), turning smoothly (about 6 turns of the gap a second, the short way round), with a slow sway of 4 degrees
          const key = head.d || 0, q = this.at(head.s + 8, head.d), want = Math.atan2(q.y - p.y, q.x - p.x) - Math.PI / 2;
          const st = this.headAng[key] || (this.headAng[key] = { a: want, t: this.time });
          const dt = Math.min(0.1, Math.max(0, this.time - st.t));
          st.t = this.time;
          st.a += ((((want - st.a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 6);
          g.save();
          g.translate(p.x, p.y);
          g.rotate(st.a + Math.sin(this.time * 2.2 + key * 1.7) * 0.07);
          g.drawImage(img, -size / 2, -h * 0.6 + Math.sin(this.time * 2.4) * 1.5, size, h);
          g.restore();
        }
        if (this.frozen > 0) {
          g.fillStyle = "rgba(138,232,255,0.4)";
          g.beginPath();
          g.arc(p.x, p.y - size * 0.1, size * 0.42, 0, Math.PI * 2);
          g.fill();
        }
        label(g, DD.fmt(head.hp), p.x, p.y + size * 0.36, 22, "#fff");
      }
      // life numbers last, never on top of each other
      const placed = [];
      for (const [e, p] of labels.reverse()) {
        if (placed.some((q) => Math.abs(q.x - p.x) < 40 && Math.abs(q.y - p.y) < 20)) continue;
        if (headBoxes.some((hb) => Math.abs(hb.x - p.x) < hb.rx && Math.abs(hb.y - p.y) < hb.ry)) continue; // hidden under a head
        placed.push(p);
        label(g, DD.fmt(e.hp), p.x, p.y + (e.special ? e.r * 0.76 : 0), 17, e.special ? "#ffe27a" : "#fff");
      }
    }

    bar(g, x, y, w, f, col) {
      g.fillStyle = INK;
      g.fillRect(x - w / 2 - 2, y - 2, w + 4, 9);
      g.fillStyle = col;
      g.fillRect(x - w / 2, y, Math.max(0, w * f), 5);
    }

    drawWave(g, wv) {
      if (wv.type === "pin") {
        if (wv.target.dead) return;
        const p = this.pos(wv.target);
        const spear = DD.img("dd/fx_proj_spear.webp"), crater = DD.img("dd/fx_area_crater.webp");
        if (ready(spear) && ready(crater)) {
          // Marpesia (Draft 19): the spear of light falls, then a glowing crater burns where it struck
          g.save();
          if (wv.drop > 0) {
            const q = 1 - wv.drop / 0.3;
            shade(g, p.x, p.y - 10, 60 * (0.5 + q * 0.5), (1 - q) * 120);
            g.drawImage(spear, p.x - 30, p.y - 160 + q * 120 - 120, 60, 150);
          } else {
            const s = Math.max(110, wv.r * 7);
            g.globalAlpha = 0.85 + Math.sin(this.time * 18) * 0.1;
            art(g, "dd/fx_area_crater.webp", p.x - s / 2, p.y - s / 2, s, s, 0, this.time);
            g.globalAlpha = 1;
            shade(g, p.x + 6, p.y - 16, 34, 0);
            g.drawImage(spear, p.x - 22, p.y - 100, 44, 110);
          }
          g.restore();
          return;
        }
        g.save();
        g.lineCap = "round";
        g.globalAlpha = 0.9;
        g.strokeStyle = wv.hero.def.col;
        g.lineWidth = 10;
        g.beginPath(); g.moveTo(p.x, p.y - 70); g.lineTo(p.x, p.y + 6); g.stroke();
        g.strokeStyle = "#fffaf0";
        g.lineWidth = 4;
        g.beginPath(); g.moveTo(p.x, p.y - 70); g.lineTo(p.x, p.y + 6); g.stroke();
        g.globalAlpha = 0.35 + Math.sin(this.time * 20) * 0.15;
        g.fillStyle = wv.hero.def.col;
        g.beginPath(); g.arc(p.x, p.y, Math.max(wv.r, 18), 0, Math.PI * 2); g.fill();
        g.restore();
        return;
      }
      if (!wv.o || wv.ang === undefined) return;
      const o = wv.o;
      g.save();
      g.translate(o.x, o.y);
      g.rotate(wv.ang);
      if (wv.type === "jet") {
        const len = wv.len || 900;
        const coin = DD.img(`dd/fx_proj_${PROJ[wv.hero.def.id] || "coin"}.webp`);
        const id = wv.hero.def.id, st = id === "dreamwalker" ? ATK("stream_dream") : ATK("stream_gold");
        if (ready(st)) {
          // C37: a painted stream flowing out (was a flat see-through bar): Ebenezer's gold coins, Dreamwalker's dream water
          const w = Math.max(44, wv.width * 5.2) * (1 + Math.sin(this.time * 9) * 0.04);
          g.globalCompositeOperation = "lighter";
          g.globalAlpha = 0.95;
          tile(g, id === "dreamwalker" || id === "ebenezer" ? st : tinted(st, wv.hero.def.col), len, w, -this.time * 520);
          const fl = RV("flare");
          if (ready(fl)) { g.globalAlpha = 0.8; g.drawImage(tinted(fl, id === "ebenezer" ? null : wv.hero.def.col), -w * 0.9, -w * 0.9, w * 1.8, w * 1.8); }
          g.restore();
          return;
        }
        if (ready(coin)) {
          g.globalAlpha = 0.35;
          g.globalCompositeOperation = "lighter";
          g.lineCap = "round";
          g.strokeStyle = wv.hero.def.id === "ebenezer" ? "#ffd84a" : wv.hero.def.col;
          g.lineWidth = wv.width * 2.4;
          g.beginPath(); g.moveTo(8, 0); g.lineTo(len, 0); g.stroke();
          g.restore();
          return;
        }
        g.globalAlpha = 0.85;
        g.lineCap = "round";
        g.strokeStyle = wv.hero.def.col;
        g.lineWidth = wv.width * 1.6;
        g.beginPath(); g.moveTo(8, 0); g.lineTo(len, 0); g.stroke();
        g.strokeStyle = "#fffaf0";
        g.lineWidth = Math.max(1.5, wv.width * 0.5);
        g.beginPath(); g.moveTo(8, 0); g.lineTo(len, 0); g.stroke();
        g.restore();
        return;
      }
      // C33 G6 (user no. 75: "animasi ysmay, memiliki api transparent, itu dihilangkan"): no see-through cone under Ysmay's
      // breath any more; the stream of fire puffs and embers (the "spray" emitter in update) is the whole flame
      if (wv.type === "spray") { g.restore(); return; }
      const flame = DD.img("dd/fx_unit_flame.webp");
      if (ready(flame)) {
        // Ysmay's flame (Request Asset R27): the painted cone, its tip at her hand, pointing along the sweep
        const len = wv.len, wide = Math.tan(wv.angle) * len * 2.6;
        g.rotate(Math.PI / 2);
        g.globalAlpha = 0.4;
        g.globalCompositeOperation = "lighter";
        art(g, "dd/fx_unit_flame.webp", -wide / 2, -len * (1 + Math.sin(this.time * 24) * 0.03), wide, len, 0, this.time);
        g.restore();
        return;
      }
      const grd = g.createLinearGradient(0, 0, wv.len, 0);
      grd.addColorStop(0, "rgba(255,240,180,0.9)");
      grd.addColorStop(0.4, wv.hero.def.col);
      grd.addColorStop(1, "rgba(242,112,28,0)");
      g.fillStyle = grd;
      g.globalAlpha = 0.85;
      g.beginPath();
      g.moveTo(6, 0);
      const flick = Math.sin(this.time * 30) * 0.03;
      g.lineTo(wv.len, Math.tan(wv.angle + flick) * wv.len);
      g.lineTo(wv.len, -Math.tan(wv.angle - flick) * wv.len);
      g.closePath();
      g.fill();
      g.restore();
    }

    drawSummon(g, s) {
      const pic0 = DD.img(s.mode === "wolf" ? "dd/fx_unit_wolf.webp" : "dd/fx_unit_dragonling.webp");
      if (ready(pic0)) {
        // the ground shadow first: under the wolf it drops away as it leaps; the dragonling flies, so its shadow sits lower
        shade(g, s.x, s.y + (s.mode === "wolf" ? 4 : 10), s.mode === "wolf" ? 70 : 80, s.mode === "wolf" ? Math.sin((s.u || 0) * Math.PI) * 70 : 46);
        g.save();
        g.translate(s.x, s.y);
        if (s.mode === "wolf") { g.scale(s.face || 1, 1); art(g, "dd/fx_unit_wolf.webp", -44, -30, 88, 60, 0, this.time); }
        else { g.rotate((s.dir || 1) > 0 ? Math.PI / 2 : -Math.PI / 2); const f = 1 + Math.sin(this.time * 16) * 0.06; art(g, "dd/fx_unit_dragonling.webp", -46 * f, -44, 92 * f, 88, 0, this.time); }
        g.restore();
        return;
      }
      const im = s.img;
      g.fillStyle = "rgba(0,0,0,0.25)";
      g.beginPath();
      g.ellipse(s.x, s.y + 20, 16, 5, 0, 0, Math.PI * 2);
      g.fill();
      if (ready(im)) g.drawImage(im, s.x - 22, s.y - 22 + Math.sin(this.time * 4 + s.seed) * 2, 44, 44);
    }

    drawBeam(g, b) {
      const a = b.t / b.max;
      // C37: painted light for every beam (was coloured lines, a stretched sun picture and gold swirls at the ends)
      const len0 = Math.hypot(b.x2 - b.x1, b.y2 - b.y1), ang0 = Math.atan2(b.y2 - b.y1, b.x2 - b.x1);
      if (b.arc) {
        const rb = ATK("rainbow");
        if (ready(rb)) {
          // Finnick's rainbow: the painted arch from one scale to the next, bowing up
          g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = Math.min(1, a * 1.6);
          g.translate((b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2); g.rotate(ang0 + (Math.cos(ang0) < 0 ? Math.PI : 0));
          const wd = Math.max(80, len0 * 1.08), ht = Math.min(wd * 0.24, 130); // its feet on the two scales, a low arch (a tall one read as a giant oval)
          g.drawImage(rb, -wd / 2, -ht * 0.96, wd, ht);
          g.restore();
          return;
        }
      } else if (b.zig) {
        const bl = RV("bolts");
        if (ready(bl)) {
          // chain lightning: one of the four painted bolts, recoloured, stretched from scale to scale
          if (b.bi === undefined) b.bi = (Math.random() * 4) | 0;
          const sw = bl.naturalWidth / 4, wd = Math.max(26, Math.min(70, len0 * 0.32));
          g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = Math.min(1, a * 1.8);
          g.translate(b.x1, b.y1); g.rotate(ang0 - Math.PI / 2);
          g.drawImage(tinted(bl, b.col), (sw * b.bi * Math.min(bl.naturalWidth, 768)) / bl.naturalWidth, 0, (sw * Math.min(bl.naturalWidth, 768)) / bl.naturalWidth, Math.round((bl.naturalHeight * Math.min(bl.naturalWidth, 768)) / bl.naturalWidth), -wd / 2, 0, wd, len0);
          g.restore();
          return;
        }
      } else if (!b.bolt) {
        const bm = ATK("beam");
        if (ready(bm)) {
          // a beam of light (Sera, Granny Tock and the lances): the painted beam in the hero's colour, flowing, a flare at each end
          const w = Math.max(30, b.w * 4.2) * (0.75 + a * 0.4);
          g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = Math.min(0.72, a * 1.2); // not so bright that it hides the numbers
          g.translate(b.x1, b.y1); g.rotate(ang0);
          tile(g, tinted(bm, b.col), len0, w, -this.time * 700);
          g.restore();
          const fl = RV("flare");
          if (ready(fl)) for (const [x, y] of [[b.x1, b.y1], [b.x2, b.y2]]) {
            const fx = Math.max(16, Math.min(this.W - 16, x)), r = w * 1.1;
            g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = a * 0.6; g.translate(fx, y); g.rotate(ang0);
            g.drawImage(tinted(fl, b.col), -r, -r, r * 2, r * 2); g.restore();
          }
          return;
        }
      }
      g.save();
      g.globalAlpha = a;
      if (b.sun || b.bolt) {
        const im = DD.img(b.sun ? "dd/fx_unit_beam.webp" : "dd/fx_area_lightning.webp");
        if (ready(im)) {
          const len = Math.hypot(b.x2 - b.x1, b.y2 - b.y1), ang = Math.atan2(b.y2 - b.y1, b.x2 - b.x1);
          g.save();
          g.translate(b.x1, b.y1);
          g.rotate(ang - Math.PI / 2);
          // local +y runs from (x1, y1) to (x2, y2); the top of the picture (narrow end, the sky) sits at the start
          const wide = b.sun ? Math.max(56, b.w * 6) * (0.8 + a * 0.4) : 90;
          art(g, b.sun ? "dd/fx_unit_beam.webp" : "dd/fx_area_lightning.webp", -wide / 2, 0, wide, len, 1 - a, this.time);
          g.restore();
          if (b.sun) {
            const portal = DD.img("dd/fx_area_portal.webp");
            if (ready(portal)) for (const [x, y] of [[b.x1, b.y1], [b.x2, b.y2]]) { g.save(); g.translate(Math.max(10, Math.min(this.W - 10, x)), y); g.rotate(this.time * 3); art(g, "dd/fx_area_portal.webp", -48, -48, 96, 96, 0, this.time); g.restore(); }
          }
          g.restore();
          return;
        }
      }
      if (b.arc) {
        // Finnick's rainbow: a high arc in seven colours
        const mx = (b.x1 + b.x2) / 2, my = Math.min(b.y1, b.y2) - 120, cx = mx + b.arc * 80;
        const cols = ["#ff4a4a", "#ff9a2a", "#ffe24a", "#5ae05a", "#4ab4ff", "#6a5aff", "#c25aff"];
        g.lineCap = "round";
        cols.forEach((col, i) => { g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(b.x1 + (i - 3) * 2.5, b.y1); g.quadraticCurveTo(cx + (i - 3) * 3, my + (i - 3) * 3, b.x2 + (i - 3) * 2.5, b.y2); g.stroke(); });
        g.restore();
        return;
      }
      g.lineCap = "round";
      const path = () => {
        g.beginPath();
        if (b.zig) {
          const n = 5;
          g.moveTo(b.x1, b.y1);
          for (let i = 1; i < n; i++) {
            const t = i / n;
            g.lineTo(b.x1 + (b.x2 - b.x1) * t + (Math.random() - 0.5) * 10, b.y1 + (b.y2 - b.y1) * t + (Math.random() - 0.5) * 10);
          }
          g.lineTo(b.x2, b.y2);
        } else {
          g.moveTo(b.x1, b.y1);
          g.lineTo(b.x2, b.y2);
        }
      };
      g.strokeStyle = b.col;
      g.lineWidth = b.w * 2;
      path();
      g.stroke();
      g.strokeStyle = "#fffaf0";
      g.lineWidth = Math.max(1.5, b.w * 0.7);
      path();
      g.stroke();
      g.restore();
    }

    drawShot(g, b) {
      if (b.wait > 0 && b.target && !b.target.dead) {
        // Garran's reticle on the strongest scale (Draft 19)
        const p = this.pos(b.target), r = 30 + b.wait * 40;
        const ret = ATK("reticle");
        if (ready(ret)) {
          // C37: the painted targeting rune in the hero's colour closes in and turns
          g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.95;
          g.translate(p.x, p.y); g.rotate(this.time * 2.4);
          g.drawImage(tinted(ret, b.hero.def.id === "mercenary" ? null : b.col), -r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
          g.restore();
        }
        return;
      }
      if (b.trail && b.trail.length > 3) {
        // C37: a fading trail of soft light in the hero's colour (was coloured line segments)
        g.save();
        g.globalCompositeOperation = "lighter";
        const dotI = soft(b.col);
        for (let i = 0; i < b.trail.length; i += 2) {
          const q = i / b.trail.length, r = 4 + q * 10;
          g.globalAlpha = q * 0.55;
          g.drawImage(dotI, b.trail[i] - r, b.trail[i + 1] - r, r * 2, r * 2);
        }
        g.restore();
      }
      const pid = b.hero && (b.kind === "needle" ? "ice" : PROJ[b.hero.def.id]);
      const pim = pid && DD.img(`dd/fx_proj_${pid}.webp`);
      if (ready(pim)) {
        // painted projectiles (Request Asset R24) point up in the picture; a ground shadow under each (user 2026-10-30:
        // "semua aset di dungeon memiliki bayangan"), further and fainter the higher it flies
        const k = b.kind;
        const alt = k === "lob" ? Math.sin(Math.min(1, b.t / b.flyT) * Math.PI) * 80 : k === "saw" && b.air ? Math.sin(Math.min(1, b.t / b.flyT) * Math.PI) * 140
          : k === "drop" && b.target && !b.target.dead ? Math.max(0, this.pos(b.target).y - b.y) : k === "boomerang" ? 26 : 10;
        shade(g, b.x, b.y, k === "boomerang" ? Math.min(70, Math.max(46, (b.r || 18) * 2)) : k === "saw" ? Math.max(48, (b.r || 18) * 2.6) : 36, alt);
        g.save();
        g.translate(b.x, b.y);
        let s = 40;
        if (k === "boomerang") { g.rotate(b.spin); s = Math.min(74, Math.max(46, b.r * 2.2)); } // C37: Borrik's axes and Hobb's discs stop growing at 74 px
        else if (k === "saw") { g.rotate(b.spin); s = Math.max(56, b.r * 2.6); }
        else if (k === "curve") { g.rotate(b.spin); s = 38; }
        else if (k === "lob") { g.rotate(b.t * 10); s = 38; }
        else if (k === "ricochet" || k === "weave") { s = Math.max(40, b.r * 2.8) * (1 + Math.sin(this.time * 20) * 0.05); g.rotate(this.time * 4); }
        else if (k === "drop") { s = 34; g.rotate(Math.sin(this.time * 12 + b.wob) * 0.4); }
        else if (k === "bounce") { s = 36; }
        else if (k === "needle") { g.rotate((b.ang || 0) + Math.PI / 2); s = 22; }
        else { g.rotate((b.ang || 0) + Math.PI / 2); s = k === "hunter" ? 36 : 42; }
        if (DD.SKIN && pim.naturalHeight > pim.naturalWidth * 1.3) { const h = s * 1.5, w = (h * pim.naturalWidth) / pim.naturalHeight; g.drawImage(pim, -w / 2, -h / 2, w, h); }
        else art(g, `dd/fx_proj_${pid}.webp`, -s / 2, -s / 2, s, s, 0, this.time);
        g.restore();
        return;
      }
      g.save();
      g.translate(b.x, b.y);
      // painted projectile per hero (Request Asset R3–R4), pointing right; Fen's wolf needles stay drawn
      const shotArt = !DD.SKIN && b.hero && b.kind !== "needle" && DD.img(`dd/shot_${b.hero.def.id}.webp`); // 2A: no old painting while the 2A one loads
      if (ready(shotArt)) {
        const k = b.kind, size = k === "saw" || k === "boomerang" || k === "ricochet" ? Math.max(30, b.r * 2.6) : 34;
        if (k === "saw" || k === "boomerang") g.rotate(b.spin);
        else if (k === "lob") g.rotate(b.t * 10);
        else if (k !== "weave" && k !== "ricochet" && k !== "gold" && k !== "bounce") g.rotate(b.ang || 0);
        g.drawImage(shotArt, -size / 2, -size / 2, size, size);
        g.restore();
        return;
      }
      g.lineJoin = "round";
      g.lineWidth = 2;
      g.strokeStyle = INK;
      g.fillStyle = b.col;
      const k = b.kind;
      if (k === "pierce") {
        g.rotate(b.ang);
        g.beginPath();
        g.moveTo(20, 0); g.lineTo(0, -7); g.lineTo(-16, 0); g.lineTo(0, 7); g.closePath();
        g.fill(); g.stroke();
      } else if (k === "boomerang") {
        g.rotate(b.spin);
        g.scale(b.r / 15, b.r / 15);
        g.fillStyle = "#c5cde4";
        g.beginPath();
        g.moveTo(-12, -4); g.quadraticCurveTo(0, -14, 12, -4); g.lineTo(6, 2); g.quadraticCurveTo(0, -4, -6, 2); g.closePath();
        g.fill(); g.stroke();
        g.fillStyle = "#7a4620";
        g.fillRect(-2, 0, 4, 10);
      } else if (k === "saw") {
        g.rotate(b.spin);
        const r = b.r * 0.55;
        g.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          g.lineTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25);
          g.lineTo(Math.cos(a + 0.39) * r * 0.8, Math.sin(a + 0.39) * r * 0.8);
        }
        g.closePath();
        g.fill(); g.stroke();
      } else if (k === "weave") {
        g.fillStyle = b.col;
        g.beginPath(); g.arc(0, 0, 11, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = "#fffaf0";
        g.beginPath(); g.arc(-3, -3, 4, 0, Math.PI * 2); g.fill();
      } else if (k === "rocket") {
        g.rotate(b.ang);
        g.fillStyle = b.col;
        g.beginPath(); g.arc(0, 0, 8, 0, Math.PI * 2); g.fill(); g.stroke();
        g.globalAlpha = 0.5;
        g.beginPath(); g.arc(-10, 0, 5, 0, Math.PI * 2); g.fill();
      } else if (k === "ricochet") {
        g.fillStyle = "#fffaf0";
        g.beginPath(); g.arc(0, 0, b.r, 0, Math.PI * 2); g.fill();
        g.strokeStyle = "#0a8fd8"; g.stroke();
      } else if (k === "lob") {
        g.rotate(b.t * 10);
        g.beginPath(); g.arc(0, 2, 6, 0, Math.PI * 2); g.fill(); g.stroke();
      } else if (k === "charm") {
        g.rotate(b.ang || 0);
        g.strokeStyle = b.col;
        g.lineWidth = 3;
        g.beginPath(); g.moveTo(-10, -4); g.lineTo(8, 0); g.lineTo(-10, 4); g.stroke();
      } else if (k === "gold") {
        g.fillStyle = "#f5c030";
        g.beginPath(); g.arc(0, 0, 6, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = "#ffe27a";
        g.fillRect(-2, -3, 4, 6);
      } else if (k === "hunter" || k === "needle") {
        g.rotate(b.ang || 0);
        g.strokeStyle = k === "needle" ? b.col : "#fffaf0";
        g.lineWidth = k === "needle" ? 2 : 3;
        g.beginPath(); g.moveTo(-12, 0); g.lineTo(9, 0); g.stroke();
        g.beginPath(); g.moveTo(13, 0); g.lineTo(7, -4); g.lineTo(7, 4); g.closePath(); g.fill();
      } else if (k === "bounce") {
        g.fillStyle = b.col;
        g.beginPath();
        g.moveTo(0, 6); g.bezierCurveTo(-10, -2, -5, -10, 0, -4); g.bezierCurveTo(5, -10, 10, -2, 0, 6);
        g.fill(); g.stroke();
      } else {
        g.rotate(b.t * 12);
        g.beginPath(); g.arc(0, 0, 5, 0, Math.PI * 2); g.fill(); g.stroke();
      }
      g.restore();
    }

    drawFx(g) {
      for (const p of this.fx) {
        const a = p.t / p.max;
        g.globalAlpha = a;
        if (p.img) {
          const im = DD.img(p.img);
          if (!ready(im)) continue;
          const s = p.size * (1 + (1 - a) * (p.grow || 0));
          g.save();
          if (p.flow) {
            g.globalAlpha = Math.min(1, (1 - a) * 6) * Math.min(1, a * 1.7) * (p.alpha || 1);
            if (p.add) g.globalCompositeOperation = "lighter";
            if (p.solid) shade(g, p.x, p.y, s, 0);
          } else {
            g.globalAlpha = (p.fade ? Math.min(1, a * 2) : Math.min(1, a * 1.6)) * (p.alpha || 1);
            if (p.add) g.globalCompositeOperation = "lighter";
          }
          g.translate(p.x, p.y);
          g.rotate((p.rot || 0) + (p.spin || 0) * (p.max - p.t));
          art(g, p.img, -s / 2, -s / 2, s, s, 1 - a, this.time);
          g.restore();
          continue;
        }
        // C37: painted claw marks and rings, round soft sparks (were line arcs, line circles and squares)
        g.save(); g.globalCompositeOperation = "lighter";
        if (p.claw) {
          const cl = ATK("claw"), s = p.claw * 3.2 * (1.05 - a * 0.25);
          if (ready(cl)) { g.translate(p.x, p.y); g.rotate(p.ang || 0); g.drawImage(tinted(cl, p.col), -s / 2, -s / 2, s, s); }
        } else if (p.ring) {
          const rg = RV("ring"), R = p.ring * (1.25 - a * 0.45);
          if (ready(rg)) g.drawImage(tinted(rg, p.col), p.x - R, p.y - R, R * 2, R * 2);
        } else {
          const sz = p.size * 3.2;
          g.drawImage(soft(p.col), p.x - sz, p.y - sz, sz * 2, sz * 2);
        }
        g.restore();
      }
      g.globalAlpha = 1;
    }

    drawHeroes(g) {
      const on = this.heroes.filter((h) => h.onWall).sort((a, b) => a.dy - b.dy);
      // no aim line under the Commander (removed 2026-10-30 at the user's word)
      for (const h of on) {
        if (h.orbitPts) {
          const im = DD.img(h.def.icon);
          const sk = DD.img(`dd/fx_proj_${PROJ[h.def.id] || "skull"}.webp`), vx = DD.img("dd/fx_area_vortex.webp"); // C33 G7: the ring hero's own picture
          if (this.has(h, "wide") && h.oc && ready(vx)) {
            // Lich (Draft 19): the soul vortex turns under the swarm
            const R = Math.min(72, h.def.w.r * (1 + h.st.size) * 1.4); // C37: at most 72 px (it grew past the head)
            g.save(); g.globalAlpha = 0.6; g.translate(h.oc.x, h.oc.y); g.rotate(-this.time * 2.2);
            if (h.def.id === "sugarplum-faerie") g.drawImage(tinted(vx, "#ff7ad6"), -R, -R, R * 2, R * 2);
            else art(g, "dd/fx_area_vortex.webp", -R, -R, R * 2, R * 2, 0, this.time);
            g.restore();
          }
          for (const q of h.orbitPts) { const skArt = ready(sk) ? sk : im; shade(g, q.x, q.y, 30, 14); if (ready(skArt)) g.drawImage(skArt, q.x - 18, q.y - 18, 36, 36); }
        }
      }
      for (const h of on) {
        const p = this.heroPos(h);
        const H = h.i === 0 ? HERO_H.cmd : HERO_H.other; // the party's first hero stands in front, a little bigger
        g.fillStyle = "rgba(0,0,0,0.35)";
        g.beginPath();
        g.ellipse(p.x, p.y + H * 0.48, H * 0.3, H * 0.09, 0, 0, Math.PI * 2);
        g.fill();
        if (!ready(h.sprite)) continue;
        const w = (H * h.sprite.naturalWidth) / h.sprite.naturalHeight;
        const an = h.at >= 0 && h.an;
        if (an && ready(an.img)) {
          // C41: the attack frame; the painted figure inside it sits exactly where the still sprite's figure is
          const q = H / h.sprite.naturalHeight, bb = an.bb, sc = (bb[3] * q) / an.figH;
          let f = Math.min(an.n - 1, Math.floor((h.at / h.adur) * an.n));
          if (h.ahold && an.n > 4) f = Math.max(1, Math.min(an.n - 2, an.hit + [0, 1, 0, -1][Math.floor(h.aht * 9) % 4]));
          g.drawImage(an.img, (f % an.cols) * an.fw, Math.floor(f / an.cols) * an.fh, an.fw, an.fh,
            p.x - w / 2 + bb[0] * q - an.fx * sc, p.y - H * 0.5 + bb[1] * q - an.fy * sc, an.fw * sc, an.fh * sc);
          continue;
        }
        const k = h.recoil > 0 ? h.recoil / 0.14 : 0;
        const breathe = Math.sin(this.time * 2.4 + h.i) * 1;
        g.drawImage(h.sprite, p.x - w / 2, p.y - H * 0.5 - breathe + k * 2, w, H + breathe - k * 2);
      }
    }
  }

  function pickTier(r) {
    let acc = 0;
    for (const [t, p] of DD.CARD_TIER_ODDS) if (r < (acc += p)) return t;
    return "rare";
  }

  DD.Battle = Battle;
})();
