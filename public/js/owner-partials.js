// Shared nav + footer for owner pages (dashboard.html, dashboard/*, deals.html).
// Loaded in <head> so renderOwnerNav() is available synchronously at top of <body>.

(function () {
  var GEAR_ICON = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">'
    + '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>'
    + '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>'
    + '</svg>';

  var RIGHT = {
    main: '<a href="/dashboard/account-settings.html" class="text-gray-500 hover:text-gray-700 transition" title="Account Settings">' + GEAR_ICON + '</a>'
      + '<button onclick="ownerLogout()" class="text-gray-600 hover:text-gray-900 font-medium text-sm">Sign Out</button>',

    subpage: '<a href="/dashboard.html" class="text-gray-600 hover:text-teal-600 transition">← Dashboard</a>'
      + '<button onclick="ownerLogout()" class="text-red-600 hover:text-red-700 transition">Sign Out</button>',

    deals: '<button id="lang-btn" onclick="toggleLang()" class="text-xs px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium transition">EN</button>'
      + '<a href="/dashboard.html" class="text-gray-600 hover:text-teal-600 transition text-sm hidden sm:block">← <span data-i18n="nav_dashboard">Dashboard</span></a>'
      + '<button onclick="ownerLogout()" class="text-sm text-red-500 hover:text-red-700 transition" data-i18n="nav_logout">Sign Out</button>'
  };

  function buildNav(label, type) {
    var labelClasses = 'text-gray-500 text-sm font-medium nav-section-label'
      + (type === 'subpage' ? '' : ' hidden sm:inline');
    var i18nAttr = type === 'deals' ? ' data-i18n="page_title"' : '';
    var labelHtml = label
      ? '<div class="h-5 w-px bg-gray-200 hidden sm:block"></div>'
        + '<span class="' + labelClasses + '"' + i18nAttr + '>' + label + '</span>'
      : '';

    return '<nav class="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">'
      + '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">'
      + '<div class="flex justify-between items-center h-20">'
      + '<div class="flex items-center gap-3">'
      + '<a href="/dashboard.html" class="flex items-center">'
      + '<img class="h-10 hidden sm:block logo-wordmark" src="/assets/resources/logo-single-line.png" alt="AspireTowards">'
      + '<img class="h-10 sm:hidden" src="/assets/resources/icon-mark-color.png" alt="AspireTowards">'
      + '</a>'
      + labelHtml
      + '</div>'
      + '<div class="flex items-center gap-3">'
      + (RIGHT[type] || RIGHT.main)
      + '</div>'
      + '</div>'
      + '</div>'
      + '</nav>';
  }

  var FOOTER_HTML = '<footer class="bg-gray-900 text-gray-300 mt-16">'
    + '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">'
    + '<div class="grid grid-cols-1 md:grid-cols-4 gap-8">'
    + '<div class="col-span-1 md:col-span-2">'
    + '<div class="flex items-center space-x-3 mb-4"><img src="/assets/resources/logo-single-line.png" alt="AspireTowards" class="h-8 brightness-0 invert"></div>'
    + '<p class="text-gray-400 mb-4">Manage your vacation rental properties with ease. Direct booking platform with no hidden fees.</p>'
    + '</div>'
    + '<div><h4 class="text-white font-semibold mb-4">Quick Links</h4>'
    + '<ul class="space-y-2">'
    + '<li><a href="/index.html" class="hover:text-white transition">View Homepage</a></li>'
    + '<li><a href="/properties.html" class="hover:text-white transition">Browse Properties</a></li>'
    + '<li><a href="/dashboard.html" class="hover:text-white transition">Dashboard</a></li>'
    + '</ul></div>'
    + '<div><h4 class="text-white font-semibold mb-4">Account</h4>'
    + '<ul class="space-y-2">'
    + '<li><a href="/dashboard/account-settings.html" class="hover:text-white transition">Account Settings</a></li>'
    + '<li><a href="/dashboard/support.html" class="hover:text-white transition">Support</a></li>'
    + '<li><a href="#" onclick="ownerLogout(); return false;" class="hover:text-white transition">Sign Out</a></li>'
    + '</ul></div>'
    + '</div>'
    + '<div class="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">'
    + '<p class="text-sm text-gray-500">© 2026 AspireTowards. All rights reserved.</p>'
    + '<div class="flex space-x-6 mt-4 md:mt-0">'
    + '<a href="#" class="text-sm hover:text-white transition">Privacy Policy</a>'
    + '<a href="#" class="text-sm hover:text-white transition">Terms of Service</a>'
    + '<a href="/dashboard/support.html" class="text-sm hover:text-white transition">Contact</a>'
    + '</div></div>'
    + '</div>'
    + '</footer>';

  window.ownerLogout = function () {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/auth/login.html';
  };

  window.renderOwnerNav = function (label, type) {
    var el = document.getElementById('owner-nav');
    if (!el) return;
    el.outerHTML = buildNav(label || '', type || 'main');
  };

  window.renderOwnerFooter = function () {
    var el = document.getElementById('owner-footer');
    if (!el) return;
    el.outerHTML = FOOTER_HTML;
  };
})();
