export interface PlaygroundProject {
  entry: string;
  files: Record<string, string>;
}

const firstEntityServer = `import { MikroORM } from '@mikro-orm/sqlite';
import config from './mikro-orm.config.js';
import { UserSchema } from './modules/user/user.entity.js';

const orm = await MikroORM.init(config);

// create the schema so we can use the in-memory database
await orm.schema.refresh();

// fork first to get a clean context with its own identity map
const em = orm.em.fork();

const user = em.create(UserSchema, {
  email: 'foo@bar.com',
  fullName: 'Foo Bar',
  password: '123456',
});

await em.flush();
console.log('user id is:', user.id);

const found = await em.fork().findOne(UserSchema, user.id);
console.log('loaded from db:', found);

await orm.close();
`;

const firstEntityConfig = `import { defineConfig } from '@mikro-orm/sqlite';
import { UserSchema } from './modules/user/user.entity.js';

export default defineConfig({
  dbName: 'sqlite.db',
  entities: [UserSchema],
  debug: true,
});
`;

const firstEntityUser = `import { defineEntity, type InferEntity, p } from '@mikro-orm/core';

export const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    fullName: p.string(),
    email: p.string(),
    password: p.string(),
    bio: p.text().default(''),
  },
});

export type IUser = InferEntity<typeof UserSchema>;
`;

const relationshipsBase = `import { defineEntity, p } from '@mikro-orm/core';

export const BaseSchema = defineEntity({
  name: 'BaseEntity',
  abstract: true,
  properties: {
    id: p.integer().primary(),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p.datetime().onCreate(() => new Date()).onUpdate(() => new Date()),
  },
});
`;

const relationshipsUser = `import { defineEntity, type InferEntity, p } from '@mikro-orm/core';
import { BaseSchema } from '../common/base.entity.js';
import { ArticleSchema } from '../article/article.entity.js';

export const UserSchema = defineEntity({
  name: 'User',
  extends: BaseSchema,
  properties: {
    fullName: p.string(),
    email: p.string(),
    password: p.string().hidden().lazy(),
    bio: p.text().default(''),
    articles: () => p.oneToMany(ArticleSchema).mappedBy('author'),
  },
});

export type IUser = InferEntity<typeof UserSchema>;
`;

const relationshipsArticle = `import { defineEntity, type InferEntity, p } from '@mikro-orm/core';
import { BaseSchema } from '../common/base.entity.js';
import { UserSchema } from '../user/user.entity.js';
import { TagSchema } from './tag.entity.js';

function convertToSlug(text: string) {
  return text.toLowerCase()
             .replace(/[^\\w ]+/g, '')
             .replace(/ +/g, '-');
}

export const ArticleSchema = defineEntity({
  name: 'Article',
  extends: BaseSchema,
  properties: {
    slug: p.string().unique().onCreate(article => convertToSlug(article.title)),
    title: p.string().index(),
    description: p.string().length(1000).onCreate(article => article.text.substring(0, 999) + '…'),
    text: p.text().lazy(),
    author: () => p.manyToOne(UserSchema),
    tags: () => p.manyToMany(TagSchema),
  },
});

export type IArticle = InferEntity<typeof ArticleSchema>;
`;

const relationshipsTag = `import { defineEntity, type InferEntity, p } from '@mikro-orm/core';
import { BaseSchema } from '../common/base.entity.js';
import { ArticleSchema } from './article.entity.js';

export const TagSchema = defineEntity({
  name: 'Tag',
  extends: BaseSchema,
  properties: {
    name: p.string().length(20),
    articles: () => p.manyToMany(ArticleSchema).mappedBy('tags'),
  },
});

export type ITag = InferEntity<typeof TagSchema>;
`;

const relationshipsConfig = `import { defineConfig } from '@mikro-orm/sqlite';
import { UserSchema } from './modules/user/user.entity.js';
import { ArticleSchema } from './modules/article/article.entity.js';
import { TagSchema } from './modules/article/tag.entity.js';

export default defineConfig({
  dbName: ':memory:',
  entities: [UserSchema, ArticleSchema, TagSchema],
  debug: true,
});
`;

const relationshipsServer = `import { MikroORM } from '@mikro-orm/sqlite';
import config from './mikro-orm.config.js';
import { UserSchema } from './modules/user/user.entity.js';
import { ArticleSchema } from './modules/article/article.entity.js';
import { TagSchema } from './modules/article/tag.entity.js';

const orm = await MikroORM.init(config);
await orm.schema.refresh();

const em = orm.em.fork();

// create an author together with an article and a couple of tags (a whole entity graph)
const user = em.create(UserSchema, {
  email: 'foo@bar.com',
  fullName: 'Foo Bar',
  password: '123456',
});

const article = em.create(ArticleSchema, {
  title: 'Foo is Bar',
  text: 'Lorem ipsum dolor sit amet',
  author: user,
  tags: [
    em.create(TagSchema, { name: 'foo' }),
    em.create(TagSchema, { name: 'bar' }),
  ],
});

await em.flush();

// the slug + description were generated via onCreate hooks
console.log('generated slug:', article.slug);
console.log('generated description:', article.description);

// clear the context to simulate a fresh request
em.clear();

// load the article together with its author and tags
const loaded = await em.findOneOrFail(ArticleSchema, { slug: 'foo-is-bar' }, {
  populate: ['author', 'tags'],
});

console.log('title:', loaded.title);
console.log('author:', loaded.author.fullName, \`<\${loaded.author.email}>\`);
console.log('tags:', loaded.tags.getItems().map(t => t.name).join(', '));

// password is hidden() + lazy(), so it is never selected nor serialized
console.log('password selected?', loaded.author.password ?? '(hidden & lazy — not selected)');

await orm.close();
`;

export const projects: Record<string, PlaygroundProject> = {
  'first-entity': {
    entry: 'src/server.ts',
    files: {
      'src/server.ts': firstEntityServer,
      'src/mikro-orm.config.ts': firstEntityConfig,
      'src/modules/user/user.entity.ts': firstEntityUser,
    },
  },
  relationships: {
    entry: 'src/server.ts',
    files: {
      'src/server.ts': relationshipsServer,
      'src/mikro-orm.config.ts': relationshipsConfig,
      'src/modules/common/base.entity.ts': relationshipsBase,
      'src/modules/user/user.entity.ts': relationshipsUser,
      'src/modules/article/article.entity.ts': relationshipsArticle,
      'src/modules/article/tag.entity.ts': relationshipsTag,
    },
  },
};
