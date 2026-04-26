import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@theme/Layout';
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

function Sidebar({ groups }) {
  const [expandedMajor, setExpandedMajor] = useState(() => groups[0]?.[0] ?? null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash) {
      return;
    }
    const id = decodeURIComponent(window.location.hash.slice(1));
    const major = majorOf(id);
    if (major && major !== 'other') {
      setExpandedMajor(major);
    }
  }, []);

  const toggle = key => {
    setExpandedMajor(prev => (prev === key ? null : key));
  };

  return (
    <aside className={styles.sidebar} aria-label="Versions">
      <nav>
        <ul className={styles.sidebarList}>
          {groups.map(([major, items]) => {
            const isOpen = expandedMajor === major;
            return (
              <li key={major} className={styles.sidebarMajor}>
                <button
                  type="button"
                  className={styles.sidebarMajorButton}
                  onClick={() => toggle(major)}
                  aria-expanded={isOpen}>
                  <span className={styles.sidebarCaret} aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
                  <span className={styles.sidebarMajorLabel}>{major}</span>
                  <span className={styles.sidebarCount}>{items.length}</span>
                </button>
                {isOpen && (
                  <ul className={styles.sidebarVersions}>
                    {items.map(release => (
                      <li key={release.tagName}>
                        <a href={`#${release.tagName}`} className={styles.sidebarVersionLink}>
                          {release.tagName}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

function useScrollToHashAfterMount() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash) {
      return;
    }
    const id = decodeURIComponent(window.location.hash.slice(1));
    // Wait for layout/paint to settle so `content-visibility: auto`
    // sections can lay out at their real height before we anchor.
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ block: 'start' });
        }
      });
    });
    return () => cancelAnimationFrame(raf1);
  }, []);
}

export default function Changelog({ releases = [] }) {
  const groups = useMemo(() => groupByMajor(releases), [releases]);
  useScrollToHashAfterMount();

  return (
    <Layout
      title="Changelog"
      description="MikroORM release changelog, sourced from GitHub Releases."
      permalink="/changelog">
      <div className={styles.layout}>
        <Sidebar groups={groups} />
        <main className={styles.content}>
          <h1>Changelog</h1>
          <p>
            Release notes are sourced from{' '}
            <a
              href="https://github.com/mikro-orm/mikro-orm/releases"
              target="_blank"
              rel="noopener noreferrer">
              GitHub Releases
            </a>{' '}
            across the entire monorepo.
          </p>

          {groups.map(([major, items]) => (
            <section key={major} className={styles.majorSection}>
              <h2 id={major} className={styles.majorHeading}>{major}</h2>
              {items.map(release => (
                <article key={release.tagName} className={styles.release} id={release.tagName}>
                  <h3 className={styles.releaseHeading}>
                    <a
                      href={release.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.releaseTitle}>
                      {release.name || release.tagName}
                    </a>
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
        </main>
      </div>
    </Layout>
  );
}
