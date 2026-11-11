/* App shell for the APK (2026-11-07, user no. 105: "apa lagi yang kurang untuk masuk apk?"). Loaded last.
   Android back: the app wrapper calls window.gameBack() and closes the app (after asking) only when it returns false.
   Order: 1) the top box or sheet: Resume in the pause box, else its X (a box without X = a choice the player must make:
   back does nothing); 2) in a battle: the pause box; 3) a hero's page: back to Heroes; 4) another page: Home; 5) Home: false.
   Escape on a PC does the same. */
(function () {
  window.gameBack = () => {
    const app = document.getElementById("app");
    if (!app || document.querySelector(".splash")) return true;
    const layers = [...app.querySelectorAll(".gk-sheet, .gk-scrim")];
    const top = layers[layers.length - 1];
    if (top) {
      const b = top.querySelector("#resume") || top.querySelector(".x");
      if (b) b.click();
      return true;
    }
    const pause = document.querySelector("#menu");
    if (DD.battle && DD.battle.state === "fight" && pause && pause.offsetParent) { pause.click(); return true; }
    const back = document.querySelector("#back");
    if (back && back.offsetParent) { back.click(); return true; }
    const home = document.querySelector('nav [data-tab="home"]');
    if (home && !home.classList.contains("is-active")) { home.click(); return true; }
    return false;
  };
  addEventListener("keydown", (e) => { if (e.key === "Escape" && window.gameBack()) e.preventDefault(); });
  // the app goes to the background (DRAGON DEFENCE FLUTTER lib/main.dart): a running battle opens its pause box, and stays
  // paused until the player taps Resume
  window.ddApp = {
    pause() {
      const m = document.querySelector("#menu");
      if (DD.battle && DD.battle.state === "fight" && !DD.battle.paused && m && m.offsetParent) m.click();
    },
    resume() {},
  };
})();
