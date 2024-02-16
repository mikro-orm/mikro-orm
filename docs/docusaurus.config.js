/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('node:path');
/** @type string[] */
const versions = require('./versions.json');
const pkg = require('../packages/core/package.json');

const packages = [
  'core',
  'knex',
  'cli',
  'migrations',
  'entity-generator',
  'reflection',
  'sqlite',
  'better-sqlite',
  'mariadb',
  'mongodb',
  'mysql',
  'postgresql',
  'seeder',
].map(d => ({ path: `packages/${d}` }));

const docsFooterLinks = {
  title: 'Docs',
  items: [
    { label: 'Quick Start', to: 'docs/quick-start' },
    { label: 'Quick Start', to: 'docs/guide/type-safety' },
    { label: 'Getting Started', to: 'docs/guide' },
    { label: 'Migration from v5 to v6', to: 'docs/upgrading-v5-to-v6' },
    { label: 'Version 5.9 docs', to: 'docs/5.9/installation' },
  ],
};

/** @type {import('@docusaurus/plugin-content-docs').PluginOptions} */
const docsPluginOptions = {
  sidebarPath: require.resolve('./sidebars.js'),
  editUrl: 'https://github.com/mikro-orm/mikro-orm/edit/master/docs/',
  showLastUpdateAuthor: true,
  showLastUpdateTime: true,
  remarkPlugins: [
    [require('@docusaurus/remark-plugin-npm2yarn'), { sync: true }],
  ],
};

/** @type {import('docusaurus-plugin-typedoc-api/lib/types').DocusaurusPluginTypeDocApiOptions} */
const docusaurusPluginTypedocApiOptions = {
  projectRoot: `${__dirname}/..`,
  changelogs: true,
  packages,
  exclude: ['**/node_modules/*'],
  readmes: false,
  typedocOptions: {
    readme: 'none',
    tsconfig: '../tsconfig.json',
    excludeExternals: true,
    excludePrivate: true,
    excludeProtected: true,
    excludeInternal: true,
    skipErrorChecking: true,
    externalPattern: '**/node_modules/*',
    cleanOutputDir: true,
  },
};

