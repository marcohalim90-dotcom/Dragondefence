/* DREAMDYSIS: DRAGON DEFENCE — every screen and box, design v3 (docs/RANCANGAN.md). Kit classes from css/kit.css,
   layout in css/game.css, rules in js/state.js, the fight in js/battle.js. The look is provisional: the UI phase comes
   after the mechanics (user 2026-10-24: "nanti baru masuk ui"). No story (user: "ga usah ada cerita dulu"). */
(function () {
  const app = document.getElementById("app");
  // narrower than the 375 px design width (a narrow preview pane, a small phone): the whole game zooms down as one picture,
  // so tiles, text and paintings keep their proportions (2026-10-30, user: "kotaknyanya kecil. tapi mereka besar banget")
  const fit = () => { const z = Math.min(1, window.innerWidth / 375); document.documentElement.style.zoom = z < 0.999 ? String(z) : ""; };
  fit();
  window.addEventListener("resize", fit);
  const A = (p) => "assets/" + (DD.skin ? DD.skin(p) : p);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const S = () => DD.P.get();
  const P = DD.P;
  let tab = "home";

  /* ------------------------------------------------------------ sound (V2 music and hero voices) */
  const audio = { el: null, name: "" };
  // C33 G8: Music and Sound Effects each have a switch and a volume (S.music / S.musicVol, S.sound / S.sfxVol); music is on
  // unless switched off (it was off since 2026-10-24, "musik matiin berisik banget", until no. 75 asked for it everywhere)
  DD.musicOn = () => S().music !== false;
  DD.musicVol = () => (S().musicVol ?? 50) / 100;
  DD.sfxVol = () => (S().sfxVol ?? 100) / 100;
  const fade = (el, to, ms, done) => {
    const from = el.volume, t0 = performance.now();
    const step = () => { const k = Math.min(1, (performance.now() - t0) / ms); el.volume = Math.max(0, Math.min(1, from + (to - from) * k)); if (k < 1) requestAnimationFrame(step); else if (done) done(); };
    requestAnimationFrame(step);
  };
  DD.bgm = function (name) {
    if (name) audio.name = name;
    if (!DD.musicOn() || !audio.name) { if (audio.el) audio.el.pause(); return; }
    const vol = DD.musicVol() * 0.8;
    if (audio.el && audio.el.dataset.name === audio.name) { if (audio.el.paused) audio.el.play().catch(() => {}); audio.el.volume = vol; return; }
    const old = audio.el;
    if (old) fade(old, 0, 450, () => old.pause()); // the old track fades out while the new one fades in
    const el = new Audio(A(`audio/${audio.name}.mp3`));
    el.dataset.name = audio.name;
    el.loop = true;
    el.volume = 0;
    audio.el = el;
    el.play().then(() => fade(el, vol, 700)).catch(() => {});
  };
  const playing = {};
  /** once (no. 110: "suara hero diputar terus menerus ... sekali saja, kalau suara belum selesai ... tetap suara tersebut lanjut
      sampai selesai"): while this file still plays, a new call starts nothing and the playing one runs to its end. */
  DD.sfx = function (file, vol, once) {
    if (!S().sound) return false;
    const was = playing[file];
    if (once && was && !was.ended && !was.paused) return false;
    const a = new Audio(A(file));
    a.volume = Math.min(1, (vol || 0.8) * DD.sfxVol());
    a.play().catch(() => {});
    if (once) playing[file] = a;
    return true;
  };
  /** The Sound menu (C33 G8): two rows, each a switch plate and a volume slider. */
  const soundPanel = () => {
    const row = (id, label, on, vol) => `<div class="sndrow"><div class="sndrow__top">${text("label", label)}<button class="sndrow__sw ${on ? "is-on" : ""}" data-sw="${id}" aria-pressed="${on}">${text("tag", on ? "On" : "Off")}</button></div>` +
      `<input class="sndrow__vol" type="range" min="0" max="100" step="5" value="${vol}" data-vol="${id}" aria-label="${label} volume" ${on ? "" : "disabled"}>${text("tag", vol + "%", "sndrow__pct")}</div>`;
    return `<div class="sndp">${row("music", "Music", DD.musicOn(), S().musicVol ?? 50)}${row("sfx", "Sound Effects", !!S().sound, S().sfxVol ?? 100)}</div>`;
  };
  const bindSoundPanel = (el, redraw) => {
    el.querySelectorAll("[data-sw]").forEach((b) => (b.onclick = () => {
      if (b.dataset.sw === "music") { S().music = !DD.musicOn(); P.save(); DD.bgm(); }
      else { S().sound = !S().sound; P.save(); if (S().sound) snd("tap"); }
      redraw();
    }));
    el.querySelectorAll("[data-vol]").forEach((r) => {
      r.oninput = () => {
        const v = +r.value;
        if (r.dataset.vol === "music") { S().musicVol = v; if (audio.el) audio.el.volume = DD.musicVol() * 0.8; }
        else S().sfxVol = v;
        r.nextElementSibling.textContent = v + "%";
      };
      r.onchange = () => { P.save(); if (r.dataset.vol === "sfx") snd("tap"); };
    });
  };
  function settingsSheet() {
    sheet({ title: () => "Menu", cls: "setsheet", body: () => `<div class="sets__h">${text("label", "Sound")}</div>` + soundPanel(), bind: (sh, re) => bindSoundPanel(sh, re) });
  }

  /** C28 (2026-11-02, user: "sekarang masukan semua sound effect"): a named sound from js/sfx.js (Ledger Draft 24). */
  const snd = (name, o) => DD.play && DD.play(name, o);
  // C28 E: every button answers the finger: a tab sound on the bottom bar, the V2 tap elsewhere, a refusal on a greyed button
  app.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    snd(b.closest("nav, .nav") ? "tab" : b.classList.contains("gk-btn--poor") ? "deny" : "tap");
  }, true);

  /* ------------------------------------------------------------ kit pieces */
  const text = (lvl, t, cls) => `<span class="gk-text gk-text--${lvl} ${cls || ""}">${t}</span>`;
  const cream = (t, cls) => `<span class="gk-cream ${cls || ""}">${t}</span>`;
  // 2A draws the small signs as thin lines (docs/TEMA_2A.md A6, css/theme-2a.css "2A small signs"); its energy bolt is the 2A energy icon (DD.skin)
  const glyph = (g) => (DD.SKIN && g !== "bolt" ? `<span class="gk-glyph g2 g2--${g}" aria-hidden="true"></span>` : `<img class="gk-glyph" src="${A("glyphs/glyph_" + g + ".webp")}" alt="">`);
  const icon = (p, cls) => `<img class="${cls || ""}" src="${A(p)}" alt="">`;
  const btn = (o) =>
    `<button class="gk-btn ${o.size ? "gk-btn--" + o.size : ""} gk--${o.v || "neutral"} ${o.cls || ""}" ${o.id ? `id="${o.id}"` : ""} ${o.data || ""}>` +
    `<span class="gk-btn__row">${o.icon || ""}${o.label !== undefined ? `<span class="gk-text gk-btn__label">${o.label}</span>` : ""}</span>${o.sub ? `<span class="gk-text gk-text--tag">${o.sub}</span>` : ""}</button>`;
  const ibtn = (o) =>
    `<button class="gk-ibtn ${o.sm ? "gk-ibtn--sm" : ""} ${o.round ? "gk-ibtn--round" : ""} gk--${o.v || "neutral"} ${o.cls || ""}" ${o.id ? `id="${o.id}"` : ""} aria-label="${o.aria || ""}">${o.inner}</button>`;
  const tierCls = (t) => t; // the tier names are the CSS names (no Commander tier since C21)
  const pic = (id, cls) => `<span class="pic pic--${tierCls(DD.HERO[id].tier)} ${cls || ""}"><img src="${A(`heroes/${id}/bust.webp`)}" alt=""></span>`;
  const IC = { coin: "icons/icon_currency_coin.webp", gem: "icons/icon_currency_gem.webp", ticket: "icons/icon_card.webp", key: "dd/icon_key.webp", chest: "icons/icon_game_chest.webp", patrol: "icons/icon_home_coin_sack.webp", lock: "icons/icon_game_lock.webp", exp: "icons/icon_party_emblem.webp",
    coll: "dd/icon_coll_chest.webp", limited: "dd/icon_limited.webp", recruit: "dd/icon_recruit.webp", stone: DD.STONE_ICON, art: "dd/art_crown.webp", pshard: "icons/icon_unlock_hero.webp", missions: "dd/icon_missions.webp", pass: "dd/icon_pass.webp", gift: "dd/icon_gift.webp", essence: "dd/icon_essence.webp", ore: "dd/icon_ore.webp" };
  const STAT_NAME = { atk: "ATK", hp: "HP", crit: "Crit", dmg: "Damage", critDmg: "Crit DMG", dur: "Duration" };
  /** A party attribute as the player reads it: Crit with one decimal, Projectiles as a count, the rest as +%. */
  // C27 B (C64.10, C64.11): numbers on screen, never percent; Wall HP is the wall's life
  const attrVal = (k, v) => (k === "hp" ? DD.fmt(v) : "+" + DD.fmt(DD.pts(k, v)));
  /** What each attribute does in a battle (tap an attribute on the Party tab). */
  const ATTR_LINE = { atk: "Damage of every hero", hp: "The wall holds out longer when the dragon bites", crit: "Chance of a critical hit", critDmg: "Extra damage of a critical hit",
    haste: "Attack speed of every hero", area: "Size of blasts, beams and zones", dur: "How long zones, beams and summons last",
    proj: "Extra projectiles, bounces or pierce", boss: "Damage to the dragon's head" };
  const affName = (a) => DD.AFFIX[a.k].name;
  const affVal = (a, tier) => (a.k === "crit" ? (DD.affixValue(a, tier) * 100).toFixed(1) + "%" : "+" + DD.pct(DD.affixValue(a, tier)));
  /** Enchant stars: five small diamonds, lit up to the affix's stars (no glyph font, no emoji). */
  const pips = (s) => `<span class="pips" aria-label="${s || 0} of ${DD.ENCHANT_MAX} stars">${Array.from({ length: DD.ENCHANT_MAX }, (_, i) => `<i class="${i < (s || 0) ? "is-on" : ""}"></i>`).join("")}</span>`;
  const ore = icon(IC.ore);
  const res = (img, val, cls) => `<div class="gk-res ${cls || ""}">${img.startsWith("<") ? img : icon(img)}${text("number", val)}</div>`;
  const coin = icon(IC.coin, "in-ic");
  const gem = icon(IC.gem, "in-ic");
  const bolt = `<span class="bolt">${glyph("bolt")}</span>`;
  const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const roman = (n) => ROMAN[n] || String(n);
  /** The painted label plate cropped out of its 254 × 300 canvas so it fills its box (audit A3: it used to squash to a line). */
  const plate = () => `<span class="plate">${icon("icons/icon_navbadge_plate.webp")}</span>`;
  const elTag = (el) => `<span class="el el--${el}">${text("tag", DD.ELEMENT_NAME[el])}</span>`;
  const time = (ms) => { const m = Math.ceil(ms / 60000); return m >= 1440 ? `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h` : m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };

  DD.toast = function (msg) {
    // C28 E: a refusal (not enough, needs, locked …) sounds like V2's error
    if (/^(Not |Needs |No |Nothing |Clear |Reach |Already|The party needs|Rank Up first)|remove one first|is at Lv /.test(msg)) snd("deny");
    app.querySelectorAll(":scope > .gk-toast").forEach((x) => x.remove());
    const t = document.createElement("div");
    t.className = "gk-toast";
    t.innerHTML = text("label", esc(msg));
    app.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  };
  function lockNote(title) {
    const t = document.createElement("div");
    t.className = "lock-note";
    t.innerHTML = `${icon(IC.lock)}${text("title", esc(title))}`;
    app.appendChild(t);
    setTimeout(() => t.remove(), 1700);
  }
  /** A simulated ad (D2.8, approved): a short card, then the reward. */
  function ad(done) {
    const s = document.createElement("div");
    s.className = "adsim";
    s.innerHTML = `<div class="adsim__box">${text("title", "Ad")}${cream("Simulated in the preview")}<div class="adsim__bar"><div></div></div></div>`;
    app.appendChild(s);
    setTimeout(() => { s.remove(); P.quest("ad"); P.save(); done(); }, 1100);
  }
  const purchaseOff = () => DD.toast("Purchases are off in the preview");
  setInterval(() => { if (document.visibilityState !== "visible") return; P.onlineTick(15); P.save(); }, 15000);
  /** A centre box in the Lair's frame (INFO_BOX_TEMPLATE); close = red X. */
  function modal(o) {
    const s = document.createElement("div");
    s.className = "gk-scrim";
    s.innerHTML =
      `<div class="gk-modal theme-dungeon ${o.cls || ""}">` +
      `<div class="gk-modal__head">${text("title", esc(o.title))}` +
      (o.close ? `<div class="gk-modal__close">${ibtn({ v: "danger", inner: glyph("close"), cls: "x", aria: "Close" })}</div>` : "") +
      `</div>${o.body || ""}` + (o.actions ? `<div class="gk-modal__actions">${o.actions}</div>` : "") + (o.foot || "") + `</div>`;
    (o.parent || app).appendChild(s);
    if (o.close) s.querySelector(".x").onclick = () => { s.remove(); if (o.onClose) o.onClose(); };
    return s;
  }
  /** A sheet from the bottom in the Lair's frame. */
  function sheet(o) {
    if (o.centre) return centreBox(o);
    const scrim = document.createElement("div");
    scrim.className = "gk-sheet-scrim";
    const sh = document.createElement("div");
    sh.className = "gk-sheet theme-dungeon " + (o.cls || "");
    app.append(scrim, sh);
    const close = () => { scrim.remove(); sh.remove(); if (o.onClose) o.onClose(); };
    scrim.onclick = close;
    const render = () => {
      sh.innerHTML = `<div class="gk-sheet__head">${text("title", esc(o.title()))}${ibtn({ v: "danger", inner: glyph("close"), cls: "x", aria: "Close" })}</div>` +
        `<div class="gk-sheet__body">${o.body()}</div>` + (o.actions ? `<div class="gk-sheet__actions">${o.actions()}</div>` : "");
      sh.querySelector(".x").onclick = close;
      if (o.bind) o.bind(sh, render, close);
    };
    render();
    return { close, render };
  }
  /** The same API as sheet(), shown as a centre box (user 2026-10-30: "saat di klik harusnya muncul tengah bukan di bawah"). */
  function centreBox(o) {
    const scrim = document.createElement("div");
    scrim.className = "gk-scrim cbox-scrim";
    const box = document.createElement("div");
    box.className = "gk-modal theme-dungeon cbox " + (o.cls || "");
    scrim.appendChild(box);
    app.appendChild(scrim);
    const close = () => { scrim.remove(); if (o.onClose) o.onClose(); };
    scrim.addEventListener("click", (e) => { if (e.target === scrim) close(); });
    const render = () => {
      box.innerHTML = `<div class="gk-modal__head">${text("title", esc(o.title()))}<div class="gk-modal__close">${ibtn({ v: "danger", inner: glyph("close"), cls: "x", aria: "Close" })}</div></div>` +
        `<div class="cbox__body">${o.body()}</div>` + (o.actions ? `<div class="gk-modal__actions">${o.actions()}</div>` : "");
      box.querySelector(".x").onclick = close;
      if (o.bind) o.bind(box, render, close);
    };
    render();
    return { close, render };
  }
  /** A short tutorial line at the top (no character, D2.9), once per key. */
  function tip(key, parent, line) {
    const seen = S().seen;
    if (seen[key]) return null;
    seen[key] = true;
    P.save();
    parent.querySelectorAll(".tip").forEach((t) => t.remove()); // one tip at a time
    const b = document.createElement("div");
    b.className = "tip";
    b.innerHTML = `${icon("icons/icon_ui_pointer.webp")}${text("label", esc(line))}`;
    parent.appendChild(b);
    setTimeout(() => b.classList.add("is-out"), 4200);
    setTimeout(() => b.remove(), 4700);
    return b;
  }

  /* ------------------------------------------------------------ artifact tiles (C21; were the Commander equipment).
     2026-10-31 (user: "smua tidak perlu ada t1.. pakai lingkaran sebagai penanda tier ... atk kecil cream, +13% besar"): one tile everywhere =
     the painting (affix diamonds left, tier circles under it), then the value big and white, then ATK / HP small and cream. Tier circles:
     1 to 5 per band, the band's colour changes every five tiers (silver, gold, ruby, violet, then again). */
  const TIER_BANDS = ["silver", "gold", "ruby", "violet"];
  const tierDots = (t) => `<span class="gear__tiers gear__tiers--${TIER_BANDS[Math.floor((t - 1) / 5) % TIER_BANDS.length]}" aria-label="Tier ${t}">${"<i></i>".repeat(((t - 1) % 5) + 1)}</span>`;
  /** a value as the tile shows it: +13%, and from 1000 % on 1.3K% (the tile is 53 px wide on a 375 px phone) */
  const tilePct = (v) => (v >= 10 ? DD.fmt(v * 100) + "%" : "+" + DD.pct(v));
  /** An equipment tile (C27 F): picture, the number it gives (ATK / Crit / Haste points, Wall HP), its stars and tier. */
  const EQ_LAB = { atk: "ATK", hp: "Wall HP", crit: "Crit", haste: "Haste" };
  const eqNum = (stat, v) => "+" + DD.fmt(stat === "hp" ? v : v * 1000);
  const starRow = (n, cls) => `<span class="gear__stars ${cls || ""}" aria-label="${n || 0} of ${DD.STAR_MAX} stars">${Array.from({ length: DD.STAR_MAX }, (_, i) => `<i class="${i < (n || 0) ? "is-on" : ""}"></i>`).join("")}</span>`;
  function gearTile(g, o) {
    o = o || {};
    const lv = o.lv ? `<span class="gear__lv">${text("tag", "Lv " + o.lv)}</span>` : "";
    if (!g) return `<span class="gear gear--empty ${o.cls || ""}" ${o.data || ""}><span class="gear__art">${o.slotId ? icon(DD.SLOT[o.slotId].art, "gear__ic gear__ic--ghost") : ""}</span>` +
      `${text("number", "—", "gear__val")}${cream(o.slotName || "", "gear__lab")}${lv}</span>`;
    const sl = DD.SLOT[g.slot], off = false; // C29 D: no half-power weapons any more
    return `<span class="gear gear--${DD.GEAR_RARITY[g.r]} ${off ? "gear--off" : ""} ${o.cls || ""}" ${o.data || ""}><span class="gear__art">${icon(DD.eqArt(g), "gear__ic")}` +
      (V4L ? v4Tier(g) + (V4L.isTwin(g) && S().bag.includes(g) ? `<span class="v4pair" aria-label="Twin of a worn piece"></span>` : "") : tierDots(g.tier)) + `</span>` +
      (V4L ? text("number", v4Pts(g), "gear__val") + cream("ATK", "gear__lab") : text("number", eqNum(sl.stat, P.gearStat(g)), "gear__val") + cream(EQ_LAB[sl.stat] + (off ? " ½" : ""), "gear__lab")) +
      (o.better ? `<span class="gear__up" aria-label="Better than worn"></span>` : "") + lv + `</span>`;
  }
  /** The rows every equipment box shows for one piece: number, the Lead's weapon type, stars, Tier Up, Fuse, effects. */
  function pieceRows(g) {
    if (!g) return "";
    // C46 (user no. 95): tiers only; at Tier 20 two pieces of the same name fuse into the next rarity (Mythic has no top tier)
    const sl = DD.SLOT[g.slot], mate = P.fuseMate(g), top = DD.tierTop(g), up = DD.tierUpCost(g), rn = (r) => DD.GEAR_RARITY_NAME[DD.GEAR_RARITY[r]];
    const row = (k, v) => `<div class="gbox__row">${text("tag", k)}${v}</div>`;
    const cost = coin + text("label", DD.fmtCost(up.coins)) + icon(IC.stone, "in-ic") + text("label", String(up.stones));
    return row(EQ_LAB[sl.stat], text("label", eqNum(sl.stat, P.gearStat(g)))) +
      (P.wearerOf(g.uid) ? row("Worn by", cream(esc(DD.HERO[P.wearerOf(g.uid)].short))) : "") +
      row(rn(g.r), cream(top === Infinity ? `Tier <em>${g.tier}</em> · no top tier` : `Tier <em>${g.tier}</em> of ${top}`)) +
      (g.tier < top ? row("Tier " + (g.tier + 1), btn({ v: "special", size: "sm", id: "tier-" + g.uid, data: `data-tier="${g.uid}"`, icon: cost, label: "Tier Up", cls: P.canTierUp(g) ? "" : "gk-btn--poor" }))
        : mate ? row("Fuse", btn({ v: "success", size: "sm", id: "fuse-" + g.uid, data: `data-fuse="${g.uid}"`, label: `Fuse → ${rn(g.r + 1)}` }))
          : row("Fuse", cream(`Needs a second ${esc(DD.artName(g))} at Tier ${top} to make a ${rn(g.r + 1)} piece`))) +
      ((g.fx || []).length ? `<div class="gbox__fx">${g.fx.map((k) => `<div class="gbox__row">${text("tag", DD.EQ_FX[k].name)}${text("label", "+" + DD.fmt(DD.pts(DD.EQ_FX[k].stat, DD.fxValue(k, g))) + " " + (DD.ATTR[DD.EQ_FX[k].stat] ? DD.ATTR[DD.EQ_FX[k].stat].name : DD.ELEMENT_NAME[DD.EQ_FX[k].stat.slice(3)] + " DMG"))}</div>`).join("")}</div>` : "");
  }
  function bindPiece(el, re) {
    el.querySelectorAll("[data-tier]").forEach((b) => (b.onclick = () => { if (!P.tierUp(+b.dataset.tier)) return DD.toast("Needs coins and Enchant Stones"); snd("tier_up"); DD.toast("Tier up"); re(); render(); }));
    el.querySelectorAll("[data-fuse]").forEach((b) => (b.onclick = () => { const g = P.fuse(+b.dataset.fuse); if (!g) return; snd("fuse"); DD.toast(`${DD.GEAR_RARITY_NAME[DD.GEAR_RARITY[g.r]]} ${DD.artName(g)}: Tier ${g.tier}`); re(); render(); }));
  }
  /* ================================================================ Rancangan v4 B4 (docs/rancangan-v4/09-alur-ui-equipment.md; v4 is on since B6, ?v3 = old):
     one piece box with one main action by state (Equip / Tier Up / Fuse), Tier Up All, Party Gear (the party's 5 × 6 pieces on one page),
     the Bag's spares and twins, Equip from the reward box, Training as one level. Rules in js/v4-level.js (DD.v4.lv). */
  const V4L = DD.V4 && DD.v4 && DD.v4.lv ? DD.v4.lv : null;
  const V4E = DD.V4 && DD.v4 && DD.v4.eco ? DD.v4.eco : null; // v4 B6 (js/v4-economy.js)
  /** v4 B6: the odds band of the highest stage, as words */
  const v4Band = () => { const b = V4E.band(); return b.to === Infinity ? `Stage ${b.from}+` : `Stage ${b.from}–${b.to}`; };
  const v4Pity = () => { const p = V4E.pity(); return cream(`An Epic or better within <em>${p.epic}</em> · a Legendary within <em>${p.legendary}</em>`); };
  /** the Wish button: the marked heroes' pictures and n/5 */
  const v4WishBtn = (id, cls) => { const w = V4E.wish(); return `<button class="${cls} v4wish" id="${id}">${w.length ? `<span class="v4wish__pics">${w.map((x) => pic(x)).join("")}</span>` : `<span class="pic pic--empty"></span>`}${text("tag", w.length ? `Wish ${w.length}/${V4E.WISH_MAX}` : "Choose your Wish heroes")}</button>`; };
  /** G7 §4.1 Wish: up to 5 heroes take 80 % of the cards of their tier; tap a hero to mark it or take it off */
  function v4WishSheet(done) {
    sheet({
      title: () => `Wish · ${V4E.wish().length}/${V4E.WISH_MAX}`,
      cls: "v4wishsh",
      body: () => cream(`Mark up to <em>${V4E.WISH_MAX}</em> heroes. <em>80%</em> of the hero cards of a tier go to the heroes you marked in that tier.`, "v4note") +
        ["common", "rare", "epic", "legendary", "mythic"].map((t) => { const ids = V4E.pool(t); return ids.length ? `<div class="gbox__sect">${text("tag", DD.TIER_NAME[t] + (t === "mythic" ? " · Limited Recruitment" : ""))}</div><div class="hgrid hgrid--pick">${ids.map((id) => heroCard(id)).join("")}</div>` : ""; }).join(""),
      bind: (el, re) => el.querySelectorAll(".hc").forEach((b) => (b.onclick = () => { if (!V4E.toggleWish(b.dataset.id)) return DD.toast(`${V4E.WISH_MAX} heroes at most: tap one to take it off`); re(); })),
      onClose: () => { if (done) done(); },
    });
  }
  let pgOpen = false; // the Party Gear page (Heroes)
  let INFO_V4 = null; // v4 Info texts, put over INFO once it exists
  const v4Rar = (g) => DD.GEAR_RARITY_NAME[DD.GEAR_RARITY[g.r]];
  const v4Pts = (g) => "+" + DD.fmt(V4L.atkPts(g));
  const v4Pct = (v) => Math.round(v * 1000) / 10 + "%";
  const v4Tier = (g) => `<span class="v4tier">${text("tag", "T" + V4L.rt(g).t)}</span>`;
  const v4Type = (g) => (g.type ? DD.WEAPON_TYPES[g.type] : DD.SLOT[g.slot].name);
  /** a piece's lines: ATK (and what the hero wears now), Wall HP, Crit / Haste, its effects, who wears it */
  const v4Lines = (g, hid) => {
    const row = (k, v) => `<div class="gbox__row">${text("tag", k)}${v}</div>`, worn = P.wearerOf(g.uid), cur = hid && !worn ? P.gearOf(hid)[g.slot] : null;
    let out = row("ATK", text("label", v4Pts(g)) + (cur ? cream(` · ${esc(DD.HERO[hid].short)} wears ${v4Pts(cur)}`) : ""));
    const hp = V4L.hpOf(g);
    if (hp) out += row("Wall HP", text("label", "+" + DD.fmt(hp)));
    for (const [k, v] of Object.entries(V4L.FIXED[g.slot] || {})) out += row(DD.ATTR[k].name, text("label", "+" + v4Pct(v)));
    for (const k of V4L.fxOf(g)) { const fx = DD.EQ_FX[k], st = fx.stat; out += row(fx.name, text("label", "+" + v4Pct(V4L.fxVal(k, g)) + " " + (DD.ATTR[st] ? DD.ATTR[st].name : DD.ELEMENT_NAME[st.slice(3)] + " DMG"))); }
    if (worn) out += row("Worn by", cream(esc(DD.HERO[worn].short)));
    return out;
  };
  /** the box of one piece (o.uid) or of one hero's slot (o.slot, o.hid): one main action by state (G9 §5.4) */
  function v4Piece(o) {
    const hid = o.hid || P.formation()[0], h = DD.HERO[hid];
    const cur = () => (o.uid ? P.findArt(o.uid) : P.gearOf(hid)[o.slot]);
    const inBag = (g) => S().bag.includes(g);
    sheet({
      centre: true,
      cls: "gbox v4box",
      title: () => { const g = cur(); return g ? DD.artName(g) : DD.SLOT[o.slot].name + " slot"; },
      body: () => {
        const g = cur(), slot = g ? g.slot : o.slot;
        let html;
        if (!g) html = `<div class="gbox__top">${gearTile(null, { slotName: DD.SLOT[slot].name, slotId: slot })}<div class="gbox__facts">${text("label", "Empty")}` +
          cream(slot === "weapon" ? `${esc(h.short)} wears a ${DD.WEAPON_TYPES[DD.HERO_WEAPON[hid]]}.` : (S().bag.some((x) => x.slot === slot && P.fits(x, hid)) ? `Tap a piece below to put it on ${esc(h.short)}.` : `Gives ${esc(h.short)} ${{ helm: "ATK and Wall HP", armor: "ATK and Wall HP", gloves: "ATK and Crit", boots: "ATK and Haste" }[slot] || "ATK"}.`)) + `</div></div>` +
          (S().bag.some((x) => x.slot === slot && P.fits(x, hid)) ? "" : cream(`No ${slot === "weapon" ? DD.WEAPON_TYPES[DD.HERO_WEAPON[hid]] : DD.SLOT[slot].name} in the Bag yet. Pieces drop from Dragon Chests and the Equipment Chest in the Shop.`, "v4note"));
        else {
          const top = V4L.tierTop(g), t = V4L.rt(g).t;
          html = `<div class="gbox__top">${gearTile(g)}<div class="gbox__facts">${text("label", `${v4Rar(g)} · ${v4Type(g)}`, "tier-" + DD.GEAR_RARITY[g.r])}` +
            cream(top === Infinity ? `Tier <em>${t}</em> · no top tier` : `Tier <em>${t}</em> of ${top}`) + `</div></div>` + v4Lines(g, inBag(g) ? hid : null);
          if (inBag(g) && !P.fits(g, hid)) html += cream(`Not for ${esc(h.short)}: needs a hero with a ${DD.WEAPON_TYPES[g.type]}.`, "v4note");
          if (!inBag(g) && t >= 20 && top === 20 && !V4L.canFuse(g)) {
            const c = V4L.fuseStoneCost(g);
            html += cream(`Fuse: a second ${esc(DD.artName(g))} at Tier 20, or <em>${c}</em> Fuse Stones (${DD.fmt(V4L.stones())}/${c}). Disassemble spare pieces for Fuse Stones.`, "v4note");
          }
        }
        // the other pieces this hero could wear in this slot (tap = wear)
        if (!g || !inBag(g)) {
          const cands = S().bag.filter((x) => x.slot === slot && P.fits(x, hid)).sort((a, b) => V4L.score(b) - V4L.score(a));
          if (cands.length) html += `<div class="gbox__sect">${text("tag", `Other ${DD.SLOT[slot].name} pieces for ${esc(h.short)}`)}</div><div class="ggrid ggrid--sheet">${cands.map((x) => gearTile(x, { data: `data-uid="${x.uid}"`, cls: "gear--btn", better: !g || V4L.score(x) > V4L.score(g) })).join("")}</div>`;
        }
        return html;
      },
      actions: () => {
        const g = cur();
        if (!g) return "";
        if (inBag(g)) {
          const better = P.fits(g, hid) && (!P.gearOf(hid)[g.slot] || V4L.score(g) > V4L.score(P.gearOf(hid)[g.slot]));
          return btn({ v: "neutral", label: "Disassemble", id: "v4dis" }) + (P.fits(g, hid) ? btn({ v: better ? "primary" : "neutral", label: "Equip", id: "v4eq" }) : "");
        }
        const top = V4L.tierTop(g), next = V4L.RARITY[Math.min(4, V4L.rt(g).r + 1)];
        const main = g.tier < top ? btn({ v: "special", id: "v4up", label: "Tier Up", icon: coin + text("label", DD.fmtCost(V4L.tierPrice(g))), cls: P.canTierUp(g) ? "" : "gk-btn--poor" })
          : P.fuseMate(g) ? btn({ v: "success", id: "v4fuse", label: `Fuse → ${next}` })
            : btn({ v: "success", id: "v4fuse", label: `Fuse → ${next}`, icon: icon(IC.stone, "in-ic") + text("label", String(V4L.fuseStoneCost(g))), cls: V4L.canFuse(g) ? "" : "gk-btn--poor" });
        return btn({ v: "neutral", label: "Remove", id: "v4rm" }) + main;
      },
      bind: (sh, re, close) => {
        const g = cur(), on = (id, fn) => { const b = sh.querySelector(id); if (b) b.onclick = fn; };
        on("#v4up", () => { if (!P.tierUp(g.uid)) return DD.toast(`Needs ${DD.fmtCost(V4L.tierPrice(g))} coins`); snd("tier_up"); DD.toast(`${DD.artName(g)}: Tier ${V4L.rt(g).t}`); re(); render(); });
        on("#v4fuse", () => { if (!V4L.canFuse(g)) return DD.toast(`Needs a second ${DD.artName(g)} at Tier 20, or ${V4L.fuseStoneCost(g)} Fuse Stones`); v4Fuse(g, () => { re(); render(); }); });
        on("#v4eq", () => { const r = P.equip(g.uid, hid); if (r === "type") return DD.toast(`Not for ${h.short}: needs a hero with a ${DD.WEAPON_TYPES[g.type]}`); snd("equip"); close(); render(); });
        on("#v4rm", () => { const r = P.unequip(hid, g.slot); if (r === "full") return DD.toast("Bag full: disassemble something first"); snd("unequip"); close(); render(); });
        on("#v4dis", () => v4Dis(g, () => { close(); render(); }));
        sh.querySelectorAll(".gear--btn").forEach((b) => (b.onclick = () => { P.equip(+b.dataset.uid, hid); snd("equip"); re(); render(); }));
      },
    });
  }
  /** Fuse asks once: the two pieces (or the piece and its Fuse Stones) and what they make (G9 §5.4) */
  function v4Fuse(g, done) {
    const mate = P.fuseMate(g), c = V4L.fuseStoneCost(g), next = V4L.RARITY[Math.min(4, V4L.rt(g).r + 1)];
    const m = modal({
      title: "Fuse",
      body: `<div class="v4fuse">${gearTile(g)}${mate ? gearTile(mate) : `<span class="v4fuse__st">${res(IC.stone, String(c))}</span>`}<span class="gbox__arrow"></span>${gearTile({ ...g, r: g.r + 1, tier: 1, fx4: null })}</div>` +
        cream(`${esc(DD.artName(g))} (${v4Rar(g)}, Tier 20) + ${mate ? "its twin from the Bag" : `${c} Fuse Stones`} → ${next}, Tier 1.`) + cream("Same ATK now. Tier Up can go on to Tier 20 again (ATK ×2)."),
      actions: btn({ v: "neutral", label: "Cancel", id: "v4fc" }) + btn({ v: "success", label: "Fuse", id: "v4fo" }),
    });
    m.querySelector("#v4fc").onclick = () => m.remove();
    m.querySelector("#v4fo").onclick = () => { const r = P.fuse(g.uid, !mate); m.remove(); if (r) { snd("fuse"); DD.toast(`${DD.artName(r)}: ${v4Rar(r)} Tier 1`); } done(); };
  }
  /** Disassemble: Common and Rare at once, Epic and up ask first (G9 §5.4) */
  function v4Dis(g, done) {
    const k = V4L.dust(g), go = () => { P.disassemble(g.uid); snd("salvage"); DD.toast(`+${k} Fuse Stone${k === 1 ? "" : "s"}`); done(); };
    if (V4L.rt(g).r < 2) return go();
    const m = modal({ title: "Disassemble", body: cream(`Break ${esc(DD.artName(g))} (${v4Rar(g)}, Tier ${V4L.rt(g).t}) into <em>${k}</em> Fuse Stones? It cannot be undone.`),
      actions: btn({ v: "neutral", label: "Cancel", id: "v4dc" }) + btn({ v: "danger", label: "Disassemble", id: "v4do" }) });
    m.querySelector("#v4dc").onclick = () => m.remove();
    m.querySelector("#v4do").onclick = () => { m.remove(); go(); };
  }
  /** Tier Up All (G9 §4.2): the plate, and the line under it that says what it will do before the tap */
  const v4TuaPlate = (ids, id) => {
    const p = V4L.tierUpPlan(ids);
    const below = ids.flatMap((h) => DD.SLOTS.map((sl) => P.gearOf(h)[sl.id]).filter((g) => g && g.tier < V4L.tierTop(g)));
    const sub = p.n ? `${p.n} · ${DD.fmtCost(p.cost)}` : below.length ? `needs ${DD.fmtCost(Math.min(...below.map((g) => V4L.tierPrice(g))))}` : ids.some((h) => DD.SLOTS.some((sl) => P.gearOf(h)[sl.id])) ? "all Tier 20" : "no pieces";
    return `<button class="hp2__plaque ${p.n ? "" : "is-poor"}" id="${id}" aria-label="Tier Up All: ${sub}"><span class="v4plq">${text("label", "Tier Up All")}${text("tag", sub)}</span></button>`;
  };
  const v4TuaGo = (ids, who) => {
    const p = V4L.tierUpAll(ids);
    if (!p.n) return DD.toast("Not enough coins for a Tier Up");
    snd("tier_up");
    DD.toast(`${who}: ${p.n} tier${p.n === 1 ? "" : "s"} up · −${DD.fmtCost(p.cost)} coins`);
    render();
  };
  /** Party Gear (G9 §5.3): the party's heroes in party order, six pieces each, Auto Equip All and Tier Up All */
  function showPartyGear() {
    const f = P.formation();
    const gearAtk = f.reduce((a, id) => a + DD.SLOTS.reduce((b, sl) => { const g = P.gearOf(id)[sl.id]; return b + (g ? V4L.atkPts(g) : 0); }, 0), 0);
    const tile = (id, sl) => {
      const g = P.gearOf(id)[sl.id];
      const better = S().bag.some((x) => x.slot === sl.id && P.fits(x, id) && (!g || V4L.score(x) > V4L.score(g)));
      const fuse = g && g.tier >= 20 && V4L.tierTop(g) === 20 && V4L.canFuse(g);
      return `<button class="pgear__t gfc ${g ? "gfc--g-" + DD.GEAR_RARITY[g.r] : "pgear__t--empty"}" data-h="${id}" data-slot="${sl.id}" aria-label="${esc(DD.HERO[id].short)}: ${sl.name}">` +
        `<span class="gfc__win"><span class="btile__art">${icon(g ? DD.eqArt(g) : DD.SLOT[sl.id].art, "btile__ic")}</span></span>${g ? v4Tier(g) : ""}` +
        (better ? `<span class="gear__up" aria-label="A better piece is in the Bag"></span>` : "") + (fuse ? `<span class="v4dot" aria-label="Fuse ready"></span>` : "") + `</button>`;
    };
    shell(
      pageHead("Party Gear", `Gear ATK +${DD.fmt(gearAtk)} · Wall HP ${DD.fmt(P.wallHP())}`) +
      `<div class="pgear__bar"><button class="hp2__plaque hp2__plaque--dark" id="pgback">${glyph("prev")}${text("label", "Heroes")}</button>` +
      `<button class="hp2__plaque hp2__plaque--dark" id="pgbag">${text("label", `Bag ${S().bag.length}/${DD.BAG_MAX}`)}</button></div>` +
      `<div class="pgear gfp">${f.map((id) => `<div class="pgear__row"><button class="pgear__hero" data-hero="${id}" aria-label="${esc(DD.HERO[id].short)}">${pic(id)}</button>${DD.SLOTS.map((sl) => tile(id, sl)).join("")}</div>`).join("")}</div>` +
      `<div class="pgear__foot"><button class="hp2__plaque hp2__plaque--dark" id="pgauto">${text("label", "Auto Equip All")}</button>${v4TuaPlate(f, "pgtua")}</div>`,
      "lobby--heroes"
    );
    app.querySelector("#info").onclick = () => showInfo("equipment");
    app.querySelector("#pgback").onclick = () => { pgOpen = false; render(); };
    app.querySelector("#pgbag").onclick = () => bagSheet(f[0]);
    app.querySelectorAll(".pgear__hero").forEach((b) => (b.onclick = () => { pgOpen = false; heroTab = "equip"; heroView = b.dataset.hero; render(); heroTab = "equip"; }));
    app.querySelectorAll(".pgear__t").forEach((b) => (b.onclick = () => v4Piece({ slot: b.dataset.slot, hid: b.dataset.h })));
    app.querySelector("#pgauto").onclick = () => {
      const by = V4L.equipAllParty(), parts = Object.entries(by).map(([id, n]) => `${DD.HERO[id].short} ${n}`), n = Object.values(by).reduce((a, x) => a + x, 0);
      if (n) snd("equip");
      DD.toast(n ? `${n} better piece${n === 1 ? "" : "s"} on (${parts.join(", ")})` : "Nothing better in the Bag");
      render();
    };
    app.querySelector("#pgtua").onclick = () => v4TuaGo(f, "Party");
  }
  /** Training as one level (G6 §6, G9 §5.6): one button, hold to train again and again */
  function v4TrainPanel() {
    const T = V4L.T(), now = 1000 * V4L.atkMul(), next = now * 1.02 * ((T + 1) % 10 === 0 ? 1.1 : 1), cost = V4L.trainPrice(T), rankAt = (Math.floor(T / 10) + 1) * 10;
    return `<div class="trn3 ${P.isNew("training") ? "has-new" : ""}"><div class="trn3__head"><button class="trn3__rank" id="trank">${text("label", "Training")}${text("tag", `Rank ${V4L.rank()}`)}</button></div>` +
      `<div class="trn3__cells trn3__cells--one"><button class="trn3__c ${S().coins >= cost ? "" : "is-poor"}" id="train1" aria-label="Train">` +
      `<span class="trn3__top">${icon(DD.ATTR.atk.icon, "trn3__ic")}${cream(`Lv ${T}`, "trn3__n")}${text("number", `ATK ${DD.fmt(now)} → ${DD.fmt(next)}`, "trn3__v")}</span>` +
      `<span class="trn__bar"><span style="width:${(T % 10) * 10}%"></span></span>` +
      `<span class="trn3__foot">${text("tag", `Rank ${V4L.rank() + 1} at Lv ${rankAt}: ATK ×1.1`)}<span class="trn3__cost">${coin}${text("label", DD.fmtCost(cost))}</span></span></button></div></div>`;
  }
  function v4BindTraining() {
    const b = app.querySelector("#train1");
    if (!b) return;
    let timer = null, n = 0, held = false;
    const once = () => { if (!P.train()) { stop(); if (!n) DD.toast("Not enough coins"); return false; } n++; snd("train"); return true; };
    const stop = () => { clearTimeout(timer); timer = null; if (held || n) { held = false; const k = n; n = 0; P.seeNew("training"); render(); if (k > 1) DD.toast(`Training +${k} levels`); } };
    const loop = (ms) => { timer = setTimeout(() => { if (once()) loop(Math.max(60, ms * 0.85)); }, ms); };
    b.onpointerdown = (e) => { e.preventDefault(); held = true; if (once()) loop(400); };
    b.onpointerup = b.onpointerleave = b.onpointercancel = stop;
    b.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); held = true; once(); stop(); } };
    b.onclick = (e) => { if (e.detail === 0 && !timer) { held = true; once(); stop(); } }; // screen readers and switch access send a click without a press
    app.querySelector("#trank").onclick = () => DD.toast(`Every Training level: ATK ×1.02. Every 10 levels a Rank: ATK ×1.1.`);
  }
  if (V4L) {
    // G9 §7: the Info of Equipment in five sentences; the Party Level and Training as v4 counts them
    INFO_V4 = {
      equipment: ["Equipment", [["Equipment", [
        ["2a/eq/sword_lo.webp", "Six pieces a hero", "Each hero wears 6 pieces. A weapon fits only heroes who use that weapon."],
        ["dd/icon_stone.webp", "Tier Up", "Coins raise a piece one tier. Tier 20 is <em>×2</em> Tier 1."],
        ["2a/eq/armor_lo.webp", "Fuse", "Two pieces with the same name at Tier 20 make one piece of the next rarity at Tier 1, with the same ATK. Or use one piece and Fuse Stones."],
        ["2a/eq/helm_hi.webp", "Disassemble", "Break a piece into Fuse Stones."],
        ["icons/icon_game_chest.webp", "Mythic", "Mythic pieces have no top tier."],
      ]]]],
      party: ["Party", [["Party", [
        ["icons/icon_party_emblem.webp", "Party Level", "Every level: ATK <em>×1.012</em> up to Lv 100, then <em>×1.008</em>; <em>10</em> energy. Win battles for EXP."],
        ["dd/stat_atk.webp", "Training", "Every level: ATK <em>×1.02</em>. Every 10 levels a Rank: ATK <em>×1.1</em>."],
        ["dd/stat_atk.webp", "ATK", "Party ATK starts at <em>1,000</em>; each hero's pieces add their ATK on top for that hero."],
        ["dd/stat_hp.webp", "Wall HP", "The wall's life while a dragon's head bites it: the heroes' HP, Helm and Armor."],
      ]]]],
    };
  }
  /** A reward object as small chips: picture + amount (Missions, Sign-in, Pass). */
  const giftIc = (k) => ({ coins: IC.coin, gems: IC.gem, tickets: IC.ticket, keys: IC.key, ore: IC.ore, stones: IC.stone, essence: IC.essence, collChests: IC.coll, exp: IC.exp }[k]);
  const gifts = (g) => Object.entries(g).map(([k, v]) => `<span class="gift">${k === "energy" ? bolt : icon(giftIc(k))}${text("number", (k === "energy" ? "+" : "") + DD.fmt(v))}</span>`).join("");
  /** A page head as in Dungeon & Dice: Info pill left, title (22) centred, its count under it as a sentence (13). */
  const pageHead = (title, sub, more) => `<div class="phead"><button class="phead__info" id="info" aria-label="Info">${text("label", "Info")}</button>` +
    `${text("title", title)}${sub ? text("tag", sub) : ""}${more || ""}</div>`;
  /** A section head: title left (18), its count right (13). */
  const shead = (title, count, cls) => `<div class="shead ${cls || ""}">${text("number", title)}${count ? text("tag", count) : ""}</div>`;
  /** Info box: sections of rows, each = picture + name + one sentence (the hero box of Dungeon & Dice). rows: [img, name, sentence] */
  function infoBox(title, sections) {
    sheet({
      centre: true,
      cls: "infobox",
      title: () => title,
      body: () => sections.map(([head, rows]) => `<div class="isec">${text("number", head)}${rows.map(([img, name, line]) =>
        `<div class="irow ${img ? "" : "irow--noimg"}">${img ? icon(img) : ""}${text("label", name)}${cream(line)}</div>`).join("")}</div>`).join(""),
      actions: () => btn({ v: "primary", label: "OK", id: "iok" }),
      bind: (box, re, close) => (box.querySelector("#iok").onclick = close),
    });
  }
  const INFO = {
    home: ["How to Play", [
      ["Battle", [
        ["icons/icon_ui_pointer.webp", "Drag", "Drag the party along the wall: the heroes fire where you aim them."],
        ["dd/stat_hp.webp", "Wall", "The dragon's head bites the wall. More <b>Wall HP</b> holds it longer: 4× the Wall HP, twice as long."],
        ["icons/icon_currency_dragon_blood.webp", "Dragon Pearl", "Break a pearl scale to pick a card: it levels up one hero's weapon."],
        ["icons/icon_soul_shard.webp", "Soul Shard", "Break a soul scale to call one more party hero onto the wall."],
        ["icons/icon_game_chest.webp", "Treasure scale", "A scale with a gold ring and a chest: break it for a heap of coins."],
        ["icons/icon_game_chest.webp", "Progress chests", "Reach <em>30</em>, <em>60</em> and <em>100 %</em> of a stage to open its chests here."],
      ]],
      ["Stages", [
        ["dd/stat_atk.webp", "Recommended Power", "A hint, not a gate: compare it with your <b>Party Power</b>."],
        ["dd/stat_crit.webp", "Elements", "Each hero hits with its best element: <em>×2</em> on a dragon that element beats, <em>×0.75</em> on its natural rival."],
        ["2a/dragon/moss/head.webp", "Dragons", "Every stage has <em>2</em> or <em>3</em> dragons, each crawling out of its own portal on its own path. The next one comes out <em>10</em> s after the one before; the stage's own dragon comes last."],
        ["dd/stat_boss.webp", "Boss", "Stage <em>10</em>, <em>20</em>, <em>30</em> …: a boss dragon. It is immune to some elements: a hit of that element deals nothing."],
        ["dd/stat_haste.webp", "Rage", "A boss, and every dragon in Hard Mode, runs faster for a few seconds every so often. It roars and glows red one second before. Awed (Dragon heroes) puts it off."],
        ["lair/banner_red.webp", "Hard Mode", "From Stage 10: cleared stages again with a thicker dragon, Rage and more loot."],
        [null, "Energy", "A battle costs <em>5</em> energy. It refills over time, with ads and with every Party Level."],
      ]],
    ]],
    heroes: ["Heroes", [
      ["Your party", [
        ["icons/icon_party_emblem.webp", "Party", "<em>5</em> places on top of this tab. Tap an empty one to add a hero, a hero to take it out."],
        ["dd/cmd_pedestal.webp", "Lead", "The first place. Opens every battle <b>alone</b> on the wall."],
        ["icons/icon_soul_shard.webp", "Hero Call", "The other heroes join when a Soul Shard breaks: you pick 1 of 3."],
      ]],
      ["Hero levels", [
        ["icons/icon_unlock_hero.webp", "Lv Up", "Coins raise a hero one level, without end. At Lv <em>5, 10, 15</em> … <em>3</em> cards of that hero open the next 5 levels."],
        ["dd/stat_atk.webp", "Level steps", "Lv <em>5</em>, <em>10</em>, <em>15</em> and <em>20</em> bring the big steps; after Lv 20 every level adds Damage, Speed and Crit."],
        ["dd/icon_recruit.webp", "Recruit", "Tickets or gems for heroes; a hero you have again is a card of it. Common is often, Legendary rare."],
      ]],
    ]],
    party: ["Party", [
      ["Party Power", [
        ["icons/icon_party_emblem.webp", "Party Level", "Every level: ATK <em>+15</em>, Wall HP <em>+10</em> and <em>10</em> energy. Win battles for EXP."],
        ["dd/stat_atk.webp", "ATK", "Damage of every hero: <em>10</em> ATK = one tenth more damage."],
        ["dd/stat_hp.webp", "Wall HP", "The wall's life while the dragon's head bites it."],
        ["dd/stat_crit.webp", "Crit", "Chance of a critical hit (600 at most)."],
        ["dd/stat_critdmg.webp", "Crit DMG", "Extra damage of a critical hit."],
        ["dd/stat_haste.webp", "Haste", "Attack speed of every hero."],
        ["dd/stat_area.webp", "Area", "Size of blasts, beams and zones."],
        ["dd/stat_dur.webp", "Duration", "How long zones, beams and summons last."],
        ["dd/stat_proj.webp", "Projectiles", "Extra projectiles, bounces or pierce (2 at most)."],
        ["dd/stat_boss.webp", "Head DMG", "Damage to the dragon's head (the dragon has no riders or bosses: only its body)."],
      ]],
      ["Growth", [
        ["dd/stat_atk.webp", "Training", "Coins raise ATK, Crit and Haste, without end. All three at the cap: Rank Up and a party bonus."],
        ["dd/art_blade.webp", "Equipment", "The second tab here: what the Lead wears counts for the whole party."],
      ]],
    ]],
    equipment: ["Equipment", [
      ["Equipment", [
        ["2a/eq/sword_lo.webp", "Six slots a hero", "Every hero wears its own pieces: open the hero in Heroes. Weapon and Amulet give it ATK, Gloves Crit, Boots Haste; Helm and Armor add Wall HP."],
        ["2a/eq/staff_lo.webp", "Weapon type", "Sword, Dagger, Bow, Staff, Tome, Axe, Spear or Orb. A hero takes only its own type."],
        ["2a/eq/helm_hi.webp", "Rarity and tier", "The tile's colour and the circles under it. Each rarity has Tier 1 to <b>20</b>; Tier 20 gives twice Tier 1. Epic pieces carry 1 effect, Legendary 2, Mythic 3."],
        ["dd/icon_stone.webp", "Tier Up", "Coins and Enchant Stones raise a piece one tier, up to Tier 20. Mythic pieces have no top tier."],
        ["2a/eq/armor_lo.webp", "Fuse", "Two pieces with the same name, both at Tier 20, make one piece of the next rarity at Tier 1. Two Legendary pieces make a <b>Mythic</b>."],
        ["dd/icon_ore.webp", "Level Up", "Coins and Forge Ore raise a <b>slot</b> for every hero; it keeps its level when you swap pieces. Disassemble breaks a piece into Forge Ore."],
        ["icons/icon_game_chest.webp", "Where from", "The Equipment Chest in the Shop, and a Dragon Chest a won battle may drop. Dragons never drop it during a battle."],
      ]],
    ]],
    artifacts: ["Artifacts", [
      ["Artifacts", [
        ["icons/icon_artifact_phoenix_feather.webp", `${DD.RELEASED ? DD.RELEASED.length : DD.COLLECTION.length} artifacts`, "Each one has its own effect: more coins, a second wall, a slower dragon, more damage of one element …"],
        ["icons/icon_artifact_royal_seal.webp", "Worn", "<em>3</em> at a time. Tap one to wear it or take it off."],
        ["dd/icon_coll_chest.webp", "Artifact Chests", "Sold only in the Shop, for gems. Each gives a copy of an artifact; copies unlock it and raise it to Lv 10."],
      ]],
    ]],
    shop: ["Shop", [
      ["Shop", [
        ["icons/icon_currency_gem.webp", "Special Offer", "New items every few hours, five free refreshes a day."],
        ["icons/icon_game_chest.webp", "Equipment Chest", "Open it with Chest Keys or gems. Each opening counts toward a better chest level."],
        ["dd/icon_pass.webp", "Progression Pass", "A free reward every 2 stages. Premium is not for sale in the preview."],
        ["shop/shop_tile_premium.webp", "Packs", "Not for sale in the preview."],
      ]],
    ]],
  };
  if (DD.V4 && DD.v4a) INFO.artifacts = DD.v4a.INFO;
  if (INFO_V4) Object.assign(INFO, INFO_V4);
  if (V4E) { // v4 B6: Info lines of the economy (G7 §10)
    const line = (sec, title, txt) => { for (const g of INFO[sec][1]) for (const row of g[1]) if (row[1] === title) row[2] = txt; };
    line("home", "Progress chests", "Reach <em>30</em>, <em>60</em> and <em>100 %</em> of a stage: <em>10</em> energy, coins, then <em>50</em> gems and a Recruit Ticket.");
    line("heroes", "Recruit", "Tickets or gems for hero cards. Your highest stage sets the odds; an Epic or better comes within <em>10</em> cards, a Legendary within <em>40</em>.");
    INFO.heroes[1][1][1].push(["icons/icon_unlock_hero.webp", "Hero cards", "Every won battle gives <em>1</em> hero card (Hard <em>2</em>). Mark up to <em>5</em> heroes as Wish: <em>80%</em> of the cards of their tier go to them."]);
    line("shop", "Equipment Chest", "Open it with Chest Keys or gems: a piece for one hero of your party.");
  } // Rancangan v4 B4: Equipment and Party // Rancangan v4 B5 (js/v4-artifacts.js): slots 3 → 5, chest odds and pity, Relic Dust
  const showInfo = (k) => infoBox(...INFO[k]);
  /** The affixes of an artifact as rows: name, value, stars. */
  const affRows = (g) => (g && g.aff && g.aff.length ? `<div class="aff">${g.aff.map((a) => `<div class="aff__row">${text("tag", affName(a))}${text("label", affVal(a, g.tier))}${pips(a.s)}</div>`).join("")}</div>` : "");
  function rewardRow(o) {
    const parts = [];
    if (o.coins) parts.push(res(IC.coin, "+" + DD.fmt(o.coins)));
    if (o.gems) parts.push(res(IC.gem, "+" + o.gems));
    if (o.tickets) parts.push(res(IC.ticket, "+" + o.tickets));
    if (o.ore) parts.push(res(ore, "+" + o.ore));
    if (o.exp) parts.push(res(IC.exp, "+" + DD.fmt(o.exp)));
    if (o.energy) parts.push(`<div class="gk-res gk-res--bolt">${bolt}${text("number", "+" + o.energy)}</div>`);
    if (o.keys) parts.push(res(IC.key, "+" + o.keys));
    if (o.collChests) parts.push(res(IC.coll, "+" + o.collChests));
    if (o.essence) parts.push(res(IC.essence, "+" + o.essence));
    if (o.stones) parts.push(res(IC.stone, "+" + o.stones));
    let html = `<div class="reward">${parts.join("")}</div>`;
    if (o.dragonChest) html += cream("A <em>Dragon Chest</em> dropped");
    if (o.gearList && o.gearList.length) html += `<div class="reward reward--gear">${o.gearList.map((g) => gearTile(g, { cls: g.broken ? "gear--broken" : "" })).join("")}</div>`;
    if (V4L && o.gearList) { // G9 §5.1: a better piece for a party hero gets Equip right here; more than 3 → one Equip All
      const plan = V4L.rewardPlan(o.gearList), ids = plan.map((x) => `${x.g.uid}:${x.hid}`).join(",");
      if (plan.length > 3) { const who = [...new Set(plan.map((x) => DD.HERO[x.hid].short))];
        html += `<div class="v4eq">${cream(`<em>${plan.length}</em> better pieces for ${esc(who.slice(0, -1).join(", "))}${who.length > 1 ? " and " : ""}${esc(who[who.length - 1])}`)}${btn({ v: "primary", size: "sm", label: "Equip All", data: `data-eqr="${ids}"` })}</div>`; }
      else html += plan.map((x) => `<div class="v4eq">${cream(`${esc(DD.artName(x.g))} (${v4Rar(x.g)}) for <b>${esc(DD.HERO[x.hid].short)}</b> · ATK ${v4Pts(x.g)} (now ${x.cur ? v4Pts(x.cur) : 0})`)}${btn({ v: "primary", size: "sm", label: "Equip", data: `data-eqr="${x.g.uid}:${x.hid}"` })}</div>`).join("");
    }
    // v4 B5: each artifact says New or +1 <tier> Dust (P.buyArtChest gives .res)
    if (o.arts && o.arts.length) html += `<div class="reward reward--arts">${o.arts.map((id, i) => { const v4 = DD.V4 && DD.v4a && o.arts.res && o.arts.res[i]; return `<span class="reward__it">${icon(DD.COLL[id].icon, "reward__art")}${text("tag", esc(DD.COLL[id].name))}${v4 ? cream(v4.isNew ? "New" : `+1 ${DD.v4a.tierName(v4.tier)} Dust`, "reward__sub") : ""}</span>`; }).join("")}</div>`;
    if (o.heroes && o.heroes.length) html += `<div class="reward">${o.heroes.map((x) => `<span class="reward__it">${pic(x.id)}${text("tag", x.result === "new" ? "New" : "+1")}</span>`).join("")}</div>`;
    if (V4E && o.cardsWon && o.heroes) html += o.heroes.map((x) => { const h = DD.HERO[x.id], nm = esc(h.short), tn = DD.TIER_NAME[h.tier], cap = P.cap(x.id);
      return cream(x.result === "new" ? `New hero! <b>${nm}</b> (${tn})` : `Hero Card · <b>${nm}</b> (${tn}) · ${P.shards(x.id)}/${DD.BREAK_CARDS} for Lv ${cap + 1}–${cap + DD.LV_BLOCK}`, "v4card"); }).join("");
    return html;
  }
  function loot(title, o, done) {
    // C28 D/F: a chest creaks open, any other reward rings the V2 chest; a top piece and a Party Level up follow
    snd(/Chest/.test(title) || o.dragonChest ? "chest_open" : "reward");
    const top = Math.max(-1, ...((o.gearList || []).map((g) => g.r)));
    if (top >= 2) setTimeout(() => snd(top >= 4 ? "reveal_legendary" : top === 3 ? "reveal_epic" : "reveal_rare"), 450);
    if (o.levelUps) setTimeout(() => snd("level_up"), 700);
    const bk = P.takeBroken();
    const m = modal({ title, body: rewardRow(o) + (bk.n ? cream(V4L ? `Bag full: ${bk.n} spare piece${bk.n === 1 ? "" : "s"} became <em>+${bk.stones} Fuse Stones</em>` : `Bag full: the ${bk.n === 1 ? "weakest piece" : `${bk.n} weakest pieces`} became <em>+${bk.ore} Forge Ore</em>`) : "") + (o.chapter ? cream(`Chapter <em>${o.chapter}</em> complete`) : "") + (o.hardFirst ? cream("Hard stage cleared") : "") + (o.levelUps ? cream(`Party Level up! <em>+${o.levelUps * DD.PL_ENERGY}</em> energy`) : ""), actions: btn({ v: "primary", label: "OK", id: "ok" }) });
    m.querySelectorAll("[data-eqr]").forEach((b) => (b.onclick = () => { const k = b.dataset.eqr.split(",").filter((p) => { const [u, h] = p.split(":"); return P.equip(+u, h) === true; }).length; if (!k) return; snd("equip"); b.disabled = true; b.innerHTML = text("label", "Equipped"); })); // v4 B4
    m.querySelector("#ok").onclick = () => { m.remove(); if (done) done(); else render(); };
  }

  /* ================================================================ the lobby shell: top bar, page, nav (Dragon Fever order) */
  const NAV = [
    { id: "shop", label: "Shop", art: "icons/icon_navbadge_shop.webp", ic: "2a/ic_shop.webp", lock: "shop" },
    { id: "heroes", label: "Heroes", art: "icons/icon_navbadge_heroes.webp", ic: "2a/ic_heroes.webp", lock: "heroes" },
    { id: "home", label: "Battle", art: "icons/icon_navbadge_home.webp", ic: "2a/ic_home.webp" },
    { id: "party", label: "Party", plate: true, art: "dd/icon_tab_party.webp", ic: "2a/ic_party.webp", lock: "party" }, // C21: was Commander
    // 2026-10-31 (user: "artifacts ... punya halaman sendiri di dungeon. dungeon pindah ke home jadi lingkarang floating")
    { id: "artifacts", label: "Artifacts", plate: true, art: "dd/art_blade.webp", ic: "2a/ic_artifacts.webp", lock: "artifacts" },
  ];
  function topbar() {
    const s = S();
    const en = P.energy();
    const cap = P.energyCap();
    return `<div class="top">` +
      (DD.SKIN ? `<div class="t2lv" aria-label="Party Level ${s.pl.lv}"><span>${s.pl.lv}</span></div>` : `<div class="top__pl">${icon("icons/icon_party_emblem.webp")}${text("number", s.pl.lv, "top__pln")}</div>`) +
      // developer switch: a small pill under the level emblem, outside the player's composition (audit A4)
      (P.isDev ? `<button class="top__dev ${P.devAll() ? "is-on" : ""}" id="dev" data-tap-tier="low" aria-label="Developer: unlock all">${text("tag", "DEV")}</button>` : "") +
      res(IC.coin, DD.fmt(s.coins)) + res(IC.gem, DD.fmt(s.gems)) +
      // energy above the cap (level-up gifts) shows green instead of looking wrong (audit A7)
      `<button class="gk-res gk-res--bolt top__en ${en > cap ? "is-over" : ""}" id="en">${DD.SKIN ? icon("2a/ic_energy.webp") : bolt}${text("number", `${en}/${cap}`)}</button>` +
      ibtn({ sm: true, round: true, v: "neutral", id: "snd", aria: "Menu", inner: glyph("menu"), cls: "top__menu" }) +
      `</div>`;
  }
  /** 2A tab bar (docs/TEMA_2A.md): a dark band with a gold hairline, each tab = the ChatGPT icon + its word in Cinzel capitals. */
  const nav2a = (dots) => `<nav class="t2nav">${NAV.map((n) => {
    const locked = n.soon || (n.lock && !P.unlocked(n.lock));
    const mark = locked || n.id === tab ? "" : n.lock && P.isNew(n.lock) ? `<span class="newtag">${text("tag", "NEW")}</span>` : dots[n.id] ? `<span class="dot"></span>` : "";
    return `<button class="t2nav__item ${n.id === tab ? "is-active" : ""} ${locked ? "is-locked" : ""}" data-tab="${n.id}" aria-label="${n.id === "home" ? "Home" : n.label}">` +
      `<span class="t2nav__icbox">${icon(n.ic, "t2nav__ic")}${locked ? icon(IC.lock, "t2nav__lock") : ""}${mark}</span><span class="t2nav__label">${n.id === "home" ? "Home" : n.label}</span></button>`;
  }).join("")}</nav>`;
  function shell(content, bgCls) {
    if (DD.battle) { DD.battle.destroy(); DD.battle = null; }
    DD.bgm("bgm_home"); // C33 G8: every lobby screen has the lobby's music (battles play their stage's own)
    // an open sheet or centre box stays open while the page under it is drawn again (it redraws itself); so does a toast that
    // reports the action that asked for this redraw (bug list 2026-11-01 B1: "Equipped 3", "Rank 2" ... vanished at once)
    const keep = [...app.querySelectorAll(":scope > .gk-sheet-scrim, :scope > .gk-sheet, :scope > .cbox-scrim, :scope > .gk-toast")];
    const scroll = app.querySelector(".page") ? app.querySelector(".page").scrollTop : 0;
    const same = app.dataset.tab === tab;
    app.dataset.tab = tab;
    app.className = "app theme-purple" + (DD.SKIN ? " t2app" : "");
    // only the screen is replaced: an open sheet or box stays in the page untouched (re-inserting it would replay its pop-in)
    const cur = NAV.find((x) => x.id === tab);
    if (cur && cur.lock) P.seeNew(cur.lock);
    const dots = P.dots();
    [...app.children].forEach((el) => { if (!keep.includes(el)) el.remove(); });
    // C34 G7: the tab's own painting behind the page (Shop, Heroes, Party, Artifacts; Home keeps its glowing hall, a hero's page its land)
    const pg = DD.SKIN && !heroView && ["shop", "heroes", "party", "artifacts"].includes(tab) ? `<div class="pgbg pgbg--${tab}" aria-hidden="true"></div>` : "";
    app.insertAdjacentHTML("afterbegin", `<div class="screen ${same ? "" : "screen--in"} lobby ${bgCls || ""}">${pg}${topbar()}<div class="page">${content}</div>` +
      (DD.SKIN ? nav2a(dots) : `<nav class="gk-nav gk-nav--medals">${NAV.map((n) => {
        const locked = n.soon || (n.lock && !P.unlocked(n.lock));
        // red dot = something to do there now; NEW = opened by the stages but not visited (P.dots, P.isNew)
        const mark = locked || n.id === tab ? "" : n.lock && P.isNew(n.lock) ? `<span class="newtag">${text("tag", "NEW")}</span>` : dots[n.id] ? `<span class="dot"></span>` : "";
        // Party and Dungeon (plain pictures) sit in a gold-rimmed disc under the same label plate as the painted
        // medals, so the five tabs read as one set (audit A2, 2026-10-30)
        const art = n.plate ? `<span class="nav__disc"><img class="gk-nav__art" src="${A(n.art)}" alt=""></span>${icon("icons/icon_navbadge_plate.webp", "nav__plateimg")}<span class="gk-text gk-text--tag nav__label">${n.label}</span>` : `<img class="gk-nav__art" src="${A(n.art)}" alt="">`;
        return `<button class="gk-nav__item ${n.id === tab ? "is-active" : ""} ${locked ? "is-locked" : ""} ${n.cls || ""}" data-tab="${n.id}" aria-label="${n.id === "home" ? "Home" : n.label}"><span class="gk-nav__artbox">${art}${locked ? `<img class="nav__lock" src="${A(IC.lock)}" alt="">` : ""}${mark}</span></button>`;
      }).join("")}</nav>`) + `</div>`);
    app.querySelectorAll(".t2prog__power").forEach((r) => r.classList.toggle("is-wrap", r.scrollWidth > r.clientWidth + 1));
    app.querySelectorAll("nav [data-tab]").forEach((b) => (b.onclick = () => {
      const n = NAV.find((x) => x.id === b.dataset.tab);
      if (n.soon) return lockNote("Coming soon");
      if (n.lock && !P.unlocked(n.lock)) return lockNote("Clear Stage " + DD.UNLOCK[n.lock]);
      if (n.id === "heroes") { heroView = null; pgOpen = false; } // C27 E: the tab button returns to the list
      tab = n.id;
      render();
    }));
    app.querySelector("#snd").onclick = settingsSheet; // C33 G8: the burger menu with Sound
    app.querySelector("#en").onclick = energySheet;
    const dev = app.querySelector("#dev");
    if (dev) dev.onclick = () => { P.setDevAll(!P.devAll()); render(); DD.toast(P.devAll() ? "Dev: everything unlocked" : "Dev: locks back on"); };
    app.addEventListener("pointerdown", () => DD.bgm("bgm_home"), { once: true });
    if (same) app.querySelector(".page").scrollTop = scroll;
  }
  function render() {
    ({ home: showHome, heroes: showHeroes, shop: showShop, party: showParty, artifacts: showArtifacts })[tab]();
  }
  DD.render = render;

  /** A round feature button: the painted ring with its picture, one word on the painted plate. */
  // the plate carries one short word; a level rides on the ring as a small chip (user 2026-10-31: "Recruit Lv 1" ran past its plate)
  /** the 2A round feature button (docs/TEMA_2A.md): a dark ring with a gold line, the icon, the label in Cinzel capitals under it */
  const t2feat = (id, img, label, on, dot, lv, soon) =>
    `<button class="t2f ${on ? "" : "is-locked"} ${soon ? "is-soon" : ""}" id="${id}" aria-label="${label}${lv ? " " + lv : ""}">` +
    `<span class="t2f__ring">${icon(img, "t2f__ic")}${on ? "" : icon(IC.lock, "t2f__lock")}${lv && on ? `<span class="t2f__lv">${lv}</span>` : ""}</span>` +
    `<span class="t2f__label">${label}</span>${dot ? `<span class="dot"></span>` : ""}</button>`;
  const fbtn = (id, img, label, on, dot, lv, soon) => DD.SKIN ? t2feat(id, img, label, on, dot, lv, soon) : `<button class="fbtn ${on ? "" : "is-locked"} ${soon ? "is-soon" : ""}" id="${id}" aria-label="${label}${lv ? " " + lv : ""}"><span class="fbtn__ring">${icon("lair/btn_round_purple.webp", "fbtn__bg")}${icon(on || soon ? img : IC.lock, "fbtn__ic")}${soon ? icon(IC.lock, "fbtn__lock") : ""}` +
    `${lv && on ? `<span class="fbtn__lv">${text("tag", lv)}</span>` : ""}</span>` +
    `<span class="fbtn__plate">${plate()}${text("tag", label)}</span>${dot ? `<span class="dot"></span>` : ""}</button>`;
  /* ================================================================ Home 2A (docs/TEMA_2A.md; 2026-10-31, user: "ganti tema aja.. buat tema serius
     ... buat di halaman home dan dungeon dulu"): the obsidian gate painting full screen, Stage n between thin chevrons, the world's
     name in Cinzel over a gold rule, two rails of round features, then the progress panel, the party (Kael for now) and Start Battle. */
  function home2a(o) {
    const { s, st, hard, best, cs, power, patrolReady } = o;
    const feat = t2feat;
    // C29 E (2026-11-02, user photo 1: "seharusnya menampilkan bosnya, lalau bisa geser untuk ke stage berikutnya. tombol start juga
    // kasih background cahaya seperti itu"): the stage's dragon on a big framed card; the stages before and after peek at the sides
    // (tap or swipe); Start between Patrol and Missions, plain (no rays or glow: user no. 70 "ga usah ada sinarnya lah")
    const stageOf = (n) => (hard ? DD.hardStage(n) : DD.stage(n)), openOf = (n) => (hard ? P.hardOpen(n) : P.stageOpen(n));
    const side = (n, cls, id) => (n < 1 ? `<span class="t2card t2card--side ${cls} is-empty" id="${id}"></span>` :
      `<button class="t2card t2card--side ${cls} ${openOf(n) ? "" : "is-locked"}" id="${id}" aria-label="Stage ${n}"><img class="t2card__art" src="${A(DD.skinDragon(stageOf(n).form, "card"))}" alt="">` +
      `<span class="t2card__shade"></span><img class="t2card__frame" src="${A("2a/ui/stage_frame.webp")}" alt="">${openOf(n) ? "" : icon(IC.lock, "t2card__lock")}<span class="t2card__no">${n}</span></button>`);
    const open = openOf(st.n);
    const chip = (e) => `<span class="t2el t2el--${e}">${DD.ELEMENT_NAME[e]}</span>`;
    const dragonLine = (x) => {
      const D = x.dragons || [], main = D[D.length - 1] || { name: (DD.FORMS[x.form] || {}).name || "", els: [x.el], immune: [] };
      const others = [...new Set(D.slice(0, -1).flatMap((d) => d.els))];
      return (main.boss ? `Boss ${esc(main.name)} ` : `${esc(main.name)} `) + main.els.map(chip).join(" ") +
        (main.immune && main.immune.length ? ` · immune ${main.immune.map(chip).join(" ")}` : x.weak ? ` · weak to ${chip(x.weak)}` : "") +
        (D.length > 1 ? `<br>${D.length - 1 === 1 ? "1 dragon" : D.length - 1 + " dragons"} before it ${others.map(chip).join(" ")}` : "");
    };
    return `<div class="t2home__bg t2home__bg--deck t2glow--${st.el}"></div>` + // C30 D (user no. 71: "background juga polos tapi glowing")
      `<div class="t2home t2home--deck">` +
      `<div class="t2home__top"><button class="t2pill" id="info" aria-label="How to Play">Info</button>` +
      `<div class="t2home__stage"><span class="t2home__no">Stage ${st.n}</span></div>` +
      `<button class="t2pill ${hard ? "is-on" : ""} ${P.unlocked("hard") ? "" : "is-locked"}" id="hardsw" aria-label="Hard Mode">${hard ? "Hard" : "Normal"}</button></div>` +
      `<div class="t2deck">${side(st.n - 1, "t2card--l", "prev")}${side(st.n + 1, "t2card--r", "next")}` +
      `<div class="t2card t2card--main t2card--${st.el} ${open ? "" : "is-locked"}"><img class="t2card__art" src="${A(DD.skinDragon(st.form, "card"))}" alt=""><img class="t2card__frame" src="${A("2a/ui/stage_frame.webp")}" alt="">` +
      `<span class="t2card__shade"></span><span class="t2card__tag">Chapter ${roman(DD.chapterOf(st.n))}${st.round ? " · Round" : ""}${st.bossDragon ? " · Boss" : ""}${hard ? " · Hard" : ""}</span>` +
      `<div class="t2card__title"><h1 class="t2card__world">${esc(st.worldName)}</h1>` +
      // G2 (no. 99): the stage's dragons, the boss with what it is immune to
      `<div class="t2card__sub">${dragonLine(st)}</div></div></div>` +
      feat("dungeon", "dd/icon_tab_dungeon.webp", "Dungeon", false, false, null, true) + `</div>` +
      `<div class="t2home__low"><div class="t2panel t2prog"><div class="t2prog__row"><span class="t2cap">Highest Survival</span>${!hard && P.readyChests() > 0 ? `<button class="t2pill t2pill--claim" id="chestall">${text("tag", "Claim All " + P.readyChests())}</button>` : ""}<span class="t2prog__pct">${best}%</span></div>` +
      (hard ? `<div class="t2prog__hard">${cream(`Coins ×${DD.HARD.coins} · EXP ×${DD.HARD.exp} · first clear`)}${gifts(DD.HARD.first)}</div>` : "") +
      `<div class="best t2best ${hard ? "best--hard" : ""}"><div class="best__fill" style="width:${best}%"></div>` +
      (hard ? "" : DD.PROGRESS_CHESTS.map((p, i) => `<button class="best__chest ${cs[i] === 2 ? "is-got" : cs[i] === 1 ? "is-ready" : ""}" data-i="${i}" style="left:${p}%" aria-label="Chest ${p}%">${icon(IC.chest)}${cs[i] === 2 ? `<span class="t2tick"></span>` : ""}</button>`).join("")) + `</div>` +
      `<div class="t2prog__power"><span class="t2pw"><span class="t2cap">Party Power</span><b class="${power < st.power ? "is-low" : ""}">${DD.fmt(power)}</b></span><span class="t2sep"></span><span class="t2pw"><span class="t2cap">Recommended</span><b>${DD.fmtCost(st.power)}</b></span></div></div>` +
      `<div class="t2go">${feat("patrol", IC.patrol, "Patrol", P.unlocked("patrol"), patrolReady)}` +
      `<div class="t2go__mid"><button class="t2cta" id="play"><span class="t2cta__t">Start</span><span class="t2cta__cost">${icon("2a/ic_energy.webp")}${DD.ENERGY_RUN}</span></button></div>` +
      `${feat("missions", IC.missions, "Missions", P.unlocked("missions"), P.missionsReady())}</div>` +
      `</div></div>`;
  }

  let homeDir = 0; // the way the last stage change went, for the card's slide-in (C29 E)
  /* C54 (user no. 116: "buat tutorial yang memiliki story, alur cerita. dan cara bermain"; Ledger Draft 44): a new player's first run —
     the prologue, 3 hero cards to open (random Commons), the heroes say hello, then Stage 1 with the how-to-play lines (js/story.js) */
  let introRunning = false, homeTalk = false;
  async function runIntro() {
    introRunning = true;
    const s = S();
    while (window.DD_SPLASH) await new Promise((r) => setTimeout(r, 120)); // after the company splash
    if (!Object.keys(s.heroes).length) {
      await DD.Story.play(DD.Story.PROLOGUE);
      const list = P.starterCards();
      await new Promise((r) => showPulls(list, r, "Your First Heroes"));
    }
    const hello = P.formation().slice(0, 3).filter((id) => DD.Story.HELLO[id]).map((id) => ({ who: id, line: DD.Story.HELLO[id] }));
    await DD.Story.play([...hello, DD.Story.GO]);
    // the old one-line tips are said by the heroes now
    Object.assign(s.seen, { intro: true, firstBattle: true, tutOn: true, drag: true, call: true, skill: true });
    P.save();
    introRunning = false;
    showBattle(1);
  }
  /** C54: a story moment on Home (Kael comes or goes, the first-win spotlights); true = Home waits for it */
  function homeStory(s) {
    if (!DD.Story || homeTalk) return homeTalk;
    const go = (p, after) => { homeTalk = true; p.then(() => { homeTalk = false; if (after) after(); render(); }); return true; };
    if (P.loanDue()) return go(DD.Story.play(DD.Story.KAEL_HI), () => P.loanStart());
    if (P.loanOver()) return go(DD.Story.play(DD.Story.KAEL_BYE), () => P.loanBye());
    if (s.seen.tutOn && s.cleared >= 1 && !s.seen.tut_home) {
      s.seen.tut_home = true;
      P.save();
      return go(DD.Story.spot(app.querySelector('[data-tab="heroes"]'), DD.Story.TUT.heroes).then(() => DD.Story.spot(app.querySelector("#play"), DD.Story.TUT.play)));
    }
    return false;
  }
  /* ================================================================ Home (Battle tab): the stage, chests, formation */
  function showHome() {
    const s = S();
    // C48: once, after an old save's Party / Exchange Shards became Recruit Tickets
    if (V4E && s.v4e && s.v4e.refund && !s.seen.v4refund) { DD.toast(`Slot levels are gone: ${DD.fmt(s.v4e.refund)} coins came back`); s.seen.v4refund = 1; P.save(); }
    if (s.shardTickets) { DD.toast(`Hero cards now come only from Recruit: your shards became ${s.shardTickets} Recruit Ticket${s.shardTickets === 1 ? "" : "s"}`); delete s.shardTickets; P.save(); }
    // Hard Mode (C23) keeps its own stage pointer and best; progress chests are Normal only
    const hard = s.hard.on && P.unlocked("hard");
    const st = hard ? DD.hardStage(s.hard.stage) : DD.stage(s.stage);
    const open = hard ? P.hardOpen(st.n) : P.stageOpen(st.n);
    const best = (hard ? s.hard.best[st.n] : P.bestOf(st.n)) || 0; // C32 G8
    const cs = P.chestState(st.n);
    const f = P.formation(), slots = P.slots();
    const nextSlot = DD.SLOT_STAGES[slots]; // the stage that opens the next party slot (C21)
    const patrolReady = P.unlocked("patrol") && P.patrol().hours >= 1;
    // composition: V2 target Home (ribbon, round side features, painted centre, recessed run card, big yellow
    // button) with Dragon Fever's content (progress chests, formation, Patrol, Recruit) — MEKANISME_UI v3 §Home
    const power = P.power();
    shell(DD.SKIN ? home2a({ s, st, hard, best, cs, power, patrolReady }) :
      `<div class="home__bg" style="background-image:url('${A(st.bg)}')"></div>` +
      `<div class="hm">` +
      `<div class="hm__ribbon">${ibtn({ v: "secondary", round: true, sm: true, id: "prev", aria: "Previous", inner: glyph("prev") })}` +
      `<div class="hm__banner">${icon(hard ? "lair/banner_red.webp" : "lair/banner_gold.webp")}${text("title", "Stage " + st.n)}</div>` +
      ibtn({ v: "secondary", round: true, sm: true, id: "next", aria: "Next", inner: glyph("next") }) + `</div>` +
      // the world line with its two pills as one pair: Info left, Normal / Hard right, the same size (UI pass 3, 2026-10-31);
      // before Stage 10 the Hard pill shows locked so the pair stays even
      `<div class="hm__head"><button class="hm__info" id="info" aria-label="How to Play">${text("tag", "Info")}</button>` +
      `<div class="hm__world">${text("number", esc(st.worldName))}${text("tag", "Chapter " + DD.chapterOf(st.n) + (st.round ? " · Round" : ""), "hm__chap")}</div>` +
      `<button class="hm__hard ${hard ? "is-on" : ""} ${P.unlocked("hard") ? "" : "is-locked"}" id="hardsw" aria-label="Hard Mode">${P.unlocked("hard") ? "" : icon(IC.lock, "hm__lock")}${text("tag", hard ? "Hard" : P.unlocked("hard") ? "Normal" : "Hard")}</button></div>` +
      // the dragon in the middle, the four features in two columns beside it, its element under it
      `<div class="hm__stage"><div class="hm__side hm__side--l">${fbtn("patrol", IC.patrol, "Patrol", P.unlocked("patrol"), patrolReady)}` +
      fbtn("missions", IC.missions, "Missions", P.unlocked("missions"), P.missionsReady()) + fbtn("dungeon", "dd/icon_tab_dungeon.webp", "Dungeon", false, false, null, true) + `</div>` +
      `<div class="hm__dragon ${open ? "" : "is-locked"}"><img src="${A(st.art)}" alt=""></div>` +
      `<div class="hm__side hm__side--r">${fbtn("recruit", IC.recruit, "Recruit", P.unlocked("recruit"), false, V4E ? "" : "Lv " + P.recruitLv())}` +
      fbtn("limited", IC.limited, "Limited", P.unlocked("limited"), P.unlocked("limited") && (s.essence > 0 || P.limitedMilestones().some((m) => m.state === 1))) + `<span class="fbtn fbtn--ghost" aria-hidden="true"></span></div>` +
      // one dark pill under the dragon, between the two columns: its element, then what it is weak to
      `<div class="hm__weak"><span class="wk">${elTag(st.el)}${st.weak ? text("tag", "Weak to") + elTag(st.weak) : text("tag", "No weakness")}</span></div></div>` +
      // title + percent on one line, the chests stand on the bar instead of covering the number (audit A5)
      `<div class="hm__card"><div class="hm__cardrow">${text("label", "Highest Survival Progress", "hm__cardt")}${text("label", best + "%", "hm__pct")}</div>` +
      // Hard: the first-clear line takes the room the chests stand in, so the card keeps its height
      (hard ? `<div class="hm__hardline">${text("tag", `Coins ×${DD.HARD.coins} · EXP ×${DD.HARD.exp} · first clear`)}${gifts(DD.HARD.first)}</div>` : "") +
      `<div class="best ${hard ? "best--hard" : ""}"><div class="best__fill" style="width:${best}%"></div>` +
      (hard ? "" : DD.PROGRESS_CHESTS.map((p, i) => `<button class="best__chest ${cs[i] === 2 ? "is-got" : cs[i] === 1 ? "is-ready" : ""}" data-i="${i}" style="left:${p}%" aria-label="Chest ${p}%">${icon(IC.chest)}${cs[i] === 2 ? `<span class="best__tick">${glyph("check")}</span>` : ""}</button>`).join("")) + `</div>` +
      `<div class="hm__power">${text("tag", "Party Power")}${text("number", DD.fmt(power), power < st.power ? "is-low" : "")}${text("tag", "Recommended " + DD.fmtCost(st.power), "hm__rec")}</div></div>` +
      `<button class="hm__party" aria-label="Party">` +
      // the first hero (on the wall from the start) is a little bigger
      f.map((id, i) => `<span class="home__pm">${pic(id, i === 0 ? "pic--kael" : "")}${P.isTrial(id) ? text("tag", "Loan", "home__trial") : ""}</span>`).join("") +
      Array.from({ length: Math.max(0, slots - f.length) }, () => `<span class="pic pic--empty"></span>`).join("") +
      (nextSlot !== undefined ? `<span class="pic pic--lock">${icon(IC.lock)}</span>` : "") +
      `</button>` +
      btn({ v: "primary", size: "xl", label: "Start Battle", id: "play", cls: "hm__play gk-btn--pulse", icon: `<span class="home__cost">${bolt}${text("label", DD.ENERGY_RUN)}</span>` }) +
      `</div>`,
      DD.SKIN ? "lobby--t2home" : "lobby--home"
    );
    const q = (x) => app.querySelector(x);
    const ptr = hard ? s.hard : s, openAt = (n) => (hard ? P.hardOpen(n) : P.stageOpen(n));
    q("#prev").style.visibility = ptr.stage > 1 ? "" : "hidden";
    if (!DD.SKIN) q("#next").style.visibility = openAt(ptr.stage + 1) ? "" : "hidden";
    q("#prev").onclick = () => { if (ptr.stage <= 1) return; ptr.stage--; homeDir = -1; P.save(); showHome(); };
    q("#next").onclick = () => { if (!openAt(ptr.stage + 1)) return DD.SKIN ? lockNote("Clear Stage " + ptr.stage) : undefined; ptr.stage++; homeDir = 1; P.save(); showHome(); };
    const deck = q(".t2deck");
    if (deck) {
      // C29 E: swipe the cards like the user's photo 1
      let sx = null, sy = 0;
      deck.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; });
      deck.addEventListener("pointerup", (e) => {
        if (sx === null) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        sx = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) q(dx < 0 ? "#next" : "#prev").click();
      });
      if (homeDir) { q(".t2card--main").classList.add(homeDir > 0 ? "is-in-r" : "is-in-l"); homeDir = 0; }
    }
    q("#info").onclick = () => (DD.V4 && DD.v4.stageInfo ? infoBox(INFO.home[0], [DD.v4.stageInfo(st), ...INFO.home[1]]) : showInfo("home")); // v4 B2: the stage's dragons first (G2 §11)
    q("#hardsw").onclick = () => {
      if (!P.unlocked("hard")) return lockNote("Clear Stage " + DD.UNLOCK.hard);
      P.setHard(!hard); showHome(); DD.toast(S().hard.on ? "Hard Mode: a thicker dragon, more loot" : "Normal stages");
    };
    if (q(".hm__party")) q(".hm__party").onclick = () => { if (P.unlocked("heroes")) { tab = "heroes"; render(); } else lockNote("Clear Stage " + DD.UNLOCK.heroes); }; // classic Home only (2A: the party is on the Heroes tab, C27 D)
    app.querySelectorAll(".best__chest").forEach((b) => (b.onclick = () => {
      const i = +b.dataset.i;
      if (cs[i] === 0) return DD.toast(V4E ? `Reach ${DD.PROGRESS_CHESTS[i]}%: ${V4E.chestWords(st.n)[i]}` : `Reach ${DD.PROGRESS_CHESTS[i]}% to open`);
      if (cs[i] === 2) return;
      const got = P.claimChest(st.n, i); // null when it was already taken (a second tap before the screen redraws)
      if (got) loot("Chest", got); else render();
    }));
    if (q("#chestall")) q("#chestall").onclick = () => { const g = P.claimAllChests(); if (Object.keys(g).length) loot("Chests", g); else render(); }; // C32 G8
    q("#patrol").onclick = () => (P.unlocked("patrol") ? patrolSheet() : lockNote("Clear Stage " + DD.UNLOCK.patrol));
    if (q("#recruit")) q("#recruit").onclick = () => (P.unlocked("recruit") ? recruitSheet() : lockNote("Clear Stage " + DD.UNLOCK.recruit));
    q("#missions").onclick = () => (P.unlocked("missions") ? missionsSheet() : lockNote("Clear Stage " + DD.UNLOCK.missions));
    if (q("#limited")) q("#limited").onclick = () => (P.unlocked("limited") ? limitedSheet() : lockNote("Clear Stage " + DD.UNLOCK.limited));
    q("#dungeon").onclick = () => lockNote("Coming soon");
    q("#play").onclick = () => {
      if (!open) return lockNote(hard && st.n <= S().cleared ? "Clear Hard Stage " + (st.n - 1) : "Clear Stage " + (hard ? st.n : st.n - 1));
      if (!P.startRun()) return energySheet();
      showBattle(st.n, hard);
    };
    // C54: a new player's first run (story, 3 hero cards, then Stage 1 as before); a save that already cleared a stage skips it
    if (!s.seen.intro) {
      if (s.cleared > 0 || s.seen.firstBattle) { s.seen.intro = true; P.save(); }
      else { if (!introRunning) runIntro(); return; }
    }
    if (homeStory(s)) return; // Kael comes or goes, or the first-win spotlights
    // the 7-Day Sign-in opens by itself once a day (the one automatic box on Home)
    if (s.seen.firstBattle && P.signinPopup()) missionsSheet("signin");
  }

  /* ================================================================ energy */
  function energySheet() {
    sheet({
      title: () => "Energy",
      body: () => {
        const en = P.energy(), cap = P.energyCap(), next = P.energyNext();
        return `<div class="ensheet"><div class="ensheet__n">${bolt}${text("title", `${en}/${cap}`)}</div>` +
          cream(next ? `+1 in <em>${time(next)}</em>` : "Full") + `</div>`;
      },
      actions: () => btn({ v: "secondary", id: "ad", label: `+${DD.ENERGY_AD}`, sub: `Ad ${P.energyAdsLeft()}/${DD.ENERGY_AD_DAY}`, cls: P.energyAdsLeft() > 0 ? "" : "gk-btn--poor" }) +
        btn({ v: "primary", id: "buy", icon: gem, label: DD.ENERGY_BUY.gems, sub: `+${DD.ENERGY_BUY.energy}`, cls: S().gems >= DD.ENERGY_BUY.gems ? "" : "gk-btn--poor" }),
      bind: (sh, re, close) => {
        sh.querySelector("#ad").onclick = () => { if (P.energyAdsLeft() <= 0) return DD.toast("No more today"); ad(() => { P.adEnergy(); close(); render(); }); };
        sh.querySelector("#buy").onclick = () => { if (!P.buyEnergy()) return DD.toast("Not enough gems"); close(); render(); };
      },
    });
  }

  /* ================================================================ Heroes */
  function heroCard(id) {
    const h = DD.HERO[id], own = P.owned(id), trial = P.isTrial(id);
    const lv = P.lv(id), c = P.lvCost(id);
    const inF = P.formation().includes(id);
    const sh = P.shards(id);
    // C27 C: the bar counts the hero's cards toward the 3 that open its next 5 levels
    const bar = !own ? "" : `<span class="hc__bar"><span style="width:${Math.min(100, (sh / DD.BREAK_CARDS) * 100)}%"></span>${text("tag", `${sh}/${DD.BREAK_CARDS}`)}</span>`;
    return `<button class="hc gfc gfc--${tierCls(h.tier)} ${P.has(id) ? "" : "is-off"}" data-id="${id}">` +
      `<span class="hc__win gfc__win hc__win--${tierCls(h.tier)}"><img src="${A(`heroes/${id}/bust.webp`)}" alt="">` +
      (P.has(id) ? text("label", "Lv " + lv, "hc__lv") : "") + `<span class="hc__el">${elTag(h.el)}</span>` +
      (P.canLv(id) ? `<span class="hc__up">${glyph("plus")}</span>` : "") +
      (trial ? `<span class="hc__trial">${text("tag", "Loan " + time(P.trialLeft()))}</span>` : "") + (V4E && V4E.isWish(id) ? `<span class="hc__wish">${text("tag", "WISH")}</span>` : "") + `</span>` +
      // in the formation = a green check in front of the name, so nothing sits on the face (audit A14)
      // name right under the picture, the shard bar under the name (UI pass 3: names line up whether or not a bar shows)
      `<span class="hc__nm">${inF ? `<span class="hc__in">${glyph("check")}</span>` : ""}${text("tag", esc(h.short), "hc__name")}</span>` + bar + `</button>`;
  }
  /* ---------------------------------------------------------------- C27 D (2026-11-02): the party on the Heroes tab
     User: "di home di atas start battle, ada urutan team yang di deploy. itu seharusnya berada di bagian heroes tab. maksnya bawa 5. semua
     muncul langsung, yang belum tetap ada lingkaran kosong. saat user klik, baru muncul box overlay, untuk pilih hero available. saat klik
     yang sudah ada heronya, artinya remove." The first place is the Lead (it opens the battle and wears the equipment). */
  let heroView = null; // the hero whose own page is open on the Heroes tab (C27 E)
  let heroDir = 0; // the way the last swipe went (−1 back, 1 on), for the page's slide-in
  let heroTab = "stats"; // the open tab of the hero profile (C31): equip, stats or skill; Stats first (C34 G5), kept while swiping heroes
  /** The Heroes list order, by grade then owned first; the hero page swipes through the same order. */
  const heroGroups = () => {
    // C36 G1 (user no. 80: "harusnya di heroes bisa feel yang mana rare yang mana mythic"): the Mythics show too (locked until owned),
    // at the top in their red frames; C33 G7: a new hero waits for its art
    const list = DD.HEROES.filter((h) => !DD.ART_PENDING.has(h.id));
    return ["mythic", "legendary", "epic", "rare", "common"].map((t) => [t, list.filter((h) => h.tier === t).sort((a, b) => P.has(b.id) - P.has(a.id))]).filter((g) => g[1].length);
  };
  const heroOrder = () => heroGroups().flatMap(([, hs]) => hs.map((h) => h.id));
  function partyRow() {
    // C32 G5 (user no. 74: "party di heroes juga buat lebih besar, dan jangan lingkaran. lalu kalau user klik jadinya langsung
    // keluarin kotak add to the party"): five 4:5 portraits in the gold frame; any tap opens the box
    const f = P.formation();
    return `<div class="prow prow--big">${Array.from({ length: P.slots() }, (_, i) => {
      const id = f[i];
      if (!id) return `<button class="prow__m prow__m--empty gfc" data-party="1" aria-label="Add a hero"><span class="gfc__win"><span class="prow__plus">${glyph("plus")}</span></span>${text("tag", "Empty", "prow__n")}</button>`;
      return `<button class="prow__m gfc gfc--${tierCls(DD.HERO[id].tier)}" data-party="1" aria-label="Party: ${esc(DD.HERO[id].short)}"><span class="gfc__win"><img src="${A(`heroes/${id}/bust.webp`)}" alt=""></span>` +
        (i === 0 ? `<span class="lead-tag prow__lead">${text("tag", "Lead")}</span>` : "") + text("tag", esc(DD.HERO[id].short), "prow__n") + `</button>`;
    }).join("")}</div>`;
  }
  function bindPartyRow() {
    app.querySelectorAll(".prow [data-party]").forEach((b) => (b.onclick = () => partyPicker()));
  }
  /** C32 G5: "di situ semua hero available. yang di select memiliki glowing di belakang warna emas, bisa select semua di sana,
      uncheck tidak masuk team." Every hero the player has; a tap puts it in or takes it out; the first one is the Lead. */
  function partyPicker() {
    sheet({
      title: () => "Add to the Party",
      cls: "ppick",
      body: () => {
        const f = P.formation(), ids = heroOrder().filter((id) => P.has(id));
        return `<div class="ppick__head">${text("label", `${f.length} of ${P.slots()} in the party`)}${cream("Tap to add or remove. The first one is the Lead.")}</div>` +
          `<div class="ppick__grid">${ids.map((id) => {
            const h = DD.HERO[id], at = f.indexOf(id);
            return `<button class="ppick__it gfc gfc--${tierCls(h.tier)} ${at >= 0 ? "is-sel" : ""}" data-pid="${id}" aria-pressed="${at >= 0}"><span class="gfc__win"><img src="${A(`heroes/${id}/bust.webp`)}" alt="">` +
              `<span class="hc__el">${elTag(h.el)}</span>${text("label", "Lv " + P.lv(id), "hc__lv")}</span>` +
              (at === 0 ? `<span class="lead-tag ppick__lead">${text("tag", "Lead")}</span>` : at > 0 ? `<span class="ppick__no">${text("tag", String(at + 1))}</span>` : "") +
              text("tag", esc(h.short), "ppick__n") + `</button>`;
          }).join("")}</div>`;
      },
      actions: () => `<button class="hp2__plaque hp2__cta ppick__done" id="pdone">${text("label", "Done")}</button>`,
      bind: (sh, re, close) => {
        sh.querySelectorAll("[data-pid]").forEach((b) => (b.onclick = () => {
          const r = P.toggleFormation(b.dataset.pid);
          if (r === "full") return DD.toast(`Party full (${P.slots()}): take a hero out first`);
          if (r === "last") return DD.toast("The party needs one hero");
          snd("tab"); re(); render();
        }));
        sh.querySelector("#pdone").onclick = close;
      },
    });
  }
  function showHeroes() {
    if (heroView) return showHeroPage(heroView);
    if (V4L && pgOpen) return showPartyGear(); // v4 B4 (G9 §5.3)
    const s = S();
    const slots = P.slots(), f = P.formation();
    // grouped by tier under a named strip, owned first inside each; the party's five places sit above the list (C27 D) and
    // C48: no shard chips in the head any more
    const groups = heroGroups();
    shell(
      pageHead("Heroes", `${Object.keys(s.heroes).length} heroes · ${f.length} of ${slots} in the party`) + // C48: no shard chips
      `<div class="hparty">${shead("Party", "Tap to choose the party")}${partyRow()}${V4L ? `<button class="hp2__plaque hp2__plaque--dark pgear__open ${P.formation().some((id) => P.betterFor(id) || V4L.fuseReady(id)) ? "has-dot" : ""}" id="pgear">${text("label", "Party Gear")}</button>` : ""}</div>` +
      `<div class="hgrid">${groups.map(([t, hs]) => shead(DD.TIER_NAME[t], `${hs.filter((h) => P.has(h.id)).length} of ${hs.length}`, "hgrid__tier--" + tierCls(t)) + hs.map((h) => heroCard(h.id)).join("")).join("")}</div>` +
      "", // C32 G6: Recruit and Limited moved to the Shop (user no. 74: "kartu recruit dan limited, pindah ke shop")
      "lobby--heroes"
    );
    app.querySelectorAll(".hgrid .hc").forEach((b) => (b.onclick = () => heroSheet(b.dataset.id)));
    bindPartyRow();
    if (app.querySelector("#pgear")) app.querySelector("#pgear").onclick = () => { pgOpen = true; render(); };
    // the party panel stays at the top while the list scrolls (2026-11-02, user: "di heroes page, party di freeze aja ya"); once it
    // sticks it gets its dark backing, so the cards passing under it do not show through
    const pg = app.querySelector(".page"), hp = app.querySelector(".hparty");
    const stuck = () => hp.classList.toggle("is-stuck", pg.scrollTop > 0 && pg.scrollTop >= hp.offsetTop - 1);
    pg.addEventListener("scroll", stuck, { passive: true });
    stuck();
    app.querySelector("#info").onclick = () => showInfo("heroes");
  }
  /* ---------------------------------------------------------------- C27 E (2026-11-02): every hero has its own page
     User: "untuk hero info itu cukup susah lihatnya, dari pada buka box overlay, berikan halaman khusus untuk hero itu. dan gimana kamu
     rancang supaya lihatnya enak dan nyaman, dari pada akordion". A page on the Heroes tab (back = the list): the hero standing on the
     dais, its name and three numbers, the level box with its one action, the big steps of Lv 1–20, then attack, element, battle cards
     and Evo, all open; the party buttons at the foot. */
  let listScroll = 0; // where the Heroes list was, so Back returns there
  function heroSheet(id) { if (tab === "heroes" && !heroView && app.querySelector(".page")) listScroll = app.querySelector(".page").scrollTop; tab = "heroes"; heroView = id; heroTab = "stats"; render(); }
  function showHeroPage(id) {
    const h = DD.HERO[id], own = P.owned(id), has = P.has(id), lv = P.lv(id) || 1, m = DD.levelMods(h, lv), w = h.w;
    const dmgAt = (L) => Math.max(1, Math.round((w.dmg || w.dps || 0) * DD.levelMods(h, L).dmgL * DD.DMG_SCALE * (DD.PATTERN_K[id] || 1))); // C53: the hit as the battle deals it (with the hero's coefficient)
    const hpAt = (L) => Math.round(h.hp * DD.levelMods(h, L).hpMul);
    const f = P.formation(), inF = f.includes(id), isLead = f[0] === id;
    const c = own ? P.lvCost(id) : null, cap = P.cap(id), cards = P.shards(id);
    const num = (label, v) => `<span class="hnum">${text("number", v)}${text("tag", label)}</span>`;
    const sec = (title, inner, sub) => `<section class="gk-isec hp__sec"><div class="gk-isec__head">${text("label", title)}${sub ? text("tag", sub, "hsheet__sub") : ""}</div>${inner}</section>`;
    const capOf = (k, v) => { const cs = DD.CARD_STATS[k]; return cs.pct ? "+" + DD.pct(v) : cs.unit ? `+${v}${cs.unit}` : "+" + v; };
    const v4s = DD.V4 && DD.v4 && DD.v4.statsUI ? DD.v4.statsUI(h, lv) : null; // Rancangan v4 B3 (G3 §10, js/v4-heroes.js)
    const steps = v4s ? DD.v4.lvSteps(h) : DD.LV_STEPS.map(([at, what]) => [at, what === "lv4" ? h.lv4.text : what === "lv6" ? `<b>${esc(h.lv6.name)}</b>: ${esc(h.lv6.text)} Evo from the start.` : what]);
    const block = Math.max(DD.LV_BLOCK, cap) - DD.LV_BLOCK;
    const pips = Array.from({ length: DD.LV_BLOCK }, (_, i) => `<i class="${block + i + 1 <= lv ? "is-on" : ""}"></i>`).join("");
    let lvAct;
    if (!has) lvAct = btn({ v: "secondary", label: "Recruit", id: "go-rec" });
    else if (!own) lvAct = cream("On loan: get this hero's card to keep it and level it up.");
    else if (c.brk) lvAct = btn({ v: "special", id: "lvup", label: `Unlock Lv ${cap + 1}–${cap + DD.LV_BLOCK}`, icon: icon(`heroes/${id}/bust.webp`, "in-ic") + text("label", `${cards}/${c.shards}`), cls: P.canLv(id) ? "" : "gk-btn--poor" });
    else lvAct = btn({ v: "success", id: "lvup", label: "Lv Up", icon: coin + text("label", DD.fmtCost(c.coins)), cls: P.canLv(id) ? "" : "gk-btn--poor" });
    const next = own && c && !c.brk && v4s ? cream(`Next level: Power <em>${DD.fmt(v4s.power(lv))} → ${DD.fmt(v4s.power(lv + 1))}</em> · HP <em>${DD.fmt(hpAt(lv))} → ${DD.fmt(hpAt(lv + 1))}</em>`, "hp__next")
      : own && c && !c.brk ? cream(`Next level: Damage <em>${DD.fmt(dmgAt(lv))} → ${DD.fmt(dmgAt(lv + 1))}</em> · HP <em>${DD.fmt(hpAt(lv))} → ${DD.fmt(hpAt(lv + 1))}</em>`, "hp__next")
      : own && c && c.brk ? cream(`Lv ${cap} reached: <em>${DD.BREAK_CARDS}</em> cards of ${esc(h.short)} open the next ${DD.LV_BLOCK} levels. ${V4E ? "Cards come from won battles and Recruit." : `A card = a copy of ${esc(h.short)} from Recruit.`}`, "hp__next") : "";
    // C31 (user no. 72 + "go", 2026-11-03: "pecah banget.. harusnya seukuran dengan gambar referensi tadi. untuk info gunakan  tab
    // saja"): photo 2's structure. The hero's own painting (1024 × 1536, A26) big and sharp over its element's land, the name on a
    // plate on top, then a tray with three tabs (Equipment, Stats, Skill) and the main action under it, always in sight; the details
    // live in the tabs instead of a long scroll under the tray
    const tabNow = has ? heroTab : "stats";
    const better = (sl) => S().bag.some((g) => g.slot === sl.id && P.fits(g, id) && P.artScore(g) > P.artScore(P.gearOf(id)[sl.id]));
    const slot2 = (sl) => {
      const g = P.gearOf(id)[sl.id];
      const vlen = g && V4L ? v4Pts(g).length : 0;
      return `<button class="eslot hp2__slot hp2__slot--${g ? DD.GEAR_RARITY[g.r] : "empty"} ${vlen >= 6 ? "hp2__slot--long hp2__slot--long6" : vlen >= 5 ? "hp2__slot--long" : ""}" data-slot="${sl.id}" aria-label="${sl.name}">` +
        (better(sl) ? `<span class="gear__up" aria-label="A better piece is in the bag"></span>` : "") +
        `<span class="hp2__art">${icon(g ? DD.eqArt(g) : DD.SLOT[sl.id].art, "hp2__ic")}</span><span class="hp2__stxt">` +
        (g && V4L ? v4Tier(g) + (g.tier >= 20 && V4L.tierTop(g) === 20 && V4L.canFuse(g) ? `<span class="v4dot" aria-label="Fuse ready"></span>` : "") + text("number", v4Pts(g), "hp2__val") + cream("ATK", "hp2__lab")
          : g ? text("number", eqNum(DD.SLOT[g.slot].stat, P.gearStat(g)), "hp2__val") + cream(EQ_LAB[DD.SLOT[g.slot].stat], "hp2__lab")
          : text("label", sl.name, "hp2__lab hp2__lab--slot") + cream("Empty", "hp2__empty")) + `</span></button>`;
    };
    const body = tabNow === "equip"
      ? (has ? `<div class="hp2__slots">${DD.SLOTS.map(slot2).join("")}</div><div class="hp2__row ${V4L ? "hp2__row--3" : ""}">` +
          (V4L ? `<button class="hp2__plaque hp2__plaque--dark" id="autoeq">${text("label", "Auto Equip")}</button>${v4TuaPlate([id], "tua")}<button class="hp2__plaque hp2__plaque--dark" id="bag">${text("label", `Bag ${S().bag.length}/${DD.BAG_MAX}`)}</button></div>`
            : `<button class="hp2__plaque" id="autoeq">${text("label", "Auto Equip")}</button><button class="hp2__plaque" id="bag">${text("label", `Bag ${S().bag.length}/${DD.BAG_MAX}`)}</button></div>`)
        : cream(`Recruit ${esc(h.short)} to give ${esc(h.short)} equipment.`, "hp2__note"))
      : tabNow === "stats"
        ? `<div class="hp2__cards">` +
          `<div class="hcard">${text("tag", "Level")}${text("number", has ? "Lv " + lv : "—")}${own ? `<span class="hp__pips" aria-label="Levels ${block + 1} to ${block + DD.LV_BLOCK}">${pips}</span>${cream(`Cards ${cards}/${DD.BREAK_CARDS}`)}` : cream(has ? "Trial" : "Recruit")}</div>` +
          (v4s ? `<div class="hcard">${text("tag", "Power")}${text("number", DD.fmt(v4s.power(lv)))}${cream(esc(v4s.tier))}${cream(esc(v4s.band))}</div>` +
            `<div class="hcard">${text("tag", "HP")}${text("number", DD.fmt(hpAt(lv)))}${cream(esc(v4s.hpNote))}</div></div><div class="hp2__next">${cream(esc(v4s.line), "hp__next")}</div>`
          : `<div class="hcard">${text("tag", "Damage")}${text("number", DD.fmt(dmgAt(lv)))}${cream(`${esc(h.target)} · ${w.cd ? "every " + w.cd + "s" : esc(h.rhythm || "Continuous")}`)}</div>` +
          `<div class="hcard">${text("tag", "HP")}${text("number", DD.fmt(hpAt(lv)))}${cream(m.lv6 ? "Evolved" : `Evo at Lv ${DD.MAIN_LV}`)}</div></div>`) +
          (has && !own ? cream("On loan: get this hero's card to keep it and level it up.", "hp2__note") : "") +
          (next ? `<div class="hp2__next">${next}</div>` : "") +
          sec("Level steps", steps.map(([at, t]) => `<div class="lvrow ${has && lv >= at ? "is-on" : ""}">${text("label", "Lv " + at)}${cream(t)}</div>`).join("") +
            `<div class="lvrow ${has && lv > DD.MAIN_LV ? "is-on" : ""}">${text("label", "Lv " + (DD.MAIN_LV + 1) + "+")}${cream("Every level: more Damage, Speed and Crit, without end.")}</div>`, "Lv 1–20 hold the big steps")
        : sec("Attack", cream(`<b>${esc(h.weapon)}.</b> ${esc(h.tech)}`, "hsheet__tech") + cream(esc(h.role), "hsheet__tech")) +
          sec("Element", (h.els || [h.el]).length > 2 ? cream(`Hits with whichever of its ${h.els.length} elements the dragon is weakest to: ${h.els.map((e) => DD.ELEMENT_NAME[e]).join(", ")}.`, "hsheet__tech") // C46: Pell
            : (h.els || [h.el]).map((e) => cream(esc(DD.ELEMENT_LINE[e]), "hsheet__tech")).join("")) +
          // C45 (user no. 94: "aku ga ngerti skill level itu apa?"): the hero's C43 cards, counted as cards, not as a "skill level"
          sec("Battle cards", (h.cards || []).filter((c) => c.type === "skill").map((c) => {
            const v = (x) => (c.pct ? "+" + DD.pct(x) : c.unit ? `+${x} s` : "+" + x);
            return `<div class="uprow">${text("label", esc(c.name))}${cream(["rare", "epic", "legendary"].filter((t) => c.tiers[t] !== undefined).map((t) => `${DD.TIER_NAME[t]} ${v(c.tiers[t])}`).join(" · "))}${text("tag", c.cap === null || c.cap === undefined ? "No limit" : "MAX " + v(c.cap), "uprow__max")}</div>`; }).join("") +
            cream(`Each level-up in a battle offers 3 cards; the one you pick powers up one hero. A hero takes at most ${DD.SKILL_MAX} cards in one battle.`, "hsheet__note"), "From Dragon Pearls") +
          sec("Unique, Mythic and Evo Cards", (h.cards || []).filter((c) => c.type !== "skill").map((c) =>
            `<div class="lvrow ${has && lv >= c.lv ? "is-on" : ""}">${text("label", { unique: "Unique", mythic: "Mythic", evo: "Evo" }[c.type])}${cream(`<b>${esc(c.name)}</b> (${DD.TIER_NAME[c.tier]}, from hero Lv ${c.lv}): ${esc(c.text)}`)}</div>`).join("") +
            cream(`Evo Cards can show once the hero has ${DD.EVO_FROM} cards in the battle. From Lv ${DD.MAIN_LV} the hero starts every battle with its first Evo Card.`, "hsheet__note"));
    // the foot: the party on the left, the main action on the right (photo 2's START BATTLE)
    const partyBtn = has ? `<button class="hp2__plaque hp2__plaque--dark" id="join">${text("label", inF ? "Leave Party" : "Join Party")}</button>` : "";
    const main = !own ? `<button class="hp2__plaque hp2__cta" id="go-rec">${text("label", "Recruit")}</button>`
      : c.brk ? `<button class="hp2__plaque hp2__cta hp2__cta--long ${P.canLv(id) ? "" : "is-poor"}" id="lvup">${text("label", `Unlock Lv ${cap + 1}–${cap + DD.LV_BLOCK}`)}<span class="plq__cost">${icon(`heroes/${id}/bust.webp`, "in-ic")}${text("label", `${cards}/${c.shards} cards`)}</span></button>`
      : `<button class="hp2__plaque hp2__cta ${P.canLv(id) ? "" : "is-poor"}" id="lvup">${text("label", "Lv Up")}<span class="plq__cost">${coin}${text("label", DD.fmtCost(c.coins))}</span></button>`;
    const leadBit = has && inF ? (isLead ? `<span class="hp2__lead">${text("tag", "Lead")}</span>` : `<button class="hp2__lead hp2__lead--btn" id="lead">${text("tag", "Make Lead")}</button>`) : "";
    shell(
      `<div class="hp2 ${has ? "" : "hp2--locked"}">` +
      `<div class="hp2__scene"><img class="hp2__bg" src="${A(`2a/bg/${h.el}.webp`)}" onerror="this.onerror=null;this.src='${A(DD.skinHall(h.el).src)}'" alt="">` +
      `<img class="hp2__hero" src="${A(`2a/heroes/profile_${id}.webp`)}" onerror="this.onerror=null;this.classList.add('is-fig');this.src='${A(`heroes/${id}/stand.webp`)}'" alt="" draggable="false"><span class="hp2__shade"></span>` +
      `<div class="hp2__head"><button class="hp2__round" id="back" aria-label="Back to Heroes">${glyph("prev")}</button>` +
      `<div class="hp2__title"><div class="hp2__plate ${h.name.length > 14 ? "hp2__plate--long hp2__plate--xl" : h.name.length > 11 ? "hp2__plate--long" : ""}">${text("title", esc(h.name), "hp2__name")}</div>${cream(`${DD.TIER_NAME[h.tier]} · ${(h.els || [h.el]).length > 2 ? h.els.length + " elements" : (h.els || [h.el]).map((e) => DD.ELEMENT_NAME[e]).join(" + ")} · ${DD.WEAPON_TYPES[DD.HERO_WEAPON[id]] || "—"}`, "hp2__line")}${has ? "" : `<span class="hp2__locked">${icon(IC.lock, "in-ic")}${text("tag", "Locked")}</span>`}</div>` +
      `<div class="hp2__side">${has ? `<span class="hp2__pow">${text("tag", "Power")}${text("number", DD.fmt(P.heroPowerFull(id)))}</span>` : ""}${leadBit}</div></div>` +
      `<button class="hp2__round hp2__nav hp2__nav--l" id="hprev" aria-label="Previous hero">${glyph("prev")}</button><button class="hp2__round hp2__nav hp2__nav--r" id="hnext" aria-label="Next hero">${glyph("prev")}</button></div>` +
      `<div class="hp2__tray"><div class="hp2__tabs" role="tablist">${[["equip", "Equipment"], ["stats", "Stats"], ["skill", "Skill"]].map(([k, l]) =>
        `<button class="hp2__tab ${tabNow === k ? "is-on" : ""} ${!has && k !== "stats" ? "is-locked" : ""}" role="tab" aria-selected="${tabNow === k}" aria-disabled="${!has && k !== "stats"}" data-htab="${k}">${!has && k !== "stats" ? icon(IC.lock, "hp2__tlock") : ""}${text("label", l)}</button>`).join("")}</div>` +
      `<div class="hp2__panel"><div class="hp2__body">${body}</div></div>` +
      `<div class="hp2__foot ${partyBtn ? "" : "hp2__foot--solo"}">${partyBtn}${main}</div></div></div>`,
      "lobby--heroes lobby--hero lobby--hero2"
    );
    // a hero page opens at its top; Back returns to the place in the list (2026-11-02)
    if (app.dataset.hero !== id) { app.querySelector(".page").scrollTop = 0; app.dataset.hero = id; }
    app.querySelector("#back").onclick = () => { heroView = null; delete app.dataset.hero; render(); app.querySelector(".page").scrollTop = listScroll; };
    // swipe left / right (or the two arrows beside the figure) = the next / previous hero in the list order (2026-11-02, user:
    // "hero profile bisa swipe kanan kiri buat lihat hero lainnya")
    const order = heroOrder(), at = order.indexOf(id);
    const go = (d) => { const n = order[(at + d + order.length) % order.length]; if (!n || n === id) return; heroDir = d; heroView = n; render(); };
    app.querySelector("#hprev").onclick = () => go(-1);
    app.querySelector("#hnext").onclick = () => go(1);
    const hpEl = app.querySelector(".hp2");
    let sx = null, sy = 0;
    hpEl.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; });
    hpEl.addEventListener("pointerup", (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
    });
    if (heroDir) { hpEl.classList.add(heroDir > 0 ? "hp2--in-r" : "hp2--in-l"); heroDir = 0; }
    app.querySelectorAll("[data-htab]").forEach((b) => (b.onclick = () => {
      if (b.classList.contains("is-locked")) return DD.toast(`Locked: recruit ${h.short} to open ${b.textContent}`);
      if (heroTab !== b.dataset.htab) { heroTab = b.dataset.htab; render(); }
    }));
    const q = (s) => app.querySelector(s);
    if (q("#go-rec")) q("#go-rec").onclick = () => { if (!P.unlocked("recruit")) return lockNote("Clear Stage " + DD.UNLOCK.recruit); heroView = null; tab = "shop"; shopTab = "heroes"; render(); };
    if (q("#join")) q("#join").onclick = () => {
      const r = P.toggleFormation(id);
      if (r === "full") return DD.toast(`Party full (${P.slots()}): remove a hero first`);
      if (r === "last") return DD.toast("The party needs one hero");
      render();
    };
    if (q("#lead")) q("#lead").onclick = () => { P.setLead(id); DD.toast(`${h.short} is the Lead: opens the battle alone on the wall`); render(); };
    if (q("#lvup")) q("#lvup").onclick = () => {
      const cc = P.lvCost(id);
      if (P.shards(id) < cc.shards) return DD.toast(`Needs ${cc.shards} cards of ${h.short}`);
      if (S().coins < cc.coins) return DD.toast(`Needs ${DD.fmtCost(cc.coins)} coins`);
      const r = P.levelUp(id);
      if (r === "break") { snd("lv_unlock"); DD.toast(`Lv ${P.cap(id) - DD.LV_BLOCK + 1}–${P.cap(id)} unlocked`); }
      else if (DD.sfx(`audio/roar_${id}.mp3`, 0.6, true)) snd("level_up"); // no. 110: the hero's sound and the chime once, never stacked
      render();
    };
    // C29 D: the hero's own pieces
    app.querySelectorAll(".hp2__slot").forEach((b) => (b.onclick = () => (V4L ? v4Piece({ slot: b.dataset.slot, hid: id }) : slotSheet(b.dataset.slot, id))));
    if (V4L && q("#tua")) q("#tua").onclick = () => v4TuaGo([id], h.short);
    if (q("#autoeq")) q("#autoeq").onclick = () => { const n = P.equipAll(id); if (n) snd("equip"); DD.toast(n ? `${h.short}: ${n} better piece${n === 1 ? "" : "s"} on` : "Nothing better in the bag"); render(); };
    if (q("#bag")) q("#bag").onclick = () => bagSheet(id);
  }
  function recruitSheet() {
    sheet({
      title: () => "Recruit",
      cls: "recsheet",
      body: () => {
        const s = S(), lv = P.recruitLv(), bar = P.recruitBar(), odds = P.recruitOdds();
        const d = s.recruit.desired;
        return `<div class="tav">${text("label", V4E ? "Recruit" : "Recruit Lv " + lv)}` +
          (V4E ? cream(`Odds for ${v4Band()}`) : bar ? `<div class="tav__lvbar"><div style="width:${(bar.have / bar.need) * 100}%"></div>${text("tag", `${bar.have}/${bar.need}`)}</div>` : text("tag", "MAX")) +
          `<div class="tav__odds">${DD.RECRUIT_TIERS.map((t, i) => `<span class="odd odd--${t}">${text("tag", `${DD.TIER_NAME[t]} ${+(odds[i] * 100).toFixed(1)}%`)}</span>`).join("")}</div>` +
          `<div class="tav__pack">${icon("shop/shop_tile_premium.webp", "tav__tile")}${icon(IC.ticket, "tav__art")}</div>` +
          (V4E ? v4Pity() + v4WishBtn("want", "tav__want") : `<button class="tav__want" id="want">${d ? pic(d) : `<span class="pic pic--empty"></span>`}${text("tag", "Desired Hero")}</button>`) +
          `<div class="reward">${res(IC.ticket, s.tickets)}${res(IC.gem, DD.fmt(s.gems))}</div></div>`;
      },
      actions: () => {
        const c1 = P.recruitCost(1), c10 = P.recruitCost(10);
        const lab = (c) => (c.tickets ? icon(IC.ticket, "in-ic") + text("label", c.tickets) : "") + (c.gems ? gem + text("label", DD.fmtCost(c.gems)) : "");
        return btn({ v: "secondary", id: "r1", label: "×1", icon: lab(c1), cls: S().gems >= c1.gems ? "" : "gk-btn--poor" }) +
          btn({ v: "primary", id: "r10", label: "×10", icon: lab(c10), cls: S().gems >= c10.gems ? "" : "gk-btn--poor" });
      },
      bind: (sh, re) => {
        const pull = (n) => {
          const r = P.recruit(n);
          if (!r) return DD.toast("Not enough gems");
          snd("pull");
          showPulls(r, re);
        };
        sh.querySelector("#r1").onclick = () => pull(1);
        sh.querySelector("#r10").onclick = () => pull(10);
        sh.querySelector("#want").onclick = () => (V4E ? v4WishSheet(re) : pickHero("Desired Hero", DD.RECRUIT_POOL.map((h) => h.id), (id) => { P.setDesired(id); re(); }));
      },
    });
  }
  function pickHero(title, ids, done) {
    const sh = sheet({
      title: () => title,
      body: () => `<div class="hgrid hgrid--pick">${ids.map((id) => heroCard(id)).join("")}</div>`,
      bind: (el, re, close) => el.querySelectorAll(".hc").forEach((b) => (b.onclick = () => { close(); done(b.dataset.id); })),
    });
    return sh;
  }
  function showPulls(list, after, title) {
    // C35 (user no. 79: "ANIMASI PADA SAAT BUKA KARTU TERLALU JELEK.. HANYANYA JUGA SANGAT JELEK.. SEMUA KASAR.."): the card
    // opening lives in js/reveal.js (painted lights, one clock, skippable)
    if (DD.SKIN && DD.revealPulls) return DD.revealPulls(list, { title: title || "Recruit", A, text, cream, esc, snd, sfx: (f, v) => DD.sfx(f, v), done: () => { after(); render(); } });
    const m = modal({
      title: title || "Recruit",
      cls: "pulls",
      body: `<div class="pgrid">${list.map((x, i) => `<span class="pcard" style="animation-delay:${i * 70}ms">${pic(x.id)}${x.result === "new" ? `<span class="pcard__new">${text("tag", "New")}</span>` : ""}${text("tag", esc(DD.HERO[x.id].short), "tier-" + x.tier)}</span>`).join("")}</div>`,
      actions: btn({ v: "primary", label: "OK", id: "ok" }),
    });
    const big = list.find((x) => x.tier === "mythic") || list.find((x) => x.tier === "legendary");
    // C28 F: the best card of the pull is announced (Rare a chime, Epic three notes, Legendary and Mythic the trumpet)
    const best = ["mythic", "legendary", "epic", "rare"].find((t) => list.some((x) => x.tier === t));
    if (best) setTimeout(() => snd("reveal_" + best), 350);
    if (big) DD.sfx(`audio/roar_${big.id}.mp3`, 0.6);
    m.querySelector("#ok").onclick = () => { m.remove(); after(); render(); };
  }

  /* ================================================================ Party (C21): Party Level, the Lead, the party's status, Training.
     2026-10-31 (user: "di party hanya party dan traning, lead dan status ... artifacts di bawah party harusnya punya halaman sendiri"):
     no hero portraits and no artifacts here; the artifacts have their own tab. */
  /* C27 F: the Party tab has two tabs, Party and Equipment (user: "ganti artifact jadi equipment. dan gabungkan dengan party. dengan tab
     baru"); the big Lead figure left the Party tab (user: "kenapa leader muncul di party, dan imagenya besar") and stands on the
     Equipment tab, where it wears the pieces. */
  let partyView = "party";
  // C29 D: one view only; the equipment moved to each hero's page (user no. 68/69)
  const ptabs = () => "";
  const bindPtabs = () => app.querySelectorAll("[data-pv]").forEach((b) => (b.onclick = () => { partyView = b.dataset.pv; render(); }));
  function showParty() {
    const s = S(), t = P.party(), lead = P.formation()[0];
    // eight attributes always (zero ones dim, so the player learns what exists); Boss DMG and the elements as chips once there
    const keys = ["atk", "hp", "crit", "critDmg", "haste", "area", "dur", "proj"];
    const els = Object.entries(t.el).filter(([, v]) => v > 0);
    const need = DD.PL_EXP(s.pl.lv);
    shell(
      // the Party Level and its EXP bar sit under the page title (C21: every level adds party ATK and HP)
      pageHead("Party", null, `<button class="cmd3__lv" id="plv">${text("label", "Lv " + s.pl.lv, "cmd3__lvn")}<span class="cmd3__lvbar"><span style="width:${Math.min(100, (s.pl.exp / need) * 100)}%"></span>${text("tag", `EXP ${DD.fmt(s.pl.exp)} / ${DD.fmt(need)}`)}</span></button>`) +
      `<div class="cmd3 party">` +
      `<div class="cmd3__board">` +
      ptabs() +
      `<div class="cmd3__power">${text("tag", "Party Power")}${text("number", DD.fmt(P.power()))}</div>` +
      // status: icon, the value big and white, the name small and cream
      `<div class="attrs">${keys.map((k) => `<button class="attr ${t[k] || k === "hp" || (k === "atk" && DD.V4) ? "" : "is-zero"}" data-k="${k}">${icon(DD.ATTR[k].icon)}${text("number", k === "hp" ? DD.fmt(P.wallHP()) : k === "atk" && DD.V4 ? DD.fmt(DD.v4.atkShown(t[k])) : attrVal(k, t[k]), "attr__v")}${cream(DD.ATTR[k].name, "attr__n")}</button>`).join("")}</div>` +
      (els.length || t.boss ? `<div class="cmd3__extra">${t.boss ? `<span class="hchip">${cream("Head DMG")}${text("label", "+" + DD.pct(t.boss))}</span>` : ""}${els.map(([e, v]) => `<span class="hchip">${elTag(e)}${text("label", "+" + DD.pct(v))}</span>`).join("")}</div>` : "") +
      `</div>` +
      (P.unlocked("training") ? (V4L ? v4TrainPanel() : trainPanel()) : btn({ v: "locked", label: "Training", id: "train", cls: "cmd3__enh" })) +
      `</div>`,
      "lobby--kael"
    );
    app.querySelectorAll(".attr").forEach((b) => (b.onclick = () => DD.toast(`${DD.ATTR[b.dataset.k].name}: ${ATTR_LINE[b.dataset.k]}`)));
    app.querySelector("#info").onclick = () => showInfo("party");
    app.querySelector("#plv").onclick = () => DD.toast(V4L ? "Every Party Level: ATK ×1.012 (×1.008 from Lv 100) and 10 energy. Win battles for EXP" : `Every Party Level: ATK +${DD.pts("atk", DD.PARTY_LV.atk)}, Wall HP +${DD.PARTY_LV.hpFlat}. Win battles for EXP`);
    bindPtabs();
    if (!P.unlocked("training")) app.querySelector("#train").onclick = () => lockNote("Clear Stage " + DD.UNLOCK.training);
    else if (V4L) v4BindTraining();
    else bindTraining();
  }

  /* ================================================================ Artifacts (2026-10-31, user: "artifacts di bawah party harusnya punya
     halaman sendiri di dungeon ... pada yang ter equip, besar kotak artifact, sama dengan artifacts list"; then "referensi sudah ku suruh
     cari, tapi hasil ga berubah"): the Dragon Fever Commander screen (docs/riset/layar-kunci-dragon-fever.jpg): the Lead on a framed
     stage with three slots on each side, Enchant and Collection as round buttons beside Power on its ribbon, Level Up All under it,
     then the bag panel with Equip All and Disassemble in its head. Worn slots and bag tiles share one size. */
  function showEquipment() {
    const s = S(), lead = P.formation()[0];
    const bag = s.bag.slice().sort((a, b) => P.artScore(b) - P.artScore(a));
    const slot = (sl) => `<button class="eslot" data-slot="${sl.id}">${gearTile(s.equipped[sl.id], { slotName: sl.name, slotId: sl.id, lv: s.slotLv[sl.id] })}</button>`;
    shell(
      pageHead("Party") + ptabs() +
      `<div class="arts">` +
      `<div class="cmd3__board arts__board">` +
      `<div class="arts__stage"><div class="arts__col">${DD.SLOTS.slice(0, 3).map(slot).join("")}</div>` +
      `<div class="arts__hero">${icon("dd/cmd_pedestal.webp", "arts__pedestal")}<img class="arts__fig" src="${A(`heroes/${lead}/${DD.SKIN ? "stand" : "figure"}.webp`)}" alt=""></div>` +
      `<div class="arts__col">${DD.SLOTS.slice(3).map(slot).join("")}</div></div>` +
      `<div class="arts__lead">${text("label", esc(DD.HERO[lead].short))}<span class="lead-tag">${text("tag", "Lead")}</span>${cream("fights with a " + DD.WEAPON_TYPES[DD.HERO_WEAPON[lead]])}</div>` +
      `<div class="arts__foot arts__foot--solo"><div class="arts__mid"><div class="arts__power">${icon("lair/banner_gold.webp", "arts__ribbon")}${text("tag", "Power")}${text("number", DD.fmt(P.power()))}</div>` +
      btn({ v: "primary", size: "sm", label: "Level Up All", id: "enh" }) + `</div>` +
      `</div>` +
      `</div>` +
      // the bag panel: its head (title + count left, Equip All and Disassemble right), the wallet, the tiles
      `<div class="arts__bag"><div class="arts__bagh">${text("number", "Bag")}${text("tag", `${s.bag.length}/${DD.BAG_MAX}`)}` +
      `<span class="arts__bagb">${btn({ v: "secondary", size: "sm", label: "Equip All", id: "eqall" })}${btn({ v: "danger", size: "sm", label: "Disassemble", id: "dis" })}</span></div>` +
      `<div class="arts__bar">${res(ore, s.ore)}${P.unlocked("enchant") ? res(IC.stone, s.stones) : ""}</div>` +
      (bag.length ? `<div class="ggrid">${bag.map((g) => gearTile(g, { data: `data-uid="${g.uid}"`, cls: "gear--btn", better: !s.equipped[g.slot] || P.artScore(g) > P.artScore(s.equipped[g.slot]) })).join("")}</div>` : `<div class="cmd__none">${cream("Equipment comes from the Equipment Chest in the Shop and from a Dragon Chest after a win.")}</div>`) +
      `</div></div>`,
      "lobby--kael"
    );
    app.querySelectorAll(".eslot").forEach((b) => (b.onclick = () => slotSheet(b.dataset.slot)));
    app.querySelectorAll(".ggrid .gear--btn").forEach((b) => (b.onclick = () => gearSheet(+b.dataset.uid)));
    app.querySelector("#info").onclick = () => showInfo("equipment");
    bindPtabs();
    app.querySelector("#eqall").onclick = () => { const n = P.equipAll(); if (n) snd("equip"); DD.toast(n ? `Equipped ${n}` : "Nothing better"); render(); };
    app.querySelector("#enh").onclick = () => { const n = P.oneClickEnhance(); if (n) snd("forge"); DD.toast(n ? `Slots +${n} level${n === 1 ? "" : "s"}` : "Needs coins and Forge Ore"); render(); };
    app.querySelector("#dis").onclick = () => { const o = P.disassembleWeaker(); if (o) snd("salvage"); DD.toast(o ? `+${o} Forge Ore` : "Nothing weaker to break"); render(); };
  }
  function slotSheet(slotId, hid) {
    hid = hid || P.formation()[0];
    const sl = DD.SLOT[slotId], worn = () => P.gearOf(hid)[slotId];
    sheet({
      centre: true,
      cls: "gbox",
      title: () => (worn() ? DD.artName(worn()) : sl.name + " slot"),
      body: () => {
        const s = S(), g = worn(), lv = s.slotLv[slotId] || 0, c = P.enhanceCost(slotId), st = EQ_LAB[sl.stat];
        const cands = s.bag.filter((x) => x.slot === slotId && P.fits(x, hid)).sort((a, b) => P.artScore(b) - P.artScore(a));
        return `<div class="gbox__top">${gearTile(g, { slotName: sl.name, slotId: slotId })}<div class="gbox__facts">` +
          (g ? text("label", `${DD.GEAR_RARITY_NAME[DD.GEAR_RARITY[g.r]]} · Tier ${g.tier}`, "tier-" + DD.GEAR_RARITY[g.r]) + cream(`${g.type ? DD.WEAPON_TYPES[g.type] : sl.name} · gives ${esc(DD.HERO[hid].short)} ${st}`) : text("label", "Empty") + cream(slotId === "weapon" ? `${esc(DD.HERO[hid].short)} wears a ${DD.WEAPON_TYPES[DD.HERO_WEAPON[hid]]}` : `Gives ${esc(DD.HERO[hid].short)} ${st}`)) +
          `</div></div>` + pieceRows(g) +
          `<div class="gbox__row">${text("tag", "Slot level")}${text("label", `Lv ${lv} · ${st} ${eqNum(sl.stat, lv * DD.SLOT_LV_VALUE[sl.stat])}`)}</div>` +
          `<div class="gbox__row">${text("tag", "Next level")}<span class="gbox__cost">${coin}${text("label", DD.fmtCost(c.coins))}${icon(IC.ore, "in-ic")}${text("label", String(c.ore))}</span></div>` +
          (cands.length ? `<div class="gbox__sect">${text("tag", "Tap to wear")}</div><div class="ggrid ggrid--sheet">${cands.map((x) => gearTile(x, { data: `data-uid="${x.uid}"`, cls: "gear--btn", better: !g || P.artScore(x) > P.artScore(g) })).join("")}</div>` : "");
      },
      actions: () => (worn() ? btn({ v: "neutral", label: "Remove", id: "un1" }) : "") + btn({ v: "success", label: "Level Up", id: "en1", cls: P.canEnhance(slotId) ? "" : "gk-btn--poor" }),
      bind: (sh, re, close) => {
        sh.querySelector("#en1").onclick = () => { if (!P.enhance(slotId)) return DD.toast("Needs coins and Forge Ore"); snd("forge"); P.save(); re(); render(); };
        bindPiece(sh, re);
        sh.querySelectorAll(".gear--btn").forEach((b) => (b.onclick = () => { P.equip(+b.dataset.uid, hid); snd("equip"); re(); render(); }));
        const un = sh.querySelector("#un1");
        if (un) un.onclick = () => { const r = P.unequip(hid, slotId); if (r === "full") return DD.toast("Bag full: disassemble something first"); snd("unequip"); re(); render(); };
      },
    });
  }
  /** C29 D: the whole bag from a hero's page: tap a piece = compare with what this hero wears; Disassemble weaker clears the rest. */
  let bagSlot = "all"; // C32 G7: the Bag's slot filter
  function bagSheet(hid) {
    // C32 G7 (user no. 74: "saat back di buka, buat ui yang lebih baik, itu jelek dan parah banget", read as the Bag): the count
    // bar and the two materials, a slot filter, 4:5 framed pieces (picture, number, label, stars; the ones this hero cannot wear
    // dimmed), an empty bag that says where pieces come from
    sheet({
      title: () => "Bag",
      cls: "bagsheet",
      body: () => {
        const all = S().bag.slice().sort((a, b) => P.artScore(b) - P.artScore(a));
        const bag = bagSlot === "all" ? all : all.filter((g) => g.slot === bagSlot);
        const tile = (g) => { const sl = DD.SLOT[g.slot], fits = P.fits(g, hid), up = fits && P.artScore(g) > P.artScore(P.gearOf(hid)[g.slot]);
          return `<button class="btile gfc gfc--g-${DD.GEAR_RARITY[g.r]} ${fits ? "" : "is-off"}" data-uid="${g.uid}">${up ? `<span class="gear__up" aria-label="Better than worn"></span>` : ""}` +
            `<span class="gfc__win btile__win"><span class="btile__art">${icon(DD.eqArt(g), "btile__ic")}</span>${text("tag", "T" + (V4L ? V4L.rt(g).t : g.tier), "btile__tier")}${V4L && V4L.isTwin(g) ? `<span class="v4pair" aria-label="Twin of a worn piece"></span>` : ""}</span>` +
            (V4L ? text("number", v4Pts(g), "btile__val") + cream("ATK", "btile__lab") : text("number", eqNum(sl.stat, P.gearStat(g)), "btile__val") + cream(EQ_LAB[sl.stat], "btile__lab")) + `</button>`; };
        return `<div class="bag__top"><div class="bag__cap">${text("label", `${S().bag.length}/${DD.BAG_MAX}`)}<span class="bag__bar"><span style="width:${Math.min(100, (S().bag.length / DD.BAG_MAX) * 100)}%"></span></span></div>` +
          `<div class="bag__mats">${V4L ? res(IC.stone, DD.fmt(S().stones || 0)) + cream("Fuse Stones") : res(ore, S().ore) + (P.unlocked("enchant") ? res(IC.stone, S().stones) : "")}</div></div>` +
          `<div class="bag__f">${[["all", "All"], ...DD.SLOTS.map((x) => [x.id, x.name])].map(([k, l]) => `<button class="bag__fb ${bagSlot === k ? "is-on" : ""}" data-bf="${k}">${text("tag", l)}</button>`).join("")}</div>` +
          (bag.length ? `<div class="bag__grid">${bag.map(tile).join("")}</div>`
            : `<div class="bag__empty">${icon(DD.SKIN ? "2a/it_artchest.webp" : IC.chest, "bag__emptyart")}${text("label", all.length ? "Nothing in this slot" : "The bag is empty")}${cream("Equipment comes from the Equipment Chest in the Shop.")}</div>`);
      },
      actions: () => `<button class="hp2__plaque hp2__plaque--dark" id="dis">${text("label", V4L ? "Disassemble spares" : "Disassemble weaker")}</button><button class="hp2__plaque" id="toshop">${text("label", "Shop")}</button>`,
      bind: (sh, re, close) => {
        sh.querySelectorAll(".btile").forEach((b) => (b.onclick = () => (V4L ? v4Piece({ uid: +b.dataset.uid, hid }) : gearSheet(+b.dataset.uid, hid))));
        sh.querySelectorAll("[data-bf]").forEach((b) => (b.onclick = () => { bagSlot = b.dataset.bf; re(); }));
        sh.querySelector("#dis").onclick = () => {
          if (V4L) { // v4 B4: the spares only (never a twin of a worn piece); the rarest one is named first (G9 §4.4)
            const sp = V4L.spares(); if (!sp.length) return DD.toast("No spare pieces: every piece is better for someone or a twin");
            const k = sp.reduce((a, g) => a + V4L.dust(g), 0), top = sp.reduce((a, g) => (g.r > a.r ? g : a), sp[0]);
            const m = modal({ title: "Disassemble spares", body: cream(`Break <em>${sp.length}</em> spare piece${sp.length === 1 ? "" : "s"} (the rarest: ${esc(DD.artName(top))}, ${v4Rar(top)}) into <em>${k}</em> Fuse Stones?`),
              actions: btn({ v: "neutral", label: "Cancel", id: "v4sc" }) + btn({ v: "danger", label: "Disassemble", id: "v4so" }) });
            m.querySelector("#v4sc").onclick = () => m.remove();
            m.querySelector("#v4so").onclick = () => { m.remove(); P.disassembleWeaker(); snd("salvage"); DD.toast(`+${k} Fuse Stones`); re(); render(); };
            return;
          }
          const o = P.disassembleWeaker(); if (o) snd("salvage"); DD.toast(o ? `+${o} Forge Ore` : "Nothing weaker to break"); re(); render(); };
        sh.querySelector("#toshop").onclick = () => { close(); heroView = null; tab = "shop"; shopTab = "chests"; render(); };
      },
    });
  }
  function gearSheet(uid, hid) {
    hid = hid || P.formation()[0];
    const g = S().bag.find((x) => x.uid === uid);
    if (!g) return;
    const sl = DD.SLOT[g.slot], cur = P.gearOf(hid)[g.slot], fits = P.fits(g, hid);
    const st = EQ_LAB[sl.stat], now = cur ? P.gearStat(cur) : 0, mine = P.gearStat(g), diff = mine - now;
    const sh = sheet({
      centre: true,
      cls: "gbox",
      title: () => DD.artName(g),
      body: () => text("tag", `${DD.GEAR_RARITY_NAME[DD.GEAR_RARITY[g.r]]} ${g.type ? DD.WEAPON_TYPES[g.type] : sl.name} · Tier ${g.tier} · gives ${EQ_LAB[sl.stat]}`, "tx-sub namesub") + `<div class="gbox__cmp"><div class="gbox__side">${text("tag", "Worn")}${gearTile(cur, { slotName: sl.name, slotId: g.slot })}${affRows(cur)}</div>` +
        `<span class="gbox__arrow"></span>` +
        `<div class="gbox__side">${text("tag", "This")}${gearTile(g)}</div></div>` +
        `<div class="gbox__delta ${diff >= 0 ? "is-up" : "is-down"}">${text("number", `${st} ${diff >= 0 ? "+" : "−"}${DD.fmt(sl.stat === "hp" ? Math.abs(diff) : Math.abs(diff) * 1000)}`)}</div>` + pieceRows(g) +
        (P.artScore(g) > P.artScore(cur) ? `<div class="gbox__verdict">${text("label", "Better overall")}</div>` : "") +
        `<div class="gbox__row">${text("tag", "Rarity")}${text("label", `${DD.GEAR_RARITY_NAME[DD.GEAR_RARITY[g.r]]} · Tier ${g.tier}`, "tier-" + DD.GEAR_RARITY[g.r])}</div>` +
        `<div class="gbox__row">${text("tag", "Disassemble")}<span class="gbox__cost">${icon(IC.ore, "in-ic")}${text("label", "+" + DD.DISASSEMBLE_ORE[g.r] * g.tier)}</span></div>`,
      actions: () => btn({ v: "neutral", label: "Disassemble", id: "d" }) + btn({ v: "primary", label: "Equip", id: "e", cls: fits ? "" : "gk-btn--poor" }),
      bind: (el, re, close) => {
        el.querySelector("#e").onclick = () => { if (!fits) return DD.toast(`Not for ${DD.HERO[hid].short}: needs a hero with a ${DD.WEAPON_TYPES[g.type]}`); P.equip(uid, hid); snd("equip"); close(); render(); };
        el.querySelector("#d").onclick = () => { P.disassemble(uid); snd("salvage"); close(); render(); };
        bindPiece(el, re);
      },
    });
    return sh;
  }
  /** Party Training (C21, Cell Survivor's pattern): three lines bought with coins; all three at the cap open a Rank Up and
      its party perk. On the Party page itself (2026-11-02, user: "pada training. tombolnya seharusnya langsung di page. jadi tidak
      perlu buka box baru"): a head (Training, Rank, Train All or Rank Up) and one cell per line; tap a cell = +1 level. */
  const perkText = (p) => Object.entries(p || {}).map(([k, v]) => `${DD.ATTR[k].name} ${attrVal(k, v)}`).join(", ");
  function trainPanel() {
    const s = S(), tr = s.training, cap = P.trainCap();
    return `<div class="trn3 ${P.isNew("training") ? "has-new" : ""}">` +
      `<div class="trn3__head"><button class="trn3__rank" id="trank">${text("label", "Training")}${text("tag", `Rank ${tr.rank}/${DD.RANKS.length}`)}</button>` +
      (P.canRank() ? btn({ v: "special", size: "sm", id: "rank", label: "Rank Up", cls: "trn3__act has-dot" }) : btn({ v: "primary", size: "sm", id: "tall", label: "Train All", cls: "trn3__act" })) + `</div>` +
      `<div class="trn3__cells">` + DD.TRAIN.map((l) => {
        const lv = tr[l.id], max = lv >= cap, cost = P.trainCost(l.id);
        return `<button class="trn3__c ${max ? "is-max" : s.coins >= cost ? "" : "is-poor"}" data-id="${l.id}" aria-label="Train ${DD.ATTR[l.id].name}">` +
          `<span class="trn3__top">${icon(DD.ATTR[l.id].icon, "trn3__ic")}${cream(DD.ATTR[l.id].name, "trn3__n")}${text("number", "+" + DD.fmt(DD.trainPts(l.id, lv)), "trn3__v")}</span>` +
          `<span class="trn__bar"><span style="width:${(lv / cap) * 100}%"></span></span>` +
          `<span class="trn3__foot">${text("tag", `Lv ${lv}/${cap}`)}<span class="trn3__cost">${max ? text("tag", "Cap") : coin + text("label", DD.fmtCost(cost))}</span></span></button>`;
      }).join("") + `</div></div>`;
  }
  function bindTraining() {
    const done = () => { P.seeNew("training"); render(); };
    app.querySelectorAll(".trn3__c").forEach((b) => (b.onclick = () => {
      const id = b.dataset.id;
      if (S().training[id] >= P.trainCap()) return DD.toast(P.canRank() ? "Rank Up first" : `${DD.ATTR[id].name} is at Lv ${P.trainCap()}: train the other two to Rank Up`);
      if (!P.train(id)) return DD.toast("Not enough coins");
      snd("train");
      done();
    }));
    app.querySelector("#trank").onclick = () => {
      const tr = S().training;
      DD.toast(`Rank ${tr.rank + 1}: all three at Lv ${P.trainCap()} · ${perkText(DD.rankPerk(tr.rank))}`);
    };
    const r = app.querySelector("#rank");
    if (r) r.onclick = () => { P.rankUp(); snd("rank_up"); DD.toast(`Rank ${S().training.rank} · ${perkText(DD.rankPerk(S().training.rank - 1))}`); done(); };
    const all = app.querySelector("#tall");
    if (all) all.onclick = () => { const n = P.oneClickTrain(); if (!n) return DD.toast(P.canRank() ? "Rank Up first" : "Not enough coins"); snd("train"); done(); };
  }

  /** Enchantment (C21, replaces the Runes): Enchant Stones raise an affix of a worn artifact one star, or reroll one affix. */
  function enchantSheet(first) {
    let pickId = first || (DD.SLOTS.find((sl) => P.enchantable(S().equipped[sl.id])) || DD.SLOTS[0]).id;
    sheet({
      centre: true,
      cls: "gbox enchbox",
      title: () => "Enchant",
      body: () => {
        const s = S(), g = s.equipped[pickId];
        return `<div class="ench__slots">${DD.SLOTS.map((sl) => `<button class="ench__slot ${sl.id === pickId ? "is-on" : ""}" data-slot="${sl.id}">${gearTile(s.equipped[sl.id], { slotName: sl.name, slotId: sl.id })}</button>`).join("")}</div>` +
          `<div class="ench__wallet">${res(IC.stone, s.stones)}${text("tag", "Enchant Stones")}</div>` +
          (!g ? cream("Nothing worn in this slot.") : !(g.aff || []).length ? cream("Normal artifacts have no affixes: wear a Superior or better one.") :
            `<div class="aff aff--big">${g.aff.map((a, i) => `<div class="aff__row">${text("tag", affName(a))}${text("label", affVal(a, g.tier))}${pips(a.s)}` +
              btn({ v: "neutral", size: "sm", id: "rr" + i, data: `data-i="${i}"`, cls: "ench__rr " + (s.stones >= DD.REROLL_COST ? "" : "gk-btn--poor"), icon: icon(IC.stone, "in-ic") + text("label", String(DD.REROLL_COST)), label: "Reroll" }) + `</div>`).join("")}</div>` +
            cream("Enchant raises the affix with the fewest stars. Reroll changes one affix and keeps its stars.", "ench__note"));
      },
      actions: () => {
        const g = S().equipped[pickId], cost = g && P.enchantCost(g);
        return cost === null || !g ? text("label", g && (g.aff || []).length ? "Every affix at 5 stars" : "") :
          btn({ v: "success", id: "ench-go", label: "Enchant", icon: icon(IC.stone, "in-ic") + text("label", String(cost)), cls: S().stones >= cost ? "" : "gk-btn--poor" });
      },
      bind: (sh, re) => {
        sh.querySelectorAll(".ench__slot").forEach((b) => (b.onclick = () => { pickId = b.dataset.slot; re(); }));
        const e = sh.querySelector("#ench-go");
        if (e) e.onclick = () => { const a = P.enchant(S().equipped[pickId].uid); if (!a) return DD.toast("Not enough Enchant Stones"); DD.toast(`${affName(a)}: ${a.s} ${a.s === 1 ? "star" : "stars"}`); re(); render(); };
        sh.querySelectorAll(".ench__rr").forEach((b) => (b.onclick = () => {
          const a = P.reroll(S().equipped[pickId].uid, +b.dataset.i);
          if (!a) return DD.toast("Not enough Enchant Stones");
          DD.toast("New affix: " + affName(a)); re(); render();
        }));
      },
    });
  }

  /* ================================================================ build stage 3 (Ledger TD Confirmed C17–C19) */
  const statLine = (stat, v) => `${STAT_NAME[stat]} +${stat === "crit" ? (v * 100).toFixed(1) + "%" : DD.pct(v)}`;
  function collSheet() {
    sheet({
      title: () => "Collection",
      cls: "collsheet",
      body: () => {
        const s = S(), sum = {};
        DD.COLLECTION.forEach((c) => (sum[c.stat] = (sum[c.stat] || 0) + DD.collValue(c, P.collLv(c.id))));
        return `<div class="coll__sum">${Object.keys(sum).map((k) => `<span class="hchip">${text("tag", STAT_NAME[k])}${text("label", statLine(k, sum[k]).replace(STAT_NAME[k] + " ", ""))}</span>`).join("")}</div>` +
          `<div class="coll__grid">${DD.COLLECTION.map((c) => {
            const lv = P.collLv(c.id), need = P.collNeed(c.id), have = P.collCopies(c.id), ready = need !== null && have >= need;
            return `<button class="coll coll--${c.tier} ${lv || have ? "" : "is-off"}" data-id="${c.id}">${icon(c.icon, "coll__art")}` +
              `${lv ? `<span class="coll__lv">${text("tag", "Lv " + lv)}</span>` : ""}${ready ? `<span class="dot"></span>` : ""}` +
              text("tag", esc(c.name), "coll__name") +
              `<span class="coll__bar"><span style="width:${need === null ? 100 : Math.min(100, (have / need) * 100)}%"></span>${text("tag", need === null ? "MAX" : `${have}/${need}`)}</span>` +
              text("tag", statLine(c.stat, DD.collValue(c, Math.max(1, lv))), "coll__stat") + `</button>`;
          }).join("")}</div>` +
          `<div class="reward">${res(IC.coll, s.coll.chests)}</div>`;
      },
      actions: () => btn({ v: "secondary", id: "copen", label: "Open All", cls: S().coll.chests ? "" : "gk-btn--poor" }) + btn({ v: "success", id: "cup", label: "Level Up All" }),
      bind: (sh, re) => {
        sh.querySelector("#copen").onclick = () => { if (!S().coll.chests) return DD.toast("No Collection Chests"); const got = P.openCollChest(S().coll.chests); DD.toast(`+${got.length} ${got.length === 1 ? "copy" : "copies"}`); re(); render(); };
        sh.querySelector("#cup").onclick = () => { const n = P.collUpAll(); DD.toast(n ? `+${n} level${n === 1 ? "" : "s"}` : "Needs more copies"); re(); render(); };
        sh.querySelectorAll(".coll").forEach((b) => (b.onclick = () => { if (!P.collUp(b.dataset.id)) return DD.toast("Needs more copies"); re(); render(); }));
      },
    });
  }
  /* ================================================================ Artifacts (C27 G, 2026-11-02)
     User: "pada tab artifact, seharusnya beneran artifact, buat daftarnya dan buat gambarnya. artifact. bisa berikan special effect. buat
     beberapa artifact 10 saja di awal". The page: three worn places on top, the Artifact Chests to open, then the ten artifacts (found
     ones in colour, Lv and copies; the rest grey). Tap one = its box: what it does now and at the next level, Level Up, Wear / Remove. */
  const artCard = (a) => {
    const lv = P.collLv(a.id), have = P.collCopies(a.id), need = P.collNeed(a.id), ready = need !== null && have >= need, on = P.worn().includes(a.id);
    return `<button class="coll coll--${a.tier} ${lv || have ? "" : "is-off"} ${on ? "is-worn" : ""}" data-art="${a.id}">${icon(a.icon, "coll__art")}` +
      `${lv ? `<span class="coll__lv">${text("tag", "Lv " + lv)}</span>` : ""}${ready ? `<span class="dot"></span>` : ""}` +
      text("tag", esc(a.name), "coll__name") + (DD.V4 && DD.v4a ? text("tag", a.num(a.v(Math.max(1, lv))), "coll__stat") : "") + // v4 B5: its number now (Lv 1 while missing)
      `<span class="coll__bar"><span style="width:${need === null ? (DD.V4 && !lv ? 0 : 100) : Math.min(100, (have / need) * 100)}%"></span>${text("tag", need !== null ? `${have}/${need}` : DD.V4 && !lv ? "Not found" : "MAX")}</span></button>`;
  };
  /** Rancangan v4 B5 (js/v4-artifacts.js): Relic Dust of each tier, how far the chest pity is, the way to the Shop */
  const artDust = (s) => {
    const A = DD.v4a, p = A.pity();
    return `<div class="artc artc--v4">${text("tag", "Relic Dust", "artd__h")}<div class="artd">${A.TIERS.map((t) => `<span class="artd__it artd--${t}"><i class="artd__dot"></i>${text("number", String(A.dust(t)))}${text("tag", A.tierName(t))}</span>`).join("")}</div>` +
      `<div class="artc__row">${cream(`Artifact Chests in the Shop: an Epic or better within <em>${p.epic}</em>, a Legendary within <em>${p.legendary}</em>`)}` +
      (s.coll.chests ? btn({ v: "primary", size: "sm", id: "aopen", label: "Open" }) : btn({ v: "secondary", size: "sm", id: "ashop", label: "Shop" })) + `</div></div>`;
  };
  function showArtifacts() {
    const s = S(), worn = P.worn(), found = DD.RELEASED.filter((a) => P.collLv(a.id) || P.collCopies(a.id)).length; // C46: locked Mythic artifacts are not shown
    shell(
      pageHead("Artifacts", `${worn.length} of ${DD.ART_WORN} worn · ${found} of ${DD.RELEASED.length} found`) +
      `<div class="artp">` +
      `<div class="artw${DD.V4 && DD.ART_WORN > 3 ? " artw--" + DD.ART_WORN : ""}">${Array.from({ length: DD.ART_WORN }, (_, i) => { const id = worn[i], a = id && DD.COLL[id];
        return a ? `<button class="artw__m" data-art="${id}">${icon(a.icon, "artw__pic")}${DD.V4 ? `<span class="coll__lv">${text("tag", "Lv " + P.collLv(id))}</span>` : ""}${text("tag", esc(a.name), "artw__n")}${cream(a.line(a.v(P.collLv(id))), "artw__fx")}</button>`
          : `<span class="artw__m artw__m--empty">${text("tag", "Empty", "artw__n")}${cream("Wear an artifact found below", "artw__fx")}</span>`; }).join("")}</div>` +
      (DD.V4 && DD.v4a ? artDust(s) : `<div class="artc">${res(IC.coll, s.coll.chests)}${cream("Artifact Chests are sold only in the Shop")}` +
      (s.coll.chests ? btn({ v: "primary", size: "sm", id: "aopen", label: "Open" }) : btn({ v: "secondary", size: "sm", id: "ashop", label: "Shop" })) + `</div>`) +
      `<div class="coll__grid artg">${DD.RELEASED.map(artCard).join("")}</div></div>`,
      "lobby--kael"
    );
    app.querySelector("#info").onclick = () => showInfo("artifacts");
    app.querySelectorAll("[data-art]").forEach((b) => (b.onclick = () => artSheet(b.dataset.art)));
    if (app.querySelector("#ashop")) app.querySelector("#ashop").onclick = () => { tab = "shop"; render(); };
    if (app.querySelector("#aopen")) app.querySelector("#aopen").onclick = () => {
      if (!S().coll.chests) return DD.toast("No Artifact Chests");
      const got = P.openCollChest(S().coll.chests);
      snd("chest_open");
      DD.toast(got.map((id) => DD.COLL[id].name).join(", "));
      render();
    };
  }
  function artSheet(id) {
    const a = DD.COLL[id];
    sheet({
      centre: true,
      cls: "gbox",
      title: () => a.name,
      body: () => {
        const lv = P.collLv(id), have = P.collCopies(id), need = P.collNeed(id);
        if (DD.V4 && DD.v4a) { // v4 B5: the first copy opens it at Lv 1; Relic Dust of its tier levels it
          const tn = DD.v4a.tierName(a.tier);
          return `<div class="gbox__top">${icon(a.icon, "artb__pic")}<div class="gbox__facts">${text("label", lv ? "Lv " + lv : "Not found yet")}${cream(tn + " artifact")}</div></div>` +
            `<div class="gbox__row">${text("tag", lv ? "Now" : "Lv 1")}${cream(a.line(a.v(Math.max(1, lv))))}</div>` +
            (!lv ? `<div class="gbox__row">${text("tag", "From")}${cream("Artifact Chests in the Shop")}</div>`
              : need !== null ? `<div class="gbox__row">${text("tag", "Lv " + (lv + 1))}${cream(a.line(a.v(lv + 1)))}</div><div class="gbox__row">${text("tag", "Owned")}${text("label", `${have} ${tn} Dust`)}</div>`
              : `<div class="gbox__row">${text("tag", "Level")}${text("label", "MAX")}</div>`);
        }
        return `<div class="gbox__top">${icon(a.icon, "artb__pic")}<div class="gbox__facts">${text("label", lv ? "Lv " + lv : have ? "Found: level it up" : "Not found yet")}${cream(DD.COLL_TIERS[a.tier].name + " artifact")}</div></div>` +
          `<div class="gbox__row">${text("tag", "Now")}${cream(lv ? a.line(a.v(lv)) : "—")}</div>` +
          (need !== null ? `<div class="gbox__row">${text("tag", "Lv " + (lv + 1))}${cream(a.line(a.v(lv + 1)))}</div>` +
            `<div class="gbox__row">${text("tag", "Copies")}${text("label", `${have}/${need}`)}</div>` : `<div class="gbox__row">${text("tag", "Level")}${text("label", "MAX")}</div>`);
      },
      actions: () => {
        const lv = P.collLv(id), need = P.collNeed(id), on = P.worn().includes(id);
        return (lv ? btn({ v: on ? "danger" : "secondary", id: "awear", label: on ? "Remove" : "Wear" }) : "") +
          (need !== null ? btn({ v: "success", id: "aup", label: lv ? "Level Up" : "Unlock", sub: DD.V4 && DD.v4a ? `${need} ${DD.v4a.tierName(a.tier)} Dust` : undefined, cls: P.collCopies(id) >= need ? "" : "gk-btn--poor" }) : "");
      },
      bind: (sh, re) => {
        const w = sh.querySelector("#awear");
        if (w) w.onclick = () => { const r = P.wear(id); if (r === "full") return DD.toast(`${DD.ART_WORN} worn: remove one first`); snd(r === "on" ? "equip" : "unequip"); re(); render(); };
        const u = sh.querySelector("#aup");
        if (u) u.onclick = () => { const was = P.collLv(id); if (!P.collUp(id)) return DD.toast(DD.V4 && DD.v4a ? `Needs more ${DD.v4a.tierName(a.tier)} Dust` : "Needs more copies from Artifact Chests"); snd(was ? "art_up" : "art_unlock"); re(); render(); };
      },
    });
  }
  function limitedSheet() {
    sheet({
      title: () => "Limited Recruitment",
      cls: "recsheet",
      body: () => {
        const s = S(), ms = P.limitedMilestones();
        return `<div class="tav">${cream("Mythic heroes only come from here.")}` +
          `<div class="tav__odds">${DD.LIMITED_ODDS.map(([t, p]) => `<span class="odd odd--${t}">${text("tag", `${DD.TIER_NAME[t]} ${+(p * 100).toFixed(1)}%`)}</span>`).join("")}</div>` +
          `<div class="tav__pack tav__pack--sm">${icon("shop/shop_tile_premium.webp", "tav__tile")}${icon(IC.limited, "tav__art")}</div>` +
          cream(`Mythic guaranteed in <em>${P.limitedPity()}</em> pulls · pulls <em>${s.limited.pulls}</em>`) +
          `<div class="lim__ms">${ms.map((m, i) => `<button class="lim__m ${m.state === 1 ? "is-ready" : m.state === 2 ? "is-got" : ""}" data-i="${i}">${text("tag", String(m.at))}${icon(m.give.essence ? IC.essence : IC.gem)}${text("tag", "+" + (m.give.essence || m.give.gems))}</button>`).join("")}</div>` +
          `<div class="reward lim__wallet">${res(IC.essence, s.essence)}${res(IC.gem, DD.fmt(s.gems))}` +
          btn({ v: "neutral", size: "sm", id: "lbuy", label: "Buy 1", icon: gem + text("label", DD.ESSENCE_GEMS), cls: s.gems >= DD.ESSENCE_GEMS ? "" : "gk-btn--poor" }) + `</div></div>`;
      },
      actions: () => {
        const s = S();
        return btn({ v: "secondary", id: "l1", label: "×1", icon: icon(IC.essence, "in-ic") + text("label", "1"), cls: s.essence >= 1 ? "" : "gk-btn--poor" }) +
          btn({ v: "primary", id: "l10", label: "×10", icon: icon(IC.essence, "in-ic") + text("label", "10"), cls: s.essence >= 10 ? "" : "gk-btn--poor" });
      },
      bind: (sh, re) => {
        const pull = (n) => { const r = P.limitedPull(n); if (!r) return DD.toast("Not enough Mythic Essence"); showPulls(r, re, "Limited Recruitment"); };
        sh.querySelector("#l1").onclick = () => pull(1);
        sh.querySelector("#l10").onclick = () => pull(10);
        sh.querySelector("#lbuy").onclick = () => { if (!P.buyEssence(1)) return DD.toast("Not enough gems"); re(); render(); };
        sh.querySelectorAll(".lim__m").forEach((b) => (b.onclick = () => { const g = P.claimMilestone(+b.dataset.i); if (!g) return DD.toast("Reach the pull count first"); loot("Reward", g, () => { re(); render(); }); }));
      },
    });
  }

  /* ================================================================ Missions (build stage 5, Ledger TD C22): Daily · Sign-in · Newcomer */
  function missionsSheet(first) {
    let view = first || "daily", pickDay = 0;
    const chestBar = (chests, pts, max, attr) => `<div class="best qbar"><div class="best__fill" style="width:${Math.min(100, (pts / max) * 100)}%"></div>` +
      chests.map((ch, i) => `<button class="best__chest ${ch.state === 2 ? "is-got" : ch.state === 1 ? "is-ready" : ""}" ${attr}="${i}" style="left:${(ch.at / max) * 100}%" aria-label="${ch.at} points">${icon(IC.chest)}${ch.state === 2 ? `<span class="best__tick">${glyph("check")}</span>` : text("tag", String(ch.at), "qbar__at")}</button>`).join("") + `</div>`;
    const row = (name, have, need, pts) => `<div class="qrow ${have >= need ? "is-done" : ""}">${text("label", esc(name))}${text("tag", `${have}/${need}`)}` +
      (have >= need ? `<span class="qrow__ok">${glyph("check")}</span>` : `<span class="qrow__pts">${text("tag", "+" + pts)}</span>`) + `</div>`;
    sheet({
      title: () => "Missions",
      cls: "missheet",
      body: () => {
        const ready = { daily: P.questChests().some((x) => x.state === 1) || P.online().rows.some((x) => x.state === 1), signin: P.signin().can,
          newcomer: (P.challengeOpen() && P.challenge().chests.some((x) => x.state === 1)) || P.benefits().some((b) => b.state === 1) };
        const tabs = `<div class="mtabs">${[["daily", "Daily"], ["signin", "Sign-in"], ["newcomer", "Newcomer"]].map(([id, label]) =>
          btn({ v: view === id ? "secondary" : "neutral", size: "sm", label, id: "mt-" + id, data: `data-v="${id}"`, cls: "mtab" + (ready[id] ? " has-dot" : "") })).join("")}</div>`;
        if (view === "daily") {
          const pts = P.questPts(), on = P.online();
          return tabs + `<div class="mhead">${text("label", "Activity")}${text("number", pts + "/120")}</div>` + chestBar(P.questChests(), pts, 120, "data-qc") +
            `<div class="qlist">${P.quests().map((q) => row(q.name, q.have, q.need, q.pts)).join("")}</div>` +
            `<div class="mhead">${text("label", "Online today")}${text("number", on.min + "m")}</div>` +
            `<div class="online">${on.rows.map((r, i) => `<button class="online__it ${r.state === 2 ? "is-got" : r.state === 1 ? "is-ready" : ""}" data-on="${i}">${gifts(r.give)}${text("tag", r.at + "m")}${r.state === 2 ? `<span class="best__tick">${glyph("check")}</span>` : ""}</button>`).join("")}</div>`;
        }
        if (view === "signin") {
          const st = P.signin();
          return tabs + `<div class="sign">${DD.SIGNIN.map((g, i) => {
            const got = i < st.done, now = st.can && i === st.next;
            return `<div class="sign__day ${got ? "is-got" : ""} ${now ? "is-now" : ""} ${i === 6 ? "sign__day--big" : ""}">${text("tag", "Day " + (i + 1))}<span class="sign__gifts">${gifts(g)}</span>${got ? `<span class="best__tick">${glyph("check")}</span>` : ""}</div>`;
          }).join("")}</div>` + cream("Sign in every day: a missed day starts again at Day 1.", "sign__note");
        }
        const ch = P.challenge(), open = ch.endsIn > 0;
        if (pickDay === 0) pickDay = ch.today;
        const d = ch.days[pickDay - 1];
        return tabs + (open ? `<div class="mhead">${text("label", "7-Day Challenge")}${text("tag", "Ends in " + time(ch.endsIn))}</div>` + chestBar(ch.chests, ch.pts, 280, "data-cc") +
            `<div class="mdays">${ch.days.map((x) => `<button class="mday ${x.day === pickDay ? "is-on" : ""} ${x.open ? "" : "is-locked"}" data-day="${x.day}">${text("tag", "Day " + x.day)}</button>`).join("")}</div>` +
            `<div class="qlist">${d.open ? d.tasks.map((t) => row(t.text, t.have, t.need, t.pts)).join("") : cream("Opens on day " + d.day)}</div>` : `<div class="mhead">${text("label", "7-Day Challenge")}${text("tag", "Ended")}</div>`) +
          `<div class="mhead">${text("label", "Newcomer Benefits")}</div>` +
          `<div class="qlist">${P.benefits().map((b, i) => `<div class="qrow ${b.state === 2 ? "is-done" : ""}">${text("label", "Clear Stage " + b.at)}<span class="qrow__gifts">${gifts(b.give)}</span>` +
            (b.state === 2 ? `<span class="qrow__ok">${glyph("check")}</span>` : b.state === 1 ? btn({ v: "success", size: "sm", label: "Claim", data: `data-bn="${i}"`, cls: "qrow__btn" }) : `<span class="qrow__need">${icon(IC.lock, "in-ic")}${text("tag", "Stage " + b.at)}</span>`) + `</div>`).join("")}</div>`;
      },
      actions: () => (view === "signin" ? btn({ v: "primary", id: "sclaim", label: P.signin().can ? "Claim" : "Come back tomorrow", cls: P.signin().can ? "" : "gk-btn--poor" }) : ""),
      bind: (sh, re) => {
        const got = (g, b) => { if (g) loot("Reward", g, () => { re(); render(); }); else DD.toast(b && b.classList.contains("is-got") ? "Already claimed" : "Not yet"); };
        sh.querySelectorAll(".mtab").forEach((b) => (b.onclick = () => { view = b.dataset.v; re(); }));
        sh.querySelectorAll("[data-qc]").forEach((b) => (b.onclick = () => got(P.claimQuestChest(+b.dataset.qc), b)));
        sh.querySelectorAll("[data-on]").forEach((b) => (b.onclick = () => got(P.claimOnline(+b.dataset.on), b)));
        sh.querySelectorAll("[data-cc]").forEach((b) => (b.onclick = () => got(P.claimChallenge(+b.dataset.cc), b)));
        sh.querySelectorAll("[data-bn]").forEach((b) => (b.onclick = () => got(P.claimBenefit(+b.dataset.bn))));
        sh.querySelectorAll(".mday").forEach((b) => (b.onclick = () => { if (b.classList.contains("is-locked")) return DD.toast("Opens on day " + b.dataset.day); pickDay = +b.dataset.day; re(); }));
        const sc = sh.querySelector("#sclaim");
        if (sc) sc.onclick = () => got(P.claimSignin());
      },
    });
  }

  /* ================================================================ Shop (C8) */
  let shopTab = "heroes"; // C32 G6: Heroes · Chests · Offers · Pass
  function showShop() {
    // C32 G6 (user no. 74: "tampilan shop sangat amat berantakan. coba rombak lagi" + "kartu recruit dan limited, pindah ke shop"):
    // the hero page's way: four tabs on plaques, one gold-framed card per thing to buy (its picture big, its name on a plate, two
    // short lines, its odds as chips, its buy plaques at the foot); a red dot on a tab with something free or ready
    const s = S(), o = P.offers(), lv = P.chestLv(), next = P.chestNext(), odds = P.chestOdds();
    const cost = (c) => (c.keys ? icon(IC.key, "in-ic") + text("label", String(c.keys)) : "") + (c.tickets ? icon(IC.ticket, "in-ic") + text("label", String(c.tickets)) : "") + (c.gems ? gem + text("label", DD.fmtCost(c.gems)) : "");
    const plq = (id, label, ic, cls) => `<button class="hp2__plaque ${cls || ""}" id="${id}">${text("label", label)}${ic ? `<span class="plq__cost">${ic}</span>` : ""}</button>`;
    const card = (art, title, lines, more, foot, cls) => `<div class="scard gfp ${cls || ""}"><span class="gfp__crest"></span><div class="scard__head"><div class="scard__plate">${text("label", title)}</div></div>` +
      `<div class="scard__top">${icon(art, "scard__art")}<div class="scard__txt">${lines}</div></div>${more || ""}${foot ? `<div class="scard__foot">${foot}</div>` : ""}</div>`;
    const lockCard = (art, title, f) => card(art, title, cream("Clear Stage " + DD.UNLOCK[f] + " to open"), "", "", "is-locked");
    const oddsLine = (pairs) => {
      const it = (x) => x.map(([cls, name, p]) => `<span class="oddl__it"><span class="oddl__n oddl--${cls}">${name}</span> ${p}</span>`).join(`<span class="oddl__dot">·</span>`);
      // C38 G4: longer than one row (about 48 letters at 375 px) = two even rows, never one lone odd on the second row
      const len = pairs.reduce((a, [, n, p]) => a + n.length + String(p).length + 4, 0), cut = Math.ceil(pairs.length / 2);
      return len > 50 && pairs.length > 2 ? `<div class="scard__odds oddl"><span class="oddl__row">${it(pairs.slice(0, cut))}</span><span class="oddl__row">${it(pairs.slice(cut))}</span></div>` : `<div class="scard__odds oddl">${it(pairs)}</div>`;
    };
    const dots = { heroes: (P.unlocked("recruit") && s.tickets > 0) || (P.unlocked("limited") && (s.essence > 0 || P.limitedMilestones().some((m) => m.state === 1))),
      chests: s.keys > 0, offers: o.items.some((it) => !it.sold && DD.OFFERS.find((x) => x.id === it.id).pay === "ad"), pass: P.unlocked("pass") && P.passReady() };
    const tabs = [["heroes", "Heroes"], ["chests", "Chests"], ["offers", "Offers"]].concat(P.unlocked("pass") ? [["pass", "Pass"]] : []);
    if (!tabs.some(([k]) => k === shopTab)) shopTab = "heroes";
    let body = "";
    if (shopTab === "heroes") {
      const rOdds = P.recruitOdds(), bar = P.recruitBar();
      body = (P.unlocked("recruit") ? card(IC.recruit, V4E ? "Recruit" : "Recruit · Lv " + P.recruitLv(),
          V4E ? cream(`Recruit Tickets <em>${s.tickets}</em> · gems <em>${DD.fmt(s.gems)}</em>`) + v4Pity() + v4WishBtn("rmore", "scard__want") // v4 B6
          : cream(`Recruit Tickets <em>${s.tickets}</em> · gems <em>${DD.fmt(s.gems)}</em>`) + (bar ? cream(`Next Recruit level <em>${bar.have}/${bar.need}</em> pulls`) : cream("Recruit level MAX")) +
            `<button class="scard__want" id="rmore">${s.recruit.desired ? pic(s.recruit.desired) : `<span class="pic pic--empty"></span>`}${text("tag", s.recruit.desired ? "Desired: " + esc(DD.HERO[s.recruit.desired].short) : "Choose a Desired Hero")}</button>`,
          (V4E ? cream(`Odds for ${v4Band()}`, "v4odds") : "") + oddsLine(DD.RECRUIT_TIERS.map((t, i) => [t, DD.TIER_NAME[t], +(rOdds[i] * 100).toFixed(1) + "%"])),
          // C33 G1 (user no. 75: "ga jelas banget tombolnya. orang ga paham"): the words say what happens, the cost follows
          plq("r1", "Recruit 1", cost(P.recruitCost(1)), S().gems >= P.recruitCost(1).gems ? "" : "is-poor") + plq("r10", "Recruit 10", cost(P.recruitCost(10)), "hp2__plaque--gold" + (S().gems >= P.recruitCost(10).gems ? "" : " is-poor")), "scard--rec")
        : lockCard(IC.recruit, "Recruit", "recruit")) +
        (P.unlocked("limited") ? card(IC.limited, "Limited Recruitment", cream("Mythic heroes only come from here.") + cream(`Mythic Essence <em>${s.essence}</em> · a Mythic within <em>${P.limitedPity()}</em> pulls`),
          oddsLine(DD.LIMITED_ODDS.map(([t, p]) => [t, DD.TIER_NAME[t], +(p * 100).toFixed(1) + "%"])) +
          `<div class="limr">${cream(`Pull rewards · you made <em>${s.limited.pulls}</em> pulls`, "limr__h")}<div class="limr__row">${P.limitedMilestones().map((m, i) =>
            `<button class="limr__m ${m.state === 1 ? "is-ready" : m.state === 2 ? "is-got" : ""}" data-lm="${i}">${text("tag", String(m.at))}<span class="limr__g">${icon(m.give.essence ? IC.essence : IC.gem, "in-ic")}${text("label", "+" + (m.give.essence || m.give.gems))}</span>${m.state === 2 ? `<span class="best__tick">${glyph("check")}</span>` : ""}</button>`).join("")}</div></div>` +
          `<div class="scard__foot scard__foot--one">${plq("lbuy", "Buy 1 Mythic Essence", gem + text("label", String(DD.ESSENCE_GEMS)), "hp2__plaque--dark" + (s.gems >= DD.ESSENCE_GEMS ? "" : " is-poor"))}</div>`,
          plq("l1", "Recruit 1", icon(IC.essence, "in-ic") + text("label", "1"), s.essence >= 1 ? "" : "is-poor") + plq("l10", "Recruit 10", icon(IC.essence, "in-ic") + text("label", "10"), "hp2__plaque--gold" + (s.essence >= 10 ? "" : " is-poor")), "scard--lim")
        : lockCard(IC.limited, "Limited Recruitment", "limited"));
    } else if (shopTab === "chests") {
      body = card(DD.SKIN ? "2a/it_artchest.webp" : IC.chest, V4E ? "Equipment Chest" : "Equipment Chest · Lv " + lv,
          (V4E ? cream("A piece for one hero of your party: a weapon of that hero's type, or any other slot.") : next ? cream(`Open <em>${next - s.chest.opened}</em> more to level the chest up`) : cream("Chest level MAX")) + cream(`Keys <em>${s.keys}</em> · mostly Tier 1, a higher tier is rare`),
          oddsLine(DD.GEAR_RARITY.map((r, i) => [("g-" + r), DD.GEAR_RARITY_NAME[r], Math.round(odds[i] * 100) + "%"]).filter((x, i) => odds[i])),
          plq("c1", "Single", cost(P.chestCost(1))) + plq("c10", "10 Pull", cost(P.chestCost(10)), "hp2__plaque--gold")) +
        (P.unlocked("artifacts") ? card(IC.coll, "Artifact Chest", DD.V4 && DD.v4a // v4 B5: odds, pity, Relic Dust
            ? cream(`One of the ${DD.RELEASED.length} artifacts. A copy you own becomes Relic Dust.`) + cream(`An Epic or better within <em>${DD.v4a.pity().epic}</em> · a Legendary within <em>${DD.v4a.pity().legendary}</em>`)
            : cream(`A copy of one of the ${DD.RELEASED.length} artifacts. Sold only here.`) + cream(`Owned <em>${s.coll.chests}</em> · Fine, Superior, Rare, Epic`), DD.V4 && DD.v4a ? oddsLine(DD.v4a.oddsPairs()) : "",
          plq("a1", "Single", cost({ gems: DD.ART_CHEST_GEMS })) + plq("a10", "×10", cost({ gems: DD.ART_CHEST_GEMS * 9 }), "hp2__plaque--gold")) : lockCard(IC.coll, "Artifact Chest", "artifacts"));
    } else if (shopTab === "offers") {
      const freeLeft = DD.OFFER_FREE_REFRESH - o.refresh.n;
      const offer = (it, i) => {
        const d = DD.OFFERS.find((x) => x.id === it.id);
        const giveIc = { gems: IC.gem, ticket: IC.ticket, ore: IC.ore, key: IC.key, stones: IC.stone, energy: null }[d.id];
        const amount = Object.values(d.give)[0];
        const price = d.pay === "ad" ? text("label", "Free (Ad)") : d.pay.coins ? coin + text("label", DD.fmtCost(d.pay.coins)) : gem + text("label", d.pay.gems);
        return `<button class="soffer gfc ${it.sold ? "is-sold" : ""}" data-i="${i}"><span class="gfc__win soffer__win"><span class="soffer__art">${giveIc ? icon(giveIc) : `<span class="bolt bolt--lg">${glyph("bolt")}</span>`}</span>` +
          `<span class="soffer__amt">${text("tag", "×" + amount)}</span></span>${text("label", esc(d.name), "soffer__name")}<span class="soffer__price">${it.sold ? text("label", "Sold") : price}</span></button>`;
      };
      body = `<div class="scard gfp"><span class="gfp__crest"></span><div class="scard__bar"><div class="scard__plate">${text("label", "Special Offer")}</div>${cream(`New items in <em>${time(P.offerEndsIn())}</em>`)}</div>` +
          `<div class="soffers">${o.items.map(offer).join("")}</div><div class="scard__foot">${plq("orf", freeLeft > 0 ? `Refresh · Free ${freeLeft}/${DD.OFFER_FREE_REFRESH}` : "Refresh", freeLeft > 0 ? "" : gem + text("label", String(DD.OFFER_REFRESH_GEMS)))}</div></div>` +
        `<div class="scard gfp"><span class="gfp__crest"></span><div class="scard__bar"><div class="scard__plate">${text("label", "Packs")}</div></div><div class="soffers soffers--2">` +
          [["Starter Pack", "$2.99", DD.SKIN ? "2a/it_starter.webp" : IC.chest], ["Hero Pack", "$9.99", DD.SKIN ? "2a/it_heropack.webp" : IC.recruit]].map(([n, p, art]) =>
            `<button class="soffer gfc pack"><span class="gfc__win soffer__win"><span class="soffer__art">${icon(art)}</span></span>${text("label", n, "soffer__name")}<span class="soffer__price">${text("label", p)}</span></button>`).join("") + `</div></div>`;
    } else {
      body = `<div class="scard gfp"><span class="gfp__crest"></span><div class="scard__head"><div class="scard__plate">${text("label", "Progression Pass")}</div></div><div class="scard__top">${icon(IC.pass, "scard__art")}<div class="scard__txt">` +
          cream(`Stage <em>${s.cleared}</em> cleared · every few stages gives a free reward`) + `</div></div>` +
          `<div class="pass__track spass">${P.passTiers().map((t) => `<div class="pass__tier ${t.state === 2 ? "is-got" : t.state === 1 ? "is-ready" : "is-lock"}">${text("tag", "Stage " + t.at)}` +
            `<span class="pass__cell pass__cell--free">${gifts(t.free)}${t.state === 2 ? `<span class="best__tick">${glyph("check")}</span>` : ""}</span>` +
            `<span class="pass__cell pass__cell--prem">${gifts(t.prem)}<img class="pass__lock" src="${A(IC.lock)}" alt=""></span></div>`).join("")}</div>` +
          `<div class="scard__foot">${plq("pclaim", "Claim All", "", P.passReady() ? "hp2__plaque--gold" : "is-poor")}${plq("pbuy", "Premium", text("label", DD.PASS_PRICE), "hp2__plaque--dark")}</div></div>`;
    }
    shell(
      pageHead("Shop") +
      `<div class="stabs hp2__tabs" role="tablist">${tabs.map(([k, l]) => `<button class="hp2__tab ${shopTab === k ? "is-on" : ""}" role="tab" aria-selected="${shopTab === k}" data-stab="${k}">${text("label", l)}${dots[k] && shopTab !== k ? `<span class="dot"></span>` : ""}</button>`).join("")}</div>` +
      `<div class="shop2">${body}</div>`,
      "lobby--shop lobby--shop2"
    );
    const q = (x) => app.querySelector(x);
    app.querySelectorAll("[data-stab]").forEach((b) => (b.onclick = () => { if (shopTab !== b.dataset.stab) { shopTab = b.dataset.stab; app.querySelector(".page").scrollTop = 0; render(); } }));
    q("#info").onclick = () => showInfo("shop");
    const recruitNow = (n) => { const r = P.recruit(n); if (!r) return DD.toast("Not enough gems"); snd("pull"); showPulls(r, () => render()); };
    if (q("#r1")) {
      q("#r1").onclick = () => recruitNow(1);
      q("#r10").onclick = () => recruitNow(10);
      q("#rmore").onclick = () => (V4E ? v4WishSheet(() => render()) : pickHero("Desired Hero", DD.RECRUIT_POOL.map((h) => h.id), (id) => { P.setDesired(id); render(); }));
    }
    if (q("#l1")) {
      const lpull = (n) => { const r = P.limitedPull(n); if (!r) return DD.toast(`Needs ${n} Mythic Essence: buy it below`); snd("pull"); showPulls(r, () => render(), "Limited Recruitment"); };
      q("#l1").onclick = () => lpull(1);
      q("#l10").onclick = () => lpull(10);
      q("#lbuy").onclick = () => { if (!P.buyEssence(1)) return DD.toast("Not enough gems"); render(); };
      app.querySelectorAll("[data-lm]").forEach((b) => (b.onclick = () => { const g = P.claimMilestone(+b.dataset.lm); if (!g) return DD.toast(b.classList.contains("is-got") ? "Already claimed" : "Reach the pull count first"); loot("Reward", g, () => render()); }));
    }
    const open = (n) => { const r = P.openChest(n); if (!r) return DD.toast("Not enough keys or gems"); loot("Equipment Chest", { gearList: r }); };
    const buyArt = (n) => { const r = P.buyArtChest(n); if (!r) return DD.toast("Not enough gems"); loot("Artifact Chest", { arts: r }); };
    if (q("#c1")) { q("#c1").onclick = () => open(1); q("#c10").onclick = () => open(10); }
    if (q("#a1")) { q("#a1").onclick = () => buyArt(1); q("#a10").onclick = () => buyArt(10); }
    app.querySelectorAll(".soffer[data-i]").forEach((b) => (b.onclick = () => {
      const i = +b.dataset.i, it = P.offers().items[i];
      if (it.sold) return;
      const d = DD.OFFERS.find((x) => x.id === it.id);
      const go = () => { const r = P.buyOffer(i); if (!r) return DD.toast("Not enough to pay"); loot(d.name, r); };
      if (d.pay === "ad") ad(go); else go();
    }));
    app.querySelectorAll(".pack").forEach((b) => (b.onclick = purchaseOff));
    if (q("#orf")) q("#orf").onclick = () => { if (!P.refreshOffers()) return DD.toast("Not enough gems"); render(); };
    if (q("#pclaim")) {
      q("#pclaim").onclick = () => { const g = P.claimPass(); if (!g) return DD.toast("Clear more stages"); loot("Progression Pass", g); };
      q("#pbuy").onclick = purchaseOff;
      const tr = q(".pass__track"), first = tr.querySelector(".is-ready, .is-lock");
      if (first) tr.scrollLeft = Math.max(0, first.offsetLeft - 8);
    }
  }

  /* ================================================================ Patrol (C9) */
  function patrolSheet() {
    sheet({
      title: () => "Patrol",
      body: () => {
        const p = P.patrol();
        const hh = Math.floor(p.hours), mm = Math.floor((p.hours - hh) * 60);
        return `<div class="exp">${icon(IC.patrol, "exp__art")}` +
          `<div class="exp__bar"><div style="width:${(p.hours / DD.PATROL_MAX_H) * 100}%"></div>${text("label", `${hh}h ${mm}m / ${DD.PATROL_MAX_H}h`)}</div>` +
          (V4E ? cream(`<em>${DD.fmt(DD.patrolRate(S().cleared).coins)}</em> coins an hour (7 × Stage ${Math.max(1, S().cleared)}), up to <em>${DD.PATROL_MAX_H}</em> h`, "v4note") : "") +
          rewardRow({ coins: p.coins, ore: p.ore, exp: p.exp, stones: p.stones, collChests: p.collChests }) + (p.gear ? cream(`Equipment <em>×${p.gear}</em>`) : "") +
          `<div class="gk-row quick"><div class="quick__t">${text("label", "Quick Patrol")}${text("tag", `+${DD.QUICK_PATROL_H}h loot`)}</div>` +
          btn({ v: "secondary", size: "sm", id: "qp", icon: bolt + text("label", DD.ENERGY_RUN), sub: `${P.quickLeft()}/${DD.QUICK_PATROL_DAY}`, cls: P.quickLeft() > 0 ? "" : "gk-btn--poor" }) +
          btn({ v: "special", size: "sm", id: "qpa", label: "Ad", sub: `${P.quickAdLeft()}/${DD.QUICK_PATROL_AD}`, cls: P.quickLeft() <= 0 && P.quickAdLeft() > 0 ? "" : "gk-btn--poor" }) + `</div></div>`;
      },
      actions: () => btn({ v: "primary", label: "Claim", id: "claim", cls: P.patrol().coins > 0 ? "" : "gk-btn--poor" }),
      bind: (sh, re, close) => {
        sh.querySelector("#claim").onclick = () => { if (P.patrol().coins <= 0) return DD.toast("Nothing yet"); close(); loot("Patrol", P.claimPatrol()); };
        sh.querySelector("#qp").onclick = () => {
          if (P.quickLeft() <= 0) return DD.toast("No more today");
          const r = P.quickPatrol(false);
          if (!r) return energySheet();
          close(); loot("Quick Patrol", r);
        };
        sh.querySelector("#qpa").onclick = () => {
          if (P.quickLeft() > 0) return DD.toast("Use the free ones first");
          if (P.quickAdLeft() <= 0) return DD.toast("No more today");
          if (P.energy() < DD.ENERGY_RUN) return energySheet();
          ad(() => { const r = P.quickPatrol(true); close(); if (r) loot("Quick Patrol", r); });
        };
      },
    });
  }

  /* ================================================================ Battle (D3, C3, C4) */
  function showBattle(n, hard) {
    const st = hard ? DD.hardStage(n) : DD.stage(n);
    app.className = "app theme-dungeon" + (DD.SKIN ? " t2app" : "");
    app.innerHTML =
      `<div class="screen screen--in ${st.round ? "is-round" : ""}" id="battle">` +
      `<div class="bt__bg" style="background-image:url('${A(st.bg)}')"></div>` +
      // the painted tray under the wall painting: the heroes' photos and the wall HP sit on it (audit A11)
      `<div class="bt__band"></div>` +
      `<div class="bt__cv"><canvas></canvas></div>` +
      // one 44 px HUD band: menu · Stage + clock over the progress bar · coins · speed (audit A9)
      `<div class="bt__hud">` +
      ibtn({ sm: true, round: true, id: "menu", aria: "Pause", inner: glyph("menu") }) +
      `<div class="bt__stage"><div class="bt__strow">${text("label", "Stage " + st.n)}${text("tag", "00:00", "bt__clock")}</div><div class="bt__prog"><div></div>${text("tag", "Progress 0%", "bt__pct")}</div></div>` +
      res(IC.coin, "0", "coin-t") + ibtn({ sm: true, v: "secondary", id: "spd", aria: "Speed", inner: text("label", "x1") }) +
      `</div>` +
      `<div class="bt__side"></div>` +
      `<div class="bt__lifebox"><div class="bt__life"><img class="frame" src="${A("loading/loading_bar_frame.webp")}" alt=""><div class="fill"><div></div></div>${text("label", "", "bt__lifen")}</div></div>` +
      `</div>`;
    const root = app.querySelector("#battle");
    const q = (x) => root.querySelector(x);
    let shownSide = "", lastCoins = -1, lastPct = -1, lastSec = -1, dragTip = null;
    // C54: the how-to-play lines (js/story.js) for a player who came through the story start; the battle stops while one shows
    const tutor = !!(S().seen.tutOn && DD.Story);
    let talking = false;
    const say = (key, steps) => {
      const s = S();
      if (s.seen["tut_" + key]) return false;
      s.seen["tut_" + key] = true;
      P.save();
      talking = true;
      battle.paused = true;
      DD.Story.play(steps, { battle: true }).then(() => { talking = false; if (battle.state === "fight") battle.paused = false; });
      return true;
    };
    const T = DD.Story ? DD.Story.TUT : {};
    function tutTick(b) {
      const s = S(), vis = b.visible();
      if (!s.seen.tut_start && b.time > 1.2 && vis.length > 1) return say("start", T.start);
      if (b.time < 2) return;
      if (st.n >= 2 && !s.seen.tut_element) return say("element", T.element);
      if (!s.seen.tut_kael && b.heroes.some((h) => h.onWall && P.isTrial(h.id))) return say("kael", DD.Story.KAEL_BATTLE);
      const seen = (k) => vis.some((e) => e.special === k && e.s > b.enterOf(e) + 40);
      for (const k of ["pearl", "shard", "chest"]) if (!s.seen["tut_" + k] && seen(k)) return say(k, T[k]);
      if (!s.seen.tut_wall && b.danger && b.danger()) return say("wall", T.wall);
    }
    const battle = (DD.battle = new DD.Battle(q("canvas"), {
      stage: st,
      formation: DD.SKIN ? (P.formation().filter((id) => DD.SKIN_HEROES.includes(id)).length ? P.formation().filter((id) => DD.SKIN_HEROES.includes(id)) : DD.SKIN_HEROES) : P.formation(),
      levels: P.levels(),
      mods: P.battleMods(),
      on: {
        choice(c) {
          const open = () => (c.type === "call" ? heroCall(battle, c.options, root) : skillPick(battle, c.options, root));
          if (!tutor || S().seen["tut_" + c.type]) return open();
          S().seen["tut_" + c.type] = true; // C54: the first Skill Selection / Hero Call is explained first
          P.save();
          talking = true;
          DD.Story.play(DD.Story.TUT[c.type], { battle: true }).then(() => { talking = false; open(); });
        },
        down(b) { revive(b, root); },
        end(r) {
          const go = () => setTimeout(() => result(st, r, root), 600);
          if (!tutor || !r.win || S().seen.tut_win) return go();
          S().seen.tut_win = true;
          P.save();
          DD.Story.play(DD.Story.TUT.win, { battle: true }).then(go);
        },
        dragged() { if (dragTip) { dragTip.classList.add("is-out"); dragTip = null; } },
        react(k) { tip("react_" + k, root, DD.REACT[k].hint); },
        frame(b) {
          if (b.coins !== lastCoins) { lastCoins = b.coins; q(".coin-t .gk-text").textContent = DD.fmt(b.coins); }
          const pct = Math.floor(b.progress * 100);
          if (pct !== lastPct) {
            lastPct = pct;
            q(".bt__prog > div").style.width = pct + "%";
            q(".bt__pct").textContent = "Progress " + pct + "%";
          }
          const sec = Math.floor(b.time);
          if (sec !== lastSec) { lastSec = sec; q(".bt__clock").textContent = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`; }
          const life = q(".bt__life");
          life.querySelector(".fill > div").style.width = (b.wall / b.wallMax) * 100 + "%";
          life.querySelector(".bt__lifen").textContent = DD.fmt(b.wall);
          life.classList.toggle("is-low", b.wall < b.wallMax * 0.3);
          life.classList.toggle("is-hit", b.contact > 0);
          if (tutor && !talking && !b.paused && b.state === "fight") tutTick(b);
          const side = b.heroes.filter((h) => h.onWall).map((h) => h.id + h.sk + (h.evo ? "e" : "")).join(",");
          if (side !== shownSide) {
            shownSide = side;
            q(".bt__side").innerHTML = b.heroes.filter((h) => h.onWall).map((h) => `<span class="side">${pic(h.id)}<span class="side__n ${h.evo ? "is-evo" : ""}">${text("tag", h.sk)}</span></span>`).join("");
          }
        },
      },
    }));
    DD.bgm(st.bgm[0]);
    snd("dragon_enter"); // C28 C: the dragon is coming (swells in, never a jolt)
    dragTip = tip("drag", root, st.round ? "Drag to move around the tower" : "Drag to move left and right");
    q("#spd").onclick = () => {
      battle.speed = battle.speed === 1 ? 2 : 1;
      q("#spd .gk-text").textContent = "x" + battle.speed;
    };
    q("#menu").onclick = () => {
      if (battle.paused || battle.state !== "fight") return;
      battle.paused = true;
      pauseBox(battle, root);
    };
  }

  function pauseBox(battle, root) {
    let view = "skills";
    const m = modal({ title: "Paused", parent: root, cls: "pausebox", body: `<div class="pause__snd"></div><div class="ptabs">${btn({ v: "secondary", size: "sm", label: "Skill Details", id: "tv1" })}${btn({ v: "neutral", size: "sm", label: "Damage Statistics", id: "tv2" })}</div><div class="pview"></div>`,
      actions: btn({ v: "danger", label: "Give Up", id: "leave" }) + btn({ v: "primary", label: "Resume", id: "resume" }) });
    const draw = () => {
      const on = battle.heroes.filter((h) => h.onWall);
      m.querySelector("#tv1").className = m.querySelector("#tv1").className.replace(/gk--\w+/, view === "skills" ? "gk--secondary" : "gk--neutral");
      m.querySelector("#tv2").className = m.querySelector("#tv2").className.replace(/gk--\w+/, view === "dmg" ? "gk--secondary" : "gk--neutral");
      if (view === "skills") {
        m.querySelector(".pview").innerHTML = `<div class="gk-isec">${on.map((h) => `<div class="gk-row">${pic(h.id)}<div class="gk-row__text">${text("label", `${esc(h.def.weapon)} · Cards ${h.sk}/${DD.SKILL_MAX}`)}${cream(h.evo ? `<em>${esc(h.def.evo.name)}</em>: ${esc(h.def.evo.text)}` : esc(h.def.line))}</div></div>`).join("")}</div>`;
      } else {
        const rows = on.slice().sort((a, b) => b.dealt - a.dealt);
        const top = Math.max(1, ...rows.map((h) => h.dealt));
        const rx = Object.keys(DD.REACT).filter((k) => battle.reacts[k]).map((k) => `${DD.REACT[k].name} ${battle.reacts[k]}`).join(" · ");
        m.querySelector(".pview").innerHTML = `<div class="gk-isec stats">${rows.map((h) => `<div class="stat">${pic(h.id)}<div class="stat__bar"><div style="width:${(h.dealt / top) * 100}%"></div></div>${text("tag", DD.fmt(h.dealt))}</div>`).join("")}` +
          `<div class="stat__rx">${text("label", "Reactions")}${cream(rx || "None yet")}</div></div>`;
      }
    };
    draw();
    m.querySelector("#tv1").onclick = () => { view = "skills"; draw(); };
    m.querySelector("#tv2").onclick = () => { view = "dmg"; draw(); };
    const sndDraw = () => { m.querySelector(".pause__snd").innerHTML = soundPanel(); bindSoundPanel(m.querySelector(".pause__snd"), sndDraw); };
    sndDraw();
    m.querySelector("#resume").onclick = () => { m.remove(); battle.paused = false; };
    m.querySelector("#leave").onclick = () => { m.remove(); battle.paused = false; battle.finish(false); };
  }

  /** The simulated in-battle offer under the choice boxes (Dragon Fever; user: "iya benar"). */
  const offerFoot = `<button class="bt__offer">${text("label", "Battle Pack")}${text("number", "$2.99")}</button>`;
  function bindOffer(m) { const b = m.querySelector(".bt__offer"); if (b) b.onclick = purchaseOff; }

  function heroCall(battle, options, root) {
    let opts = options;
    const m = modal({ title: "Hero Call", cls: "pick pick--call", parent: root, body: `<div class="cards"></div>`, actions: `<span id="rr"></span>` });
    const wall = battle.heroes.filter((x) => x.onWall);
    const combo = (h) => {
      for (const x of wall) { const k = DD.comboOf(h.def, x.def); if (k) return `<span class="card__combo card__combo--${k}">${text("tag", "Combo: " + DD.REACT[k].name)}${text("tag", "with " + esc(x.def.short))}</span>`; }
      return "";
    };
    const draw = () => {
      m.querySelector(".cards").innerHTML = opts.map((h, i) => `<button class="card card--hero card2 gfc gfc--${tierCls(h.def.tier)}" data-i="${i}" style="animation-delay:${i * 60}ms">` +
        `<span class="gfc__win card2__win"><img src="${A(`heroes/${h.id}/bust.webp`)}" alt=""><span class="card2__el">${elTag(h.def.el)}</span></span>` +
        `<span class="card2__foot">${text("label", esc(h.def.short), "card2__name")}${text("tag", esc(DD.aimOf(h.def)), "card2__aim")}</span>${combo(h)}</button>`).join("");
      m.querySelector("#rr").innerHTML = btn({ v: "secondary", size: "sm", id: "reroll", cls: battle.callRefresh > 0 ? "" : "gk-btn--poor", icon: glyph("reroll"), label: "Refresh", sub: `Ad ${battle.callRefresh}` });
      m.querySelectorAll(".card").forEach((b) => (b.onclick = () => {
        const h = opts[+b.dataset.i];
        m.remove();
        DD.sfx(`audio/roar_${h.id}.mp3`, 0.6);
        battle.callHero(h);
      }));
      m.querySelector("#reroll").onclick = () => {
        if (battle.callRefresh <= 0) return DD.toast("No more refreshes");
        ad(() => { battle.callRefresh--; opts = battle.rollCall(); draw(); });
      };
    };
    draw();
    tip("call", root, "Pick a hero to join the wall");
  }

  const gemOf = (tier) => ({ rare: "rare", epic: "epic", legendary: "legendary", mythic: "legendary" }[tier]);
  function cardFace(c) {
    const h = c.hero.def;
    if (c.card) {
      // C43: Skill Cards and Evo Cards from DD.CARDS (js/cards-c43.js); `info` = the line under the cards that says what it does
      const k = c.card;
      if (k.type === "skill") {
        const val = k.pct ? "+" + DD.pct(c.v) : k.unit ? `+${c.v} s` : "+" + c.v;
        return { tier: c.tier, icon: h.icon, name: k.name, what: c.max ? "MAX" : "", val, tag: "", hero: h.id,
          info: `${val}${c.max ? ", its top limit" : k.cap === null ? "" : ` (up to ${k.pct ? "+" + DD.pct(k.cap) : k.unit ? `+${k.cap} s` : k.cap})`}${k.note ? ", " + k.note : ""}` }; // C53: note (Stun Time: near the wall)
      }
      const tag = k.type === "evo" ? "Evo" : k.type === "unique" ? "Unique" : "Mythic";
      return { tier: k.tier, icon: k.type === "evo" ? k.icon || h.evoIcon : h.icon, name: k.name, what: "", val: tag, tag: k.rep ? tag + " ×" : tag, hero: h.id, evo: k.type === "evo", info: k.text + (k.rep ? " Can be taken again." : "") };
    }
    if (c.evo) return { tier: "mythic", icon: h.evoIcon, name: h.evo.name, what: h.evo.text, val: "Evo", tag: "Evo", hero: h.id };
    if (c.evo2) return { tier: "mythic", icon: h.evoIcon, name: h.evo2.name, what: h.evo2.text, val: "Evo", tag: "Evo II", hero: h.id };
    const s = DD.CARD_STATS[c.stat];
    const val = s.pct ? "+" + DD.pct(c.v) : s.unit ? `+${c.v}${s.unit}` : "+" + c.v;
    return { tier: c.tier, icon: h.icon, name: `${h.noun} ${s.label}`, what: c.max ? "MAX" : "", val, tag: s.tag, hero: h.id };
  }
  function skillPick(battle, options, root) {
    let cards = options;
    const m = modal({
      title: "Skill Selection", cls: "pick", parent: root,
      body: `<div class="tiers"></div><div class="cards"></div><div class="pick__info"></div>`,
      actions: `<span id="rr"></span>`, foot: offerFoot,
    });
    bindOffer(m);
    const draw = () => {
      // C43: the tier odds right now (they move with every Free Refresh in this battle)
      const odds = Object.fromEntries(DD.cardOdds ? DD.cardOdds(battle.rerolls || 0) : DD.CARD_TIER_ODDS);
      m.querySelector(".tiers").innerHTML = DD.CARD_TIERS.slice().reverse().map((t) => `<span class="odd odd--${t}">${text("tag", `${DD.TIER_NAME[t]} ${Math.round(odds[t] * 1000) / 10}%`)}</span>`).join("");
      m.querySelector(".pick__info").innerHTML = cards.map((c) => { const f = cardFace(c); return f.info ? `<p class="pick__row gk-cream"><span class="oddl__n oddl--${f.tier}">${esc(f.name)}</span> ${esc(f.info)}</p>` : ""; }).join("");
      m.querySelector(".cards").innerHTML = cards.map((c, i) => {
        const f = cardFace(c);
        return `<button class="card ${c.evo || f.evo ? "card--evo" : ""} ${f.tier === "legendary" || f.tier === "mythic" ? "card--glow" : ""}" data-i="${i}" style="animation-delay:${i * 60}ms">` +
          `<span class="card__win card__win--${f.tier}"><span class="card__who">${pic(f.hero)}</span>${(c.evo || c.evo2 || f.tag) ? `<span class="card__tag">${text("tag", f.tag)}</span>` : ""}` +
          `${icon(f.icon, "card__icon")}${text("label", esc(f.name), "card__name" + (f.name.length > 11 ? " card__name--long" : ""))}` +
          `<span class="card__line">${f.what ? `<span class="gk-cream">${esc(f.what)}</span>` : ""}${text("number", f.val)}</span></span>` +
          `<img class="card__frame" src="${A("cards/frame.webp")}" alt=""><img class="card__gem" src="${A("lair/sheet_gem_" + gemOf(f.tier) + ".webp")}" alt=""></button>`;
      }).join("");
      m.querySelector("#rr").innerHTML =
        btn({ v: "secondary", size: "sm", id: "reroll", cls: battle.refresh > 0 ? "" : "gk-btn--poor", icon: glyph("reroll"), label: "Free Refresh", sub: `${battle.refresh}/${DD.FREE_REFRESH}` }) +
        btn({ v: "primary", size: "sm", id: "all", cls: battle.takeAll > 0 ? "" : "gk-btn--poor", label: "Take All", sub: `Ad ${battle.takeAll}/${DD.TAKE_ALL}` });
      m.querySelectorAll(".card").forEach((b) => (b.onclick = () => { m.remove(); battle.applyCard(cards[+b.dataset.i]); }));
      m.querySelector("#reroll").onclick = () => {
        if (battle.refresh <= 0) return DD.toast("No more free refreshes");
        battle.refresh--;
        cards = battle.reroll ? battle.reroll() : battle.rollCards(); // C43: every refresh moves the tier odds
        draw();
      };
      m.querySelector("#all").onclick = () => {
        if (battle.takeAll <= 0) return DD.toast("No more this battle");
        ad(() => { battle.takeAll--; m.remove(); battle.applyAll(cards); });
      };
    };
    draw();
    tip("skill", root, "Pick one card: it levels up that hero's weapon");
  }

  function revive(battle, root) {
    const left = 100 - Math.floor(battle.progress * 100);
    const m = modal({
      title: "Can Still Rescue",
      parent: root,
      body: cream(`${left <= 30 ? "Only " : ""}<em>${left}%</em> left to clear.`),
      actions: btn({ v: "neutral", label: "Give Up", id: "give" }) + btn({ v: "primary", label: "Revive", sub: "Ad", id: "rev" }),
    });
    m.querySelector("#rev").onclick = () => ad(() => { m.remove(); battle.revive(); });
    m.querySelector("#give").onclick = () => { m.remove(); battle.finish(false); };
  }

  function result(st, r, root) {
    const base = P.runRewards(st.n, r, st.hard);
    const pct = Math.round((r.win ? 1 : r.progress) * 100);
    // a big painted ribbon over the frame, the progress, the rewards in icon slots, two equal buttons (audit A13)
    const slot = (img, n) => `<span class="rslot">${icon(img)}${text("number", n)}</span>`;
    const m = modal({
      title: "Stage " + st.n,
      parent: root,
      cls: r.win ? "res res--win" : "res res--lose",
      body: `<div class="res__banner">${icon(r.win ? "lair/banner_gold.webp" : "lair/banner_red.webp")}${text("hero", r.win ? "Victory" : "Defeat")}</div>` +
        `<div class="res__prog"><div class="best"><div class="best__fill" style="width:${pct}%"></div></div>${text("label", pct + "%", "res__pctn")}</div>` +
        `<div class="rslots">${slot(IC.coin, "+" + DD.fmt(base.coins))}${slot(IC.exp, "+" + DD.fmt(base.exp))}${base.gear ? slot(IC.art, "×" + base.gear) : ""}${V4E ? (r.win ? slot(IC.recruit, "+" + (st.hard ? 2 : 1)) : "") : r.win && P.unlocked("enchant") ? slot(IC.stone, "+1") : ""}</div>`,
      actions: btn({ v: "neutral", label: "Confirm", id: "ok" }) +
        btn({ v: "primary", label: "Double Rewards", sub: `Ad ${P.doubleLeft()}/${DD.DOUBLE_DAY}`, id: "dbl", cls: P.doubleLeft() > 0 ? "" : "gk-btn--poor" }),
    });
    const finish = (double) => {
      m.remove();
      const out = P.endRun(st.n, r, double, st.hard);
      DD.bgm("bgm_home");
      tab = "home";
      loot("Rewards", out, () => {
        render();
        out.unlocked.forEach((f, i) => setTimeout(() => { snd("unlock"); DD.toast((DD.UNLOCK_NAME[f] || f) + " unlocked"); }, 300 + i * 1900));
      });
    };
    m.querySelector("#ok").onclick = () => finish(false);
    m.querySelector("#dbl").onclick = () => { if (P.doubleLeft() <= 0) return DD.toast("No more today"); ad(() => finish(true)); };
  }

  render();
})();
