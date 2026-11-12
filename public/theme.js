// Mavzuni sahifa chizilishidan oldin o'rnatamiz — oq/qora "chaqnash" bo'lmasligi uchun.
// Alohida faylda: Content-Security-Policy ichki (inline) skriptlarni taqiqlaydi.
(function () {
  try {
    var saved = JSON.parse(localStorage.getItem('tomosha.theme'));
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = saved === 'light' || saved === 'dark' ? saved : dark ? 'dark' : 'light';
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
