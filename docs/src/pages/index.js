import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import CodeBlock from '@theme/CodeBlock';
import styles from './styles.module.css';

const features = [
  {
    title: 'Unit of Work & Identity Map',
    docsUrl: 'docs/unit-of-work',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    description: 'Automatic change tracking and batched queries. All changes are wrapped in implicit transactions when you call em.flush().',
  },
  {
    title: 'Fully Type-Safe',
    docsUrl: 'docs/next/type-safe-relations',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    description: 'Type-safe queries, populate hints, and entity operations. Even string-based filters and relations are validated at compile time.',
  },
  {
    title: 'Multiple Entity Definition Styles',
    docsUrl: 'docs/defining-entities',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
        <line x1="14" y1="4" x2="10" y2="20"/>
      </svg>
    ),
    description: 'Choose your style: defineEntity with full type inference, decorators, or EntitySchema. No lock-in to a single approach.',
  },
  {
    title: 'Filters & Soft Delete',
    docsUrl: 'docs/filters',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
    ),
    description: 'Global and entity-level query filters for multi-tenancy, soft deletes, and more. Applied automatically to every query.',
  },
  {
    title: 'SQL & NoSQL',
    docsUrl: 'docs/usage-with-sql',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
    description: 'First-class support for MongoDB, PostgreSQL, MySQL, MariaDB, SQLite, libSQL, MS SQL Server, and more.',
  },
  {
    title: 'Schema Management',
    docsUrl: 'docs/migrations',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    description: 'Prototype with SchemaGenerator, version with Migrations, or introspect existing databases with EntityGenerator.',
  },
  {
    title: 'Smart Populate & Loading',
    docsUrl: 'docs/populating-relations',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    description: 'Type-checked populate hints with auto-joined loading strategies. Control exactly what gets loaded and how.',
  },
  {
    title: 'Events & Lifecycle',
    docsUrl: 'docs/events',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    description: 'Powerful event system with entity lifecycle hooks, onFlush events, and metadata-aware QueryBuilder.',
  },
  {
    title: 'Seeding & Factories',
    docsUrl: 'docs/seeding',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    description: 'Seed your database with realistic test data using entity factories. Define reusable blueprints and generate data for development and testing.',
  },
  {
    title: 'First-Class Kysely Integration',
    docsUrl: 'docs/next/kysely',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 7h3a5 5 0 0 1 0 10h-3"/>
        <path d="M9 17H6a5 5 0 0 1 0-10h3"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
    description: 'Use Kysely\'s type-safe SQL query builder directly with your MikroORM entities. Full autocompletion for table and column names.',
  },
];

const databases = [
  { name: 'PostgreSQL', logo: 'img/databases/postgresql.svg', docsUrl: 'docs/usage-with-sql' },
  { name: 'MySQL', logo: 'img/databases/mysql.svg', docsUrl: 'docs/usage-with-sql' },
  { name: 'MariaDB', logo: 'img/databases/mariadb.svg', docsUrl: 'docs/usage-with-sql' },
  { name: 'SQLite', logo: 'img/databases/sqlite.svg', docsUrl: 'docs/usage-with-sql' },
  { name: 'MongoDB', logo: 'img/databases/mongodb.svg', docsUrl: 'docs/usage-with-mongo' },
  { name: 'MS SQL', logo: 'img/databases/mssql.svg', docsUrl: 'docs/usage-with-sql' },
  { name: 'libSQL', logo: 'img/databases/libsql.svg', docsUrl: 'docs/usage-with-sql' },
  { name: 'CockroachDB', logo: 'img/databases/cockroachdb.svg', docsUrl: 'docs/next/usage-with-cockroachdb' },
  { name: 'Oracle', logo: 'img/databases/oracle.svg', docsUrl: 'docs/usage-with-sql', comingSoon: true },
  { name: 'Turso', logo: 'img/databases/turso.svg', docsUrl: 'docs/usage-with-sql#using-turso-database' },
  { name: 'Cloudflare D1', logo: 'img/databases/cloudflare-d1.svg', docsUrl: 'docs/next/usage-with-sql#using-cloudflare-d1-database' },
];

function Feature({ title, icon, description, docsUrl }) {
  return (
    <Link className={styles.featureCard} to={useBaseUrl(docsUrl)}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
    </Link>
  );
}

