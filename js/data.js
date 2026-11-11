/* DREAMDYSIS: DRAGON DEFENCE — game data, design v3 (docs/RANCANGAN.md, section CONFIRMED).
   Mechanics follow Dragon Fever TD; only the theme comes from DREAMDYSIS. Every number is a first value for the HTML
   preview: tune it here, nowhere else. Nothing in the rules names the Commander: it is one data entry (DD.COMMANDER). */
window.DD = window.DD || {};

/* ---------------------------------------------------------------- rarity (C4, C6) */
DD.TIERS = ["common", "rare", "epic", "legendary", "mythic"]; // hero grades (C27 C: Common added, user: "hero seharusnya punya grade common")
DD.CARD_TIERS = ["rare", "epic", "legendary", "mythic"]; // the battle cards keep their four rarities
DD.TIER_NAME = { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary", mythic: "Mythic", commander: "Commander" };
DD.TIER_STEP = { rare: 0, epic: 1, legendary: 2, mythic: 3, commander: 4 };

/* ---------------------------------------------------------------- elements (C3) */
DD.ELEMENTS = ["physical", "fire", "water", "electric", "nature"];
DD.ELEMENT_NAME = { physical: "Physical", fire: "Fire", water: "Water", electric: "Electric", nature: "Nature" };
/** What each dragon element is weak to (Water > Fire > Nature > Electric > Water; Physical has no weakness). */
DD.WEAK_TO = { fire: "water", nature: "fire", electric: "nature", water: "electric", physical: null };
DD.WEAK_MULT = 1.5;

/* ---------------------------------------------------------------- heroes = weapons (D5, C5)
   kind = the weapon's shape (js/battle.js fires it); w = its numbers at Lv 1; hp adds to the wall; noun = the word the
   skill cards use ("Axe Damage +50%"); el/target/rhythm = Dragon Fever's label (Element · Single/Area · Continuous/Burst).
   lv4 = the Lv 4 effect; evo = the evolution (an Evo card in a battle, permanent at Lv 6). */
const H = (o) => o;
DD.COMMANDER = H({
  id: "spellsword", name: "Kael Arden", short: "Kael", tier: "epic", el: "physical", target: "Single", rhythm: "Burst", // no captain since C21 (2026-10-30)
  weapon: "Arcane Bolt", noun: "Bolt", col: "#3fd8ff", hp: 1500,
  kind: "pierce", w: { dmg: 43, cd: 0.7, speed: 620, pierce: 0, count: 1 },
  line: "Fires bolts where you aim (drag the squad).", lv4: { text: "Bolt Count +1", stat: "count", v: 1 },
  evo: { name: "Split Bolt", text: "Each bolt splits into 2 that pierce 3 times on the first hit.", flag: "split" },
});
DD.HEROES = [
  DD.COMMANDER,
  // Rare
  H({ id: "ebenezer", name: "Ebenezer", short: "Ebenezer", tier: "rare", el: "physical", target: "Single", rhythm: "Continuous",
    weapon: "Coin Jet", noun: "Jet", col: "#f5c030", hp: 1000,
    kind: "jet", w: { dps: 82, cd: 3, dur: 2, width: 7, count: 1 },
    line: "A fountain of coins sweeps left and right for 2 s, hitting the first scale in its way every 0.1 s.", lv4: { text: "Jets +1", stat: "count", v: 1 },
    evo: { name: "Gold Rush", text: "Jet width +50%, jet damage +100%.", flag: "widejet" } }),
  H({ id: "half-goblin", name: "Nim", short: "Nim", tier: "rare", el: "physical", target: "Single", rhythm: "Burst",
    weapon: "Throwing Dagger", noun: "Dagger", col: "#ffd84a", hp: 950,
    kind: "pierce", w: { dmg: 25, cd: 0.9, speed: 560, pierce: 1, count: 1, fanStep: 0.14 },
    line: "Daggers fly curved paths to scales in the upper field and curve on to the next one.", lv4: { text: "Dagger Pierce +1", stat: "pierce", v: 1 },
    evo: { name: "Heist", text: "Throws 3 daggers in a fan.", flag: "fan" } }),
  H({ id: "enchantress", name: "Madame Velis", short: "Velis", tier: "rare", el: "water", target: "Single", rhythm: "Burst",
    weapon: "Heartdrop", noun: "Heartdrop", col: "#ff8af0", hp: 1000,
    kind: "bounce", w: { dmg: 11, cd: 1.2, speed: 520, bounces: 1, multi: 5 },
    line: "A heart flutters up, dives onto a scale, hits it 5 times, then hops toward the head.", lv4: { text: "Ricochet +1", stat: "bounce", v: 1 },
    evo: { name: "Mass Charm", text: "Every heartdrop stops the dragon for 0.3 s.", flag: "charm" } }),
  H({ id: "mercenary", name: "Garran Voss", short: "Garran", tier: "rare", el: "physical", target: "Single", rhythm: "Burst",
    weapon: "Marksman Shot", noun: "Shot", col: "#ee3c46", hp: 1100,
    kind: "hunter", w: { dmg: 96, cd: 2.2, speed: 1400, crit: 0.15, strongest: true },
    line: "Marks the strongest scale near his column, then a tracer shot hits it.", lv4: { text: "Shot Damage +60%", stat: "dmg", v: 0.6 },
    evo: { name: "Bounty Hunter", text: "The head takes double damage.", flag: "bounty" } }),
  H({ id: "tracker", name: "Fen", short: "Fen", tier: "rare", el: "nature", target: "Single", rhythm: "Continuous",
    weapon: "Spirit Wolf", noun: "Wolf", col: "#8fe85a", hp: 950,
    kind: "summon", w: { dmg: 31, cd: 14, life: 12, fire: 0.4, mode: "wolf" },
    line: "A spirit wolf leaps from scale to scale for 12 s and bites where it lands.", lv4: { text: "Wolf Duration +4 s", stat: "dur", v: 4 },
    evo: { name: "Alpha", text: "Wolves fire 3 needles at once.", flag: "alpha" } }),
  // Epic
  H({ id: "dwarf", name: "Borrik Stonebeard", short: "Borrik", tier: "epic", el: "physical", target: "Area", rhythm: "Burst",
    weapon: "Boomerang Axe", noun: "Axe", col: "#c5cde4", hp: 1600,
    kind: "boomerang", w: { dmg: 9, cd: 1.6, range: 520, speed: 560, count: 1 },
    line: "An axe flies a wide loop over the field through every scale.", lv4: { text: "Axe Count +1", stat: "count", v: 1 },
    evo: { name: "Mountain Stand", text: "Axes are twice as big.", flag: "bigaxe" } }),
  H({ id: "occultist", name: "Morrow", short: "Morrow", tier: "epic", el: "nature", target: "Area", rhythm: "Continuous",
    weapon: "Orbiting Skulls", noun: "Skull", col: "#c290ff", hp: 1050,
    kind: "orbit", w: { dmg: 11, n: 3, r: 46, spin: 2.4, tick: 0.35 },
    line: "A skull swarm drifts over the thickest part of the body and bites everything in it.", lv4: { text: "Skull Count +2", stat: "count", v: 2 },
    evo: { name: "Lich", text: "Skulls orbit twice as wide.", flag: "wide" } }),
  H({ id: "leprechaun", name: "Finnick Gale", short: "Finnick", tier: "epic", el: "electric", target: "Area", rhythm: "Burst",
    weapon: "Rainbow Arc", noun: "Arc", col: "#8fe85a", hp: 950,
    kind: "bounce", w: { dmg: 30, cd: 1.1, speed: 600, bounces: 2, chain: true, diag: true },
    line: "A rainbow arcs onto a scale, then runs along the body.", lv4: { text: "Arc Bounce +2", stat: "bounce", v: 2 },
    evo: { name: "Pot of Gold", text: "Both diagonals at once.", flag: "twin" } }),
  H({ id: "knight", name: "Sera Hale", short: "Sera", tier: "epic", el: "electric", target: "Area", rhythm: "Burst",
    weapon: "Sun Beam", noun: "Beam", col: "#ffe27a", hp: 1500,
    kind: "beam", w: { dmg: 26, cd: 2.2, width: 9 },
    line: "A portal opens at the screen edge; a sun beam crosses the whole field.", lv4: { text: "Beam Width +50%", stat: "size", v: 0.5 },
    evo: { name: "Skyfall", text: "Two more beams, 60 px either side.", flag: "skyfall" } }),
  H({ id: "jack-frost", name: "Jack Frost", short: "Jack", tier: "epic", el: "water", target: "Area", rhythm: "Continuous",
    weapon: "Bouncing Snowball", noun: "Snowball", col: "#8ae8ff", hp: 950,
    kind: "ricochet", w: { dmg: 15, cd: 1.8, speed: 360, life: 3, count: 1, r: 9 },
    line: "A big snowball bounces off every edge for 3 s, slowing what it hits.", lv4: { text: "Snowball Count +1", stat: "count", v: 1 },
    evo: { name: "Frost Storm", text: "Snowballs freeze the dragon for 0.4 s on every 8th hit.", flag: "freeze" } }),
  H({ id: "cassandra", name: "Cassandra", short: "Cassandra", tier: "epic", el: "nature", target: "Single", rhythm: "Burst",
    weapon: "Claw Lash", noun: "Lash", col: "#9a52ee", hp: 1400,
    kind: "charm", w: { dmg: 90, cd: 1.0, speed: 900, stun: 0.15, range: 560 },
    line: "Three giant claw slashes cross the thickest part of the body and paralyse the dragon a moment.", lv4: { text: "Lash Damage +60%", stat: "dmg", v: 0.6 },
    evo: { name: "Moonbound", text: "Every lash strikes twice.", flag: "double" } }),
  // Legendary
  H({ id: "sorceress", name: "Ysmay Corr", short: "Ysmay", tier: "legendary", el: "fire", target: "Area", rhythm: "Continuous",
    weapon: "Flame Breath", noun: "Flame", col: "#ffa23c", hp: 1100,
    kind: "spray", w: { dps: 19, cd: 3.2, dur: 2.2, len: 500, angle: 0.16 },
    line: "A flame cone sweeps across the field, burning every scale in it.", lv4: { text: "Flame Width +40%", stat: "size", v: 0.4 },
    evo: { name: "Dragon Fury", text: "Two more flames, left and right.", flag: "triple" } }),
  H({ id: "crusader", name: "Aldous Crane", short: "Aldous", tier: "legendary", el: "fire", target: "Area", rhythm: "Continuous",
    weapon: "Spinning Hammer", noun: "Hammer", col: "#fff1d6", hp: 1700,
    kind: "saw", w: { dps: 158, cd: 2.4, speed: 240, life: 2.2, r: 26 },
    line: "A hammer is thrown high, slams down with a shockwave and grinds there for 2.2 s.", lv4: { text: "Hammer Duration +1 s", stat: "dur", v: 1 },
    evo: { name: "Holy Harvest", text: "Each hammer splits into 2 more on its first hit.", flag: "splitsaw" } }),
  H({ id: "tou-lak", name: "Tou'lak", short: "Tou'lak", tier: "legendary", el: "electric", target: "Area", rhythm: "Continuous",
    weapon: "Roar Orb", noun: "Orb", col: "#ffbe12", hp: 3000,
    kind: "weave", w: { dmg: 18, cd: 2.6, speed: 300, life: 3, count: 1 },
    line: "A roaring orb bounces off every edge of the field for 3 s, through every scale.", lv4: { text: "Orb Count +1", stat: "count", v: 1 },
    evo: { name: "Intimidate", text: "Orbs explode when they fade.", flag: "boom" } }),
  H({ id: "alchemist", name: "Pell", short: "Pell", tier: "legendary", el: "fire", target: "Area", rhythm: "Continuous",
    weapon: "Fire Flask", noun: "Flask", col: "#c6f04a", hp: 1000,
    kind: "lob", w: { dps: 50, cd: 2.4, radius: 44, dur: 3, count: 1 },
    line: "Lobs a flask onto the thickest part of the body; it leaves a fire pool for 3 s.", lv4: { text: "Zone Size +40%", stat: "size", v: 0.4 },
    evo: { name: "Transmute", text: "Throws 3 flasks at once.", flag: "triple" } }),
  // Mythic (build stage 3: Limited Recruitment only; not in the normal Recruit pool)
  H({ id: "alexandra", name: "Alexandra", short: "Alexandra", tier: "mythic", el: "electric", target: "Area", rhythm: "Burst",
    weapon: "Thunder Tome", noun: "Bolt", col: "#9dbcff", hp: 1300,
    kind: "bounce", w: { dmg: 17, cd: 1.0, speed: 900, bounces: 6, chain: true },
    line: "A thunderstorm: lightning strikes scales anywhere on the field and jumps on.", lv4: { text: "Bolt Bounce +3", stat: "bounce", v: 3 },
    evo: { name: "Infinite Library", text: "Two bolts at once.", flag: "twin" } }),
  H({ id: "marpesia", name: "Marpesia", short: "Marpesia", tier: "mythic", el: "physical", target: "Single", rhythm: "Continuous",
    weapon: "Sky Spear", noun: "Spear", col: "#ff7c70", hp: 1500,
    kind: "pin", w: { dps: 155, cd: 2.5, dur: 2.5, width: 6, count: 1 },
    line: "A spear of light falls from the sky onto the thickest part of the body and keeps burning.", lv4: { text: "Spear Duration +1 s", stat: "dur", v: 1 },
    evo: { name: "Rallying Cry", text: "All heroes attack 15% faster.", flag: "rally" } }),
  H({ id: "loeg-yllavyre", name: "Loeg Yllavyre", short: "Loeg", tier: "mythic", el: "nature", target: "Area", rhythm: "Continuous",
    weapon: "Dragonling Call", noun: "Dragonling", col: "#ff7c50", hp: 1400,
    kind: "summon", w: { dmg: 42, cd: 10, life: 8, fire: 0.3, mode: "sweep" },
    line: "A dragonling flies across the field, row by row, breathing fire.", lv4: { text: "Dragonling Duration +3 s", stat: "dur", v: 3 },
    evo: { name: "Brood", text: "Two dragonlings at once.", flag: "twin" } }),
  H({ id: "amar-suen", name: "King Amar-Suen", short: "Amar-Suen", tier: "mythic", el: "physical", target: "Single", rhythm: "Burst",
    weapon: "Midas Touch", noun: "Touch", col: "#ffe27a", hp: 1200,
    kind: "gold", w: { dmg: 132, cd: 1.2, speed: 560, gold: 3 },
    line: "Golden rain: crowned coins fall on scales anywhere; golden scales drop coins when they break.", lv4: { text: "Gold +3 coins", stat: "gold", v: 3 },
    evo: { name: "Golden Crown", text: "Golden scales take double damage.", flag: "crown" } }),
  // C33 G7 (2026-11-03): the DREAMDYSIS heroes that were missing; grades as in DREAMDYSIS (its God = Mythic here)
  // C36 G4 (user no. 80: "common 6 aja, pindah ke rare 2. ganti base statusnya"): Rare; Damage 11 -> 13, every 1.1 -> 1.0 s, HP 1000 -> 1150
  H({ id: "minstrel", name: "Lark", short: "Lark", tier: "rare", el: "water", target: "Single", rhythm: "Burst",
    weapon: "Echo Song", noun: "Note", col: "#7fd4ff", hp: 1150,
    kind: "bounce", w: { dmg: 13, cd: 1.0, speed: 540, bounces: 2, multi: 3 },
    line: "A song note flies up, rings on a scale 3 times, then hops on to two more.", lv4: { text: "Note Bounce +1", stat: "bounce", v: 1 },
    evo: { name: "Lullaby", text: "Every note stops the dragon for 0.3 s.", flag: "charm" } }),
  // C36 G4: Rare; Damage 30 -> 35, each arrow passes through 1 scale (was 0), HP 950 -> 1100
  H({ id: "scout", name: "Dace", short: "Dace", tier: "rare", el: "nature", target: "Single", rhythm: "Burst",
    weapon: "Twin Arrows", noun: "Arrow", col: "#a6e05a", hp: 1100,
    kind: "pierce", w: { dmg: 35, cd: 0.8, speed: 700, pierce: 1, count: 2 },
    line: "Two arrows fly straight up his lane, side by side, each through 1 scale; drag the party to aim.", lv4: { text: "Arrow Pierce +1", stat: "pierce", v: 1 },
    evo: { name: "Splitting Arrows", text: "Each arrow splits into 2 that pierce 3 times on the first hit.", flag: "split" } }),
  H({ id: "klaus", name: "Old Klaus", short: "Klaus", tier: "common", el: "physical", target: "Area", rhythm: "Continuous",
    weapon: "Gift Bomb", noun: "Gift", col: "#ff5a4a", hp: 1100,
    kind: "lob", w: { dps: 34, cd: 2.6, radius: 40, dur: 2.5, count: 1 },
    line: "Lobs a wrapped gift onto the thickest part of the body; it bursts into a ring of sparks for 2.5 s.", lv4: { text: "Gift Count +1", stat: "count", v: 1 },
    evo: { name: "Sack of Plenty", text: "Throws 3 gifts at once.", flag: "triple" } }),
  H({ id: "archaeologist", name: "Prof. Hobb Calloway", short: "Hobb", tier: "rare", el: "electric", target: "Area", rhythm: "Burst",
    weapon: "Relic Disc", noun: "Disc", col: "#ffd36a", hp: 1050,
    kind: "boomerang", w: { dmg: 9, cd: 1.6, range: 520, speed: 560, count: 1 },
    line: "A spinning relic disc flies a wide loop over the field through every scale.", lv4: { text: "Disc Count +1", stat: "count", v: 1 },
    evo: { name: "Ancient Seal", text: "Discs are twice as big.", flag: "bigaxe" } }),
  H({ id: "sugarplum-faerie", name: "Mistress Plum", short: "Plum", tier: "rare", el: "water", target: "Area", rhythm: "Continuous",
    weapon: "Sugar Swarm", noun: "Sweet", col: "#ff9ad8", hp: 1000,
    kind: "orbit", w: { dmg: 11, n: 3, r: 46, spin: 2.6, tick: 0.35 },
    line: "A swarm of sugared sweets drifts over the thickest part of the body and nips everything in it.", lv4: { text: "Sweet Count +2", stat: "count", v: 2 },
    evo: { name: "Sugar Storm", text: "Sweets circle twice as wide.", flag: "wide" } }),
  H({ id: "tristan", name: "Tristan", short: "Tristan", tier: "rare", el: "fire", target: "Single", rhythm: "Burst",
    weapon: "Ember Blade", noun: "Slash", col: "#ff8a4a", hp: 1400,
    kind: "charm", w: { dmg: 90, cd: 1.0, speed: 900, stun: 0.15, range: 560 },
    line: "Three burning blade waves cross the thickest part of the body and stun the dragon a moment.", lv4: { text: "Slash Damage +60%", stat: "dmg", v: 0.6 },
    evo: { name: "Twin Edge", text: "Every slash strikes twice.", flag: "double" } }),
  H({ id: "guild-leader", name: "Bertrand Crowe", short: "Bertrand", tier: "epic", el: "electric", target: "Single", rhythm: "Burst",
    weapon: "Crow Strike", noun: "Crow", col: "#b48aff", hp: 1300,
    kind: "hunter", w: { dmg: 120, cd: 2.2, speed: 1400, crit: 0.18, strongest: true },
    line: "Marks the strongest scale near his column, then his crow dives at it.", lv4: { text: "Strike Damage +60%", stat: "dmg", v: 0.6 },
    evo: { name: "Guild Bounty", text: "The head takes double damage.", flag: "bounty" } }),
  H({ id: "szopin", name: "Szopin", short: "Szopin", tier: "epic", el: "fire", target: "Area", rhythm: "Continuous",
    weapon: "Chained Blades", noun: "Blade", col: "#ff6a3a", hp: 1700,
    kind: "weave", w: { dmg: 16, cd: 2.6, speed: 320, life: 3, count: 1 },
    line: "A chained blade bounces off every edge of the field for 3 s, through every scale.", lv4: { text: "Blade Count +1", stat: "count", v: 1 },
    evo: { name: "Wrath Unchained", text: "Blades explode when they fade.", flag: "boom" } }),
  H({ id: "time-traveler", name: "Granny Tock", short: "Granny", tier: "legendary", el: "electric", target: "Area", rhythm: "Burst",
    weapon: "Clockwork Ray", noun: "Ray", col: "#ffe9a0", hp: 1100,
    kind: "beam", w: { dmg: 30, cd: 2.1, width: 10 },
    line: "A clock portal opens at the screen edge; a ray of frozen time crosses the whole field.", lv4: { text: "Ray Width +50%", stat: "size", v: 0.5 },
    evo: { name: "Paradox", text: "Two more rays, 60 px either side.", flag: "skyfall" } }),
  H({ id: "viking", name: "Rusk", short: "Rusk", tier: "legendary", el: "physical", target: "Area", rhythm: "Continuous",
    weapon: "Whirling Axe", noun: "Axe", col: "#e8dcc8", hp: 2400,
    kind: "saw", w: { dps: 158, cd: 2.4, speed: 240, life: 2.2, r: 26 },
    line: "An axe is hurled high, crashes down with a shockwave and whirls there for 2.2 s.", lv4: { text: "Axe Duration +1 s", stat: "dur", v: 1 },
    evo: { name: "Berserker", text: "Each axe splits into 2 more on its first hit.", flag: "splitsaw" } }),
  H({ id: "dreamwalker", name: "Dreamwalker", short: "Dreamwalker", tier: "mythic", el: "water", target: "Single", rhythm: "Continuous",
    weapon: "Dream Tide", noun: "Tide", col: "#7fe8e0", hp: 1400,
    kind: "jet", w: { dps: 140, cd: 3, dur: 2.2, width: 8, count: 1 },
    line: "A tide of starlit dreams sweeps left and right for 2.2 s, hitting the first scale in its way every 0.1 s.", lv4: { text: "Tides +1", stat: "count", v: 1 },
    evo: { name: "Endless Dream", text: "Tide width +50%, tide damage +100%.", flag: "widejet" } }),
  // C36 G3 (user no. 80: "mythic tambah 1 lagi, kael very mythic, kael dragon ascendence"): Kael after he took a dragon's power.
  // The only Fire Mythic and the strongest hero: Kael's own attack (parallel bolts where the party aims) made dragonfire, three
  // blades through two scales each: 3 x 64 every 0.75 s = 256 a second spread on three lanes (Dreamwalker 140, Amar-Suen 110);
  // Kael's Split Bolt and Twin Shot come with him
  H({ id: "kael-dragon", name: "Kael, Dragon Ascendance", short: "Dragon Kael", tier: "mythic", el: "fire", target: "Area", rhythm: "Burst",
    weapon: "Dragonfire Blade", noun: "Blade", col: "#ff6a2a", hp: 2200,
    kind: "pierce", w: { dmg: 64, cd: 0.75, speed: 760, pierce: 2, count: 3 },
    line: "Three dragonfire blades fly where you aim, side by side, each through 2 scales; drag the party to aim.", lv4: { text: "Blade Count +1", stat: "count", v: 1 },
    evo: { name: "Dragon Split", text: "Each blade splits into 2 that pierce 3 times on the first hit.", flag: "split" },
    evo2: { name: "Wings of Ruin", text: "Every attack fires 2 volleys in a row.", flag: "twinshot", at: 7 } }),
];
DD.HERO = Object.fromEntries(DD.HEROES.map((h) => [h.id, h]));
/** Pattern coefficient per hero (Draft 19 / Confirmed C20, 2026-10-30): damage per hit × this so that the new attack
    patterns (area, flying, across the field, full screen) keep the DPS each hero had before (node tools/sim-node.mjs heroes). */
DD.PATTERN_K = { ebenezer: 1.45, "half-goblin": 1.09, enchantress: 0.62, mercenary: 1.24, tracker: 0.44, occultist: 0.59, leprechaun: 0.74, knight: 1.15,
  "jack-frost": 0.92, cassandra: 0.142, sorceress: 2.4, crusader: 0.24, "tou-lak": 0.91, alchemist: 0.5, alexandra: 0.33, marpesia: 1.04, "amar-suen": 1.09 };
/** The same after the Evo, where the evolved pattern hits differently from the base one (sim 2026-10-30). */
DD.PATTERN_KE = { "half-goblin": 0.74, enchantress: 1.49, tracker: 1.36, occultist: 0.8, sorceress: 0.73, crusader: 1.98 };
// C33 G7: each new hero takes the coefficient of the hero with the same attack kind
Object.assign(DD.PATTERN_K, { minstrel: 0.62, klaus: 0.5, "sugarplum-faerie": 0.59, tristan: 0.142, "guild-leader": 1.24, szopin: 0.91, "time-traveler": 1.15, viking: 0.24, dreamwalker: 1.45 });
Object.assign(DD.PATTERN_KE, { minstrel: 1.49, "sugarplum-faerie": 0.8, viking: 1.98 });
/** Where each weapon goes (user 2026-10-24: "FOKUS PADA SERANGAN HERO ARAH SERANGNYA"); shown on Hero Call cards and the
    hero sheet. Forward = along the squad's aim: straight up on vertical stages, so the player aims by dragging. */
DD.AIM = {
  pierce: "Straight shot", jet: "Straight jet", beam: "Straight beam", spray: "Flame cone", boomerang: "Out and back",
  hunter: "Seeks strongest", charm: "Straight lash", gold: "Straight touch", lob: "Lobbed in lane", summon: "Summon",
  saw: "Rolls straight", weave: "Weaves up and back", pin: "Falls on the back", ricochet: "Diagonal bounce", orbit: "Ring on the lane",
};
// Draft 19 / C20 (2026-10-30): seven attack patterns
const AIM_ID = { spellsword: "Aimed shot", ebenezer: "Sweeping fountain", "half-goblin": "Flying daggers", enchantress: "Fluttering hearts", mercenary: "Marks the strongest",
  tracker: "Leaping wolf", dwarf: "Wide loop", occultist: "Skull swarm", leprechaun: "Rainbow arc", knight: "Beam across the field", "jack-frost": "Bounces everywhere",
  cassandra: "Claw slashes", sorceress: "Sweeping flame", crusader: "Hammer slam", "tou-lak": "Bounces everywhere", alchemist: "Fire pool", alexandra: "Thunderstorm",
  marpesia: "Spear from the sky", "loeg-yllavyre": "Flies across", "amar-suen": "Golden rain",
  minstrel: "Ringing notes", scout: "Twin arrows", klaus: "Gift burst", archaeologist: "Wide loop", "sugarplum-faerie": "Sweet swarm", tristan: "Blade waves",
  "guild-leader": "Marks the strongest", szopin: "Bounces everywhere", "time-traveler": "Ray across the field", viking: "Axe slam", dreamwalker: "Sweeping tide", "kael-dragon": "Dragonfire volley" };
DD.aimOf = (h) => AIM_ID[h.id] || DD.AIM[h.kind];
DD.CMD = DD.COMMANDER.id;
/* weapon and evolution icons: V2 skill paintings borrowed where the picture fits (D2.7); new paintings via the Ledger */
const ICON = {
  spellsword: ["spellsword_arcane_blade", "spellsword_spellblade"], ebenezer: ["ebenezer_compound_interest", "ebenezer_golden_vault"],
  "half-goblin": ["half_goblin_smash_and_grab", "half_goblin_heist"], enchantress: ["enchantress_charm", "enchantress_mass_charm"],
  mercenary: ["mercenary_calculated_strike", "mercenary_bounty_hunter"], tracker: ["tracker_wolf_companion", "tracker_called_shot"],
  dwarf: ["dwarf_cleave", "dwarf_mountain_stand"], occultist: ["occultist_danse_macabre", "occultist_lich"],
  leprechaun: ["leprechaun_rainbow_s_end", "leprechaun_pot_of_gold"], knight: ["knight_sunlance", "knight_skyfall"],
  "jack-frost": ["jack_frost_snowball", "jack_frost_frost_storm"], cassandra: ["cassandra_bestial_fury", "cassandra_moonbound"],
  sorceress: ["sorceress_dragon_breath", "sorceress_dragon_fury"], crusader: ["crusader_crusade", "crusader_holy_harvest"],
  "tou-lak": ["tou_lak_deafening_roar", "tou_lak_intimidate"], alchemist: ["alchemist_alchemist_s_fire", "alchemist_transmute"],
  alexandra: ["alexandra_forbidden_knowledge", "alexandra_infinite_library"], marpesia: ["marpesia_warrior_queen", "marpesia_rallying_cry"],
  "loeg-yllavyre": ["loeg_yllavyre_dragon_call", "loeg_yllavyre_brood"], "amar-suen": ["amar_suen_touch_of_midas", "amar_suen_golden_crown"],
  // C33 G7: the new heroes' two skill paintings (assets/2a/skills/<key>.webp, sheet A28)
  minstrel: ["minstrel_echo_song", "minstrel_lullaby"], scout: ["scout_twin_arrows", "scout_splitting_arrows"], klaus: ["klaus_gift_bomb", "klaus_sack_of_plenty"],
  archaeologist: ["archaeologist_relic_disc", "archaeologist_ancient_seal"], "sugarplum-faerie": ["sugarplum_sugar_swarm", "sugarplum_sugar_storm"],
  tristan: ["tristan_ember_blade", "tristan_twin_edge"], "guild-leader": ["guild_leader_crow_strike", "guild_leader_guild_bounty"], szopin: ["szopin_chained_blades", "szopin_wrath_unchained"],
  "time-traveler": ["time_traveler_clockwork_ray", "time_traveler_paradox"], viking: ["viking_whirling_axe", "viking_berserker"], dreamwalker: ["dreamwalker_dream_tide", "dreamwalker_endless_dream"],
  "kael-dragon": ["kael_dragon_dragonfire_blade", "kael_dragon_dragon_split"], // C36 G3
};
DD.HEROES.forEach((h) => { h.icon = `icons/icon_skill_${ICON[h.id][0]}.webp`; h.evoIcon = `icons/icon_skill_${ICON[h.id][1]}.webp`; });
/* C27 C (2026-11-02): the grades move one step down so Common exists and the start has no Legendary of its own (user: "hero awal jangan
   kasih legend, legend dan mythic itu dapat pakai usaha"): the old Rares are Common, four old Epics are Rare; Kael, Sera and Jack Frost
   stay Epic. Ysmay stays Legendary: the 24-hour Trial at the start, then from Recruit or Limited. */
const REGRADE = { "half-goblin": "common", enchantress: "common", tracker: "common", ebenezer: "common", mercenary: "common",
  dwarf: "rare", occultist: "rare", leprechaun: "rare", cassandra: "rare", knight: "epic", "jack-frost": "epic" };
DD.HEROES.forEach((h) => { if (REGRADE[h.id]) h.tier = REGRADE[h.id]; });
/** C33 G7 (user no. 76: "stylenya beda banget, pakai style yang sekarang"): the new heroes stay out of sight (list, Recruit,
    Limited) until their paintings are redone in the current 2A style; a hero leaves this set once its art is in. */
// C34 G6 (user no. 78: "lanjutkan para heroes"): all 11 repainted in the current style (profile, card, front and back figure,
// skills, projectiles), so none waits any more
DD.ART_PENDING = new Set(); // C36 G3: Kael, Dragon Ascendance has all his paintings
/** Heroes the normal Recruit can give (no Commander, no Mythic). */
DD.RECRUIT_POOL = DD.HEROES.filter((h) => h.tier !== "commander" && h.tier !== "mythic" && !DD.ART_PENDING.has(h.id));

/* ---------------------------------------------------------------- hero levels (C27 C, replaces C5's Lv 1–6)
   User 2026-11-02: "level hero itu harusnya unlimited aja sementara. buat 10-20 level utama, dimana mendapatkan pengembangan maksimal di
   sana, setelahnya baru kenaikan attk / spd / crit, per level" and "naik level hero menggunakan koin setiap 5 level. untuk unlock 5 level
   berikutnya user harus memiliki kartu hero tersebut sebanyak 3 lembar". No top level. Every level costs coins; at Lv 5, 10, 15 … the
   next 5 levels open with 3 cards of that hero. Lv 1–20 carry the big steps (the old Lv 4 / 3 / 5 / 6 effects at Lv 5 / 10 / 15 / 20),
   then every level adds ATK ×1.04, Speed +0.5 % (up to +50 %) and Crit +0.2 % (up to +20 %). */
DD.MAX_LV = Infinity;
DD.LV_BLOCK = 5;
DD.BREAK_CARDS = 3;
DD.MAIN_LV = 20;
// coins for Lv lv → lv + 1. no. 103–104 (user: "pembetulan harga coin untuk level up di semua. terutama hero, terlalu amat murah di bandingkan yang di dapat dari stage win"; Ledger Draft 20.11, C50): a level costs about one Normal win at the stage where it is usually bought, a little more at high levels, and never less than the old price (the higher of the new and the old curve); hero Lv L is usually bought around Stage 2L
DD.lvCoins = (lv) => Math.max(Math.round(400 * lv * Math.pow(1.03, Math.max(0, lv - 20))), Math.round(25 * Math.pow(1.12, lv - 1)));
/** The big steps of Lv 1–20 (shown on the hero page). */
DD.LV_STEPS = [[5, "lv4"], [10, "Attack Speed ×1.3"], [15, "Crit Damage ×3"], [20, "lv6"]];
/** Damage of one hit (C12): base × level × (1 + DMG cards) × (1 + team ATK) × (1 + Damage) × element × crit × special. */
DD.levelMods = function (h, lv) {
  const main = Math.min(lv, DD.MAIN_LV), past = Math.max(0, lv - DD.MAIN_LV);
  const m = { dmgL: (1 + 0.15 * (main - 1)) * Math.pow(1.04, past), rateL: (lv >= 10 ? 1.3 : 1) * (1 + Math.min(0.5, 0.005 * past)),
    hpMul: (1 + 0.08 * (main - 1)) * Math.pow(1.03, past), extra: {}, critMul: lv >= 15 ? 3 : 2, lv6: lv >= DD.MAIN_LV };
  const add = (o) => { for (const [k, v] of Object.entries(o || {})) m.extra[k] = (m.extra[k] || 0) + v; };
  if (lv >= 5) add({ [h.lv4.stat]: h.lv4.v });
  if (lv >= DD.MAIN_LV) add(h.lv6.mods);
  if (past) add({ crit: Math.min(0.2, 0.002 * past) });
  return m;
};
/** Old saves (Lv 1–6) → the new levels. */
DD.LV_FROM_OLD = [1, 1, 5, 9, 13, 17, 21];
/** C15 (Kael's level from the Player Level) is replaced by C21: Kael levels with shards like everyone; this only converts old saves. */
DD.CMD_LV_EVERY = 6;
DD.cmdLv = (pl) => Math.min(DD.MAX_LV, 1 + Math.floor(pl / DD.CMD_LV_EVERY));
DD.EXCHANGE_COST = 15; // old saves only: Exchange Shards became Recruit Tickets, 15 for 1 (C48)

/* ---------------------------------------------------------------- in-battle cards (C4, C12)
   Values per card rarity (Rare / Epic / Legendary / Mythic). Each hero only gets the upgrades in its own list (upg),
   and each upgrade stops at that hero's cap ("mentok"): a card is clamped to what is left, a capped upgrade is no
   longer offered. */
DD.CARD_TIER_ODDS = [["rare", 0.6], ["epic", 0.28], ["legendary", 0.1], ["mythic", 0.02]];
DD.CARD_STATS = {
  dmg: { label: "Damage", tag: "DMG", v: [0.4, 0.6, 1.0, 1.5], pct: true },
  rate: { label: "Speed", tag: "Speed", v: [0.2, 0.3, 0.5, 0.8], pct: true },
  count: { label: "Count", tag: "Count", v: [1, 1, 2, 2] },
  pierce: { label: "Pierce", tag: "Pen", v: [1, 1, 2, 3] },
  size: { label: "Area", tag: "Area", v: [0.2, 0.3, 0.5, 0.7], pct: true }, // width, radius or angle; reach is not a card (every weapon crosses the field)
  dur: { label: "Duration", tag: "Duration", v: [0.5, 1, 2, 3], unit: "s" },
  bounce: { label: "Bounce", tag: "Bounce", v: [1, 1, 2, 3] },
  crit: { label: "Crit", tag: "Crit", v: [0.05, 0.08, 0.12, 0.18], pct: true },
  gold: { label: "Gold", tag: "Gold", v: [1, 2, 3, 5] },
};
/* Each hero: technique (how it attacks), role (what it is good at), upg = its upgrades and their caps, evoAt = skill
   level from which its Evo card can show, evo2 (Commander only) = a second Evo card, lv6 = the Lv 6 Evolution. */
const SPEC = {
  spellsword: { tech: "Straight bolts up its lane, side by side; drag to aim.", role: "Steady damage on one line; drag the party to aim.",
    upg: { dmg: 5, rate: 2, count: 4, pierce: 4, crit: 0.4 }, evoAt: 4,
    evo2: { name: "Twin Shot", text: "Every attack fires 2 volleys in a row.", flag: "twinshot", at: 7 },
    lv6: { name: "Arcane Storm", text: "Pierce +2.", mods: { pierce: 2 } } },
  ebenezer: { tech: "A straight jet up its lane; it stops at the first scale.", role: "Strong on one target; no pierce, weak against crowds.",
    upg: { dmg: 5, rate: 1.5, count: 3, dur: 4, size: 1.5 }, evoAt: 4,
    lv6: { name: "Golden Vault", text: "Jets +1, Duration +1 s.", mods: { count: 1, dur: 1 } } },
  "half-goblin": { tech: "Daggers in a fan, 8° apart, that pierce.", role: "Spreads over a few columns; the fan opens as it climbs.",
    upg: { dmg: 5, rate: 2, count: 3, pierce: 5, crit: 0.4 }, evoAt: 4,
    lv6: { name: "Grand Heist", text: "Daggers +1, Crit +15%.", mods: { count: 1, crit: 0.15 } } },
  enchantress: { tech: "A heartdrop straight up its lane: 5 hits on its scale, then hops toward the head.", role: "Damage on one scale, then the next.",
    upg: { dmg: 5, rate: 2, bounce: 5, crit: 0.4 }, evoAt: 4,
    lv6: { name: "Heartbreaker", text: "Ricochet +2.", mods: { bounce: 2 } } },
  mercenary: { tech: "A marksman shot at the strongest scale in his column (±30 px; Area widens it).", role: "Head and toughest-scale killer.",
    upg: { dmg: 6, rate: 1.5, crit: 0.5, size: 1 }, evoAt: 4,
    lv6: { name: "Deadeye", text: "Crit +20%.", mods: { crit: 0.2 } } },
  tracker: { tech: "A spirit wolf at the end of the squad shoots straight up.", role: "Widens the squad's lanes while the wolf lives.",
    upg: { dmg: 5, rate: 1.5, dur: 6, count: 2 }, evoAt: 4,
    lv6: { name: "Spirit Pack", text: "Wolves +1 (in front of the third).", mods: { count: 1 } } },
  dwarf: { tech: "An axe flies straight up through every scale and comes back.", role: "Hits a whole line twice; best on vertical stages.",
    upg: { dmg: 5, rate: 1.5, count: 4, size: 1.5 }, evoAt: 4,
    lv6: { name: "Avalanche", text: "Axes +1, Area +30%.", mods: { count: 1, size: 0.3 } } },
  occultist: { tech: "A ring of skulls sits on the first scale in his lane and bites everything around it.", role: "Grinds the front of his lane; follows the drag.",
    upg: { dmg: 5, rate: 1.5, count: 6, size: 1.5 }, evoAt: 4,
    lv6: { name: "Danse of Bones", text: "Skulls +2.", mods: { count: 2 } } },
  leprechaun: { tech: "A diagonal arc, left and right in turn, then it runs along the body both ways.", role: "Chains through the body.",
    upg: { dmg: 5, rate: 1.5, bounce: 8, crit: 0.4 }, evoAt: 4,
    lv6: { name: "Double Rainbow", text: "Bounce +2, Crit +10%.", mods: { bounce: 2, crit: 0.1 } } },
  knight: { tech: "A beam straight up its lane through every scale.", role: "Line clear; best on vertical stages.",
    upg: { dmg: 5, rate: 1.5, size: 1.5, crit: 0.4 }, evoAt: 4,
    lv6: { name: "Dawnbreaker", text: "Beam width +50%.", mods: { size: 0.5 } } },
  "jack-frost": { tech: "Snowballs fly off 30° to the side and bounce off the edges, slowing what they hit.", role: "Slows the whole dragon; area damage.",
    upg: { dmg: 5, rate: 1.5, count: 3, dur: 4 }, evoAt: 4,
    lv6: { name: "Blizzard", text: "Snowballs +1, Duration +1 s.", mods: { count: 1, dur: 1 } } },
  cassandra: { tech: "An instant lash straight ahead (300 px) that paralyses the dragon a moment.", role: "Single-target damage with short stops.",
    upg: { dmg: 5, rate: 2, crit: 0.5, dur: 1.5 }, evoAt: 4,
    lv6: { name: "Wild Hunt", text: "Crit +15%.", mods: { crit: 0.15 } } },
  sorceress: { tech: "A flame cone straight up its lane, hitting every scale in it; Area widens the cone.", role: "Burns the whole cone; top area damage.",
    upg: { dmg: 5, rate: 1.5, size: 1.5, dur: 4 }, evoAt: 4,
    lv6: { name: "Inferno", text: "Flame width +30%, Duration +1 s.", mods: { size: 0.3, dur: 1 } } },
  crusader: { tech: "A spinning hammer rolls straight up, stops on the first scale and grinds the body crawling through it.", role: "Area damage on one spot of the coil.",
    upg: { dmg: 5, rate: 1.5, size: 1.5, dur: 3 }, evoAt: 4,
    lv6: { name: "Golden Hammer", text: "Hammers +1, Area +40%.", mods: { count: 1, size: 0.4 } } },
  "tou-lak": { tech: "A roaring orb weaves up its column (±40 px), bouncing off the top and the wall until its time is up.", role: "Area damage up and down one column and a huge wall bonus.",
    upg: { dmg: 5, rate: 1.5, count: 4, dur: 4 }, evoAt: 4,
    lv6: { name: "Warlord's Roar", text: "Orbs +1.", mods: { count: 1 } } },
  alchemist: { tech: "A flask lobbed onto the first scale in her column leaves a fire zone.", role: "Zone damage where the body passes.",
    upg: { dmg: 5, rate: 1.5, size: 1.5, dur: 4 }, evoAt: 4,
    lv6: { name: "Philosopher's Fire", text: "Flasks +1.", mods: { count: 1 } } },
  alexandra: { tech: "Lightning straight up her lane, then jumps from scale to scale (160 px).", role: "Long chains; burst.", upg: { dmg: 6, rate: 1.5, bounce: 10, crit: 0.5 }, evoAt: 4,
    lv6: { name: "Forbidden Storm", text: "Bounce +3.", mods: { bounce: 3 } } },
  marpesia: { tech: "A spear falls on the back of the body in her column and stays pinned, burning; when that scale breaks it moves to the next one in the column.", role: "Top single-target damage at the back of the body.", upg: { dmg: 6, rate: 1.5, dur: 5, size: 1.5 }, evoAt: 4,
    lv6: { name: "Sky Queen", text: "Duration +1 s.", mods: { dur: 1 } } },
  "loeg-yllavyre": { tech: "A dragonling sweeps across the body row by row.", role: "Lasting area damage.", upg: { dmg: 6, rate: 1.5, dur: 6, count: 2 }, evoAt: 4,
    lv6: { name: "Brood Mother", text: "Dragonlings +1.", mods: { count: 1 } } },
  "amar-suen": { tech: "Turns scales to gold; golden scales drop coins.", role: "Damage and coins.", upg: { dmg: 6, rate: 1.5, gold: 10, crit: 0.4 }, evoAt: 4,
    lv6: { name: "Midas King", text: "Gold +3.", mods: { gold: 3 } } },
  // C33 G7: the new heroes (technique and role follow their attack kind; caps as the hero with the same kind)
  minstrel: { tech: "A note straight up his lane: 3 rings on its scale, then it hops on to two more.", role: "Hits one scale hard, then the next ones.",
    upg: { dmg: 5, rate: 2, bounce: 5, crit: 0.4 }, evoAt: 4, lv6: { name: "Grand Finale", text: "Bounce +2.", mods: { bounce: 2 } } },
  scout: { tech: "Two arrows side by side straight up his lane; drag to aim.", role: "Steady damage on two lines.",
    upg: { dmg: 5, rate: 2, count: 4, pierce: 4, crit: 0.4 }, evoAt: 4, lv6: { name: "Hawkeye", text: "Pierce +2.", mods: { pierce: 2 } } },
  klaus: { tech: "A gift lobbed onto the first scale in his column bursts into a ring of sparks.", role: "Zone damage where the body passes.",
    upg: { dmg: 5, rate: 1.5, size: 1.5, dur: 4 }, evoAt: 4, lv6: { name: "Midwinter Night", text: "Gifts +1.", mods: { count: 1 } } },
  archaeologist: { tech: "A relic disc flies straight up through every scale and comes back.", role: "Hits a whole line twice; best on vertical stages.",
    upg: { dmg: 5, rate: 1.5, count: 4, size: 1.5 }, evoAt: 4, lv6: { name: "Lost Expedition", text: "Discs +1.", mods: { count: 1 } } },
  "sugarplum-faerie": { tech: "A ring of sweets sits on the first scale in her lane and nips everything around it.", role: "Grinds the front of her lane; follows the drag.",
    upg: { dmg: 5, rate: 1.5, count: 6, size: 1.5 }, evoAt: 4, lv6: { name: "Sugar Queen", text: "Sweets +2.", mods: { count: 2 } } },
  tristan: { tech: "An instant blade wave straight ahead (300 px) that stuns the dragon a moment.", role: "Single-target damage with short stops.",
    upg: { dmg: 5, rate: 2, crit: 0.5, dur: 1.5 }, evoAt: 4, lv6: { name: "Knight of Embers", text: "Crit +10%.", mods: { crit: 0.1 } } },
  "guild-leader": { tech: "His crow dives at the strongest scale in his column (±30 px; Area widens it).", role: "Head and toughest-scale killer.",
    upg: { dmg: 6, rate: 1.5, crit: 0.5, size: 1 }, evoAt: 4, lv6: { name: "Guildmaster", text: "Crit +10%.", mods: { crit: 0.1 } } },
  szopin: { tech: "A chained blade weaves up his column (±40 px), bouncing off the top and the wall until its time is up.", role: "Area damage up and down one column.",
    upg: { dmg: 5, rate: 1.5, count: 4, dur: 4 }, evoAt: 4, lv6: { name: "God Slayer", text: "Blades +1.", mods: { count: 1 } } },
  "time-traveler": { tech: "A clockwork ray straight up her lane through every scale.", role: "Line clear; best on vertical stages.",
    upg: { dmg: 5, rate: 1.5, size: 1.5, crit: 0.4 }, evoAt: 4, lv6: { name: "Grandfather Clock", text: "Area +30%.", mods: { size: 0.3 } } },
  viking: { tech: "A whirling axe rolls straight up, stops on the first scale and grinds the body crawling through it.", role: "Area damage on one spot of the coil.",
    upg: { dmg: 5, rate: 1.5, size: 1.5, dur: 3 }, evoAt: 4, lv6: { name: "Valhalla", text: "Duration +1 s.", mods: { dur: 1 } } },
  dreamwalker: { tech: "A dream tide straight up its lane, sweeping left and right; it stops at the first scale.", role: "Very strong on one target at a time.",
    upg: { dmg: 6, rate: 1.5, count: 3, dur: 4, size: 1.5 }, evoAt: 4, lv6: { name: "Waking World", text: "Tides +1.", mods: { count: 1 } } },
  "kael-dragon": { tech: "Three dragonfire blades side by side where the party aims, each through 2 scales.", role: "The strongest damage there is, on three lines at once.",
    upg: { dmg: 7, rate: 2, count: 5, pierce: 5, crit: 0.5 }, evoAt: 4, lv6: { name: "Ascendance", text: "Pierce +2.", mods: { pierce: 2 } } },
};
DD.HEROES.forEach((h) => Object.assign(h, SPEC[h.id]));
/** Small numbers at the start (C27 B, 2026-11-02, user: "di awal serangan nya start dari kecil aja, jangan tiba2 party power udah
    langsung K"): every hit and the dragon's life ×0.2 (the ratio stays, so the balance stays), hero HP ×0.1 (the wall bite works on
    the ratio of the party's HP), Party Power and Recommended Power ÷40. */
DD.DMG_SCALE = 0.2;
DD.POWER_SCALE = 1 / 40;
DD.HEROES.forEach((h) => (h.hp = Math.round(h.hp * 0.1)));
/** The two core attributes of each hero: its Evo card shows only when both have at least one card (combo inside one hero). */
const CORE = {
  spellsword: ["count", "pierce"], ebenezer: ["count", "size"], "half-goblin": ["count", "pierce"], enchantress: ["bounce", "rate"],
  mercenary: ["dmg", "crit"], tracker: ["count", "dur"], dwarf: ["count", "size"], occultist: ["count", "size"],
  leprechaun: ["bounce", "crit"], knight: ["size", "crit"], "jack-frost": ["count", "dur"], cassandra: ["crit", "dur"],
  sorceress: ["size", "dur"], crusader: ["size", "dur"], "tou-lak": ["count", "dur"], alchemist: ["size", "dur"],
  alexandra: ["bounce", "crit"], marpesia: ["rate", "dur"], "loeg-yllavyre": ["count", "dur"], "amar-suen": ["gold", "crit"],
  minstrel: ["bounce", "rate"], scout: ["count", "pierce"], klaus: ["size", "dur"], archaeologist: ["count", "size"], "sugarplum-faerie": ["count", "size"],
  tristan: ["crit", "dur"], "guild-leader": ["dmg", "crit"], szopin: ["count", "dur"], "time-traveler": ["size", "crit"], viking: ["size", "dur"], dreamwalker: ["count", "size"],
  "kael-dragon": ["count", "pierce"],
};
DD.HEROES.forEach((h) => (h.core = CORE[h.id]));

/* ---------------------------------------------------------------- combos between heroes (Ledger TD Rules 4, Draft 10)
   Every hit leaves its element's status on the scale; a scale carries one element status, a new one replaces the old.
   Cracked (Physical) is kept apart and stacks. A reaction fires when a status meets its partner element; the status it
   uses is gone. Reactions work both ways round (Wet + Electric = Charged + Water). */
DD.STATUS = {
  water: { id: "wet", name: "Wet", t: 3, col: "#5ab4ff" },
  fire: { id: "burn", name: "Burning", t: 2, col: "#ff7a2a", dot: 0.2 }, // the hit's damage ×0.2 again over 2 s
  electric: { id: "charged", name: "Charged", t: 3, col: "#ffe24a" },
  nature: { id: "tangle", name: "Entangled", t: 2, col: "#7fe05a", slow: 0.9 }, // the whole dragon ×0.9
  physical: { id: "crack", name: "Cracked", t: 3, col: "#e8dcc8", per: 0.05, max: 3 }, // +5 % damage taken a stack
};
DD.REACT = {
  overload: { name: "Overload", pair: ["wet", "electric"], mul: 1.5, chain: 1,
    hint: "Overload! Wet + Electric: ×1.5, and a spark hits the next scale." },
  steam: { name: "Steam", pair: ["wet", "fire"], mul: 1.3, splash: 40,
    hint: "Steam! Wet + Fire: ×1.3, and half the damage splashes around." },
  wildfire: { name: "Wildfire", pair: ["burn", "nature"], burst: 1.5, share: 0.25, // the burn left flares ×1.5; each neighbour catches ¼
    hint: "Wildfire! Burning + Nature: the burn flares up and catches the scales next to it." },
  shatter: { name: "Shatter", frozen: 2, slowed: 1.25, // Physical on a frozen / slowed dragon
    hint: "Shatter! Physical hits on a frozen dragon deal ×2 (slowed: ×1.25)." },
};
/** The Element line of the hero sheet: the status a hero leaves and the reactions it makes (Ledger TD Draft 15). */
DD.ELEMENT_LINE = {
  water: "Water · leaves Wet (3 s) · Overload with Electric, Steam with Fire",
  fire: "Fire · leaves Burning (20% over 2 s) · Steam with Water, Wildfire with Nature",
  electric: "Electric · leaves Charged (3 s) · Overload with Water",
  nature: "Nature · leaves Entangled (dragon ×0.9) · Wildfire with Fire",
  physical: "Physical · leaves Cracked (+5% taken, ×3) · Shatter on a frozen or slowed dragon",
};
/** Heroes that freeze or slow the dragon, so Physical heroes shatter with them. */
const STILLS = ["jack-frost", "cassandra"];
/** The reaction two heroes make together, or null (Hero Call "Combo" label). */
DD.comboOf = function (a, b) {
  const els = [a.el, b.el].sort().join("+");
  const k = { "electric+water": "overload", "fire+water": "steam", "fire+nature": "wildfire" }[els];
  if (k) return k;
  if ((a.el === "physical" && STILLS.includes(b.id)) || (b.el === "physical" && STILLS.includes(a.id))) return "shatter";
  return null;
};
DD.KIND_STATS = {
  pierce: ["dmg", "rate", "count", "pierce", "crit"],
  jet: ["dmg", "rate", "count", "dur", "size"],
  beam: ["dmg", "rate", "size", "crit"],
  spray: ["dmg", "rate", "size", "dur"],
  bounce: ["dmg", "rate", "bounce", "crit"],
  boomerang: ["dmg", "rate", "count", "size"],
  hunter: ["dmg", "rate", "crit", "size"],
  orbit: ["dmg", "count", "size", "rate"],
  lob: ["dmg", "rate", "size", "dur"],
  charm: ["dmg", "rate", "crit", "dur"],
  summon: ["dmg", "rate", "dur", "size"],
  saw: ["dmg", "rate", "size", "dur"],
  rocket: ["dmg", "rate", "count", "dur"],
  ricochet: ["dmg", "rate", "count", "dur"],
  gold: ["dmg", "rate", "gold"],
};
DD.SKILL_MAX = 10; // a hero's skill level inside one battle (every card +1, Evo cards included)
DD.EVO_CHANCE = 0.35;
DD.FREE_REFRESH = 6;
DD.TAKE_ALL = 4;
DD.CALL_REFRESH = 3;
DD.REVIVES = 1;

/* ---------------------------------------------------------------- worlds and stages (C1, C2) */
const W = (id, name, dragon, el, mini, boss, bgm) => ({ id, name, dragon, el, mini, boss, bgm });
DD.WORLDS = [
  W("warren", "Mossfang Hollow", "warren_dragon", "nature", ["Goblin Brute", "warren_miniboss"], ["Goblin Chief", "goblin_chief"], ["bgm_warren", "bgm_warren_boss"]),
  W("barracks", "Ironhide Keep", "barracks_dragon", "physical", ["Haunted Armor", "barracks_miniboss"], ["Skeleton Captain", "skeleton_captain"], ["bgm_barracks", "bgm_crypt_rage"]),
  W("springs", "Mistfin Springs", "springs_dragon", "water", ["Bubble Toad", "springs_miniboss"], ["Ooze Mother", "ooze_mother"], ["bgm_venom", "bgm_venom_boss"]),
  W("bramble", "Thornback Thicket", "bramble_dragon", "nature", ["Thorn Wolf", "bramble_miniboss"], ["Thornback Boar", "thornback_boar"], ["bgm_jungle", "bgm_jungle_boss"]),
  W("windmill", "Stormwing Ridge", "windmill_dragon", "electric", ["Giant Crow", "windmill_miniboss"], null, ["bgm_lair", "bgm_lair_rage"]),
  W("cove", "Tidewyrm Cove", "cove_dragon", "water", ["Pirate Brute", "cove_miniboss"], ["Ironclaw Crab", "ironclaw_crab"], ["bgm_cathedral", "bgm_cathedral_boss"]),
  W("bridge", "Stonescale Bridge", "bridge_dragon", "physical", ["Bridge Ogre", "bridge_miniboss"], ["Stone Troll", "stone_troll"], ["bgm_storm", "bgm_storm_boss"]),
  W("ashen", "Ashscale Foothills", "ashen_dragon", "fire", ["Cinder Golem", "ashen_miniboss"], ["Ash Salamander", "ash_salamander"], ["bgm_lair", "bgm_lair_rage"]),
  W("obsidian", "Obsidian Wyrm Pass", "obsidian_dragon", "physical", ["Glass Golem", "obsidian_miniboss"], ["Ember Harpy Queen", "ember_harpy_queen"], ["bgm_dragon", "bgm_lair_rage"]),
  W("ember", "Ember Drake Nest", "ember_dragon", "fire", ["Ember Whelp", "ember_miniboss"], null, ["bgm_dragon", "bgm_lair_rage"]),
  W("fire", "Blazefang Lair", "dragon", "fire", null, null, ["bgm_lair", "bgm_lair_rage"]),
  W("frost", "Frostscale Cavern", "frost_dragon_face", "water", null, null, ["bgm_frost", "bgm_frost_rage"]),
  W("crypt", "Bone Wyrm Crypt", "shadow_dragon_face", "physical", null, null, ["bgm_crypt", "bgm_crypt_rage"]),
  W("jungle", "Hydra Fen Temple", "bramble_dragon", "nature", ["Vine Ape", "jungle_miniboss"], ["Jade Colossus", "jade_colossus"], ["bgm_jungle", "bgm_jungle_boss"]),
  W("storm", "Thunder Drake Spire", "storm_dragon", "electric", null, null, ["bgm_storm", "bgm_storm_boss"]),
  W("cathedral", "Drowned Wyrm Cathedral", "cathedral_dragon", "water", ["Coral Golem", "cathedral_miniboss"], ["Abyssal Leviathan", "abyssal_leviathan"], ["bgm_cathedral", "bgm_cathedral_boss"]),
  W("venom", "Venomscale Mire", "venom_dragon", "nature", null, null, ["bgm_venom", "bgm_venom_boss"]),
  W("rift", "Riftwing Chasm", "eclipse_dragon", "electric", ["Dream Moth", "rift_miniboss"], ["Nightmare Weaver", "nightmare_weaver"], ["bgm_rift", "bgm_rift_boss"]),
  W("sand", "Sandwyrm Dunes", "sand_dragon", "physical", null, null, ["bgm_sand", "bgm_sand_boss"]),
  W("hive", "Broodmother Hive", "hive_dragon", "nature", ["Hive Warrior", "hive_miniboss"], null, ["bgm_jungle", "bgm_jungle_boss"]),
  W("rust", "Rustscale Scrapyard", "rust_dragon", "physical", ["Rust Drake", "rust_miniboss"], null, ["bgm_storm", "bgm_storm_boss"]),
  W("ghostship", "Ghostwyrm Graveyard", "ghostship_dragon", "water", ["Drowned Pirate", "ghostship_miniboss"], ["Ghost Captain", "ghost_captain"], ["bgm_cathedral", "bgm_cathedral_boss"]),
  W("bone", "Old Dragon's Salt Flats", "bone_dragon", "physical", ["Bone Drake", "bone_miniboss"], null, ["bgm_crypt", "bgm_crypt_rage"]),
  W("colosseum", "Titanscale Arena", "bone_dragon", "physical", ["Cyclops Brute", "colosseum_miniboss"], ["Minotaur Gladiator", "minotaur_gladiator"], ["bgm_lair", "bgm_lair_rage"]),
  W("eclipse", "Eclipse Drake Observatory", "eclipse_dragon", "electric", ["Eclipse Drake", "eclipse_miniboss"], null, ["bgm_rift", "bgm_rift_boss"]),
  W("vampire", "Bloodwing Keep", "eclipse_dragon", "nature", ["Blood Bat", "vampire_miniboss"], ["Vampire Countess", "vampire_countess"], ["bgm_crypt", "bgm_crypt_rage"]),
  W("blossom", "Blossom Wyrm Shrine", "blossom_dragon", "nature", ["Blossom Drake", "blossom_miniboss"], null, ["bgm_jungle", "bgm_jungle_boss"]),
  W("forge", "Magma Drake Forge", "rust_dragon", "fire", ["Forge Imp", "forge_miniboss"], ["Iron Juggernaut", "iron_juggernaut"], ["bgm_lair", "bgm_lair_rage"]),
  W("amethyst", "Crystal Wyvern Geode", "amethyst_dragon", "electric", ["Amethyst Drake", "amethyst_miniboss"], null, ["bgm_rift", "bgm_rift_boss"]),
  W("elder", "Elder Dragon's Throne", "elder_dragon", "fire", ["Elder Drake", "elder_miniboss"], null, ["bgm_dragon", "bgm_lair_rage"]),
];
DD.isRound = (n) => n >= 4 && (n - 4) % 5 === 0; // Stage 4, 9, 14, …
/* C27 H (2026-11-02, user: "stage akan menjadi tanpa batas. jadi variasi dari naga itu juga penting, sekarang aku lihat judul2nya stage masih
   banyak salah. seperti goblin. padahal judul kita dragon & defence" and "jalur naga berjalan juga seperti monotone"): the thirty world
   names are dragon places now (same element and order); after Stage 30 they come round again as II, III …; the path changes its shape
   with the stage: Rows (Stage 1–2), then Wave, Slant, Zigzag, Column, Rows …; round stages: a circle or a tall oval in turn, and the
   turning way changes every second round stage (4 spiral →, 9 oval →, 14 spiral ←, 19 oval ←, …). */
DD.PATHS = ["rows", "wave", "slant", "zigzag", "column"];
// counted over the stages that are not round stages (every fifth stage is round, so counting every stage would skip one shape for good)
DD.pathKind = (n) => { if (DD.isRound(n)) return Math.floor((n - 4) / 5) % 2 ? "oval" : "spiral"; if (n <= 2) return "rows"; const ord = n - (n >= 4 ? Math.floor((n - 4) / 5) + 1 : 0); return DD.PATHS[(ord - 3) % DD.PATHS.length]; };
DD.roundDir = (n) => (Math.floor((n - 4) / 10) % 2 ? -1 : 1);
/** Columns put the body over fewer lanes at a time (sim 2026-11-02: 15 % vs 24 % progress on Stage 7), so their dragon is thinner. */
DD.PATH_HP = { rows: 1, wave: 0.96, slant: 0.96, zigzag: 1, column: 0.86, spiral: 1, oval: 1 }; // tuned 2026-11-02 so every shape is about as hard as rows (sim, stages 5–7)
/* C27 H, Draft 23.8 (2026-11-02, user: "naganya secara fisiki juga harus beda" → "go"): 13 dragon forms, each owned by one element, so no
   two dragons are the same shape in another colour. Each world has its form; the battle draws the form's head, segment, tail, chest,
   pearl and elite pieces, plus its feature: "under" = a pair of limbs drawn below the segment along the body (w = width in segment
   radii), "swap" = a variant segment; every n segments, or at the listed places. headScale widens a wide head (the Hydra's three). */
DD.FORMS = {
  ember: { el: "fire", name: "Ember Drake", dir: "fire", feats: [{ part: "legs", every: 6, w: 4.2 }] },
  magma: { el: "fire", name: "Magma Wyrm", feats: [{ part: "feat", every: 6, swap: true }] },
  elder: { el: "fire", name: "Elder Dragon", feats: [{ part: "feat", at: [3], w: 7.5 }], headScale: 1.1 },
  tide: { el: "water", name: "Tide Serpent", feats: [{ part: "feat", every: 6, w: 4.2 }] },
  frost: { el: "water", name: "Frost Wyrm", feats: [{ part: "feat", every: 6, w: 4 }] },
  moss: { el: "nature", name: "Moss Wyrm", feats: [{ part: "feat", every: 6, swap: true }] },
  hydra: { el: "nature", name: "Hydra", feats: [{ part: "feat", every: 6, swap: true }], headScale: 1.35 },
  brood: { el: "nature", name: "Broodmother", feats: [{ part: "feat", every: 1, w: 3.6 }, { part: "extra", at: [2], w: 6.5 }] },
  wyvern: { el: "electric", name: "Storm Wyvern", feats: [{ part: "feat", at: [2], w: 7.5 }] },
  crystal: { el: "electric", name: "Crystal Wyvern", feats: [{ part: "feat", every: 6, w: 4 }, { part: "extra", at: [2], w: 7 }] },
  ironhide: { el: "physical", name: "Ironhide Drake", feats: [{ part: "feat", every: 6, w: 3.8 }] },
  bone: { el: "physical", name: "Bone Wyrm", feats: [{ part: "feat", every: 6, w: 4.2 }] },
  sand: { el: "physical", name: "Sand Wyrm", feats: [{ part: "feat", every: 6, w: 3.8 }] },
};
DD.WORLD_FORM = { warren: "moss", barracks: "ironhide", springs: "tide", bramble: "moss", windmill: "wyvern", cove: "tide", bridge: "ironhide",
  ashen: "ember", obsidian: "ironhide", ember: "ember", fire: "ember", frost: "frost", crypt: "bone", jungle: "hydra", storm: "wyvern",
  cathedral: "tide", venom: "hydra", rift: "wyvern", sand: "sand", hive: "brood", rust: "ironhide", ghostship: "tide", bone: "bone",
  colosseum: "ironhide", eclipse: "wyvern", vampire: "brood", blossom: "moss", forge: "magma", amethyst: "crystal", elder: "elder" };
const ROMAN = ["", "", " II", " III", " IV", " V", " VI", " VII", " VIII", " IX", " X"];
DD.cycleName = (n) => { const c = Math.floor((n - 1) / 30) + 1; return c < ROMAN.length ? ROMAN[c] : " " + c; };
/** Stage N from the formula, so Stage 1 to the hundreds need no new data (D13). */
DD.stage = function (n) {
  const w = DD.WORLDS[(n - 1) % DD.WORLDS.length];
  const round = DD.isRound(n);
  // ×1.15 a stage up to Stage 30, then ×1.07 (2026-10-29, Ledger TD Draft 16: ×1.04 let a free player clear Stage 31–45 in one day)
  // no. 110–112 (user: "naikan statistik naga semakin kuat setiap 10 level" … "pakai B"; Ledger Draft 41.2, C16): on top of
  // that, ×1.5 at the first stage of every chapter (Stage 11, 21, 31 …)
  // C55: a new player starts with 3 random Commons and no Kael (C54), so the first stages start gentler: ×0.5 at Stage 1, +0.1 a
  // stage, normal from Stage 6 (user no. 64: "stage 1 naga itu seharusnya mulai dari angka kecil")
  const growth = Math.pow(1.15, Math.min(n, 30) - 1) * Math.pow(1.07, Math.max(0, n - 30)) * Math.pow(1.5, Math.floor((n - 1) / 10)) * (DD.EASE[n - 1] || 1);
  // the tail: the world's boss, or its mini boss painted bigger; round stages have none
  const boss = round ? null : w.boss || w.mini || null;
  return {
    n, name: `${n}. ${w.name}${DD.cycleName(n)}`, world: w.id, worldName: w.name + DD.cycleName(n), path: DD.pathKind(n), form: DD.WORLD_FORM[w.id] || "ember", dragon: w.dragon, el: w.el, weak: DD.WEAK_TO[w.el],
    art: `creatures/${w.dragon}.webp`, head: `creatures/head_${w.dragon}.webp`, bg: `dd/bg_${w.id}.webp`, bgm: w.bgm,
    round, rider: w.mini, boss, bossFromMini: !round && !w.boss && !!w.mini,
    // the body's HP climbs ×4 head to tail on Stage 1, up to ×22 from Stage 21 (the heroes grow inside a battle)
    segments: Math.min(160, 80 + 4 * n), base: 128 * growth * DD.DMG_SCALE * (DD.PATH_HP[DD.pathKind(n)] || 1), // ×1.6 on 2026-10-28: the new base damage made the Rare heroes ~2× stronger (Ledger TD Draft 13)
     ramp: 4 + 18 * Math.min(1, (n - 1) / 20), power: Math.max(1, Math.round(2600 * growth * DD.POWER_SCALE)),
  };
};
/** Hard Mode (Cell Survivor, Ledger TD C23, 2026-10-31): every Normal stage again with a thicker dragon and more loot; opens
    after Chapter 1. Chapters = 10 stages; finishing one (its 10th stage) gives the chapter gift once. */
DD.HARD = { hp: 2.5, coins: 2, exp: 1.5, first: { gems: 30, stones: 2 } };
DD.hardStage = (n) => { const s = DD.stage(n); return { ...s, hard: true, name: s.name + " (Hard)", base: s.base * DD.HARD.hp, power: Math.round(s.power * DD.HARD.hp) }; };
DD.CHAPTER = 10;
DD.chapterOf = (n) => Math.ceil(n / DD.CHAPTER);
DD.CHAPTER_GIFT = { gems: 100, tickets: 2, keys: 2 };
/* special scales: every 8th from the 4th, Pearl and Soul Shard in turn (Pearl first); a chest every 25th from the 16th */
/** The wall (bug list A5, Confirmed C26): the dragon bites WALL_BITE of the party's base wall a second; HP above the base
    stretches the time by (HP / base)^WALL_HP_EXP (0.5 = square root: 4× the HP holds 2× as long). */
DD.WALL_BITE = 0.07;
DD.WALL_HP_EXP = 0.5;
DD.SPECIAL = { every: 8, first: 4, chestEvery: 25, chestFirst: 16, hpMul: 1.3 };
DD.DRAGON_SPEED = 30; // px per second at ×1
/* sizes (px radius at a 375 px wide field), measured on Heroes vs Crazy Wiggler (user 2026-10-24: "SEMUA KECIL2 KAYAK SEMUT"):
   a body row there is 52–55 px thick and the rows touch; the chain fills the width edge to edge */
DD.SEG_R = 29;
DD.COIL_ROWS = 7; // most rows the body winds through at the top of a vertical stage (fewer when the field is short)
DD.COIL_BAND = 0.62; // share of the field height the rows may fill
DD.ROUND_TURNS = 3.2; // spiral turns on round stages
DD.HEAD_R = 36;
DD.RIDER_R = 44;
DD.BOSS_R = 60;
DD.HEAD_MUL = 6;
DD.RIDER_MUL = 25;
DD.BOSS_MUL = 15;
DD.BOSS_SPEED = 0.55; // the boss crawls at this share of the dragon speed
DD.PROGRESS_CHESTS = [30, 60, 100];

/* ---------------------------------------------------------------- formation (C5) */
DD.SLOT_STAGES = [0, 0, 0, 0, 3, 8, 15, 25]; // party slot k opens after clearing this stage (C21: no Commander slot, all equal)
DD.slotsOpen = (cleared) => DD.SLOT_STAGES.filter((s) => cleared >= s).length;
DD.START_HEROES = ["half-goblin", "enchantress", "tracker"]; // Common since C27 C
DD.PARTY_MAX = 5;
/** Weapon types (C27 F, user: "equipment seharusnya memiliki banyak jenis, dan bukan blade, tapi weapon. di mana lead yang pakai bukan
    sesuai senjatanya tidak mendapatkan effect maksimal"): every hero fights with one type; the Lead's weapon works fully only on its type. */
DD.WEAPON_TYPES = { sword: "Sword", dagger: "Dagger", bow: "Bow", staff: "Staff", tome: "Tome", axe: "Axe", hammer: "Hammer", spear: "Spear", orb: "Orb" };
DD.HERO_WEAPON = { spellsword: "sword", knight: "sword", "half-goblin": "dagger", cassandra: "dagger", tracker: "bow", mercenary: "bow",
  sorceress: "staff", occultist: "staff", "loeg-yllavyre": "staff", alexandra: "tome", alchemist: "tome", dwarf: "axe", crusader: "hammer",
  marpesia: "spear", "tou-lak": "spear", enchantress: "orb", "jack-frost": "orb", leprechaun: "orb", ebenezer: "orb", "amar-suen": "orb",
  minstrel: "tome", scout: "bow", klaus: "staff", archaeologist: "orb", "sugarplum-faerie": "orb", tristan: "sword", "guild-leader": "tome", szopin: "axe",
  "time-traveler": "staff", viking: "axe", dreamwalker: "orb" /* C33 G7 */, "kael-dragon": "sword" /* C36 G3 */ }; // C27 D (user: "maksnya bawa 5. semua muncul langsung"): five places, all open from the start
// C54 (user no. 116: "kartu kael tidak di dapat di awal, itu dapatnya sebagai pinjaman menggantikan ysmay. expired 3 hari. dan hanya di
// dapat setelah stage 3"): the hero on loan is Kael, for 72 hours from the first time Stage 3 is cleared (was Ysmay, 24 h from the start)
DD.TRIAL = { id: "spellsword", hours: 72, afterStage: 3 };
/** C55 (user no. 118: "ga boleh ada freeze yang lebih dari 0.4 detik"): the longest a freeze (Frozen, Stun, a stop) holds the dragon,
    and the pause before the next freeze can start (js/battle-c43.js c43init) */
DD.FREEZE_MAX = 0.4;
DD.FREEZE_CD = 1.6;
// C54 (user no. 116–117: "di awal user di berikan 3 kartu ntuk diopen" · "acak"): a new player opens 3 hero cards, 3 different random Commons
DD.START_CARDS = 3;
// C55: the first stages are gentler (the dragon's life ×0.5 at Stage 1 …), so any 3 random Commons clear Stages 1–3 before Kael comes
DD.EASE = [0.5, 0.6, 0.7, 0.8, 0.9];
// C55: Stages 1–3 (before Kael comes) have a Pearl or a Shard on every 4th scale from the 2nd: the lead is alone for less time
DD.SPECIAL_EARLY = { first: 2, every: 4, upTo: 3 };
// C55: the 3 starter cards put the hero that holds best alone in the lead (the lead fights alone until a Shard scale breaks)
DD.START_LEAD = ["enchantress", "mercenary", "half-goblin", "ebenezer", "klaus", "tracker"];

/* ---------------------------------------------------------------- Recruit (C6) */
DD.TICKET_GEMS = 200;
DD.RECRUIT_LV_PULLS = [20, 60, 100, 150, 200]; // pulls to go from Lv 1, 2, 3, 4, 5 to the next
DD.RECRUIT_TIERS = ["common", "rare", "epic", "legendary"];
DD.RECRUIT_ODDS = [ // common, rare, epic, legendary per Recruit level (C27 C)
  [0.6, 0.28, 0.1, 0.02], [0.56, 0.29, 0.12, 0.03], [0.52, 0.3, 0.14, 0.04], [0.48, 0.31, 0.16, 0.05], [0.44, 0.32, 0.17, 0.07], [0.4, 0.33, 0.19, 0.08],
];
DD.DESIRED_SHARE = 0.5;

/* ---------------------------------------------------------------- Artifacts (C21; were the Commander equipment of C7) */
/* ---------------------------------------------------------------- Equipment (C27 F, 2026-11-02; the Artifacts of C21 renamed)
   User: "ganti artifact jadi equipment. dan gabungkan dengan party. dengan tab baru. equipment seharusnya memiliki banyak jenis, dan bukan
   blade, tapi weapon. di mana lead yang pakai bukan sesuai senjatanya tidak mendapatkan effect maksimal" … "equipment tidak boleh
   persentase, melainkan angka fix". The Lead wears six pieces; their numbers go to the whole party (Party Power). base = Tier 1 Normal:
   ATK, Crit and Haste in points (1 point = 0.1 % behind the screen), Wall HP flat. */
DD.SLOTS = [
  { id: "weapon", name: "Weapon", stat: "atk", base: 0.03 }, { id: "helm", name: "Helm", stat: "hp", base: 15 },
  { id: "armor", name: "Armor", stat: "hp", base: 25 }, { id: "gloves", name: "Gloves", stat: "crit", base: 0.008 },
  { id: "boots", name: "Boots", stat: "haste", base: 0.015 }, { id: "amulet", name: "Amulet", stat: "atk", base: 0.015 },
];
DD.SLOTS.forEach((s) => (s.art = `2a/eq/${s.id === "weapon" ? "sword" : s.id}_lo.webp`));
/** Names: material by rarity (Normal … Epic), a name of its own at Legendary; the name + tier decide which two pieces may fuse. */
DD.EQ_MAT = ["Iron", "Steel", "Runed", "Dragonbone"];
DD.EQ_NOUN = { helm: "Helm", armor: "Mail", gloves: "Gauntlets", boots: "Greaves", amulet: "Amulet" };
DD.EQ_LEGEND = { sword: "Vorpal Sword", dagger: "Shadowfang", bow: "Skyreach Bow", staff: "Archmage Staff", tome: "Codex of Ages", axe: "Worldsplitter",
  hammer: "Titan's Maul", spear: "Dawnspear", orb: "Orb of Eternity", helm: "Crown of Ages", armor: "Aegis of Dawn", gloves: "Grip of Titans",
  boots: "Windwalkers", amulet: "Heart of Dreams" };
/** The picture of a piece: its weapon type or slot, a plain look up to Rare and a grand look from Epic (sheets A19, A20). */
DD.eqArt = (g) => `2a/eq/${g.type || g.slot}_${g.r >= 3 ? "hi" : "lo"}.webp`;
DD.eqKey = (g) => `${g.slot}:${g.type || ""}:${g.r}`;
DD.TIER_MULT = (t) => Math.pow(1.6, t - 1);
DD.STAR_MAX = 5;
DD.STAR_STEP = 0.1; // +10 % of the main number a star
DD.starCost = (stars) => 2 * (stars + 1); // Enchant Stones
DD.tierUpCost = (t) => ({ coins: Math.round(300 * Math.pow(2.5, t - 1)), ore: Math.round(5 * Math.pow(2, t - 1)) }); // C64.7: five stars → next tier
DD.WEAPON_OFF = 0.5; // a weapon of another type than the Lead's: half its ATK, its effects off
/** Effects (C64.9): Epic, Legendary (two) and any piece from Tier 3 carry one; the number grows with the tier. */
DD.EQ_FX = {
  dragonbane: { name: "Dragonbane", stat: "boss", v: 0.05 }, keen: { name: "Keen Edge", stat: "critDmg", v: 0.1 },
  reach: { name: "Reach", stat: "area", v: 0.04 }, linger: { name: "Lingering", stat: "dur", v: 0.04 }, swift: { name: "Swiftness", stat: "haste", v: 0.02 },
  el_fire: { name: "Fire Edge", stat: "el_fire", v: 0.05 }, el_water: { name: "Tide Edge", stat: "el_water", v: 0.05 },
  el_electric: { name: "Storm Edge", stat: "el_electric", v: 0.05 }, el_nature: { name: "Thorn Edge", stat: "el_nature", v: 0.05 },
  el_physical: { name: "Iron Edge", stat: "el_physical", v: 0.05 },
};
DD.fxValue = (k, tier) => DD.EQ_FX[k].v * DD.TIER_MULT(tier);
DD.fxCount = (r, t) => (r === 4 ? 2 : r === 3 || t >= 3 ? 1 : 0);
/** Where equipment comes from (C64.1: never from the dungeon itself): the Shop's Equipment Chest, and a Dragon Chest that a won battle
    may drop. Mostly Tier 1; a higher tier is rare. */
DD.DRAGON_CHEST = { chance: 0.35, hard: 0.5, // C29 D: five sets to fill (was 0.2 / 0.35)
  odds: [0.55, 0.3, 0.12, 0.027, 0.003] };
DD.DROP_TIERS = [0.92, 0.07, 0.01];
DD.EQ_MIGRATE = { blade: "weapon", tome: "amulet", crown: "helm", aegis: "armor", charm: "gloves", banner: "boots" };
/** old equipment slot → artifact slot (save conversion) */
/** Every artifact has a name: one per slot and rarity (Normal, Superior, Rare, Epic, Legendary), 2026-10-31 (user: "lihat bagaimana di
    sana menyusun dan menamai setiap barang"). */
DD.ART_NAMES = {
  blade: ["Iron Blade", "Steel Blade", "Runed Blade", "Dragonbone Blade", "Vorpal Blade"],
  tome: ["Worn Tome", "Scholar's Tome", "Runic Tome", "Arcane Codex", "Greedy Ledger"],
  crown: ["Copper Circlet", "Silver Circlet", "Jeweled Crown", "Royal Crown", "Crown of Ages"],
  aegis: ["Wooden Shield", "Iron Shield", "Warden's Shield", "Queen's Guard", "Aegis of Dawn"],
  charm: ["Bead Charm", "Silver Charm", "Sapphire Charm", "Dream Amulet", "Heart of Dreams"],
  banner: ["Torn Banner", "Guild Banner", "War Banner", "Royal Standard", "Winner's Flag"],
};
DD.artName = (g) => (g.r === 4 ? DD.EQ_LEGEND[g.type || g.slot] : `${DD.EQ_MAT[g.r]} ${g.type ? DD.WEAPON_TYPES[g.type] : DD.EQ_NOUN[g.slot]}`);
DD.SLOT_MIGRATE = { helm: "aegis", armor: "charm", boots: "banner", gauntlets: "tome", amulet: "crown", blade: "blade" };
/** Affixes: the party attributes an artifact can add. v = value at Tier 1, before the roll (×0.8–1.2) and the stars (+20 % each). */
DD.AFFIX = {
  crit: { name: "Crit Chance", v: 0.015 }, critDmg: { name: "Crit Damage", v: 0.08 }, haste: { name: "Haste", v: 0.025 },
  area: { name: "Area", v: 0.03 }, dur: { name: "Duration", v: 0.03 }, boss: { name: "Head DMG", v: 0.05 },
  el_physical: { name: "Physical DMG", v: 0.05 }, el_fire: { name: "Fire DMG", v: 0.05 }, el_water: { name: "Water DMG", v: 0.05 },
  el_electric: { name: "Electric DMG", v: 0.05 }, el_nature: { name: "Nature DMG", v: 0.05 },
};
DD.AFFIX_COUNT = [0, 1, 1, 2, 3]; // per rarity: Normal, Superior, Rare, Epic, Legendary
DD.affixValue = (a, tier) => DD.AFFIX[a.k].v * (1 + 0.25 * (tier - 1)) * a.q * (1 + 0.2 * (a.s || 0));
/** Enchantment (C21, replaces the runes of C18): Enchant Stones raise one affix a star (5 at most) or reroll one affix. */
DD.ENCHANT_MAX = 5;
DD.enchantCost = (star) => 2 * (star + 1);
DD.REROLL_COST = 5;
DD.STONE_PATROL_H = 4; // Patrol: 1 Enchant Stone every 4 hours from Stage 15
DD.STONE_CHEST = 0.3; // chance of a stone with every Artifact Chest
DD.STONE_ICON = "dd/icon_stone.webp";
/** Party Training (C21, replaces the Talents of C7; pattern from Cell Survivor): three lines bought with coins, a Rank Up
    every 10 levels once all three are equal; each rank opens a party perk. */
DD.TRAIN = [{ id: "atk", name: "ATK", per: 0.02 }, { id: "crit", name: "Crit", per: 0.004 }, { id: "haste", name: "Haste", per: 0.008 }];
/* C27 B (2026-11-02, user: "training tidak boleh persentase malinkan angka fix ... nantinya bisa tembus sampai million trilion zetilion
   sampai tanpa batas, tapi itu expensi yang panjang"): no top level. ATK: level L adds 20 × 1.05^(L−1) points (1 point = 0.1 %), so it
   grows without end; Crit +4 and Haste +8 points a level up to their caps (600 and 1,000). Each level costs 150 × 1.15^L coins. */
DD.TRAIN_MAX = Infinity;
DD.trainCost = (lv) => Math.max(Math.round(400 * Math.pow(1.11, lv)), Math.round(150 * Math.pow(1.15, lv))); // no. 103–104 (Draft 20.11): Training L ≈ Stage L
DD.trainPts = (id, lv) => (id === "atk" ? Math.round((20 * (Math.pow(1.05, lv) - 1)) / 0.05) : id === "crit" ? 4 * lv : 8 * lv);
/** Rank 11 and up (no list): ATK +500 × 1.5^(rank − 11) points. */
DD.rankPerk = (i) => DD.RANKS[i] || { atk: 0.5 * Math.pow(1.5, i - DD.RANKS.length) };
DD.RANKS = [
  { area: 0.1 }, { critDmg: 0.25 }, { dur: 0.1 }, { haste: 0.1 }, { proj: 1 }, { area: 0.1 }, { critDmg: 0.5 }, { boss: 0.25 }, { dur: 0.15 }, { proj: 1 },
];
/** Party Level (C21; the Player Level renamed): every level adds party ATK and HP. */
DD.PARTY_LV = { atk: 0.015, hpFlat: 10 }; // ATK +15 points, Wall HP +10 a level (C27 B: flat HP, no percent on screen)
/** C48 (user no. 97: "mana boleh ada hero shard. sangat membingungkan. kalau bener mah, kertu duplicat aja, 1 cara cukup."): no Party Shards any more; a hero's cards are its duplicates from Recruit, nothing else.
    Party Shards (C21, 2026-10-30) were: every Party Level up gave these; each one was one shard of any hero the player picks.
    They replace C15 (Kael levelled for free with the Player Level): the growth stays, but it goes to whoever the player wants. */
DD.plShards = () => 0; // C48: none (was 1 per Party Level)
/** The party attributes, their names, icons and caps (C21). */
DD.ATTR = {
  atk: { name: "ATK", icon: "dd/stat_atk.webp", pct: true }, hp: { name: "Wall HP", icon: "dd/stat_hp.webp" },
  crit: { name: "Crit", icon: "dd/stat_crit.webp", pct: true, cap: 0.6 }, critDmg: { name: "Crit DMG", icon: "dd/stat_critdmg.webp", pct: true, cap: 3 },
  haste: { name: "Haste", icon: "dd/stat_haste.webp", pct: true, cap: 1 }, area: { name: "Area", icon: "dd/stat_area.webp", pct: true, cap: 0.6 },
  dur: { name: "Duration", icon: "dd/stat_dur.webp", pct: true, cap: 0.6 }, proj: { name: "Projectiles", icon: "dd/stat_proj.webp", cap: 2 },
  boss: { name: "Head DMG", icon: "dd/stat_boss.webp", pct: true, cap: 1 },
};
DD.EL_CAP = 1;
/** Animation strips baked from the user's videos (Database Request Video): add the name here once assets/dd/<name>.webp exists. */
DD.ANIM_READY = [];
DD.SLOT = Object.fromEntries(DD.SLOTS.map((s) => [s.id, s]));
DD.GEAR_RARITY = ["normal", "superior", "rare", "epic", "legendary"];
DD.GEAR_RARITY_NAME = { normal: "Normal", superior: "Superior", rare: "Rare", epic: "Epic", legendary: "Legendary" };
DD.GEAR_MULT = [1, 1.5, 2.2, 3.2, 4.6];
DD.GEAR_BASE = 0.04;
DD.gearTier = (cleared) => 1 + Math.floor(cleared / 10);
DD.gearValue = (g) => DD.SLOT[g.slot].base * DD.GEAR_MULT[g.r] * DD.TIER_MULT(g.tier) * (1 + DD.STAR_STEP * (g.stars || 0));
DD.SLOT_LV_VALUE = { atk: 0.005, hp: 3, crit: 0.001, haste: 0.002 }; // a slot level: ATK +5, Wall HP +3, Crit +1, Haste +2
DD.SLOT_LV_MAX = 100;
DD.enhanceCost = (lv) => ({ coins: Math.max(Math.round(250 * Math.pow(1.11, lv)), Math.round(80 * Math.pow(1.15, lv))), ore: 1 + Math.floor(lv / 5) }); // no. 103–104 (Draft 20.11)
DD.DISASSEMBLE_ORE = [1, 2, 4, 8, 16];
DD.BAG_MAX = 60; // C29 D: each hero has six slots now (was 30)
// the old Talents (C7): only read to convert an old save into Party Training
DD.TALENT_ROWS = 10;
DD.TALENT_SMALL = [ // per level
  { id: "atk", name: "ATK", v: 0.02 }, { id: "hp", name: "HP", v: 0.02 }, { id: "crit", name: "Crit", v: 0.01 },
];
DD.TALENT_SMALL_MAX = 5;
DD.TALENT_BIG = (row) => (row % 2 === 0 ? { stat: "dmg", name: "Damage", v: 0.1 } : { stat: "wall", name: "Wall HP", v: 0.1 }); // row 0 = the 1st
DD.talentCost = (bought) => Math.round(100 * Math.pow(1.25, bought));
DD.ONE_CLICK_MAX = 20;

/* ---------------------------------------------------------------- Shop (C8) */
DD.CHEST_KEY_GEMS = 150;
DD.CHEST_10_GEMS = 1350;
DD.CHEST_LV_OPENS = [20, 50, 100, 200];
DD.CHEST_ODDS = [ // Equipment Chest: normal, superior, rare, epic, legendary per chest level (C27 F: "ga boleh kegampangan")
  [0.4, 0.33, 0.2, 0.06, 0.01], [0.35, 0.33, 0.22, 0.08, 0.02], [0.3, 0.33, 0.25, 0.1, 0.02], [0.25, 0.32, 0.28, 0.12, 0.03], [0.2, 0.32, 0.3, 0.14, 0.04],
];
DD.OFFER_HOURS = 4;
DD.OFFER_FREE_REFRESH = 5;
DD.OFFER_REFRESH_GEMS = 10;
DD.OFFERS = [
  { id: "gems", name: "Gems", give: { gems: 20 }, pay: "ad" },
  { id: "ticket", name: "Recruit Ticket", give: { tickets: 1 }, pay: "ad" },
  { id: "energy", name: "Energy", give: { energy: 30 }, pay: { gems: 88 } }, // C48: was "Hero Shards" (3 random cards for coins); the same as the energy buy
  { id: "ore", name: "Forge Ore", give: { ore: 10 }, pay: { coins: 600 } },
  { id: "key", name: "Chest Key", give: { keys: 1 }, pay: { gems: 120 } },
  { id: "stones", name: "Enchant Stone", give: { stones: 5 }, pay: { coins: 900 } },
];

/* ---------------------------------------------------------------- Patrol, energy, Player Level, rewards (C9) */
DD.patrolRate = (cleared) => ({ coins: 30 + 6 * cleared, ore: 2 + Math.floor(cleared / 5), exp: 20 + 2 * cleared, gearEveryH: 2 });
DD.PATROL_MAX_H = 16;
DD.QUICK_PATROL_H = 2;
DD.QUICK_PATROL_DAY = 10;
DD.QUICK_PATROL_AD = 5;
DD.ENERGY_BASE = 30;
DD.ENERGY_CAP_MAX = 40;
DD.ENERGY_RUN = 5;
DD.ENERGY_MIN = 5; // minutes per point
DD.ENERGY_AD = 15;
DD.ENERGY_AD_DAY = 5;
DD.ENERGY_BUY = { gems: 88, energy: 30 };
DD.PL_EXP = (lv) => Math.round(100 * Math.pow(lv, 1.5));
DD.PL_ENERGY = 10;
DD.DOUBLE_DAY = 3;
DD.winCoins = (n) => 50 * n;
DD.runExp = (n, progress) => Math.round((20 + 100 * progress) * (1 + 0.2 * n));
DD.WIN_GEAR = 0; // C27 F: a battle gives no equipment itself, only a Dragon Chest on a win (DD.DRAGON_CHEST)

/* ---------------------------------------------------------------- unlocks (C10): screen → stage to clear */
DD.UNLOCK = { heroes: 1, recruit: 1, missions: 1, party: 2, artifacts: 2, patrol: 3, training: 4, pass: 5, shop: 5, collection: 10, hard: 10, enchant: 15, limited: 15 };
DD.UNLOCK_NAME = { heroes: "Heroes", recruit: "Recruit", missions: "Missions", party: "Party", artifacts: "Artifacts", patrol: "Patrol", training: "Training", pass: "Progression Pass", shop: "Shop", hard: "Hard Mode",
  collection: "Collection", enchant: "Enchantment", limited: "Limited Recruitment" };

/* ---------------------------------------------------------------- build stage 3 (Ledger TD Draft 18 / Confirmed C17–C19) */
/** Collection: an album of V2 artifact paintings (only the picture and the name; no V2 effect). Each item Lv 0–10 from
    copies out of Collection Chests; every level adds a permanent team stat. */
DD.COLL_TIERS = { fine: { name: "Fine", w: 50, v: 0.01 }, superior: { name: "Superior", w: 30, v: 0.015 }, rare: { name: "Rare", w: 15, v: 0.02 }, epic: { name: "Epic", w: 5, v: 0.03 } };
DD.COLL_CRIT = 0.3; // Crit items give 30 % of the tier's value (1 % ATK ~ 0.3 % Crit)
/* ---------------------------------------------------------------- Artifacts (C27 G, 2026-11-02; the Collection album of C17 became real
   artifacts, user: "pada tab artifact, seharusnya beneran artifact, buat daftarnya dan buat gambarnya. artifact. bisa berikan special
   effect. buat beberapa artifact 10 saja di awal"). Ten relics (pictures A12), each with its own effect; three are worn at a time;
   copies from Artifact Chests (the old Collection Chests) raise them Lv 1 → 10. v(lv) = the effect at that level. */
const AV = (a, b) => (lv) => a + b * (Math.max(1, lv) - 1);
DD.COLLECTION = [
  { id: "lucky_coin", name: "Lucky Coin", tier: "fine", fx: "coin", v: AV(0.1, 0.05), line: (v) => `Coins from battles ×${(1 + v).toFixed(2)}` },
  { id: "thiefs_lockpick", name: "Thief's Lockpick", tier: "fine", fx: "chestCoin", v: AV(0.5, 0.25), line: (v) => `Treasure scales give ×${(1 + v).toFixed(2)} coins` },
  { id: "alchemists_flask", name: "Alchemist's Flask", tier: "fine", fx: "burn", v: AV(0.2, 0.1), line: (v) => `Burning damage ×${(1 + v).toFixed(2)}` },
  { id: "hunters_trophy", name: "Hunter's Trophy", tier: "fine", fx: "boss", v: AV(0.1, 0.05), line: (v) => `Head DMG +${Math.round(v * 1000)}` },
  { id: "dragon_compass", name: "Dragon Compass", tier: "superior", fx: "call", v: (lv) => (lv >= 10 ? 2 : lv >= 5 ? 1 : 0), line: (v) => `Hero Call shows 4 heroes${v ? `, Hero Call Refresh +${v}` : ""}` },
  { id: "royal_seal", name: "Royal Seal", tier: "superior", fx: "refresh", v: (lv) => 1 + (lv >= 5) + (lv >= 10), line: (v) => `Free Refresh +${v} a battle` },
  { id: "frostfire_ember", name: "Frostfire Ember", tier: "superior", fx: "react", v: AV(0.15, 0.07), line: (v) => `Reactions ×${(1 + v).toFixed(2)}` },
  { id: "dragon_scale", name: "Dragon Scale", tier: "rare", fx: "hp", v: AV(30, 15), line: (v) => `Wall HP +${v}` },
  { id: "phoenix_feather", name: "Phoenix Feather", tier: "rare", fx: "phoenix", v: AV(0.2, 0.03), line: (v) => `Once a battle, a broken wall stands again with ${DD.P && DD.P.wallHP ? DD.fmt(Math.round(DD.P.wallHP() * v)) : Math.round(v * 100)} Wall HP` }, // the number from the party's Wall HP now (C64.8: numbers, not percent)
  { id: "void_hourglass", name: "Void Hourglass", tier: "epic", fx: "slow", v: AV(0.05, 0.01), line: (v) => `The dragon crawls ×${(1 - v).toFixed(2)}` },
];
DD.ART_WORN = 3;
DD.ART_GIFT = 0; // 2026-11-02 (user: "artifact harusnya di dapat hanya dari beli saja. ga bisa kalaiu ga beli"): no free chests; was 2
DD.ART_CHEST_GEMS = 300; // the Shop's Artifact Chest; ×10 costs 9 (the only source of artifacts since 2026-11-02)
DD.COLLECTION.forEach((c) => (c.icon = `icons/icon_artifact_${c.id}.webp`));
DD.COLL = Object.fromEntries(DD.COLLECTION.map((c) => [c.id, c]));
DD.COLL_MAX = 10;
DD.COLL_COPIES = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]; // copies to reach Lv 1..10 (30 in all)
DD.collValue = (c, lv) => lv * DD.COLL_TIERS[c.tier].v * (c.stat === "crit" ? DD.COLL_CRIT : c.stat === "critDmg" ? 3 : 1);
DD.COLL_PATROL_H = 8; // Patrol: 1 Collection Chest every 8 hours from Stage 10

