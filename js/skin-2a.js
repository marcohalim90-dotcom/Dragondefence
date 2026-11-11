/* DUNGEON DICE 2A — the "Obsidian & Gold" skin (docs/TEMA_2A.md; 2026-10-31, user: "ganti tema aja.. buat tema serius ... yang pasti
   ga usah pakai aset dungeon and dice. pakai gpt generate baru ... hero di kael dulu").
   Every picture the screens and the battle ask for goes through DD.skin(path): the old Dungeon & Dice path is answered with the new
   ChatGPT picture in assets/2a/ (sheets cut by tools/cut-2a-sheet.py). Paths without a new picture yet are returned as they are.
   Every page is 2A. Battle: every hero of the party fights (2026-11-01, bug list A1, Confirmed C25 group 2): each has a back
   figure (A13), its attack and statuses are 2A paintings (A14, A15) and its skill icons too (A16). */
(function () {
  DD.SKIN = "2a";
  DD.SKIN_PORTRAITS = ["spellsword", "ebenezer", "half-goblin", "enchantress", "mercenary", "tracker", "dwarf", "occultist", "leprechaun", "knight",
    "jack-frost", "cassandra", "sorceress", "crusader", "tou-lak", "alchemist", "alexandra", "marpesia", "loeg-yllavyre", "amar-suen",
    "minstrel", "scout", "klaus", "archaeologist", "sugarplum-faerie", "tristan", "guild-leader", "szopin", "time-traveler", "viking", "dreamwalker", "kael-dragon"]; // + C33 G7, C36 G3 // the heroes that have 2A art (user: "hero di kael dulu")
  DD.SKIN_FIGURES = DD.SKIN_PORTRAITS; // every hero has a 2A full-body figure facing us (sheets A10, 2026-11-01)
  DD.SKIN_HEROES = DD.SKIN_PORTRAITS; // every hero fights: each has a 2A back figure (sheets A13, C25 group 2)
  DD.SKIN_RELICS = ["lucky_coin", "thiefs_lockpick", "alchemists_flask", "hunters_trophy", "dragon_compass", "royal_seal", "frostfire_ember", "dragon_scale", "phoenix_feather", "kaels_sigil", "void_hourglass"]; // Collection relics with a 2A painting
  const MAP = {
    "icons/icon_currency_coin.webp": "2a/ic_coin.webp",
    "icons/icon_currency_gem.webp": "2a/ic_gem.webp",
    "icons/icon_game_chest.webp": "2a/ic_chest.webp",
    "icons/icon_game_lock.webp": "2a/ic_lock.webp",
    "icons/icon_feature_sound.webp": "2a/ic_sound.webp",
    "glyphs/glyph_bolt.webp": "2a/ic_energy.webp", // energy costs and gifts: the 2A energy icon, as on the top bar
    "icons/icon_home_coin_sack.webp": "2a/ic_patrol.webp",
    "icons/icon_soul_shard.webp": "2a/fx_shard.webp",
    "dd/icon_missions.webp": "2a/ic_missions.webp",
    "dd/icon_recruit.webp": "2a/ic_recruit.webp",
    "dd/icon_limited.webp": "2a/ic_limited.webp",
    "dd/icon_tab_dungeon.webp": "2a/ic_dungeon.webp",
    "heroes/spellsword/figure.webp": "2a/kael_back.webp",
    "icons/icon_card.webp": "2a/ic_recruit.webp",
    "icons/icon_unlock_hero.webp": "2a/it_heroshard.webp",
    "icons/icon_party_emblem.webp": "2a/it_exp.webp",
    "dd/icon_ore.webp": "2a/it_ore.webp",
    "dd/icon_key.webp": "2a/it_key.webp",
    "dd/icon_stone.webp": "2a/it_stone.webp",
    "dd/icon_essence.webp": "2a/it_essence.webp",
    "dd/icon_pass.webp": "2a/it_pass.webp",
    "dd/icon_coll_chest.webp": "2a/it_reliquary.webp",
    "dd/icon_gift.webp": "2a/it_gift.webp",
    "dd/cmd_pedestal.webp": "2a/pedestal.webp",
    "icons/icon_artifact_runestone_of_recall.webp": "2a/rel_runestone.webp",
    "dd/fx_proj_bolt.webp": "2a/fx_bolt.webp",
    "dd/fx_proj_coin.webp": "2a/fx_coin.webp",
    "dd/fx_hit_coins.webp": "2a/fx_coin.webp",
    "dd/fx_hit_flash.webp": "2a/fx_hit_s.webp",
    "dd/fx_hit_sparkle.webp": "2a/fx_sparkle.webp",
    "dd/fx_hit_shock.webp": "2a/fx_ring.webp",
    "dd/fx_area_slash.webp": "2a/fx_slash.webp",
    "dd/fx_hit_phys_s.webp": "2a/fx_hit_s.webp",
    "dd/fx_hit_phys_l.webp": "2a/fx_hit_l.webp",
    "dd/fx_hit_fire_s.webp": "2a/fx_hit_fire.webp",
    "dd/fx_hit_fire_l.webp": "2a/fx_hit_fire.webp",
    "dd/fx_hit_water_s.webp": "2a/fx_hit_water.webp",
    "dd/fx_hit_water_l.webp": "2a/fx_hit_water.webp",
    "dd/fx_hit_elec_s.webp": "2a/fx_hit_elec.webp",
    "dd/fx_hit_elec_l.webp": "2a/fx_hit_elec.webp",
    "dd/fx_hit_nature_s.webp": "2a/fx_hit_nature.webp",
    "dd/fx_hit_nature_l.webp": "2a/fx_hit_nature.webp",
  };
  DD.skin = (p) => {
    if (MAP[p]) return MAP[p];
    // the 20 hero portraits (C27 I, 2026-11-02: two ChatGPT sheets with one framing, light and gutter, docs/art-2a/hero_portraits_v2_*.png); Kael too
    const bust = /^heroes\/([\w-]+)\/bust\.webp$/.exec(p);
    if (bust && DD.SKIN_PORTRAITS.includes(bust[1])) return `2a/heroes/${bust[1]}.webp`;
    // battle (C25 group 2): every hero from behind (Kael keeps his own, above), the attacks, areas and statuses, the skill icons
    const back = /^heroes\/([\w-]+)\/figure\.webp$/.exec(p);
    if (back && DD.SKIN_HEROES.includes(back[1])) return `2a/heroes/back_${back[1]}.webp`;
    const fx = /^dd\/fx_(proj_\w+|unit_\w+|area_(?:crater|firepool|goldcloud|lightning|portal|storm|vortex)|hit_explosion|burning|charged|cracked|entangled|wet|overload|steam|shatter|wildfire|superconduct|toxic|eclipse)\.webp$/.exec(p);
    if (fx) return `2a/fx/${fx[1]}.webp`;
    const skill = /^icons\/icon_skill_(\w+)\.webp$/.exec(p);
    if (skill) return `2a/skills/${skill[1]}.webp`;
    if (p === "dd/shot_alexandra.webp") return "2a/fx/chain.webp";
    // Party and Artifacts (2026-11-01, user: "lanjut party dan artfacts"): every hero standing, facing us; the six slots; the status icons; the relics
    const stand = /^heroes\/([\w-]+)\/stand\.webp$/.exec(p);
    if (stand) return DD.SKIN_FIGURES.includes(stand[1]) ? `2a/heroes/fig_${stand[1]}.webp` : `heroes/${stand[1]}/figure.webp`;
    const art = /^dd\/art_(blade|tome|crown|aegis|charm|banner)\.webp$/.exec(p);
    if (art) return `2a/art_${art[1]}.webp`;
    const stat = /^dd\/stat_(atk|hp|crit|critdmg|haste|area|dur|proj|boss)\.webp$/.exec(p);
    if (stat) return `2a/st_${stat[1]}.webp`;
    const rel = /^icons\/icon_artifact_(\w+)\.webp$/.exec(p);
    if (rel && DD.SKIN_RELICS.includes(rel[1])) return `2a/rel_${rel[1]}.webp`;
    if (/^creatures\/head_/.test(p)) return DD.skinDragon("water", "head"); // the battle asks DD.skinDragon by the stage's element
    const body = /^dd\/body_\w+?_(seg|elite|chest|tail)\.webp$/.exec(p);
    if (body) return `2a/body_${body[1]}.webp`;
    return p;
  };
  /** The dungeon background and where its battlement starts (fraction of the picture's height): the battle lines its wall up with it. */
  DD.SKIN_BG = { dungeon: "2a/dungeon_bg.webp", wallAt: 0.815, home: "2a/home_bg.webp" };
  /** One obsidian dragon and one hall per element (2026-11-01, user: "go"; docs/TEMA_2A.md A17, A18): the world's element picks the
      dragon's accent (fire, water, electric, nature, physical) and the hall it comes down. Pieces: head, seg, elite, chest, pearl, tail.
      wallAt = where the painted battlement of that hall starts (fraction of its height; all five measured at 0.815). An unknown element
      gets the water dragon and the first hall (dungeon_bg); the first dragon (A7: body_*, dragon_head) is no longer drawn. */
  DD.SKIN_HALL = {
    fire: { src: "2a/dungeon/fire.webp", wallAt: 0.815 },
    water: { src: "2a/dungeon/water.webp", wallAt: 0.815 },
    electric: { src: "2a/dungeon/electric.webp", wallAt: 0.815 },
    nature: { src: "2a/dungeon/nature.webp", wallAt: 0.815 },
    physical: { src: "2a/dungeon/physical.webp", wallAt: 0.815 },
    // G3 group 2 (2026-11-06, ChatGPT from the fire hall, same corridor and battlement): the halls of the new elements
    ice: { src: "2a/dungeon/ice.webp", wallAt: 0.815 },
    dark: { src: "2a/dungeon/dark.webp", wallAt: 0.815 },
    rock: { src: "2a/dungeon/rock.webp", wallAt: 0.815 },
    poison: { src: "2a/dungeon/poison.webp", wallAt: 0.815 },
    holy: { src: "2a/dungeon/holy.webp", wallAt: 0.815 },
  };
  /** A dragon piece by form (C27 H: DD.FORMS, folder = its id, Ember Drake = the first fire dragon) or, as before, by element. */
  DD.skinDragon = (k, part) => { const f = DD.FORMS && DD.FORMS[k]; if (part === "card" && f && f.cardFrom) return DD.skinDragon(f.cardFrom, "card"); /* G3: until its own card is painted */ return `2a/dragon/${f ? f.dir || k : DD.SKIN_HALL[k] ? k : "water"}/${part}.webp`; };
  DD.skinHall = (el) => DD.SKIN_HALL[el] || DD.SKIN_HALL[(DD.HALL_EL || {})[el]] || { src: DD.SKIN_BG.dungeon, wallAt: DD.SKIN_BG.wallAt }; // G2: a new element fights in the nearest hall
})();