function FeatureScroll() {
  const trackRef = useRef(null);
  const paused = useRef(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let animId;
    const speed = 0.4;

    const step = () => {
      if (!paused.current) {
        el.scrollLeft += speed;
        // seamless loop: when the first set scrolls away, reset
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, []);

  const pause = useCallback(() => { paused.current = true; }, []);
  const resume = useCallback(() => { paused.current = false; }, []);

  return (
    <div
      className={styles.featureScroll}
      ref={trackRef}
      onPointerEnter={pause}
      onPointerLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      <div className={styles.featureScrollTrack}>
        {features.map((props, idx) => (
          <Feature key={`a-${idx}`} {...props} />
        ))}
        {features.map((props, idx) => (
          <Feature key={`b-${idx}`} {...props} />
        ))}
      </div>
    </div>
  );
}

const driverPackages = [
  '@mikro-orm/postgresql',
  '@mikro-orm/mysql',
  '@mikro-orm/mariadb',
  '@mikro-orm/sqlite',
  '@mikro-orm/mongodb',
  '@mikro-orm/libsql',
  '@mikro-orm/mssql',
];

function InstallSnippet() {
  const [copied, setCopied] = useState(false);
  const [driverIndex, setDriverIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setDriverIndex(i => (i + 1) % driverPackages.length);
        setAnimating(false);
      }, 200);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const pkg = driverPackages[driverIndex];
  const command = `npm install ${pkg}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.installSnippet} onClick={handleCopy} title="Click to copy">
      <span className={styles.installPrefix}>$</span>
      <span>npm install <span className={`${styles.installPkg} ${animating ? styles.installPkgOut : styles.installPkgIn}`}>{pkg}</span></span>
      <svg className={styles.copyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {copied ? (
          <polyline points="20 6 9 17 4 12"/>
        ) : (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </>
        )}
      </svg>
    </div>
  );
}

const entityTabs = [
  {
    id: 'defineEntity',
    label: 'defineEntity',
    code: `import { defineEntity, InferEntity, p } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.number().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author).ref(),
    tags: () => p.manyToMany(Tag),
  },
});

export type IBook = InferEntity<typeof Book>;`,
  },
  {
    id: 'reflect-metadata',
    label: 'reflect-metadata',
    code: `@Entity()
export class Book {

  [EntityName]?: 'Book';

  @PrimaryKey()
  id: number;

  @Property()
  title: string;

  @ManyToOne(() => Author, { ref: true })
  author: Ref<Author>;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

}`,
  },
  {
    id: 'ts-morph',
    label: 'ts-morph',
    code: `@Entity()
export class Book {

  [EntityName]?: 'Book';

  @PrimaryKey()
  id: number;

  @Property()
  title: string;

  @ManyToOne()
  author: Ref<Author>;

  @ManyToMany()
  tags = new Collection<Tag>(this);

}`,
  },
  {
    id: 'entitySchema',
    label: 'EntitySchema',
    code: `export interface IBook {
  [EntityName]?: 'Book';
  id: number;
  title: string;
  author: Ref<IAuthor>;
  tags: Collection<ITag>;
}

export const Book = new EntitySchema<IBook>({
  name: 'Book',
  properties: {
    id: { type: 'number', primary: true },
    title: { type: 'string' },
    author: { kind: 'm:1', entity: () => 'Author', ref: true },
    tags: { kind: 'm:n', entity: () => 'Tag' },
  },
});`,
  },
];

const queryTabs = [
  {
    id: 'em',
    label: 'EntityManager',
    code: `// fully type-safe queries
const books = await em.find(Book, {
  author: { name: 'Tolkien' },
}, {
  populate: ['author.profile'], // type-checked!
  orderBy: { title: 'asc' },
});

// all changes are tracked automatically
books[0].title = 'Updated Title';
em.remove(books[1]);

// single flush = one transaction, batched queries
await em.flush();`,
  },
  {
    id: 'qb',
    label: 'QueryBuilder',
    code: `const books = await em.createQueryBuilder(Book, 'b')
  .select('*')
  .leftJoinAndSelect('b.author', 'a')
  .where({ 'a.name': 'Tolkien' })
  .orderBy({ title: 'asc' })
  .getResultList();

// or with raw SQL fragments
const stats = await em.createQueryBuilder(Book, 'b')
  .select([raw('count(*) as count'), 'b.author'])
  .groupBy('b.author')
  .having({ [raw('count(*)')]: { $gte: 3 } })
  .getResultList();`,
  },
  {
    id: 'kysely',
    label: 'Kysely',
    code: `// first-class Kysely integration
const kysely = orm.em.getKysely({
  tableNamingStrategy: 'entity',
  columnNamingStrategy: 'property',
});

const rows = await kysely
  .selectFrom('Book as b')
  .innerJoin('Author as a', 'a.id', 'b.author')
  .select(['b.title', 'a.name'])
  .where('a.name', '=', 'Tolkien')
  .orderBy('b.title', 'asc')
  .execute();

