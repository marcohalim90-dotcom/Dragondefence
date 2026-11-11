/* C46 (user no. 95, 2026-11-05: "stars di hapuskan permanent, yang ada hanyalah tier. dengan max level 20, setelah 20 baru boleh elegible
   untuk fuse. setelah fuse balik ke tier 1 lagi. untuk mythic tier tanpa batas."). Equipment has tiers only:
   - Tier 1 → 20 for each rarity (Tier Up: coins + Enchant Stones); every tier adds 1/19 of the Tier 1 number, so Tier 20 = ×2;
   - two pieces with the same name at Tier 20 fuse into ONE piece of the next rarity at Tier 1, which is worth what Tier 20 was (each
     rarity ×2), so a fuse never loses power;
   - Mythic (new, only from a fuse of two Legendary pieces): no top tier.
   Loaded after js/items-c44.js, before js/state.js. A save's stars become Enchant Stones again (js/state.js convertStars). */
(function () {
  DD.GEAR_RARITY = ["normal", "superior", "rare", "epic", "legendary", "mythic"];
  DD.GEAR_RARITY_NAME.mythic = "Mythic";
  DD.MYTHIC = 5;
  DD.GEAR_MULT = [1, 2, 4, 8, 16, 32];
  DD.TIER_TOP = 20;
  DD.TIER_STEP = 1 / 19;
  DD.TIER_MULT = (t) => 1 + DD.TIER_STEP * (Math.max(1, t) - 1);
  /** The top tier of a piece: 20, none for Mythic. */
  DD.tierTop = (g) => (g.r >= DD.MYTHIC ? Infinity : DD.TIER_TOP);
  DD.gearValue = (g) => DD.SLOT[g.slot].base * DD.GEAR_MULT[g.r] * DD.TIER_MULT(g.tier);
  /** An effect grows like the piece: ×2 a rarity from Epic (its Tier 1 value) and the same tier step. */
  DD.fxValue = (k, g) => {
    const r = typeof g === "object" ? g.r : 3, t = typeof g === "object" ? g.tier : g;
    return DD.EQ_FX[k].v * (DD.GEAR_MULT[r] / DD.GEAR_MULT[3]) * DD.TIER_MULT(t);
  };
  DD.fxCount = (r) => (r >= DD.MYTHIC ? 3 : r === 4 ? 2 : r === 3 ? 1 : 0); // effects come with the rarity only now
  /** Tier t → t + 1. */
  // no. 103–104 (Draft 20.11): about one Normal win at Stage 2 × Tier for a Common piece, never below the old price
  DD.tierUpCost = (g) => ({ coins: Math.round(Math.max(500 * Math.pow(1.12, g.tier - 1), 100 * Math.pow(1.15, g.tier - 1)) * Math.pow(1.6, g.r)), stones: 1 + Math.floor((g.tier - 1) / 5) + g.r });
  DD.DISASSEMBLE_ORE = [1, 2, 4, 8, 16, 32];
  // names and the fuse key: a Mythic keeps its Legendary name (its colour and the word Mythic tell them apart)
  const name0 = DD.artName;
  DD.artName = (g) => name0(g.r >= DD.MYTHIC ? Object.assign({}, g, { r: 4 }) : g);
  DD.eqKey = (g) => `${g.slot}:${g.type || ""}:${g.r}` + (g.r >= 4 && g.lv3 ? ":" + g.lv3 : "");
  DD.STAR_MAX = 0; // no stars any more (DD.starCost and DD.starStones stay only to give an old save its stones back)
})();
