// Shared nav + footer for all public-facing pages.
// Load in <head> so renderPublicNav() is available synchronously at top of <body>.
// Usage: <div id="public-nav"></div> then <script>renderPublicNav('home')</script>
//        <div id="public-footer"></div> then <script>renderPublicFooter()</script>
// active values: 'home' | 'properties' | '' (none)

(function () {
  var LINKS = [
    { key: 'home',       label: 'Home',            href: '/index.html' },
    { key: 'properties', label: 'Properties',      href: '/properties.html' },
    { key: '',           label: 'Why Book Direct',  href: '/index.html#why-direct' },
    { key: '',           label: 'Contact',          href: '/index.html#contact' },
  ];

  var HAMBURGER = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">'
    + '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>'
    + '</svg>';

  var CLOSE_ICON = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">'
    + '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>'
    + '</svg>';

  function linkClass(key, active, base) {
    var isActive = key && key === active;
    return base + (isActive ? ' text-teal-600 font-medium' : ' text-gray-600 hover:text-teal-600 font-medium transition');
  }

  function buildNav(active) {
    var desktop = LINKS.map(function (l) {
      return '<a href="' + l.href + '" class="' + linkClass(l.key, active, '') + '">' + l.label + '</a>';
    }).join('');

    var mobile = LINKS.map(function (l) {
      var cls = l.key && l.key === active
        ? 'block py-3 px-4 text-teal-600 bg-teal-50 rounded-lg font-medium mobile-menu-link'
        : 'block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium mobile-menu-link';
      return '<a href="' + l.href + '" class="' + cls + '">' + l.label + '</a>';
    }).join('');

    return '<nav class="bg-white shadow-sm sticky top-0 z-50">'
      + '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">'
      + '<div class="flex justify-between items-center h-20">'
      + '<a href="/index.html" class="flex items-center">'
      + '<img src="/assets/resources/logo-single-line.png" alt="AspireTowards" class="h-10 hidden sm:block">'
      + '<img src="/assets/resources/icon-mark-color.png" alt="AspireTowards" class="h-9 sm:hidden">'
      + '</a>'
      + '<div class="hidden md:flex items-center space-x-8">' + desktop + '</div>'
      + '<div class="hidden md:block">'
      + '<a href="/auth/login.html" class="text-gray-600 hover:text-teal-600 font-medium transition">Host Login</a>'
      + '</div>'
      + '<button id="mobile-menu-button" class="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500">' + HAMBURGER + '</button>'
      + '</div></div></nav>'
      // Mobile slide-out panel
      + '<div id="mobile-menu" class="public-mobile-menu fixed inset-y-0 right-0 w-64 bg-white shadow-2xl z-50 md:hidden">'
      + '<div class="flex flex-col h-full">'
      + '<div class="flex justify-between items-center p-4 border-b">'
      + '<h2 class="text-lg font-bold text-gray-900">Menu</h2>'
      + '<button id="mobile-menu-close" class="p-2 rounded-lg text-gray-600 hover:bg-gray-100">' + CLOSE_ICON + '</button>'
      + '</div>'
      + '<nav class="flex-1 overflow-y-auto p-4">'
      + mobile
      + '<a href="/auth/login.html" class="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium mobile-menu-link">Host Login</a>'
      + '</nav>'
      + '</div></div>'
      + '<div id="mobile-menu-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"></div>';
  }

  var FOOTER_HTML = '<footer class="bg-gray-900 text-gray-300 py-12 mt-16">'
    + '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">'
    + '<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">'
    + '<div>'
    + '<div class="mb-4"><img src="/assets/resources/logo-single-line.png" alt="AspireTowards" class="h-8 brightness-0 invert opacity-80 hidden sm:block">'
    + '<span class="text-white font-bold text-xl sm:hidden">AspireTowards</span></div>'
    + '<p class="text-gray-400">Mountain escapes and family-friendly vacation rentals. Book direct and save.</p>'
    + '</div>'
    + '<div><h4 class="text-white font-semibold mb-4">Quick Links</h4>'
    + '<ul class="space-y-2">'
    + '<li><a href="/properties.html" class="hover:text-white transition">Properties</a></li>'
    + '<li><a href="/index.html#why-direct" class="hover:text-white transition">Why Book Direct</a></li>'
    + '<li><a href="/privacy.html" class="hover:text-white transition">Privacy Policy</a></li>'
    + '<li><a href="/terms.html" class="hover:text-white transition">Terms of Service</a></li>'
    + '</ul></div>'
    + '<div><h4 class="text-white font-semibold mb-4">Contact Us</h4>'
    + '<ul class="space-y-2">'
    + '<li><a href="mailto:info@aspiretowards.com" class="hover:text-white transition">info@aspiretowards.com</a></li>'
    + '<li><a href="tel:+15182178257" class="hover:text-white transition">+1 (518) 217-8257</a></li>'
    + '<li class="text-gray-400">Available 24/7</li>'
    + '</ul></div>'
    + '</div>'
    + '<div class="border-t border-gray-800 pt-8 text-center text-gray-400">'
    + '<p>&copy; 2026 AspireTowards. All rights reserved.</p>'
    + '</div>'
    + '</div></footer>';

  function injectMobileMenuCss() {
    if (document.getElementById('public-partials-css')) return;
    var s = document.createElement('style');
    s.id = 'public-partials-css';
    s.textContent = '.public-mobile-menu{transform:translateX(100%);transition:transform 0.3s ease-in-out}.public-mobile-menu.active{transform:translateX(0)}';
    document.head.appendChild(s);
  }

  function initMobileMenu() {
    var btn = document.getElementById('mobile-menu-button');
    var menu = document.getElementById('mobile-menu');
    var closeBtn = document.getElementById('mobile-menu-close');
    var overlay = document.getElementById('mobile-menu-overlay');
    if (!btn || !menu) return;

    function open() { menu.classList.add('active'); overlay.classList.remove('hidden'); }
    function close() { menu.classList.remove('active'); overlay.classList.add('hidden'); }

    btn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.querySelectorAll('.mobile-menu-link').forEach(function (a) {
      a.addEventListener('click', close);
    });
  }

  window.renderPublicNav = function (active) {
    var el = document.getElementById('public-nav');
    if (!el) return;
    injectMobileMenuCss();
    el.outerHTML = buildNav(active || '');
    // Wire up after elements are in DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
      initMobileMenu();
    }
  };

  window.renderPublicFooter = function () {
    var el = document.getElementById('public-footer');
    if (!el) return;
    el.outerHTML = FOOTER_HTML;
  };
})();
