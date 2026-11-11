/* C46 (user no. 95: "sekarang lanjut juga gambar2 baru menggunakan gpt"): the pictures of the 45 Evo Cards that had none (TEMA_2A A43,
   ChatGPT in the style of docs/art-2a/skills_1.png). Each painted card gets card.icon = 2a/skills/evo_<hero>_<card>.webp; a card whose
   picture is not painted yet keeps the hero's Evo picture. Loaded after js/heroes-c43.js. */
(function () {
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  DD.evoIconOf = (hero, name) => `2a/skills/evo_${slug(hero)}_${slug(name)}.webp`;
  /** hero|card, in the order of the two ChatGPT sheets (docs/art-2a/evo/evo_sheet_1.png, evo_sheet_2.png) */
  DD.EVO_ICON_ORDER = [
    "ebenezer|Penny Storm", "ebenezer|Taxman", "half-goblin|Boomerang Blades", "enchantress|Twin Hearts", "mercenary|Double Tap", "tracker|Spirit Howl",
    "dwarf|Avalanche", "occultist|Grave Call", "leprechaun|Rainbow Road", "knight|Sunrise", "jack-frost|Snowman", "jack-frost|Avalanche",
    "cassandra|Thorn Snare", "sorceress|Phoenix Wings", "sorceress|Meteor", "crusader|Crusade", "crusader|Divine Judgement", "tou-lak|Stampede",
    "tou-lak|War Drums", "alchemist|Grand Experiment", "alchemist|Philosopher's Stone", "alexandra|Storm Tome", "alexandra|Chain Reaction", "marpesia|Spear Rain",
    "marpesia|Valkyrie's Verdict", "loeg-yllavyre|Elder Call", "loeg-yllavyre|Hatchery", "amar-suen|King's Ransom", "amar-suen|Gilded Death", "minstrel|Crescendo",
    "scout|Hawk", "klaus|Surprise Box", "archaeologist|Petrify", "sugarplum-faerie|Jawbreaker", "tristan|Flame Tornado", "guild-leader|Murder of Crows",
    "szopin|Bloodlust", "time-traveler|Rewind", "time-traveler|Time Stop", "viking|Frost Giant", "viking|Ragnarok", "dreamwalker|Deep Sleep",
    "dreamwalker|Waking World", "dreamwalker|Lucid", "kael-dragon|Dragon Form",
  ];
  DD.EVO_ICON_READY = DD.EVO_ICON_READY || DD.EVO_ICON_ORDER.slice(); // all 45 painted (sheets 1 and 2, 2026-11-05)
  for (const key of DD.EVO_ICON_READY) {
    const [hero, name] = key.split("|");
    const c = (DD.CARDS[hero] || []).find((x) => x.type === "evo" && x.name === name);
    if (c) c.icon = DD.evoIconOf(hero, name);
  }
})();