if (!!process.env.MIKRO_ORM_DOCS_TESTING) {
  // Always include the latest version, and the earliest version.
  const includedVersions = new Set([
    versions[0],
    versions.at(-1),
  ]);
  // Include whatever other versions are featured in the footer.
  docsFooterLinks.items.forEach(({to}) => {
    const versionPath = path.dirname(path.relative('docs', to));
    if (!versions.includes(versionPath)) {
      return;
    }
    includedVersions.add(versionPath);
  });
  includedVersions.add('current');

  docusaurusPluginTypedocApiOptions.onlyIncludeVersions = docsPluginOptions.onlyIncludeVersions = Array.from(includedVersions);
}

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'MikroORM',
  tagline: 'TypeScript ORM for Node.js based on Data Mapper, Unit of Work and Identity Map patterns.',
  url: 'https://mikro-orm.io',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'mikro-orm',
  projectName: 'mikro-orm',
  scripts: ['/js/custom.js'],
  trailingSlash: false,
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  onBrokenMarkdownLinks: 'throw',
  onDuplicateRoutes: 'throw',
  themeConfig: {
    algolia: {
      apiKey: '83015544b5b03ca27af77c74a25d4868',
      appId: 'V3HQ8I5PUQ',
      indexName: 'mikro-orm',
      contextualSearch: true,
    },
    announcementBar: {
      id: 'supportus',
      content: '⭐️ If you like MikroORM, give it a star on ' +
        '<a target="_blank" rel="noopener noreferrer" href="https://github.com/mikro-orm/mikro-orm">GitHub</a> ' +
        'and consider <a target="_blank" rel="noopener noreferrer" href="https://github.com/sponsors/B4nan">sponsoring</a> its development! ⭐️',
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    prism: {
      defaultLanguage: 'typescript',
      theme: require('prism-react-renderer').themes.github,
      darkTheme: require('prism-react-renderer').themes.dracula,
      additionalLanguages: ['docker', 'log', 'bash', 'diff', 'json'],
    },
    navbar: {
      title: '',
      logo: {
        alt: 'MikroORM',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docsVersionDropdown',
          position: 'left',
        },
        { to: 'docs/quick-start', label: 'Docs', position: 'left' },
        { to: 'api', label: 'API', position: 'left', activeBaseRegex: 'api/(?!core/changelog)', },
        { to: 'docs/faq', label: 'FAQ', position: 'left' },
        { to: 'blog', label: 'Blog', position: 'left' },
        { to: 'api/core/changelog', label: 'Changelog', position: 'left', className: 'changelog' },
        {
          to: '/versions',
          label: `latest: v${pkg.version}`,
          position: 'right',
          'data-type': 'versions',
        },
        {
          href: 'https://join.slack.com/t/mikroorm/shared_invite/enQtNTM1ODYzMzM4MDk3LWM4ZDExMjU5ZDhmNjA2MmM3MWMwZmExNjhhNDdiYTMwNWM0MGY5ZTE3ZjkyZTMzOWExNDgyYmMzNDE1NDI5NjA',
          label: 'Slack',
          position: 'right',
          title: 'Chat on Slack',
          className: 'icon',
        },
        {
          href: 'https://github.com/mikro-orm/mikro-orm',
          label: 'GitHub',
          position: 'right',
          title: 'View on GitHub',
          className: 'icon',
        },
        {
          href: 'https://twitter.com/MikroORM',
          label: 'Twitter',
          position: 'right',
          title: 'Twitter',
          className: 'icon',
        },
      ],
    },
    image: 'https://opengraph.githubassets.com/8b51ab16e00d8f8480da64948bd38ff0c5e57b3aa55ef8702d49e0ab4ad02f1f/mikro-orm/mikro-orm',
    footer: {
      style: 'dark',
      links: [
        docsFooterLinks,
        {
          title: 'Community',
          items: [
            {
              label: 'Slack',
              href: 'https://join.slack.com/t/mikroorm/shared_invite/enQtNTM1ODYzMzM4MDk3LWM4ZDExMjU5ZDhmNjA2MmM3MWMwZmExNjhhNDdiYTMwNWM0MGY5ZTE3ZjkyZTMzOWExNDgyYmMzNDE1NDI5NjA',
            },
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/ask?tags=mikro-orm',
            },
          ],
        },
        {
          title: 'Social',
          items: [
            { label: 'Blog', to: 'blog' },
            { label: 'Twitter', to: 'https://twitter.com/MikroORM' },
            { label: 'GitHub', to: 'https://github.com/mikro-orm/mikro-orm' },
            { label: 'GitHub Sponsors', to: 'https://github.com/sponsors/B4nan' },
          ],
        },
      ],
      logo: {
        alt: 'MikroORM',
        src: 'img/logo-header.svg',
      },
      copyright: `Copyright © 2018-${new Date().getFullYear()} Martin Adámek. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: docsPluginOptions,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        gtag: { trackingID: 'UA-135618258-1' },
      },
    ],
  ],
  plugins: [
    [
      'docusaurus-plugin-typedoc-api',
      docusaurusPluginTypedocApiOptions,
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            from: '/docs',
            to: '/docs/quick-start',
          },
          {
            from: '/docs/next',
            to: '/docs/quick-start',
          },
          {
            from: '/docs/installation',
            to: '/docs/quick-start',
          },
          {
            from: '/docs/next/installation',
            to: '/docs/next/quick-start',
          },
          {
            from: '/docs/lifecycle-hooks',
            to: '/docs/events',
          },
          {
            from: '/docs/debugging',
            to: '/docs/logging',
          },
          {
            from: '/docs/entity-references',
            to: '/docs/type-safe-relations',
          },
        ],
      },
    ],
  ],
};
