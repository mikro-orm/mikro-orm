import React, { useMemo } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

function formatDate(iso) {
  if (!iso) {
    return '';
  }
  return new Date(iso).toISOString().slice(0, 10);
}

function majorOf(tagName) {
  const match = /^v?(\d+)\./.exec(tagName);
  return match ? `v${match[1]}` : 'other';
}

function groupByMajor(releases) {
  const groups = new Map();
  for (const release of releases) {
    const key = majorOf(release.tagName);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(release);
  }
  const ordered = Array.from(groups.entries()).sort((a, b) => {
    const an = parseInt(a[0].replace(/^v/, ''), 10) || 0;
    const bn = parseInt(b[0].replace(/^v/, ''), 10) || 0;
    return bn - an;
  });
  for (const [, items] of ordered) {
    items.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }
  return ordered;
}

export default function Changelog({ releases = [] }) {
  const groups = useMemo(() => groupByMajor(releases), [releases]);

  return (
    <Layout
      title="Changelog"
      description="MikroORM release changelog, sourced from GitHub Releases."
      permalink="/changelog">
      <div className="container margin-vert--xl">
        <h1>Changelog</h1>
        <p>
          Release notes are sourced from{' '}
          <Link to="https://github.com/mikro-orm/mikro-orm/releases">GitHub Releases</Link>{' '}
          across the entire monorepo.
        </p>

        {groups.length > 1 && (
          <nav className={styles.toc} aria-label="Major versions">
            <span className={styles.tocLabel}>Jump to:</span>
            {groups.map(([major]) => (
              <a key={major} href={`#${major}`} className={styles.tocLink}>{major}</a>
            ))}
          </nav>
        )}

        {groups.map(([major, items]) => (
          <section key={major} className={styles.majorSection}>
            <h2 id={major} className={styles.majorHeading}>{major}</h2>
            {items.map(release => (
              <article key={release.tagName} className={styles.release} id={release.tagName}>
                <h3 className={styles.releaseHeading}>
                  <Link to={release.htmlUrl} className={styles.releaseTitle}>
                    {release.name || release.tagName}
                  </Link>
                  <span className={styles.releaseMeta}>
                    {release.prerelease && <span className={styles.prereleaseBadge}>pre-release</span>}
                    <time dateTime={release.publishedAt}>{formatDate(release.publishedAt)}</time>
                  </span>
                </h3>
                <div
                  className={styles.releaseBody}
                  dangerouslySetInnerHTML={{ __html: release.bodyHtml }}
                />
              </article>
            ))}
          </section>
        ))}
      </div>
    </Layout>
  );
}
