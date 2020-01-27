setInterval(() => {
  const version = location.pathname.match(/\/docs\/(\d+\.\d+|next)\//);
  const el = document.querySelector('a.navbar__link[href="/versions"]');

  if (el && version) {
    el.innerText = version[1];
  }
}, 500);
