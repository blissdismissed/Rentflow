// Runs synchronously in <head> — sets dark class before any content paints (no FOUC).
(function () {
  var STORAGE_KEY = 'rentflow-theme';
  var root = document.documentElement;

  function getPreferred() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';
  }

  function apply(theme) {
    root.classList.toggle('dark', theme === 'dark');
  }

  function syncIcons() {
    var dark = root.classList.contains('dark');
    var moon = document.getElementById('theme-icon-moon');
    var sun  = document.getElementById('theme-icon-sun');
    if (moon) moon.style.display = dark ? 'none'  : '';
    if (sun)  sun.style.display  = dark ? ''      : 'none';
  }

  // Apply immediately — synchronous, before body renders
  apply(getPreferred());

  window.toggleTheme = function () {
    var next = root.classList.contains('dark') ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    apply(next);
    syncIcons();
  };

  document.addEventListener('DOMContentLoaded', syncIcons);

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (!localStorage.getItem(STORAGE_KEY)) {
        apply(e.matches ? 'dark' : 'light');
        syncIcons();
      }
    });
  }
})();
