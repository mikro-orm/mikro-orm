'use strict';

const path = require('node:path');
const { marked } = require('marked');
const { fetchReleases } = require('./fetch-releases');

marked.setOptions({ gfm: true, breaks: false });

module.exports = function changelogPlugin(context, options = {}) {
  const cachePath = path.resolve(__dirname, 'releases.json');
  const offline = process.env.MIKRO_ORM_DOCS_CHANGELOG_OFFLINE === '1';
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const routePath = options.routePath || '/changelog';

  return {
    name: 'mikro-orm-changelog',

    async loadContent() {
      const releases = await fetchReleases({ cachePath, token, offline });
      return releases
        .filter(r => !r.draft)
        .map(r => ({
          name: r.name || r.tagName,
          tagName: r.tagName,
          publishedAt: r.publishedAt,
          htmlUrl: r.htmlUrl,
          prerelease: !!r.prerelease,
          bodyHtml: marked.parse(r.body || ''),
        }));
    },

    async contentLoaded({ content, actions }) {
      const { createData, addRoute } = actions;
      const dataPath = await createData('releases.json', JSON.stringify(content));
      addRoute({
        path: routePath,
        component: path.resolve(__dirname, 'Changelog.jsx'),
        modules: { releases: dataPath },
        exact: true,
      });
    },
  };
};