/** Runes (C18): replaced by Enchantment (C21); the values stay only to convert an old save into Enchant Stones. */
DD.RUNE_MAX = 10;
DD.RUNE_VALUE = 0.03; // per rune level, to the slot's stat
DD.RUNE_PATROL_H = 4; // Patrol: 1 rune every 4 hours from Stage 15
DD.RUNE_CHEST = 0.3; // chance of a rune with every Equipment Chest
DD.RUNE_ICON = "icons/icon_artifact_runestone_of_recall.webp";

/** Limited Recruitment: the only way to Mythic heroes. One pull = 1 Mythic Essence. */
DD.LIMITED_ODDS = [["mythic", 0.015], ["legendary", 0.125], ["epic", 0.3], ["rare", 0.56]];
DD.LIMITED_PITY = 33; // the 33rd pull without a Mythic gives one
DD.LIMITED_POOL = DD.HEROES.filter((h) => h.tier !== "commander" && !DD.ART_PENDING.has(h.id));
DD.LIMITED_MILESTONES = [[15, { gems: 100 }], [25, { essence: 2 }], [40, { gems: 200 }], [55, { essence: 3 }], [70, { gems: 300 }], [85, { essence: 5 }], [100, { gems: 500 }]];
DD.ESSENCE_GEMS = 250; // 1 Mythic Essence in gems
DD.ESSENCE_CHEST = 2; // the 100 % progress chest of Stage 15+ gives 2 Essence

