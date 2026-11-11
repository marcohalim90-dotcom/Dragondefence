/* C54 (user no. 116: "buat tutorial yang memiliki story, alur cerita. dan cara bermain"; Ledger Draft 44): the story and the
   how-to-play lines, and the player that shows them. Game text is English. (The file once held an old, unused draft of lines.)
   - DD.Story.play(steps, o): a story box over the screen; steps = [{ who, line, bg }] (who = a hero id or a role, or nothing for the
     narrator; bg = a dungeon hall painting for a full-screen scene). Tap anywhere for the next line; Skip ends it. Returns a Promise.
   - DD.Story.spot(el, step): darkens the screen except one control and says one line next to it. Returns a Promise.
   Roles a / b / c = the player's first three heroes (the 3 starting cards are random Commons, so the lines are not tied to a name). */
window.DD = window.DD || {};
(function () {
  const A = (p) => "assets/" + (DD.skin ? DD.skin(p) : p);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const hall = (k) => `assets/2a/dungeon/${k}.webp`;

  const Story = (DD.Story = {});
  Story.PROLOGUE = [
    { bg: hall("dark"), line: "Under Dreamdysis the old dragons sleep, deep in the dungeons." },
    { bg: hall("fire"), line: "Now the dungeons are breaking open. Out of every portal, a dragon crawls toward the last wall." },
    { bg: hall("holy"), line: "You are the new Warden of the wall. You fight with no sword: you call heroes." },
    { bg: hall("holy"), line: "The old Warden left you three hero cards. Open them." },
  ];
  /** each starting Common says who it is */
  Story.HELLO = {
    ebenezer: "Ebenezer. My coin fountain sweeps the scales clean.",
    "half-goblin": "Nim, at your service. My daggers fly where you point them.",
    enchantress: "Velis. My hearts hop from scale to scale.",
    mercenary: "Garran. I always shoot the toughest scale first.",
    tracker: "Fen. My wolves run down anything that crawls.",
    klaus: "Klaus. My gifts burst wherever they land.",
  };
  Story.GO = { who: "c", line: "Listen… a portal is opening. To the wall, Warden!" };
  /** how to play: shown once, the first time each thing happens (the battle stops until the player taps) */
  Story.TUT = {
    start: [{ who: "a", line: "Here it comes! Each scale has its own life: the number on it." },
      { who: "a", line: "Drag left and right to move along the wall. Stay under the dragon." }],
    pearl: [{ who: "b", line: "That glowing pearl scale! Break it to pick a Skill Card." }],
    skill: [{ who: "b", line: "Pick one card. It makes that hero stronger for this battle." }],
    shard: [{ who: "c", line: "A shard scale! Break it to call another hero to the wall." }],
    call: [{ who: "c", line: "Pick who joins the wall." }],
    chest: [{ who: "a", line: "A chest scale! Break it for loot." }],
    wall: [{ who: "b", line: "Don't let its head reach the wall! If the wall falls, we lose." }],
    win: [{ who: "c", line: "It's down! The wall holds, for now." }],
    heroes: { who: "a", line: "Every win brings coins. Level us up in Heroes." },
    play: { who: "b", line: "Ready? Press Play for the next dungeon." },
    element: [{ who: "c", line: "Every dragon has an element. Heroes of the element it is weak to hit it twice as hard." }],
  };
  Story.KAEL_HI = [
    { bg: hall("fire"), line: "Smoke rolls over the wall. Someone walks out of it." },
    { who: "spellsword", line: "Kael Arden. I hunt dragons, and your wall seems to draw them in." },
    { who: "spellsword", line: "I'll stand with you for three days. Then the road calls me." },
    { who: "a", line: "Three days of free bolts? We'll take them!" },
  ];
  Story.KAEL_BATTLE = [{ who: "spellsword", line: "My bolts fly where you aim. Drag well." }];
  Story.KAEL_BYE = [
    { who: "spellsword", line: "Three days are up. The road calls." },
    { who: "spellsword", line: "If you need me again, find my card." },
  ];

  /** a / b / c → the player's first three heroes (Kael on loan is never a / b / c) */
  Story.roles = () => {
    const P = DD.P;
    const f = (P ? P.formation() : []).filter((id) => !(P && P.isTrial(id)));
    const a = f[0] || null, b = f[1] || a, c = f[2] || b;
    return { a, b, c };
  };
  const who = (w, roles) => (w && roles[w] !== undefined ? roles[w] : w);

  function box(step, roles) {
    const id = who(step.who, roles), h = id && DD.HERO[id];
    const pic = h ? `<span class="story__pic gfc gfc--${h.tier}"><span class="gfc__win"><img src="${A(`heroes/${id}/bust.webp`)}" alt=""></span></span>` : "";
    return `<div class="story__box gfp ${h ? "" : "story__box--narr"}"><span class="gfp__crest"></span>${pic}` +
      `<div class="story__txt">${h ? `<span class="gk-text gk-text--label story__name">${esc(h.short)}</span>` : ""}` +
      `<span class="gk-cream story__line">${esc(step.line)}</span></div>` +
      `<span class="gk-text gk-text--tag story__tap">Tap to continue</span></div>`;
  }

  /** steps one by one; o.battle = above the hero tray; o.noSkip = no Skip button */
  Story.play = function (steps, o) {
    o = o || {};
    const roles = o.roles || Story.roles();
    const app = document.getElementById("app");
    return new Promise((done) => {
      const el = document.createElement("div");
      el.className = "story" + (o.battle ? " story--battle" : "");
      app.appendChild(el);
      let i = 0, shownAt = 0, over = false;
      const end = () => { if (over) return; over = true; el.classList.add("is-out"); setTimeout(() => el.remove(), 220); done(); };
      const show = () => {
        const s = steps[i];
        el.classList.toggle("story--scene", !!s.bg);
        el.innerHTML = (s.bg ? `<div class="story__bg" style="background-image:url('${s.bg}')"></div>` : "") + `<div class="story__dim"></div>` +
          (o.noSkip ? "" : `<button class="story__skip" aria-label="Skip"><span class="gk-text gk-text--tag">Skip</span></button>`) + box(s, roles);
        shownAt = performance.now();
        const sk = el.querySelector(".story__skip");
        if (sk) sk.onclick = (e) => { e.stopPropagation(); end(); };
      };
      // a tap within 0.3 s of a new line was meant for the line before (input guard)
      el.onclick = () => { if (over || performance.now() - shownAt < 300) return; if (++i >= steps.length) end(); else show(); };
      show();
    });
  };

  /** one line next to a control, the rest of the screen dark; a tap anywhere goes on */
  Story.spot = function (target, step, o) {
    o = o || {};
    const app = document.getElementById("app");
    if (!target) return Promise.resolve();
    return new Promise((done) => {
      const r = target.getBoundingClientRect(), ar = app.getBoundingClientRect();
      const z = app.clientWidth ? ar.width / app.clientWidth : 1; // the page may be zoomed under 375 px
      const x = (r.left - ar.left) / z, y = (r.top - ar.top) / z, w = r.width / z, h = r.height / z;
      const el = document.createElement("div");
      el.className = "story story--spot";
      const below = y + h / 2 < app.clientHeight / 2;
      el.innerHTML = `<div class="story__hole" style="left:${x - 6}px;top:${y - 6}px;width:${w + 12}px;height:${h + 12}px"></div>` + box(step, o.roles || Story.roles());
      const b = el.querySelector(".story__box");
      b.style[below ? "top" : "bottom"] = (below ? y + h + 22 : app.clientHeight - y + 22) + "px";
      app.appendChild(el);
      const shownAt = performance.now();
      el.onclick = () => { if (performance.now() - shownAt < 300) return; el.classList.add("is-out"); setTimeout(() => el.remove(), 220); done(); };
    });
  };
})();
