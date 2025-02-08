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
  'seeder',
  'reflection',
  'postgresql',
  'mysql',
  'mariadb',
  'sqlite',
  'libsql',
  'mssql',
  'mongodb',
].map(d => ({ path: `packages/${d}` }));

const docsFooterLinks = {
  title: 'Docs',
  items: [
    { label: 'Quick Start', to: 'docs/quick-start' },
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
  versions: {
    current: { noIndex: true },
    ...versions.slice(1).reduce((o, v) => {
      o[v] = { noIndex: true };
      return o;
    }, {}),
  },
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

const renames = {
  'usage-with-transpilers': ['usage-with-babel'],
  'type-safe-relations': ['entity-references'],
  'logging': ['debugging'],
  'lifecycle-hooks': ['events'],
  'quick-start': [{min: '6.0', from: 'installation'}, ''],
};

const docsRouteRegex = /^\/docs\/([^\/]+\/|)([^\/]*)$/;

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
  future: {
    experimental_faster: true,
  },
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
          href: 'https://discord.gg/w8bjxFHS7X',
          label: 'Discord',
          position: 'right',
          title: 'Chat on Discord',
          className: 'icon',
        },
        // {
        //   href: 'https://join.slack.com/t/mikroorm/shared_invite/enQtNTM1ODYzMzM4MDk3LWM4ZDExMjU5ZDhmNjA2MmM3MWMwZmExNjhhNDdiYTMwNWM0MGY5ZTE3ZjkyZTMzOWExNDgyYmMzNDE1NDI5NjA',
        //   label: 'Slack',
        //   position: 'right',
        //   title: 'Chat on Slack',
        //   className: 'icon',
        // },
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
    // https://og-playground.vercel.app/?share=tVRNj9MwEP0rlhEqSMk2XdStGgES7HLooSBR0F64OPE0cevYlj2lW6r-d8ZtrX4sEhe4xPG80cx7zx5veW0l8JK_lernD8NYwI2Gd9tt_GdMquC02JSsN9fw1MsO0RZU0yIFB0XxMgXXSmJ7FRNaNWaC0AUCajAIPkGLVUA139xbCppY6xKO7R6UhxqVNRG1etWZhFaiXjberoycdKIBwrUyIHzeeCEVFXo1uC0kNNmLwXA4Go_jOh4PR69TAQ1IzWZO1Mo0JctvU1ui83hUNyqKYxThCT9EKVc0d7v4fR8_yb5rA8-53lttPZVYtwohMblI0MoRHtud4F6-hmqpMD_l5TUl9p5lkkf7-uiFCU54YnoCo7KZ-kVe3SVZjDkhJRnw0SLarmTD4gCc6WJsqpbefvk63avsk8y_6E0srlSe-r9JZj_rP0jMLgh82ziY1V45ZESDCnn2me7szSKQdQEks4Y9CBRsKpwDvy_xb4le0PluFDI7Z4_WL5kwkk0kGa1wE_uTonixTLj5L3bZoI7zIKpAE3FxjY4mnh3v1S3_o7stogtlv9_FY86t726UPeeeVp5x62LzwMst3w87L2nKiowfngNe3sWNhGrV8HIudICMQ2cXKh4gvTC43u-oUBT3qatA8hL9CnYZR1FRRgta27X1WvLdbw
    // https://og-playground.vercel.app/?share=hVPBjtMwEP0VY4QKUrJNl22rWoAEC4c9rJBYJC5cnHiazNaxI3tCtlT9d-x2rbTlsBc7fm80897TZMcrq4AL_kHhn9-GMU9bDR93u_jNmELfabkVbLLW8DTJjmgDWDcUwFlRvEnggIqaC0xqrM0dQesDUYEhcIl67D3hentrA2hir3M6jvuKDipCayJrdd-axJay2tTO9kbdtbKGwGs0IF1eO6kwNHo7uy4U1Nnr2Xy-XK3ivVrNl-9SAw0Uhj10skJTC5Zfp7FBzq9nd8uieEYJnuhztHIhc7-P56d4pPguAzzVemu1daHF0CBBUnJWoLELfBw30pN8gHKDlI91eRUKJ_9VhowO_clJ4zvpgtKRjM4e8G_IapFsMdZJpUIAXyyRbQWbF0fixBdj97hx9vuPe7a4umFIzPb06uB4Giy_4D0punA8anmfgj8b2RB1XkynbRydW9deoZ2W2tYjki_ym9yBBulBncpJN8-47eLyeC52_LCcXIStKDJ-XF8uFvGhoOxrLtZSe8g4tPYRf267-EfQcHiFRlHvt7YExQW5HvYZJ1mGiga0toN1WvH9Pw
    image: 'https://mikro-orm.io/img/og.png',
    footer: {
      style: 'dark',
      links: [
        docsFooterLinks,
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/w8bjxFHS7X',
            },
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
        blog: {
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 'ALL',
        },
      }
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
        /**
         * @param {string} to
         * @return {string|string[]|undefined}
         */
        createRedirects(to) {
          if (!to.startsWith('/docs/') || to.startsWith('/docs/api/')) {
            return;
          }

          const match = docsRouteRegex.exec(to);
          if (!match) {
            return;
          }

          if (renames[match[2]]) {
            return renames[match[2]].map(fromEntry => {
              if (typeof fromEntry === 'string') {
                return `/docs/${match[1]}${fromEntry}`;
              }
              if (versions.indexOf(match[1].slice(0, -1)) <= versions.indexOf(fromEntry.min)) {
                return `/docs/${match[1]}${fromEntry.from}`;
              }
              return '';
            }).filter(Boolean);
          }

        }
      },
    ],
  ],
};
