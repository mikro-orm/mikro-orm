/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classnames from 'classnames';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

const features = [
  {
    title: <>Implicit Transactions</>,
    imageUrl: 'img/lock-icon.svg',
    description: (
      <>
        MikroORM allows handling transactions automatically. When you call <code>em.flush()</code>, all computed changes
        are wrapped inside a database transaction.
      </>
    ),
  },
  {
    title: <>DRY Entities</>,
    imageUrl: 'img/hairdryer.svg',
    description: (
      <>
        Uses source code analysis so you do not have to repeat yourself when defining entities. Simply define correct
        TypeScript types and you are good to go!
      </>
    ),
  },
  {
    title: <>Supports both SQL and NoSQL</>,
    imageUrl: 'img/creative-idea.svg',
    description: (
      <>
        Supports MongoDB, MySQL, MariaDB, PostgreSQL and SQLite databases, and more can be supported via custom
        drivers right now.
      </>
    ),
  },
];

function Feature({imageUrl, title, description}) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={classnames('col col--4', styles.feature)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const {siteConfig = {}} = context;
  return (
    <Layout
      title={`${siteConfig.title}: ${siteConfig.tagline}`}
      description="TypeScript ORM for Node.js based on Data Mapper, Unit of Work and Identity Map patterns.">
      <header className={classnames('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <img src="/img/hp-example.svg" style={{ float: 'right' }} alt="Example of MikroORM in action"/>
          <h1 className="hero__subtitle">
            TypeScript&nbsp;ORM
            for Node.js based on Data&nbsp;Mapper,
            Unit&nbsp;of&nbsp;Work and Identity&nbsp;Map patterns.
          </h1>
          <div className={styles.buttons}>
            <Link
              className={classnames(
                'button button--outline button--secondary button--lg',
                styles.getStarted,
              )}
              to={useBaseUrl('docs/installation')}>
              Documentation
            </Link>
            <Link
              className={classnames(
                'button button--outline button--secondary button--lg',
                styles.getStarted,
              )}
              to={'https://github.com/mikro-orm/mikro-orm'}>
              Source code
            </Link>
            <span className="github-button">
              <iframe src="https://ghbtns.com/github-btn.html?user=mikro-orm&repo=mikro-orm&type=star&count=true&size=large"
                      frameBorder={0}
                      scrolling={0}
                      width={160}
                      height={30}
                      title="GitHub Stars"
              />
              <iframe src="https://ghbtns.com/github-btn.html?user=B4nan&type=sponsor&size=large"
                      frameBorder={0}
                      scrolling={0}
                      width={180}
                      height={30}
                      title="Sponsor B4nan" />
            </span>
          </div>
        </div>
      </header>
      <main>
        {features && features.length && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}

export default Home;
