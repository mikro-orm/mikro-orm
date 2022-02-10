function load() {
  const versions = document.querySelectorAll('.navbar .dropdown ul a');
  const types = ['/docs/next', '/docs'];
  let i = 0;

  for (const el of versions) {
    const match = el.href.match(/\/docs\/(\d+\.\d+(\.\d+)?)$/) || el.href.match(/\/docs\/(\d+\.\d+(\.\d+)?)/);
    const version = (types[i++] || match[0]).replace('/docs', '/api');

    el.addEventListener('click', (e) => {
      if (location.pathname.startsWith('/api')) {
        location.href = version;
        e.preventDefault();
      }
    });
  }
}

const versions = document.querySelectorAll('.navbar .dropdown ul a');

if (versions.length > 0) {
  load();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(load, 500);
  });
}

