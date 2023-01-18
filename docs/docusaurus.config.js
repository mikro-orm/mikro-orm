/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
    prism: {
      theme: require('prism-react-renderer/themes/github'),
      darkTheme: require('prism-react-renderer/themes/dracula'),
    },
    navbar: {
      hideOnScroll: true,
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
        { to: 'docs/installation', label: 'Docs', position: 'left' },
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
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Installation & Usage', to: 'docs/installation' },
            { label: 'Quick Start', href: 'https://github.com/mikro-orm/mikro-orm#-quick-start' },
            { label: 'Migration from v4 to v5', to: 'docs/upgrading-v4-to-v5' },
            { label: 'Version 4.5 docs', to: 'docs/4.5/installation' },
          ],
        },
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
            { label: 'Twitter', to: 'https://twitter.com/MikroOrm' },
            { label: 'GitHub Stars', to: 'https://github.com/mikro-orm/mikro-orm' },
            { label: 'GitHub Sponsors', to: 'https://github.com/sponsors/B4nan' },
          ],
        },
      ],
      logo: {
        alt: 'MikroORM',
        src: 'img/logo-header.svg',
      },
      copyright: `Copyright © 2018-${new Date().getFullYear()} Martin Adámek. Built with Docusaurus. `,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/mikro-orm/mikro-orm/edit/master/docs/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },
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
      {
        projectRoot: `${__dirname}/..`,
        changelogs: true,
        packages,
        typedocOptions: {
          readme: 'none',
          tsconfig: '../tsconfig.json',
          excludeExternals: true,
          excludePrivate: true,
          excludeProtected: true,
          excludeInternal: true,
          externalPattern: '**/node_modules/*',
          cleanOutputDir: true,
        },
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            from: '/docs',
            to: '/docs/installation',
          },
          {
            from: '/docs/next',
            to: '/docs/next/installation',
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