/* ---------------------------------------------------------------- build stage 5: the daily loop (Ledger TD Draft 21 / C22, 2026-10-31,
   user: "masuk group task"; RANCANGAN D8 alur harian, riset Dragon Fever §8). Rewards are plain resource objects. */
/** Daily Quests: activity points; the chests at 20 / 40 / 60 / 80 / 120 points. lock = the feature a quest needs. */
DD.QUESTS = [
  { id: "login", name: "Log in", need: 1, pts: 10 },
  { id: "battle", name: "Play 3 battles", need: 3, pts: 20 },
  { id: "win", name: "Win a battle", need: 1, pts: 20 },
  { id: "recruit", name: "Recruit a hero", need: 1, pts: 20, lock: "recruit" },
  { id: "levelup", name: "Level up a hero", need: 1, pts: 10, lock: "heroes" },
  { id: "patrol", name: "Claim Patrol", need: 1, pts: 10, lock: "patrol" },
  { id: "quick", name: "Quick Patrol", need: 1, pts: 10, lock: "patrol" },
  { id: "train", name: "Train or level up a slot 3 times", need: 3, pts: 10, lock: "party" },
  { id: "chest", name: "Open an Equipment Chest", need: 1, pts: 10, lock: "shop" },
  { id: "ad", name: "Watch 2 ads", need: 2, pts: 10 },
];
DD.QUEST_CHESTS = [[20, { coins: 800, energy: 5 }], [40, { gems: 20 }], [60, { tickets: 1 }], [80, { ore: 15, keys: 1 }], [120, { gems: 50, stones: 2 }]];
/** 7-Day Sign-in: one claim a day, days in a row (a missed day starts again at Day 1), then a new round. */
DD.SIGNIN = [{ gems: 50 }, { coins: 3000 }, { tickets: 2 }, { keys: 2 }, { ore: 30 }, { gems: 100 }, { tickets: 5, gems: 100 }];
/** Online Rewards: minutes played today. */
DD.ONLINE = [[5, { coins: 500 }], [10, { energy: 5 }], [20, { gems: 10 }], [30, { ore: 10 }], [60, { gems: 30 }]];
/** 7-Day Challenge (newcomer): three tasks open each day for 7 days; points fill five chests; closed 8 days after it starts.
    m = what is counted (P.metric), need = the target. */
