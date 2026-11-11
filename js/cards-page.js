/* Skill Cards (cards.html; user no. 90, 2026-11-04: "daftar dari kotak2 level up yang digunakan untuk menambah kekuatan serang
   itu ... semua variasi yang ada. apa aja tiernya, ada berapa jenis dan ada berapa total di dalam, per heronya. buatkan ui dengan
   gambar"). Read-only: every number comes from js/data.js (DD.CARD_TIERS, DD.CARD_TIER_ODDS, DD.CARD_STATS, each hero's upg / evo /
   evo2), the card faces are the battle's own (js/screens.js cardFace + skillPick), drawn small (.card--mini, the name moves to the
   row's label). Nothing here changes a save. */
(function () {
  const A = (p) => "assets/" + (DD.skin ? DD.skin(p) : p);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const text = (lvl, t, cls) => `<span class="gk-text gk-text--${lvl} ${cls || ""}">${t}</span>`;
  const cream = (t, cls) => `<span class="gk-cream ${cls || ""}">${t}</span>`;
  const icon = (p, cls) => `<img class="${cls || ""}" src="${A(p)}" alt="" loading="lazy">`;
  const pic = (id, cls) => `<span class="pic pic--${DD.HERO[id].tier} ${cls || ""}"><img src="${A(`heroes/${id}/bust.webp`)}" alt="" loading="lazy"></span>`;
  const elTag = (el) => `<span class="el el--${el}">${text("tag", DD.ELEMENT_NAME[el] || el)}</span>`;
  const tierTag = (t) => `<span class="odd odd--${t}">${text("tag", DD.TIER_NAME[t])}</span>`;
  /** A tier's name in its colour (the Shop's odds line), narrow enough for a column over a small card. */
  const tierName = (t) => `<span class="oddl__n oddl--${t}">${DD.TIER_NAME[t]}</span>`;
  const btn = (o) => `<button class="gk-btn gk--${o.v || "neutral"} ${o.cls || ""}" ${o.data || ""}><span class="gk-btn__row"><span class="gk-text gk-btn__label">${o.label}</span></span></button>`;
  const gemOf = (tier) => ({ rare: "rare", epic: "epic", legendary: "legendary", mythic: "legendary" }[tier]);
  const TIERS = DD.CARD_TIERS; // rare, epic, legendary, mythic
  const ODDS = Object.fromEntries(DD.CARD_TIER_ODDS);
  const STATS = DD.CARD_STATS;
  const STAT_ORDER = ["dmg", "rate", "count", "pierce", "bounce", "size", "dur", "crit", "critDmg", "multi", "stun"];
  const SK_TIERS = ["rare", "epic", "legendary"]; // Skill Cards; a hero's Mythic Card is a combo card, below
  const val = (c, v) => (c.pct ? "+" + DD.pct(v) : c.unit ? `+${v} s` : "+" + v);
  const capTxt = (c) => (c.cap === null ? "<em>max</em> · no limit" : `up to <em>${c.pct ? "+" + DD.pct(c.cap) : c.unit ? `+${c.cap} s` : c.cap}</em>`);
  const KIND = { unique: "Unique", mythic: "Mythic", evo: "Evo" };

  /** One hero's cards (C43, js/cards-c43.js): Skill Cards with a value per tier, then its Unique, Mythic and Evo Cards. */
  function cardsOf(h) {
    const skill = h.cards.filter((c) => c.type === "skill"), special = h.cards.filter((c) => c.type !== "skill");
    const faces = skill.reduce((a, c) => a + Object.keys(c.tiers).length, 0) + special.length;
    return { skill, special, kinds: h.cards.length, faces, evos: special.filter((c) => c.type === "evo").length };
  }

  /** A battle card face, small: the hero, the picture, the value, the tier's window, frame and gem (no name: the row says it). */
  const face = (h, tier, ic, v, tag) =>
    `<div class="card card--mini ${tier === "legendary" || tier === "mythic" ? "card--glow" : ""} ${tag === "Evo" ? "card--evo" : ""}" role="img" aria-label="${esc(DD.TIER_NAME[tier] + " " + v)}">` +
    `<span class="card__win card__win--${tier}"><span class="card__who">${pic(h.id)}</span>` +
    `${icon(ic, "card__icon")}<span class="card__line">${tag ? text("tag", v) : text("number", v)}</span></span>` +
    `<img class="card__frame" src="${A("cards/frame.webp")}" alt=""><img class="card__gem" src="${A("lair/sheet_gem_" + gemOf(tier) + ".webp")}" alt=""></div>`;
  const blank = `<div class="cl-none" aria-hidden="true"></div>`;

  const box = (title, inner, cls) => `<section class="scard gfp ${cls || ""}"><span class="gfp__crest"></span><div class="scard__head"><div class="scard__plate">${text("label", esc(title))}</div></div>${inner}</section>`;

  function heroBox(h) {
    const c = cardsOf(h);
    const head = `<div class="scard__top">${icon(`heroes/${h.id}/bust.webp`, "scard__art cl-bust")}<div class="scard__txt">` +
      `<div class="cl-chips">${tierTag(h.tier)}${(h.els || [h.el]).map(elTag).join("")}</div>${cream(esc(h.line || h.tech))}` +
      `<div class="cl-count">${text("number", String(c.kinds))}${cream("kinds")}${text("number", String(c.faces))}${cream("cards")}${text("number", String(c.evos))}${cream("Evo")}</div></div></div>`;
    const cols = `<div class="cl-grid cl-grid--3 cl-grid--head"><span></span>${SK_TIERS.map((t) => `<span class="cl-th oddl">${tierName(t)}</span>`).join("")}</div>`;
    const rows = c.skill.map((k) => `<div class="cl-row"><div class="cl-rl">${text("label", esc(k.name))}${cream(capTxt(k))}</div>` +
      `<div class="cl-grid cl-grid--3"><span class="cl-gap"></span>${SK_TIERS.map((t) => (k.tiers[t] === undefined ? blank : face(h, t, h.icon, val(k, k.tiers[t])))).join("")}</div></div>`).join("");
    const special = c.special.map((k) => `<div class="cl-evo">${face(h, k.tier, k.type === "evo" ? k.icon || h.evoIcon : h.icon, KIND[k.type], KIND[k.type])}<div class="cl-evo__txt">` +
      `${text("label", esc(k.name))}<span class="cl-meta gk-cream"><span class="oddl__n oddl--${k.tier}">${DD.TIER_NAME[k.tier]}</span> ${KIND[k.type]} Card · opens at hero Lv ${k.lv}${k.rep ? " · can be taken again" : ""}</span>${cream(esc(k.text))}</div></div>`).join("");
    return `<div class="cl-hero" data-tier="${h.tier}" id="h-${h.id}">` + box(h.name, head + cols + rows + special) + `</div>`;
  }

  function render() {
    const heroes = DD.HEROES;
    const all = heroes.map(cardsOf);
    const total = all.reduce((a, c) => a + c.faces, 0);
    const kinds = all.reduce((a, c) => a + c.kinds, 0);
    const evoN = all.reduce((a, c) => a + c.evos, 0);
    const skillOf = (k) => heroes.flatMap((h) => h.cards.filter((c) => c.type === "skill" && c.stat === k));
    const o1 = Object.fromEntries(DD.cardOdds(1));
    const pc = (x) => Math.round(x * 1000) / 10 + "%";

    const tiersBox = box("Card Tiers", `<div class="cl-tiers">${TIERS.slice().reverse().map((t) => `<div class="cl-tier">${tierTag(t)}${text("number", pc(ODDS[t]))}</div>`).join("")}</div>` +
      cream(`Every level-up in battle offers <em>3</em> cards; the one you pick powers up one hero's attack. A hero takes at most <em>${DD.SKILL_MAX}</em> cards in one battle, Evo included.`) +
      cream(`Each Free Refresh moves the odds for the rest of the battle: Rare <em>−1.5%</em>, the other three <em>+0.5%</em> each (after one: Rare ${pc(o1.rare)}, Epic ${pc(o1.epic)}, Legendary ${pc(o1.legendary)}, Mythic ${pc(o1.mythic)}).`));
    // one stat = its name and how many heroes have it, then the most common value in each tier
    const common = (list, t) => { const n = {}; for (const c of list) if (c.tiers[t] !== undefined) { const v = val(c, c.tiers[t]); n[v] = (n[v] || 0) + 1; } const e = Object.entries(n).sort((a, b) => b[1] - a[1])[0]; return e ? e[0] : "—"; };
    const statRows = STAT_ORDER.filter((k) => skillOf(k).length).map((k) => { const L = skillOf(k); return `<div class="cl-sl">${text("label", STATS[k] ? STATS[k].label : k)}${cream(`${L.length} heroes`)}</div>` +
      SK_TIERS.map((t) => `<span class="cl-sv">${text("number", common(L, t), "oddl--" + t)}</span>`).join(""); }).join("");
    const statsBox = box("Stat Kinds", `<div class="cl-sgrid cl-sgrid--3">${SK_TIERS.map((t) => `<span class="cl-sv oddl">${tierName(t)}</span>`).join("")}${statRows}</div>` +
      cream(`Every tier is higher than the one below it. Each hero has 4 or 5 Skill Cards, each with its own top limit or none (max), plus a Unique, a Mythic and 2 or 3 Evo Cards.`));
    const byTier = DD.TIERS.map((t) => [t, heroes.filter((h) => h.tier === t).length]).filter(([, n]) => n);
    const totalBox = box("All Heroes", `<div class="cl-total">` +
      `<div>${text("number", String(heroes.length))}${cream("heroes")}</div><div>${text("number", String(kinds))}${cream("kinds")}</div>` +
      `<div>${text("number", String(total))}${cream("cards")}</div><div>${text("number", String(evoN))}${cream("Evo Cards")}</div></div>` +
      cream(`Cards = each Skill Card in each of its tiers, plus the Unique, Mythic and Evo Cards.`) + cream(`Heroes by grade: ` + byTier.map(([t, n]) => `${DD.TIER_NAME[t]} <em>${n}</em>`).join(" · ")));
    const filters = `<div class="phead cl-lhead">${text("title", "Heroes")}${text("tag", "Show one grade, or all")}</div><div class="cl-filter">${[["all", "All"], ...byTier.map(([t]) => [t, DD.TIER_NAME[t]])].map(([k, l]) => btn({ v: k === "all" ? "primary" : "secondary", label: l, data: `data-f="${k}"` })).join("")}</div>`;

    document.getElementById("app").innerHTML =
      `<div class="screen lobby cl"><div class="pgbg pgbg--heroes" aria-hidden="true"></div><div class="cl-bar"></div><div class="page cl-page">` +
      `<div class="phead">${text("title", "Skill Cards")}${text("tag", `${total} cards for ${heroes.length} heroes`)}</div>` +
      tiersBox + statsBox + totalBox + filters + `<div class="cl-list">${heroes.map(heroBox).join("")}</div>` +
      `</div><div></div></div>`;
    document.querySelectorAll(".cl-filter [data-f]").forEach((b) => (b.onclick = () => {
      const f = b.dataset.f;
      document.querySelectorAll(".cl-filter [data-f]").forEach((x) => { x.classList.toggle("gk--primary", x === b); x.classList.toggle("gk--secondary", x !== b); });
      document.querySelectorAll(".cl-hero").forEach((el) => (el.hidden = f !== "all" && el.dataset.tier !== f));
    }));
  }
  render();
})();