// fully typed — entity and property names
// auto-completed from your entity metadata`,
  },
  {
    id: 'loaded',
    label: 'Loaded Type',
    code: `// enforce loaded relations via function signature
function renderBookCard(
  book: Loaded<Book, 'author.profile' | 'tags'>,
) {
  // all accessed relations guaranteed to be loaded
  return {
    title: book.title,
    author: book.author.$.name,
    bio: book.author.$.profile.$.bio,
    tags: book.tags.$.map(t => t.name),
  };
}

// populate must match — or it won't compile
const book = await em.findOneOrFail(Book, 1, {
  populate: ['author.profile', 'tags'],
});
renderBookCard(book); // works!

const raw = await em.findOneOrFail(Book, 1);
renderBookCard(raw);  // compile error!`,
  },
];

function CodeExample() {
  const [activeTab, setActiveTab] = useState('defineEntity');
  const [activeQueryTab, setActiveQueryTab] = useState('em');

  return (
    <section className={styles.codeExample}>
      <div className={styles.codeExampleInner}>
        <h2 className={styles.sectionTitle}>Define, Query, Done</h2>
        <p className={styles.sectionSubtitle}>
          Define entities your way, query with a clean type-safe API
        </p>
        <div className={styles.codeColumns}>
          <div className={styles.codeColumn}>
            <div className={styles.tabBar}>
              {entityTabs.map(tab => (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className={styles.codeBlockWrapper}>
              <CodeBlock language="ts">
                {entityTabs.find(t => t.id === activeTab).code}
              </CodeBlock>
            </div>
          </div>
          <div className={styles.codeColumn}>
            <div className={styles.tabBar}>
              {queryTabs.map(tab => (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${activeQueryTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveQueryTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className={styles.codeBlockWrapper}>
              <CodeBlock language="ts">
                {queryTabs.find(t => t.id === activeQueryTab).code}
              </CodeBlock>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout
      title={`${siteConfig.title}: ${siteConfig.tagline}`}
      description="TypeScript ORM for Node.js based on Data Mapper, Unit of Work and Identity Map patterns.">
      {/* Hero */}
      <header className={`hero hero--primary ${styles.heroBanner}`}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            TypeScript ORM{'\n'}built on <em>proven patterns</em>
          </h1>
          <p className="hero__subtitle">
            Based on Data Mapper, Unit of Work, and Identity Map patterns.
            Build type-safe, performant database layers with minimal boilerplate.
          </p>
          <InstallSnippet />
          <div className={styles.buttons}>
            <Link
              className={`button button--lg ${styles.primaryButton}`}
              to={useBaseUrl('docs/guide')}>
              Get Started
            </Link>
            <Link
              className={`button button--lg ${styles.outlineButton}`}
              to="https://github.com/mikro-orm/mikro-orm">
              GitHub
            </Link>
          </div>
          <div className={styles.heroMeta}>
            <iframe
              src="https://ghbtns.com/github-btn.html?user=mikro-orm&repo=mikro-orm&type=star&count=true&size=large"
              frameBorder={0}
              scrolling="0"
              width={160}
              height={30}
              title="GitHub Stars"
            />
            <a
              className={styles.sponsorLink}
              href="https://github.com/sponsors/b4nan"
              target="_blank"
              rel="noopener noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              Sponsor
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Features */}
        <section className={styles.features}>
          <h2 className={styles.sectionTitle}>Why MikroORM?</h2>
          <p className={styles.sectionSubtitle}>
            A modern ORM that gets out of your way and lets you focus on your domain
          </p>
          <div className={styles.featureGrid}>
            {features.map((props, idx) => (
              <Feature key={idx} {...props} />
            ))}
          </div>
          <FeatureScroll />
        </section>

        {/* Databases */}
        <section className={styles.databases}>
          <h2 className={styles.sectionTitle}>Supported Databases</h2>
          <p className={styles.sectionSubtitle}>
            One API, multiple database backends
          </p>
          <div className={styles.databaseGrid}>
            {databases.map((db) => (
              <Link key={db.name} className={styles.databaseItem} to={useBaseUrl(db.docsUrl)}>
                <img className={styles.databaseLogo} src={useBaseUrl(db.logo)} alt={db.name} />
                <span className={styles.databaseName}>
                  {db.name}
                  {db.comingSoon && <span className={styles.comingSoon}> (soon)</span>}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Code Example */}
        <CodeExample />

        {/* Social Proof */}
        <section className={styles.socialProof}>
          <h2 className={styles.sectionTitle}>Join the Community</h2>
          <div className={styles.socialLinks}>
            <a
              className={styles.socialLink}
              href="https://github.com/mikro-orm/mikro-orm"
              target="_blank"
              rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Star on GitHub
            </a>
            <a
              className={styles.socialLink}
              href="https://github.com/sponsors/b4nan"
              target="_blank"
              rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              Sponsor
            </a>
            <a
              className={styles.socialLink}
              href="https://discord.gg/w8bjxFHS7X"
              target="_blank"
              rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Join Discord
            </a>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default Home;
