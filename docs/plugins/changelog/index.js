'use strict';

const path = require('node:path');
const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');
const { fetchReleases } = require('./fetch-releases');

marked.setOptions({ gfm: true, breaks: true });

const sanitizeOptions = {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'del', 'input'],
  allowedAttributes: {
    a: ['href', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    code: ['class'],
    th: ['align'],
    td: ['align'],
    input: ['type', 'checked', 'disabled'],
  },
  allowedClasses: { code: ['language-*'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  exclusiveFilter: frame => frame.tag === 'input' && frame.attribs.type !== 'checkbox',
};

function renderBody(markdown) {
  return externalizeLinks(sanitizeHtml(marked.parse(markdown), sanitizeOptions));
}

function externalizeLinks(html) {
  return html.replace(/<a (?![^>]*\btarget=)/g, '<a target="_blank" rel="noopener noreferrer" ');
}

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
          bodyHtml: renderBody(r.body || ''),
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