DD.CHALLENGE = [
  [["Clear Stage 3", "cleared", 3, 20], ["Recruit 3 times", "pulls", 3, 10], ["Win 3 battles", "wins", 3, 10]],
  [["Clear Stage 5", "cleared", 5, 20], ["Reach Party Lv 5", "pl", 5, 10], ["Wear 3 artifacts", "worn", 3, 10]],
  [["Clear Stage 8", "cleared", 8, 20], ["Own 8 heroes", "owned", 8, 10], ["Level up artifact slots 10 times", "slotLv", 10, 10]],
  [["Clear Stage 10", "cleared", 10, 20], ["Train 10 levels", "training", 10, 10], ["Gain 6 hero levels", "heroLv", 6, 10]],
  [["Clear Stage 12", "cleared", 12, 20], ["Reach Party Lv 10", "pl", 10, 10], ["Open 10 Equipment Chests", "chests", 10, 10]],
  [["Clear Stage 14", "cleared", 14, 20], ["Own 10 heroes", "owned", 10, 10], ["Win 25 battles", "wins", 25, 10]],
  [["Clear Stage 16", "cleared", 16, 20], ["Train 30 levels", "training", 30, 10], ["Gain 12 hero levels", "heroLv", 12, 10]],
];
DD.CHALLENGE_CHESTS = [[60, { gems: 50 }], [120, { tickets: 3 }], [180, { keys: 5 }], [240, { gems: 150 }], [280, { tickets: 5, essence: 5 }]];
DD.CHALLENGE_DAYS = 8; // 7 days of tasks + 1 day to claim
/** Newcomer Benefits: one gift for clearing each of these stages. */
DD.NEWCOMER = [[3, { tickets: 3 }], [5, { gems: 100 }], [8, { keys: 3 }], [10, { tickets: 5 }], [15, { stones: 10 }], [20, { gems: 300 }], [30, { essence: 5 }]];
/** Progression Pass: a tier every 2 stages up to Stage 40; the free track can be claimed, the premium track is simulated. */
DD.PASS = Array.from({ length: 20 }, (_, i) => ({ at: (i + 1) * 2,
  free: [{ coins: 1000 }, { gems: 20 }, { tickets: 1 }, { keys: 1 }, { ore: 15 }][i % 5],
  prem: [{ gems: 60 }, { tickets: 2 }, { keys: 2 }, { stones: 3 }, { essence: 1 }][i % 5] }));
DD.PASS_PRICE = "$9.99";

DD.pct = (v) => Math.round(v * 100) + "%";
/** Points on screen (C27 B, C64.10): 1 point = 0.1 % behind the screen; Projectiles stay a count. */
DD.pts = (k, v) => (k === "proj" ? Math.round(v) : Math.round(v * 1000));
