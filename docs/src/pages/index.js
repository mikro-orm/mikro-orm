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
    imageUrl: 'img/icons/lock-icon.svg',
    description: (
      <>
        MikroORM allows handling <Link to="/docs/transactions">transactions</Link> automatically. When you call <code>em.flush()</code>, all <Link to="/docs/unit-of-work#how-mikroorm-detects-changes">computed changes</Link> are wrapped inside a database transaction.
      </>
    ),
  },
  {
    title: <>DRY Entities</>,
    imageUrl: 'img/icons/hairdryer.svg',
    description: (
      <>
        Uses <Link to="/docs/metadata-providers#tsmorphmetadataprovider">source code analysis</Link> so you do not have to repeat yourself when defining entities. Simply define correct TypeScript types and you are good to go!
      </>
    ),
  },
  {
    title: <>Supports both SQL and NoSQL</>,
    imageUrl: 'img/icons/creative-idea.svg',
    description: (
      <>
        Supports <Link to="/docs/usage-with-mongo">MongoDB</Link>, <Link to="/docs/usage-with-sql">MySQL, MariaDB, PostgreSQL, MS SQL Server, and SQLite (including libSQL)</Link> databases, and more can be supported via custom drivers right now.
      </>
    ),
  },
  {
    title: <>In sync with your database</>,
    imageUrl: 'img/icons/migration.png',
    description: (
      <>
        Prototype schemas out of entity definitions rapidly with the <Link to="/docs/schema-generator">SchemaGenerator</Link>, generate migration diffs out of entity definitions with the <Link to="/docs/migrations">Migrator</Link>, or introspect your database with the <Link to="/docs/entity-generator">EntityGenerator</Link> to get entity definitions out of your database schema.
      </>
    ),
  },
  {
    title: <>Seeder</>,
    imageUrl: 'img/icons/seeds.png',
    description: (
      <>
        With the <Link to="/docs/seeding">Seeder</Link> and seeding factories, we can generate fake data of any volume/shape and seed the database with ease.
      </>
    ),
  },
  {
    title: <>Automatic Batching</>,
    imageUrl: 'img/icons/batch-processing.png',
    description: (
      <>
        Thanks to the <Link to="/docs/unit-of-work">UnitOfWork</Link>, all queries it fires are automatically batched. Inserts, updates, deletes - you name it!
      </>
    ),
  },
  {
    title: <>Events</>,
    imageUrl: 'img/icons/calendar.png',
    description: (
      <>
        Powerful <Link to="/docs/events">event system</Link> allows to hook into not only the entity lifecycle. Want to alter how the UnitOfWork works? Try <Link to="/docs/events#using-onflush-event"><code>onFlush</code></Link> event!
      </>
    ),
  },
  {
    title: <>QueryBuilder</>,
    imageUrl: 'img/icons/magnet.png',
    description: (
      <>
        Includes metadata-aware <Link to="/docs/query-builder">QueryBuilder</Link> with auto-joining support. Need more flexibility? We got you covered!
      </>
    ),
  },
  {
    title: <>Filters</>,
    imageUrl: 'img/icons/filter.png',
    description: (
      <>
        Define and control your common <Link to="/docs/filters">filters</Link> globally. Want to show only results relevant for a given tenant? Or maybe you want to automatically hide all soft-deleted entities?
      </>
    ),
  },
];

function Feature({imageUrl, title, description}) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={classnames('col col--4 margin-bottom--xl', styles.feature)}>
      <div>
        {imgUrl && (
          <div className="text--center">
            <img className={styles.featureImage} src={imgUrl} alt={title} />
          </div>
        )}
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
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
              to={useBaseUrl('docs/guide')}>
              Get Started
            </Link>
            <Link
              className={classnames(
                'button button--outline button--secondary button--lg',
                styles.sourceCode,
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
