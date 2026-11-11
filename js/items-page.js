/* Equipment & Artifacts (items.html; user no. 93, 2026-11-05: "buat lagi listing dari equipement dan artifact. tambah banyak equipment
   lagi dan artifact. aku akan check nanti"). Read-only: every number comes from js/data.js and js/items-c44.js (DD.SLOTS, DD.EQ_FX,
   DD.EQ_LEGENDS, DD.COLLECTION …); the tiles are the game's own (.gear from the Party page, .coll from the Artifacts page). Nothing here
   changes a save. */
(function () {
  const A = (p) => "assets/" + (DD.skin ? DD.skin(p) : p);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const text = (lvl, t, cls) => `<span class="gk-text gk-text--${lvl} ${cls || ""}">${t}</span>`;
  const cream = (t, cls) => `<span class="gk-cream ${cls || ""}">${t}</span>`;
  const icon = (p, cls) => `<img class="${cls || ""}" src="${A(p)}" alt="" loading="lazy">`;
  const btn = (o) => `<button class="gk-btn gk--${o.v || "neutral"} ${o.cls || ""}" ${o.data || ""}><span class="gk-btn__row"><span class="gk-text gk-btn__label">${o.label}</span></span></button>`;
  const box = (title, inner, cls) => `<section class="scard gfp ${cls || ""}"><span class="gfp__crest"></span><div class="scard__head"><div class="scard__plate">${text("label", esc(title))}</div></div>${inner}</section>`;
  const fmt = DD.fmt || ((n) => String(n));
  const fmtCost = DD.fmtCost || fmt; // prices round up (B1)
  const pc = (x) => Math.round(x * 1000) / 10 + "%";
  const NEW = `<span class="it-new">${text("tag", "New")}</span>`;
  const RAR = DD.GEAR_RARITY; // normal … legendary
  const RNAME = DD.GEAR_RARITY_NAME;
  const rarName = (r) => `<span class="oddl__n oddl--g-${RAR[r]}">${RNAME[RAR[r]]}</span>`;
  const ART_G = { fine: "g-normal", superior: "g-superior", rare: "g-rare", epic: "g-epic", mythic: "g-mythic" }; // artifact tier → the gear colours
  if (DD.V4 && DD.v4a) Object.assign(ART_G, { common: "common", rare: "rare", epic: "epic", legendary: "legendary" }); // v4 B5: the hero tier names and colours
  const artTier = (t) => `<span class="oddl__n oddl--${ART_G[t]}">${DD.COLL_TIERS[t].name}</span>`;
  const EQ_LAB = { atk: "ATK", hp: "Wall HP", crit: "Crit", haste: "Haste" };
  const eqNum = (stat, v) => "+" + fmt(Math.round(stat === "hp" ? v : v * 1000));
  const statName = (s) => (DD.ATTR[s] ? DD.ATTR[s].name : s.startsWith("el_") ? (DD.ELEMENT_NAME[s.slice(3)] || s.slice(3)) + " DMG" : s);
  const fxNum = (k, r, t) => "+" + fmt(DD.pts(DD.EQ_FX[k].stat, DD.fxValue(k, { r, tier: t || 1 })));
  const OLD_FX = ["dragonbane", "keen", "reach", "linger", "swift", "el_fire", "el_water", "el_electric", "el_nature", "el_physical"];
  const OLD_ART = ["lucky_coin", "thiefs_lockpick", "alchemists_flask", "hunters_trophy", "dragon_compass", "royal_seal", "frostfire_ember", "dragon_scale", "phoenix_feather", "void_hourglass"];

  /** The game's equipment tile (js/screens.js gearTile), without stars or tier dots: picture, the number, what it raises. */
  const tile = (g, o) => {
    o = o || {};
    const sl = DD.SLOT[g.slot];
    return `<span class="gear gear--${RAR[g.r]} it-gear"><span class="gear__art">${icon(DD.eqArt(g), "gear__ic")}</span>` +
      (o.bare ? "" : text("number", eqNum(sl.stat, DD.gearValue(g)), "gear__val") + cream(EQ_LAB[sl.stat], "gear__lab")) + `</span>`;
  };
  const piece = (slot, type, r, tier) => ({ slot, type, r, tier: tier || 1, fx: [] });
  const typeOf = (k) => (DD.WEAPON_TYPES[k] ? piece("weapon", k, 4) : piece(k, undefined, 4));

  /* ------------------------------------------------------------------ Equipment */
  function equipment() {
    const odds = DD.CHEST_ODDS[0], dragon = DD.DRAGON_CHEST.odds;
    // C46 (user no. 95): six rarities, tiers only; Mythic comes only from a fuse
    const rarity = box("Rarity", `<div class="it-rar it-rar--3">${RAR.map((_, r) => `<div class="it-rar__c">${tile(piece("weapon", "sword", r))}${rarName(r)}` +
      `${text("number", "×" + DD.GEAR_MULT[r])}${cream((DD.fxCount(r) ? `${DD.fxCount(r)} effect${DD.fxCount(r) > 1 ? "s" : ""}` : "no effect") + (r >= DD.MYTHIC ? "<br>from Fuse only" : ""))}</div>`).join("")}</div>` +
      cream(`The number of a piece = its slot's number × its rarity × its tier (shown on a Tier 1 sword). Each rarity is ×<em>2</em> the one below. Epic carries <em>1</em> effect, Legendary <em>2</em>, Mythic <em>3</em>.`) +
      `<div class="it-odds">${text("label", "Equipment Chest")}${cream(odds.map((p, r) => `${RNAME[RAR[r]]} <em>${pc(p)}</em>`).join(" · "))}</div>` +
      `<div class="it-odds">${text("label", "Dragon Chest")}${cream(dragon.map((p, r) => `${RNAME[RAR[r]]} <em>${pc(p)}</em>`).join(" · ") + ` · a won battle drops one <em>${pc(DD.DRAGON_CHEST.chance)}</em> of the time (Hard <em>${pc(DD.DRAGON_CHEST.hard)}</em>)`)}</div>`);

    const slots = box("Slots", `<div class="it-list">${DD.SLOTS.map((s) => {
      const g = piece(s.id, s.id === "weapon" ? "sword" : undefined, 0);
      const names = s.id === "weapon" ? "Iron, Steel, Runed, Dragonbone + the weapon type" : DD.EQ_MAT.map((m) => `${m} ${DD.EQ_NOUN[s.id]}`).join(", ");
      return `<div class="it-row">${tile(g)}<div class="it-row__t">${text("label", s.name)}${cream(`Raises <em>${EQ_LAB[s.stat]}</em> · Tier 1 Normal ${eqNum(s.stat, DD.gearValue(g))}`)}${cream(names)}</div></div>`;
    }).join("")}</div>` + cream(`Every hero wears six pieces. ATK, Crit and Haste count for the hero who wears them; Helm and Armor add Wall HP for the whole wall.`));

    const users = (k) => Object.entries(DD.HERO_WEAPON).filter(([, t]) => t === k).length;
    const types = box("Weapon Types", `<div class="it-grid3">${Object.entries(DD.WEAPON_TYPES).map(([k, n]) =>
      `<div class="it-cell">${tile(piece("weapon", k, 3), { bare: true })}${text("label", n)}${cream(`${users(k)} hero${users(k) === 1 ? "" : "es"}`)}</div>`).join("")}</div>` +
      cream(`A hero can only wear a weapon of its own type. Hammer joined Axe: the Crusader takes an Axe now, and a Hammer in the bag became an Axe.`));

    const fxRows = Object.entries(DD.EQ_FX).map(([k, f]) => `<div class="it-fx">${text("label", esc(f.name))}${OLD_FX.includes(k) ? "" : NEW}` +
      `${cream(`${statName(f.stat)} at Tier 1: Epic <em>${fxNum(k, 3)}</em> · Legendary <em>${fxNum(k, 4)}</em> · Mythic <em>${fxNum(k, 5)}</em>`, "it-fx__v")}</div>`).join("");
    const effects = box("Effects", `<div class="it-fxs">${fxRows}</div>` + cream(`An effect grows with the tier like the piece's own number (Tier 20 = ×2), and doubles with each rarity.`));

    const legend = box("Legendary Pieces", `<div class="it-list">${Object.entries(DD.EQ_LEGENDS).map(([k, L3]) => {
      const nm = DD.WEAPON_TYPES[k] || DD.SLOT[k].name;
      return `<div class="it-leg">${tile(typeOf(k), { bare: true })}<div class="it-leg__t">${text("label", nm)}` +
        L3.map((l, i) => `<div class="it-leg__n">${cream(`<b>${esc(l.name)}</b>`, "it-leg__nm")}${i ? NEW : ""}${cream(l.fx ? `${DD.EQ_FX[l.fx].name} + 1 random effect` : "2 random effects", "it-leg__fx")}</div>`).join("") + `</div></div>`;
    }).join("")}</div>` + cream(`A Legendary is one of three named pieces, picked when it drops or fuses. Two of the same name at Tier 20 fuse into a <b>Mythic</b> with that name and a third effect.`));

    // C46 (user no. 95: "stars di hapuskan permanent, yang ada hanyalah tier ..."): one sword up the tiers and through two fuses
    const band = ["silver", "gold", "ruby", "violet"];
    const dots = (t) => `<span class="gear__tiers gear__tiers--${band[Math.floor((t - 1) / 5) % band.length]}">${"<i></i>".repeat(((t - 1) % 5) + 1)}</span>`;
    const step = (r, t) => { const g = piece("weapon", "sword", r, t);
      return `<div class="it-rar__c"><span class="gear gear--${RAR[r]} it-gear"><span class="gear__art">${icon(DD.eqArt(g), "gear__ic")}${dots(t)}</span>` +
        text("number", eqNum("atk", DD.gearValue(g)), "gear__val") + cream("ATK", "gear__lab") + `</span>${rarName(r)}${cream(`Tier ${t}`)}</div>`; };
    const c1 = DD.tierUpCost(piece("weapon", "sword", 0, 1)), c19 = DD.tierUpCost(piece("weapon", "sword", 4, 19));
    const growth = box("Tier and Fuse", `<div class="it-rar it-rar--3">${[[0, 1], [0, 20], [1, 1], [4, 20], [5, 1], [5, 40]].map(([r, t]) => step(r, t)).join("")}</div>` +
      `<div class="it-list it-list--txt">` +
      cream(`<b>Tier</b>: every rarity has Tier 1 to <em>${DD.TIER_TOP}</em>. Each tier adds 1/19 of the Tier 1 number, so Tier 20 gives ×<em>2</em>; the effects grow the same way. Drops: Tier 1 <em>${pc(DD.DROP_TIERS[0])}</em>, Tier 2 <em>${pc(DD.DROP_TIERS[1])}</em>, Tier 3 <em>${pc(DD.DROP_TIERS[2])}</em>.`) +
      cream(`<b>Tier Up</b>: coins and Enchant Stones raise a piece one tier (Normal Tier 1 → 2: <em>${fmt(c1.coins)}</em> coins, <em>${c1.stones}</em> stone; Legendary Tier 19 → 20: <em>${fmt(c19.coins)}</em> coins, <em>${c19.stones}</em> stones).`) +
      cream(`<b>Fuse</b>: two pieces with the same name, both at Tier 20 → one piece of the next rarity at Tier <em>1</em>, worth what Tier 20 was. Epic → Legendary picks one of the three Legendary names; Legendary → Mythic keeps the name and adds a third effect.`) +
      cream(`<b>Mythic</b> has no top tier: it keeps going up, 1/19 of its Tier 1 number a tier, without end. Stars are gone: a piece's old stars came back as Enchant Stones.`) + `</div>`);
    return rarity + slots + types + effects + legend + growth;
  }

  /* ------------------------------------------------------------------ Equipment, Rancangan v4 B4 (G6 §5, G9 §8; js/v4-level.js) */
  function equipmentV4() {
    const L = DD.v4.lv, R = [0, 1, 2, 3, 4], RN = L.RARITY;
    const rn = (r) => `<span class="oddl__n oddl--${RN[r].toLowerCase()}">${RN[r]}</span>`;
    const pts = (g) => "+" + fmt(L.atkPts(g));
    const vtile = (g, bare) => `<span class="gear gear--${RAR[g.r]} it-gear"><span class="gear__art">${icon(DD.eqArt(g), "gear__ic")}</span>` +
      (bare ? "" : text("number", pts(g), "gear__val") + cream("ATK", "gear__lab")) + `</span>`;
    const odds = (arr) => arr.map((p, r) => [p, r]).filter(([p]) => p > 0).map(([p, r]) => `${RN[Math.min(4, r)]} <em>${pc(p)}</em>`).join(" · ");
    const rarity = box("Rarity", `<div class="it-rar">${R.map((r) => `<div class="it-rar__c">${vtile(piece("weapon", "sword", r))}${rn(r)}${text("number", "×" + Math.pow(2, r))}` +
      cream(r >= 2 ? `${r - 1} effect${r > 2 ? "s" : ""}` : "no effect") + `</div>`).join("")}</div>` +
      cream(`A piece's ATK = its slot's points × its rarity × its tier (shown on a Tier 1 sword). Each rarity is ×<em>2</em> the one below. Only a Weapon carries effects: Epic <em>1</em>, Legendary <em>2</em>, Mythic <em>3</em>.`) +
      `<div class="it-odds">${text("label", "Equipment Chest")}${cream(odds(DD.v4.eco ? DD.v4.eco.GEAR_ODDS[1] : DD.CHEST_ODDS[0]) + (DD.v4.eco ? " · a piece for one hero of the party" : ""))}</div>` +
      `<div class="it-odds">${text("label", "Dragon Chest")}${cream((DD.v4.eco ? `Up to Stage 40: ${odds(DD.v4.eco.GEAR_ODDS[0])} · from Stage 41: ${odds(DD.v4.eco.GEAR_ODDS[1])}` : odds(DD.DRAGON_CHEST.odds)) + ` · a won battle drops one <em>${pc(DD.DRAGON_CHEST.chance)}</em> of the time (Hard <em>${pc(DD.DRAGON_CHEST.hard)}</em>)`)}</div>`);
    const gives = (id) => {
      const g = piece(id, id === "weapon" ? "sword" : undefined, 0), out = [`ATK <em>${pts(g)}</em>`];
      if (L.HP[id]) out.push(`Wall HP <em>+${fmt(L.hpOf(g))}</em>`);
      for (const [k, v] of Object.entries(L.FIXED[id] || {})) out.push(`${k === "crit" ? "Crit" : "Haste"} <em>+${pc(v)}</em> at every rarity and tier`);
      return out.join(" · ");
    };
    const slots = box("Slots", `<div class="it-list">${DD.SLOTS.map((sl) => {
      const g = piece(sl.id, sl.id === "weapon" ? "sword" : undefined, 0);
      const names = sl.id === "weapon" ? "Iron, Steel, Runed + the weapon type; from Legendary the type's Legendary name" : DD.EQ_MAT.slice(0, 3).map((m) => `${m} ${DD.EQ_NOUN[sl.id]}`).join(", ");
      return `<div class="it-row">${vtile(g)}<div class="it-row__t">${text("label", sl.name)}${cream(`Common Tier 1: ${gives(sl.id)}`)}${cream(names)}</div></div>`;
    }).join("")}</div>` +
      cream(`Every hero wears six pieces. ATK points count for the hero who wears them (<em>1</em> point = <em>0.1%</em> ATK); Helm and Armor add Wall HP for the whole wall.`));
    const users = (k) => Object.entries(DD.HERO_WEAPON).filter(([, t]) => t === k).length;
    const types = box("Weapon Types", `<div class="it-grid3">${Object.entries(DD.WEAPON_TYPES).map(([k, n]) =>
      `<div class="it-cell">${vtile(piece("weapon", k, 3), true)}${text("label", n)}${cream(`${users(k)} hero${users(k) === 1 ? "" : "es"}`)}</div>`).join("")}</div>` +
      cream("A hero can only wear a weapon of its own type."));
    const fxRows = Object.entries(L.FX).map(([k, v]) => `<div class="it-fx">${text("label", esc(DD.EQ_FX[k].name))}` +
      cream(`${statName(DD.EQ_FX[k].stat)}: Epic <em>+${pc(v[0])}</em> · Legendary <em>+${pc(v[1])}</em> · Mythic <em>+${pc(v[2])}</em>`, "it-fx__v") + `</div>`).join("");
    const effects = box("Weapon Effects", `<div class="it-fxs">${fxRows}</div>` + cream("An effect's number depends on the rarity only: Tier Up does not change it."));
    const tierRow = (r) => {
      const g1 = piece("weapon", "sword", r, 1), g10 = piece("weapon", "sword", r, 10), g19 = piece("weapon", "sword", r, 19), g20 = piece("weapon", "sword", r, 20);
      return `<div class="it-fx">${rn(r)}` +
        cream(`Sword ATK: Tier 1 <em>${pts(g1)}</em> · Tier 10 <em>${pts(g10)}</em> · Tier 20 <em>${pts(g20)}</em>${r >= 4 ? ", no top tier" : ""}`, "it-fx__v") +
        cream(`Tier Up: 1 → 2 <em>${fmtCost(L.tierPrice(g1))}</em> · 10 → 11 <em>${fmtCost(L.tierPrice(g10))}</em> · 19 → 20 <em>${fmtCost(L.tierPrice(g19))}</em> coins`, "it-fx__v") +
        cream(r < 4 ? `Fuse → ${RN[r + 1]}: a second one at Tier 20, or <em>${L.fuseStoneCost(g1)}</em> Fuse Stones · Disassemble: <em>${Math.pow(2, r)}</em> Fuse Stone${r ? "s" : ""}`
          : `Disassemble: <em>${Math.pow(2, r)}</em> Fuse Stones`, "it-fx__v") + `</div>`;
    };
    const growth = box("Tier and Fuse", `<div class="it-fxs">${R.map(tierRow).join("")}</div><div class="it-list it-list--txt">` +
      cream(`<b>Tier</b>: Tier 1 to <em>20</em>; each tier is ×<em>1.037</em>, so Tier 20 = ×<em>2</em>. Drops: Tier 1 <em>${pc(DD.DROP_TIERS[0])}</em>, Tier 2 <em>${pc(DD.DROP_TIERS[1])}</em>, Tier 3 <em>${pc(DD.DROP_TIERS[2])}</em>.`) +
      cream("<b>Tier Up</b> costs coins only; the price is the same for every slot.") +
      cream("<b>Fuse</b>: two pieces with the same name at Tier 20 make one piece of the next rarity at Tier 1 with the same ATK; or one piece and Fuse Stones.") +
      cream("<b>Disassemble</b> breaks a piece into Fuse Stones. <b>Mythic</b> has no top tier.") + `</div>`);
    const legend = box("Legendary Pieces", `<div class="it-list">${Object.keys(DD.EQ_LEGENDS).map((k) =>
      `<div class="it-leg">${vtile(typeOf(k), true)}<div class="it-leg__t">${text("label", DD.WEAPON_TYPES[k] || DD.SLOT[k].name)}` +
      `<div class="it-leg__n">${cream(`<b>${esc(DD.EQ_LEGEND[k] || "")}</b>`, "it-leg__nm")}</div></div></div>`).join("")}</div>` +
      cream("From Legendary a piece carries its type's Legendary name; a Mythic keeps it."));
    return rarity + slots + types + effects + growth + legend;
  }

  /* ------------------------------------------------------------------ Artifacts */
  const TIER_ORDER = DD.V4 && DD.v4a ? DD.v4a.TIERS : ["fine", "superior", "rare", "epic"]; // released tiers; Mythic artifacts are locked (C46)
  /** One artifact: its card, name, tier, the line at Lv 1 and Lv 10, every level's number (C45, user no. 94: "di tengah2 nya apa?"),
      how it works where the line alone does not say it, and whether its picture is still to paint. */
  function artCard(a) {
    const art = a.noArt ? `<span class="it-noart">${icon("2a/ic_artifacts.webp", "coll__art")}</span>` : icon(a.icon, "coll__art");
    const max = a.max || DD.COLL_MAX;
    const strip = a.num ? `<div class="it-strip">${text("tag", esc(a.lab || ""))}<div class="it-strip__g ${max < 5 ? "it-strip__g--" + max : ""}">${Array.from({ length: max }, (_, i) =>
      `<span class="it-lv">${text("tag", "Lv " + (i + 1))}${cream(esc(a.num(a.v(i + 1))))}</span>`).join("")}</div></div>` : "";
    return `<div class="it-art" data-tier="${a.tier}"><div class="coll coll--${a.tier} it-coll">${art}${text("tag", esc(a.name), "coll__name")}</div>` +
      `<div class="it-art__t"><div class="it-art__h">${text("label", esc(a.name))}${OLD_ART.includes(a.id) || a.locked ? "" : NEW}${a.locked ? `<span class="it-lock">${text("tag", "Locked")}</span>` : ""}</div>` +
      artTier(a.tier) +
      cream(`<b>Lv 1</b> ${esc(a.line(a.v(1)))}`) + cream(`<b>Lv ${max}</b> ${esc(a.line(a.v(max)))}`) +
      (a.noArt ? cream("Picture: still to paint", "it-art__pic") : "") + `</div>` + strip + (a.note ? cream(esc(a.note), "it-art__note") : "") + `</div>`;
  }
  /** Rancangan v4 B5: chest, pity, Relic Dust and slots in words */
  const artV4 = () => {
    const A = DD.v4a, d = (t) => `${A.tierName(t)} ${A.DUST[t].join(", ")} (${A.DUST[t].reduce((x, y) => x + y, 0)})`;
    return cream(`Each Artifact Chest (Shop, <em>${A.CHEST_GEMS}</em> gems; ×10 for <em>${fmt(A.CHEST10_GEMS)}</em>) gives one artifact: first the tier by the chances above, then one artifact of that tier. An Epic or better comes at the latest at the <em>${A.PITY_E}th</em> chest since the last one, a Legendary at the <em>${A.PITY_L}th</em>.`) +
      cream(`The first copy opens an artifact at Lv 1; every later copy becomes <em>1</em> Relic Dust of its tier, which levels up any artifact of that tier. Dust for Lv 2 → ${DD.COLL_MAX}: ${A.TIERS.map(d).join(" · ")}.`) +
      cream(`<em>3</em> are worn at a time, <em>4</em> from Stage ${A.SLOTS[1][0]}, <em>5</em> from Stage ${A.SLOTS[0][0]}.`);
  };
  function artifacts() {
    const tw = Object.values(DD.COLL_TIERS).reduce((a, t) => a + t.w, 0);
    const n = (t) => DD.RELEASED.filter((a) => a.tier === t).length;
    const tiers = box("Artifact Tiers", `<div class="it-rar it-rar--4">${TIER_ORDER.map((t) => `<div class="it-rar__c">${artTier(t)}` +
      `${text("number", pc(DD.COLL_TIERS[t].w / tw))}${cream(`${n(t)} artifacts`)}</div>`).join("")}</div>` +
      (DD.V4 && DD.v4a ? artV4() : // Rancangan v4 B5 (js/v4-artifacts.js)
      cream(`Each Artifact Chest (Shop, <em>${DD.ART_CHEST_GEMS}</em> gems; ten for the price of nine) gives one copy: first the tier by the chances above, then one artifact of that tier.`) +
      cream(`Copies raise an artifact Lv 1 → ${DD.COLL_MAX}: ${DD.COLL_COPIES.join(", ")} copies (${DD.COLL_COPIES.reduce((a, b) => a + b, 0)} in all). <em>${DD.ART_WORN}</em> are worn at a time.`)) +
      cream(`Every released artifact grows the same way: each level adds half of its Lv 1 number, so Lv 10 = <em>5.5×</em> Lv 1 and no level is empty.`));
    const filters = `<div class="phead cl-lhead">${text("title", "Artifacts")}${text("tag", "Show one tier, or all")}</div><div class="cl-filter it-afilter">${[["all", "All"], ...TIER_ORDER.map((t) => [t, DD.COLL_TIERS[t].name])].map(([k, l]) => btn({ v: k === "all" ? "primary" : "secondary", label: l, data: `data-af="${k}"` })).join("")}</div>`;
    const list = TIER_ORDER.flatMap((t) => DD.RELEASED.filter((a) => a.tier === t)).map(artCard).join("");
    const locked = DD.COLLECTION.filter((a) => a.locked);
    return tiers + filters + box("All Artifacts", `<div class="it-arts">${list}</div>`) +
      box("Mythic · Locked", cream(`Not released yet: no chest gives them and the game does not show them. <em>${locked.length}</em> artifacts, <em>3</em> levels each (${DD.V4 && DD.v4a ? "Mythic Dust " + DD.v4a.DUST.mythic.join(", ") : "copies " + (locked[0] ? locked[0].copies.join(", ") : "")}).`) + `<div class="it-arts">${locked.map(artCard).join("")}</div>`);
  }

  const V4EQ = !!(DD.V4 && DD.v4 && DD.v4.lv); // Rancangan v4 B4
  function render() {
    const plainNames = (Object.keys(DD.WEAPON_TYPES).length + Object.keys(DD.EQ_NOUN).length) * (V4EQ ? 3 : DD.EQ_MAT.length); // v4: Iron, Steel, Runed
    const legN = V4EQ ? Object.keys(DD.EQ_LEGENDS).length : Object.values(DD.EQ_LEGENDS).reduce((a, l) => a + l.length, 0); // v4: one Legendary name a type
    const total = box("All Items", `<div class="cl-total">` +
      `<div>${text("number", String(plainNames + legN))}${cream("pieces")}</div><div>${text("number", String(V4EQ ? 5 : RAR.length))}${cream("rarities")}</div>` +
      `<div>${text("number", String(V4EQ ? Object.keys(DD.v4.lv.FX).length : Object.keys(DD.EQ_FX).length))}${cream("effects")}</div><div>${text("number", String(DD.RELEASED.length))}${cream("artifacts")}</div></div>` +
      cream(`Pieces = every name: ${plainNames} plain names (material + weapon type or slot) and ${legN} Legendary names (a Mythic keeps its Legendary name). Artifacts: ${DD.RELEASED.length} released, ${DD.COLLECTION.length - DD.RELEASED.length} Mythic locked.`));
    const tabs = `<div class="cl-filter it-tabs">${btn({ v: "primary", label: "Equipment", data: 'data-tab="eq"' })}${btn({ v: "secondary", label: "Artifacts", data: 'data-tab="art"' })}</div>`;
    document.getElementById("app").innerHTML =
      `<div class="screen lobby cl"><div class="pgbg pgbg--heroes" aria-hidden="true"></div><div class="cl-bar"></div><div class="page cl-page">` +
      `<div class="phead">${text("title", "Equipment & Artifacts")}${text("tag", `${plainNames + legN} pieces · ${DD.RELEASED.length} artifacts`)}</div>` +
      total + tabs + `<div class="it-sec" data-sec="eq">${V4EQ ? equipmentV4() : equipment()}</div><div class="it-sec" data-sec="art" hidden>${artifacts()}</div>` +
      `</div><div></div></div>`;
    const pick = (sel, attr, f) => document.querySelectorAll(sel).forEach((x) => { const on = x.dataset[attr] === f; x.classList.toggle("gk--primary", on); x.classList.toggle("gk--secondary", !on); });
    document.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => {
      pick("[data-tab]", "tab", b.dataset.tab);
      document.querySelectorAll(".it-sec").forEach((s) => (s.hidden = s.dataset.sec !== b.dataset.tab));
    }));
    document.querySelectorAll("[data-af]").forEach((b) => (b.onclick = () => {
      const f = b.dataset.af;
      pick("[data-af]", "af", f);
      document.querySelectorAll(".it-art").forEach((el) => (el.hidden = f !== "all" && el.dataset.tier !== f));
    }));
    if (location.hash === "#artifacts") document.querySelector('[data-tab="art"]').click();
  }
  render();
})();
