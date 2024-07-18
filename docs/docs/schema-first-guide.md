---
title: Schema First Guide
---

Although MikroORM is primarily a "code first" ORM, it can also be used in a "schema first" approach.

## "Code first" vs "Schema first"

As the names suggest, in a "code first" approach, you write the entity definitions first, and generate the schema definition out of that code (using the schema generator). As a last step, you execute the migration statements to the database server. In a "schema first" approach, you write the schema definition first (or in the case of migrations, write the migrations first), execute it, and generate the entity definitions out of the database (using the entity generator).

Both approaches have some benefits and drawbacks.

Code first:

- ✅ No need to get familiar with all SQL options for defining tables, columns, indexes and foreign keys. (It helps if you are though)
- ✅ Easy to port between different database engines (until you opt into engine-specific features)
- ✅ It is trivial to rename tables and columns, as well as add and remove them... As long as you only do one of those three things per entity per migration.
- ❌ If you aren’t careful, and do multiple changes to one entity in one go, database migrations can cause data loss. Careful manual review of generated migrations is needed to avoid this.
- ❌ Performance may be suboptimal, as many database features are "out of sight, out of mind".
- ❌ You may be missing out on possible M:N and 1:N relations that would in turn make your application logic simpler.
- ❌ Hard to port to and from a different ORM, as often times, features that are named the same may actually work differently, and conversely, the same features may be named differently.

Schema first:

- ✅ No need to get familiar with the ORM's options. (It helps if you are though)
- ✅ Easy to port to and from a different ORM (including different versions of the same ORM), even if that ORM is in another language.
- ✅ If you’re comfortable with SQL, it is trivial to add new tables, columns and relations, while keeping the entity definitions fully aware of all possible links, and your data safe.
- ❌ Renames are a bit more involved, because the regenerated entities aren’t part of the rest of your code.
- ❌ Sufficiently complex schemas can end up triggering bugs in entity generation, that you then need to patch in some way, before your application can even build.
- ❌ You may be missing out on goodies from the ORM that make application logic simpler.
- ❌ Likely harder to port to and from a different database engine, as even relatively "simple" database schemas are likely to end up needing database-specific features, which the entity generator will include where supported by the ORM. If using the database to its full potential, such a migration would be even more challenging.

## What are we building?

In the rest of this guide, we will be building an application after first having made the database schema.

We'll end with the same application that you may have already created by following [the "code first" guide](./guide), but re-create it from scratch again. Reading that guide beforehand is not strictly required, but we will make several references back to it as a point of comparison.

To take a peek at the final project we will be building, try cloning the [`mikro-orm/schema-first-guide` GitHub project](https://github.com/mikro-orm/schema-first-guide).

```bash
git clone https://github.com/mikro-orm/schema-first-guide.git
```

We will use MySQL for this project. Other database engines follow the same process. If you're building an application from scratch (as opposed to migrating an existing application), you can use GUI tools (in the case of MySQL, this includes f.e. MySQL Workbench) to make this part of the process easier. We are also assuming you already have MySQL itself installed locally and can connect to it via the username "root" and no password.

Here's the MySQL DDL of our initial application (before later migrations), as dumped by a DB creation tool (in this case, MySQL Workbench Forward Engineering):

```mysql title='schema.sql'
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema blog
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema blog
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `blog` DEFAULT CHARACTER SET utf8 ;
USE `blog` ;

-- -----------------------------------------------------
-- Table `user`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `bio` TEXT NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `article`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `article` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `slug` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` VARCHAR(1000) NOT NULL,
  `text` TEXT NOT NULL,
  `author` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `slug_UNIQUE` (`slug` ASC) VISIBLE,
  INDEX `fk_article_user1_idx` (`author` ASC) VISIBLE,
  CONSTRAINT `fk_article_user1`
    FOREIGN KEY (`author`)
    REFERENCES `user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `comment`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `comment` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `text` VARCHAR(1000) NOT NULL,
  `article` INT UNSIGNED NOT NULL,
  `author` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_comment_article1_idx` (`article` ASC) VISIBLE,
  INDEX `fk_comment_user1_idx` (`author` ASC) VISIBLE,
  CONSTRAINT `fk_comment_article1`
    FOREIGN KEY (`article`)
    REFERENCES `article` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_comment_user1`
    FOREIGN KEY (`author`)
    REFERENCES `user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tag`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tag` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `name` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `article_tag`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `article_tag` (
  `article_id` INT UNSIGNED NOT NULL,
  `tag_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`article_id`, `tag_id`),
  INDEX `fk_article_tag_tag1_idx` (`tag_id` ASC) VISIBLE,
  CONSTRAINT `fk_article_tag_article1`
    FOREIGN KEY (`article_id`)
    REFERENCES `article` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_article_tag_tag1`
    FOREIGN KEY (`tag_id`)
    REFERENCES `tag` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
```

But we can place this in an initial migration file, to make our application work on blank MySQL servers as well.

## Project setup

### Install

We will use a similar setup to [the guide](./guide).

Init the project:
```bash npm2yarn
npm init
```

Install the following:
```bash npm2yarn
npm install @mikro-orm/core \
            @mikro-orm/mysql \
            @mikro-orm/migrations \
            fastify
```

and some dev dependencies

```bash npm2yarn
npm install --save-dev @mikro-orm/cli \
                       @mikro-orm/entity-generator \
                       typescript \
                       ts-node \
                       @types/node \
                       rimraf \
                       vitest
```

### ECMAScript Modules

Just [as in the "code first" guide](./guide/01-first-entity.md#ecmascript-modules), we'll be using ECMAScript modules. Make sure you have

```json title='package.json'
{
  "type": "module",
  ...
}
```

in your package.json file.

### Configuring TypeScript

We will use almost the same config [as the "code first" guide one](./guide/01-first-entity.md#configuring-typescript). As mentioned there, already, adjust this config if you know what you’re doing.

We'll include the ts-node config, and add `emitDecoratorMetadata`, because we'll be using the default metadata provider, which requires that of our TypeScript config.

```json title='tsconfig.json'
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "strict": true,
    "outDir": "dist",
    "declaration": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  },
  "include": [
    "./src/**/*.ts"
  ],
  "ts-node": {
    "esm": true,
    "transpileOnly": true
  }
}
```

### Configuring the CLI

Configuring the MikroORM CLI tools is essential for the "schema first" approach.  We need the migrator to run our migrations, as well as the entity generator to create our entities out of the schema state.

Here's a basic config we'll start with (and later extend to take full advantage of the entity generator's features):

```ts title='src/mikro-orm.config.ts'
import { defineConfig } from '@mikro-orm/mysql';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Migrator } from '@mikro-orm/migrations';

export default defineConfig({
    multipleStatements: true,
    extensions: [EntityGenerator, Migrator],
    discovery: {
        // we need to disable validation for no entities, due to the entity generation
        warnWhenNoEntities: false,
    },
    entities: ['dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
    host: 'localhost',
    user: 'root',
    password: '',
    dbName: 'blog',
    // enable debug mode to log SQL queries and discovery information
    debug: true,
    migrations: {
        path: 'dist/migrations',
        pathTs: 'src/migrations',
    },
    entityGenerator: {
        save: true,
        path: 'src/modules',
        esmImport: true,
        readOnlyPivotTables: true,
        outputPurePivotTables: true,
        bidirectionalRelations: true,
        customBaseEntityName: 'Base',
        useCoreBaseEntity: true,
    },
});
```

And you can also add to your package.json

```json title='package.json'
{
  "mikro-orm": {
    "useTsNode": true
  }
}
```

Or alternatively, set the environment variable `MIKRO_ORM_CLI_USE_TS_NODE` to a non-empty value.

To keep the example simple, we're having all of our configuration in a single config file, but you may split your config into a shared config and a tool specific config. In that case, you will want to also supply the correct config file for the correct tool upon running it. You will want to wrap those calls in package.json scripts that do that for you.

## Generating initial entities

We'll first generate and run an initial migration to generate entities out of. We'll need to add the "--blank" option to make it ok for the migration generator that we don't currently have any entities.

Run
```sh
npx mikro-orm-esm migration:create --initial --blank
```

And let's edit it to include the contents of the schema:

```ts title='migrations/Migration00000000000000.ts'
import { Migration } from '@mikro-orm/migrations';

export class Migration00000000000000 extends Migration {

  async up(): Promise<void> {
    await this.execute(`
CREATE TABLE IF NOT EXISTS \`user\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`full_name\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) NOT NULL,
  \`password\` VARCHAR(255) NOT NULL,
  \`bio\` TEXT NOT NULL,
  PRIMARY KEY (\`id\`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`article\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`slug\` VARCHAR(255) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` VARCHAR(1000) NOT NULL,
  \`text\` TEXT NOT NULL,
  \`author\` INT UNSIGNED NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE INDEX \`slug_UNIQUE\` (\`slug\` ASC) VISIBLE,
  INDEX \`fk_article_user1_idx\` (\`author\` ASC) VISIBLE,
  CONSTRAINT \`fk_article_user1\`
    FOREIGN KEY (\`author\`)
    REFERENCES \`user\` (\`id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`comment\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`text\` VARCHAR(1000) NOT NULL,
  \`article\` INT UNSIGNED NOT NULL,
  \`author\` INT UNSIGNED NOT NULL,
  PRIMARY KEY (\`id\`),
  INDEX \`fk_comment_article1_idx\` (\`article\` ASC) VISIBLE,
  INDEX \`fk_comment_user1_idx\` (\`author\` ASC) VISIBLE,
  CONSTRAINT \`fk_comment_article1\`
    FOREIGN KEY (\`article\`)
    REFERENCES \`article\` (\`id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_comment_user1\`
    FOREIGN KEY (\`author\`)
    REFERENCES \`user\` (\`id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`tag\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`name\` VARCHAR(20) NOT NULL,
  PRIMARY KEY (\`id\`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`article_tag\` (
  \`article_id\` INT UNSIGNED NOT NULL,
  \`tag_id\` INT UNSIGNED NOT NULL,
  PRIMARY KEY (\`article_id\`, \`tag_id\`),
  INDEX \`fk_article_tag_tag1_idx\` (\`tag_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_article_tag_article1\`
    FOREIGN KEY (\`article_id\`)
    REFERENCES \`article\` (\`id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_article_tag_tag1\`
    FOREIGN KEY (\`tag_id\`)
    REFERENCES \`tag\` (\`id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
    `);
  }
}
```

Then run the migration with

```sh
npx mikro-orm-esm migration:up
```

And now, you can generate the initial entities with

```sh
npx mikro-orm-esm generate-entities --save
```

If all is good to this point, you should be seeing the following directory structure

```
├── package.json
├── src
│   ├── mikro-orm.config.ts
│   └── modules
│       ├── Article.ts
│       ├── ArticleTag.ts
│       ├── Base.ts
│       ├── Comment.ts
│       ├── Tag.ts
│       └── User.ts
└── tsconfig.json
```

## Manipulating entity file locations and names

You may have noticed that the files aren’t following the `*.entity.ts` suffix we configured initially. Further, they're all under one folder. Both of these are because of the default names the entity generator uses. We can override the `fileName` option in the config to save our files in different locations, and add suffixes:

```ts title='src/mikro-orm.config.ts'
import { defineConfig } from '@mikro-orm/mysql';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Migrator } from '@mikro-orm/migrations';

export default defineConfig({
  // rest of the config
  entityGenerator: {
    fileName: (entityName) => {
      switch (entityName) {
        case 'Article':
        case 'ArticleTag':
        case 'Tag':
        case 'Comment':
          return `article/${entityName.toLowerCase()}.entity`;
        case 'User':
          return `user/${entityName.toLowerCase()}.entity`;
        default:
          return `common/${entityName.toLowerCase()}.entity`;
      }
    },
    // rest of the entity generator config
  }
});
```

If you first remove all files from the modules folder (or just remove the modules folder itself), and then re-run the entity generator, you should now instead see the following directory structure:

```
├── package.json
├── src
│   ├── mikro-orm.config.ts
│   └── modules
│       ├── article
│       │   ├── article.entity.ts
│       │   ├── articletag.entity.ts
│       │   ├── tag.entity.ts
│       │   └── comment.entity.ts
│       ├── common
│       │   └── base.entity.ts
│       └── user
│           └── user.entity.ts
└── tsconfig.json
```

When re-generating the entities later, you will want to first remove all files with the suffix ".entity.ts".

```sh
npx rimraf -g ./src/modules/**/*.entity.ts
```

Because we'll be regenerating entities a lot, and doing so requires removal of the old ones first, let's add a script in package.json for that:

```json title="package.json"
  "scripts": {
    "regen": "rimraf -g ./src/modules/**/*.entity.ts && npx mikro-orm-esm generate-entities --save"
  }
```

And now, you can call

```sh
npm run regen
```

## Using the generated entities

Because the generated entities now match our runtime configuration, we can init the ORM in our application, and they should be picked up.

We're going to use a similar approach for our application organization as the one in the "code first" guide.

Specifically, our DB wrapper:

```ts title="src/db.ts"
import {
  type EntityManager,
  type EntityRepository,
  MikroORM,
  type Options,
} from "@mikro-orm/mysql";
import config from "./mikro-orm.config.js";
import { Article } from "./modules/article/article.entity.js";
import { Tag } from "./modules/article/tag.entity.js";
import { User } from "./modules/user/user.entity.js";
import { Comment } from "./modules/article/comment.entity.js";

export interface Services {
  orm: MikroORM;
  em: EntityManager;
  user: EntityRepository<User>;
  article: EntityRepository<Article>;
  tag: EntityRepository<Tag>;
  comment: EntityRepository<Comment>;
}

let cache: Services;

export async function initORM(options?: Options): Promise<Services> {
  if (cache) {
    return cache;
  }

  const orm = await MikroORM.init({
    ...config,
    ...options,
  });

  return (cache = {
    orm,
    em: orm.em,
    user: orm.em.getRepository(User),
    article: orm.em.getRepository(Article),
    tag: orm.em.getRepository(Tag),
    comment: orm.em.getRepository(Comment),
  });
}
```

The app itself:

```ts title="src/app.ts"
import { RequestContext } from '@mikro-orm/core';
import { fastify } from 'fastify';
import { initORM } from './db.js';

export async function bootstrap(port = 3001, migrate = true) {
  const db = await initORM({
      ensureDatabase: { create: false },
  });

  if (migrate) {
    // sync the schema
    await db.orm.migrator.up();
  }

  const app = fastify();

  // register request context hook
  app.addHook('onRequest', (request, reply, done) => {
    RequestContext.create(db.em, done);
  });

  // shut down the connection when closing the app
  app.addHook('onClose', async () => {
    await db.orm.close();
  });

  // register routes here
  app.get('/article', async (request) => {
    const { limit, offset } = request.query as {
      limit?: number;
      offset?: number;
    };
    const [items, total] = await db.article.findAndCount(
      {},
      {
        limit,
        offset,
      }
    );

    return { items, total };
  });

  const url = await app.listen({ port });

  return { app, url };
}
```

And the server entry point:

```ts title="src/server.ts"
import { bootstrap }  from './app.js';

try {
  const { url } = await bootstrap();
  console.log(`server started at ${url}`);
} catch (e) {
  console.error(e);
}
```

Finally, let's add a script in package.json to start the application, as well as a script to check our code:

```json title="package.json"
{
  "scripts": {
    "check": "tsc --noEmit",
    "start": "node --no-warnings=ExperimentalWarning --loader ts-node/esm src/server.ts"
  }
}
```

While you don’t need to run the check script before starting the application, you may find it convenient to check for errors after significant changes.

## ⛳ Checkpoint 1

At this point, we have an application similar to the one at ["Checkpoint 3" of the "code first" guide](./guide/03-project-setup.md#-checkpoint-3). The application itself can only list articles, which don’t exist yet, unless we manually add them with SQL queries. However, we already defined all the entities we'll use. We'll later do some tweaks on top of the generated entities to showcase the full extent of the entity generator's features in a useful way. However, you're already at a point where you can use the generated entities "as is" in your application code, and code the remaining logic around them.

You can verify the application is working ok by starting it, and opening https://localhost:3001/article in your browser.

## Making changes to existing tables and columns

Given the current simplicity of our application, we don't have to worry about compatibility. We can just run

```sh
npx mikro-orm-esm migration:create --blank
```

to create a new empty migration, prepare whatever SQL statements we need to perform in it, run

```sh
npx mikro-orm-esm migration:up
```

and finally re-generate the entities with

```sh
npm run regen
```

This flow gets a bit more complex once your application grows enough that the rest of your code actually references individual entities and properties, meaning you can't remove or rename things without considering these usages.

### Renaming existing tables and columns

When you would like to rename a table or a column, or even adjust the names of classes and properties, you should do so in code first. Use your IDE to rename all usages. In the case of class names, you should also rename the file and its imports. Once you’ve done so, you can then continue with the rest of the flow as shown above - create a migration in which you do the rename in the database, run it, and regenerate the entities. Try to rebuild your application immediately after entity regeneration. The old files (that you had edited manually) will be removed, but that is ok, because thanks to the migration, the new ones will now have the correct names already working with the rest of your application. It is possible that entity regeneration will reveal some relations which were also renamed, due to being named after the table/column that you renamed. In that event, your application will fail to build. You will want to restore your earlier entities from version control, and rename the affected relations, before regenerating the entities again, and trying to build again.

Note that with such database renames, any running application instance will break, since it will be referring to a now non-existent name. When running in production, you will want to avoid renames, and instead use the "expand, then contract" migration strategy.

### "Expand, then contract" migration strategy

The way "Expand, then contract" migration strategy works is that you have to do (in this order) the following:

1. Create the new table/column (as a migration + entity regeneration)
2. Make the new version of your app write to both the old and new table/column (in the same deploy as with step 1 if and only if you also execute migrations automatically on run; otherwise, ensure migration from step 1 is executed before app run)
3. Copy over old data from the old table/column into the new table/column (in a second migration that doesn't require entity regeneration or application code changes)
4. Refactor any reads from the old table/column to use the new table/column instead (ideally after old data is already migrated).
5. After ensuring any read references to the old table/column are gone, stop writing to the old table/column (deploy changed application code without related migrations).
6. After ensuring any read and write references to the old table/column are gone, remove the old table/column (as a final migration + entity regeneration).

Technically, you can also apply this strategy if you are using a "code first" approach, and in fact, you very much should. Failure to follow this strategy in a "code first" approach may lead to accidental data loss (unless you carefully review generated migrations), as well as downtime. Failure to follow this strategy in a "schema first" approach leads to downtime on production, and build errors during development.

### Naming strategy considerations

The names of your tables and properties don’t have to match exactly the names of classes and properties in your application code. This is what the entity generator does by default to minimize surprises, but you can override this.

Let's make it so that our tables use the plural form of words, while the entity class names will be singular. In the end, the application code will not need changes, because it is still referring to the singular word "article".

First, let's add the package [pluralize](https://www.npmjs.com/package/pluralize), to do the transformation between singular and plural forms automatically.

```bash npm2yarn
npm install --save-dev pluralize @types/pluralize
```

Next, let's add a migration to rename our tables:

```sh
npx mikro-orm-esm migration:create --blank
```

and in it,

```ts title='migrations/Migration00000000000001.ts'
import { Migration } from '@mikro-orm/migrations';

export class Migration00000000000001 extends Migration {
  async up(): Promise<void> {
    await this.execute(`
RENAME TABLE
    \`article\` TO \`articles\`,
    \`article_tag\` TO \`article_tags\`,
    \`tag\` TO \`tags\`,
    \`comment\` TO \`comments\`,
    \`user\` TO \`users\`
    `);
  }
  async down(): Promise<void> {
      await this.execute(`
RENAME TABLE
    \`articles\` TO \`article\`,
    \`article_tags\` TO \`article_tag\`,
    \`tags\` TO \`tag\`,
    \`comments\` TO \`comment\`,
    \`users\` TO \`user\`
    `);
  }
}
```

If you now just run the migration and regenerate, you will see your entities with plural form. To keep them in singular form, we can override the `getEntityName` method of the UnderscoreNamingStrategy (which is the default naming strategy).

```ts title='src/mikro-orm.config.ts'
import { UnderscoreNamingStrategy } from "@mikro-orm/core";
import pluralize from 'pluralize';
// rest of imports

export default defineConfig({
  // rest of the config
  namingStrategy: class extends UnderscoreNamingStrategy {
    override getEntityName(tableName: string, schemaName?: string): string {
      return pluralize.singular(super.getEntityName(tableName, schemaName));
    }
  },
  entityGenerator: {
    // rest of entity generator config
  }
});
```

With this addition, if you regenerate the entities now, the classes, and the respective file names will now still be in singular form, as they were before.

You may notice that the `tableName` option is also added to all entities. That is because there is a separate method in the naming strategy - `classToTableName` - about converting class names back to table names. The entity generator checks if this method produces the correct table, and if not, it adds the `tableName` option to ensure the correct table is used in the end. You may override the `classToTableName` method in the naming strategy if you wish to instead convert the singular form to plural automatically, and thus omit the `tableName` option once again. The entity generator will ensure that any errors made by "pluralize" would be mitigated by an explicit `tableName` entry. Alternatively, you may keep the `classToTableName` method to its default, and keep the `tableName` options around, to make your generated entities code searchable by the table names.

There's also the `columnNameToProperty` method, which, as the name suggests, tells the entity generator what property name to produce for a given column name. Similarly, there is `propertyToColumnName` that does the reverse. If there is a mismatch between the two, the options `fieldName` or `fieldNames` will be filled with the names of the columns.

## Adding application level logic to entities

While there is a lot you can do on DB schema level with foreign key relations, check constraints, unique indexes and generated columns, there are some things that can't be determined by the schema alone. At the same time, in a "schema first" approach, you have to keep your entities able to be regenerated at any time. To bridge the gap between these two seemingly conflicting goals, the entity generator has two callbacks that it calls during the entity generation process. In them, you can manipulate the entity metadata, which will in turn influence the generated code in the end. You should keep your modifications during those hooks as simple as possible, to keep your code as portable as possible.

The two configuration options are `onInitialMetadata` and `onProcessedMetadata`. The first is made immediately after getting the raw metadata from your database, and the second is run after the entity generator goes through all the things it normally infers automatically for you from that metadata. Things like M:N relations, inverse sides of relations, base class and more. You can think of `onInitialMetadata` as the place to opt into extra features, and `onProcessedMetadata` as the place to opt out of features that you were otherwise opted into.

If you went through the whole "code first" guide before, and now are going over through this guide, you may have noticed that we are missing a few things in the entity definitions. Let's add some of them.

First, let's make the "text" of the "article" be lazy. Also, let's make the "password" lazy too, as well as make it "hidden", to avoid accidentally leaking it in responses. We'll do that in the `onInitialMetadata` hook, though these changes in particular can be done in `onProcessedMetadata` just the same.

```ts title='src/mikro-orm.config.ts'
// rest of imports

export default defineConfig({
  // rest of the config
  entityGenerator: {
    onInitialMetadata: (metadata, platform) => {
      const userEntity = metadata.find(meta => meta.className === 'User');
      if (userEntity) {
        const passwordProp = userEntity.properties.password;
        passwordProp.hidden = true;
        passwordProp.lazy = true;
      }

      const articleEntity = metadata.find(meta => meta.className === 'Article');
      if (articleEntity) {
        const textProp = articleEntity.properties.text;
        textProp.lazy = true;
      }
    },
    // rest of entity generator config
  }
});
```

When it comes to handling the password hashing and verification, we could register global hooks to handle the password. That would be similar to what the "code first" guide does, except doing that would not be doing it at the entity, but globally. A current limitation of the entity generator is that you can't add hooks to the entity itself. However, there is an easy workaround that you may in fact find more convenient and ultimately less magical to work with - custom types. That is, we can define a custom type object for the password, which will let us verify the password and hash it automatically on writes.

Let's add this type, and make the password prop of the User entity use it. We'll use argon2 as the hashing function, so first, install it with

```bash npm2yarn
npm install argon2
```

The next step is to create the class that our DB value will be transformed to and from. Let's add it to the "users" module. We'll use the suffix "runtimeType" to make it clear this will be set as the runtime type at an entity. We'll also make the type automatically rehash the password on successful verification if needed.

```ts title="src/modules/user/password.runtimeType.ts
import { hash, verify, needsRehash, Options } from 'argon2';

const hashOptions: Options = {
  hashLength: 100
};

export class Password {
  static async fromRaw(raw: string): Promise<Password>
  {
      return new Password(await hash(raw, hashOptions));
  }

  static fromHash(hash: string): Password
  {
    return new Password(hash);
  }

  #hash: string;

  private constructor(hash: string) {
    this.#hash = hash;
  }

  verify(raw: string): Promise<boolean> {
    return verify(this.#hash, raw, hashOptions);
  }

  needsRehash(): boolean
  {
    return needsRehash(this.#hash, hashOptions);
  }

  async verifyAndMaybeRehash(raw: string): Promise<boolean> {
    const verifyResult = await this.verify(raw);
    if (verifyResult && this.needsRehash()) {
      this.#hash = await hash(raw, hashOptions);
    }
    return verifyResult;
  }
    
  toString() {
    return this.#hash;
  }
}
```

and then add the ORM custom type that does the transformation:

```ts title="src/modules/user/password.type.ts"
import { type Platform, type TransformContext, Type } from '@mikro-orm/core';
import { Password } from './password.runtimeType.js';

export class PasswordType extends Type<Password, string> {

  convertToJSValue(value: string, platform: Platform): Password {
    return Password.fromHash(value);
  }

  convertToDatabaseValue(value: Password, platform: Platform, context?: TransformContext): string {
    return `${value}`;
  }

  compareAsType() {
    return 'string';
  }

}
```

Now, let's modify our `fileName` and `onInitialMetadata` functions to recognize these two new files and associate the password with them.

```ts title='src/mikro-orm.config.ts'
// rest of imports

export default defineConfig({
  // rest of the config
  entityGenerator: {
    fileName: (entityName) => {
      switch (entityName) {
        case 'Article':
        case 'ArticleTag':
        case 'Tag':
        case 'Comment':
          return `article/${entityName.toLowerCase()}.entity`;
        case 'User':
          return `user/${entityName.toLowerCase()}.entity`;
        case 'Password':
          return `user/password.runtimeType`;
        case 'PasswordType':
          return `user/password.type`;
        default:
          return `common/${entityName.toLowerCase()}.entity`;
      }
    },
    onInitialMetadata: (metadata, platform) => {
      const userEntity = metadata.find(meta => meta.className === 'User');
      if (userEntity) {
        const passwordProp = userEntity.properties.password;
        passwordProp.hidden = true;
        passwordProp.lazy = true;
        passwordProp.type = 'PasswordType';
        passwordProp.runtimeType = 'Password';
      }

      const articleEntity = metadata.find(meta => meta.className === 'Article');
      if (articleEntity) {
        const textProp = articleEntity.properties.text;
        textProp.lazy = true;
      }
    },
    // rest of entity generator config
  }
});
```

After regeneration, you would be able to do the login in app.ts like so:

```ts title="src/app.ts"
import { RequestContext, EntityData } from '@mikro-orm/core';
import { fastify } from 'fastify';
import { initORM } from './db.js';
import { User } from './modules/user/user.entity.js';
import { Password } from './modules/user/password.runtimeType.js';

const emptyHash = await Password.fromRaw('');

//...

  // register new user
  app.post('/sign-up', async request => {
    const body = request.body as EntityData<User, true>;

    if (!body.email || !body.fullName || !body.password) {
      throw new Error('One of required fields is missing: email, fullName, password');
    }

    if ((await db.user.count({ email: body.email })) > 0) {
      throw new Error('This email is already registered, maybe you want to sign in?');
    }

    const user = db.user.create({
      fullName: body.fullName,
      email: body.email,
      password: await Password.fromRaw(body.password),
      bio: body.bio ?? '',
    });
    await db.em.persist(user).flush();

    // after flush, we have the `user.id` set
    console.log(`User ${user.id} created`);

    return user;
  });

  app.post('/sign-in', async request => {
    const { email, password } = request.body as { email: string; password: string };
    const err = new Error('Invalid combination of email and password');
    if (password === '' || email === '') {
      throw err;
    }

    const user = await db.user.findOne({ email }, {
      populate: ['password'], // password is a lazy property, we need to populate it
    })
      // On failure, we return a pseudo user with an empty password hash.
      // This approach minimizes the effectiveness of timing attacks
      ?? { password: emptyHash };

    if (await user.password.verifyAndMaybeRehash(password)) {
      await db.em.flush();
      return user;//password is a hidden property, so it won't be returned, even on success.
    }

    throw err;
  });
```

### Naming strategy vs metadata hooks

It may look like the naming strategy is a more specialized version of the metadata hooks, but there is also one critical difference between changing the name from one vs the other. With a naming strategy, all references are also updated with the new name. With a metadata hook, changing the "original" does not update any references to it. You may update the references yourself, but doing so is less efficient than just overriding the naming strategy.

But efficiency aside, this "loophole" can in fact be beneficial. We can use mapped superclasses. To do that, rename an entity via the application hooks, and then create a class with the original name, to take the place of the original class. The new "manual" class should inherit from the generated class.

This approach can be used to mitigate any shortcoming of the entity generator. Most notably, it is useful to create constructor functions and other helper methods, as the generator doesn’t give you any means to add such.

Let's extend the article in this fashion. First, let's adjust our config. We should use a different suffix from ".entity" for our custom entity class, so that we don't wipe it upon regeneration. We'll also need to recognize these new suffixes as entities too. Let's use the suffix ".customEntity". We'll also need to adjust the fileName to give the proper paths, and do the rename of the original "Article" entity to something else in `onInitialMetadata`. Let's say we'll make it a convention for this project to prefix such class names with "_".

```ts title='src/mikro-orm.config.ts'
// rest of imports

export default defineConfig({
  // rest of the config
  entities: ['dist/**/*.customEntity.js', 'dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.customEntity.ts', 'src/**/*.entity.ts'],
  // rest of the config
  entityGenerator: {
    fileName: (entityName) => {
      switch (entityName) {
        case '_Article':
          return `article/article.entity`;
        case 'Article':
          return `article/article.customEntity`;
        case 'ArticleTag':
        case 'Tag':
        case 'Comment':
          return `article/${entityName.toLowerCase()}.entity`;
        case 'User':
          return `user/${entityName.toLowerCase()}.entity`;
        case 'Password':
          return `user/password.runtimeType`;
        case 'PasswordType':
          return `user/password.type`;
        default:
          return `common/${entityName.toLowerCase()}.entity`;
      }
    },
    onInitialMetadata: (metadata, platform) => {
      const userEntity = metadata.find(meta => meta.className === 'User');
      if (userEntity) {
        const passwordProp = userEntity.properties.password;
        passwordProp.hidden = true;
        passwordProp.lazy = true;
        passwordProp.type = 'PasswordType';
        passwordProp.runtimeType = 'Password';
      }
      
      const articleEntity = metadata.find(meta => meta.className === 'Article');
      if (articleEntity) {
        articleEntity.className = '_Article';
        articleEntity.abstract = true;
        const textProp = articleEntity.properties.text;
        textProp.lazy = true;
      }
    },
    // rest of entity generator config
  }
});
```

And try to regenerate the entities... Oops, you'll crash the entity generator. What happened? The "Article" entity is involved in a M:N relationship, and upon trying to connect it on the Users end, it was not found, which is not OK. This is now a case where we need to bring in `onProcessedMetadata`, so that we only swap our the class after the M:N disocvery has already happened.

Change the config to:

```ts title='src/mikro-orm.config.ts'
// rest of imports

export default defineConfig({
  // rest of the config
  entities: ['dist/**/*.entity.js', 'dist/**/*.customEntity.js'],
  entitiesTs: ['src/**/*.entity.ts', 'src/**/*.customEntity.ts'],
  // rest of the config
  entityGenerator: {
    fileName: (entityName) => {
      switch (entityName) {
        case '_Article':
          return `article/article.entity`;
        case 'Article':
          return `article/article.customEntity`;
        case 'ArticleTag':
        case 'Tag':
        case 'Comment':
          return `article/${entityName.toLowerCase()}.entity`;
        case 'User':
          return `user/${entityName.toLowerCase()}.entity`;
        case 'Password':
          return `user/password.runtimeType`;
        case 'PasswordType':
          return `user/password.type`;
        default:
          return `common/${entityName.toLowerCase()}.entity`;
      }
    },
    onInitialMetadata: (metadata, platform) => {
      const userEntity = metadata.find(meta => meta.className === 'User');
      if (userEntity) {
        const passwordProp = userEntity.properties.password;
        passwordProp.hidden = true;
        passwordProp.lazy = true;
        passwordProp.type = 'PasswordType';
        passwordProp.runtimeType = 'Password';
      }
      
      const articleEntity = metadata.find(meta => meta.className === 'Article');
      if (articleEntity) {
        const textProp = articleEntity.properties.text;
        textProp.lazy = true;
      }
    },
    onProcessedMetadata: (metadata, platform) => {
      const articleEntity = metadata.find(meta => meta.className === 'Article');
      if (articleEntity) {
        articleEntity.className = '_Article';
        articleEntity.abstract = true;
      }
    },
    // rest of entity generator config
  }
});
```

Regenerating the entities should now work. However, the code doesn't build for now.

To fix this, first, let's add the actual custom entity class. We'll add a slug function as part of the custom constructor.

```ts title="src/modules/article/article.customEntity.ts"
import { Entity, type Rel } from '@mikro-orm/core';
import { _Article } from './article.entity.js';
import { User } from '../user/user.entity.js';

function convertToSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

@Entity({ tableName: 'articles' })
export class Article extends _Article {

  constructor(title: string, text: string, author: Rel<User>) {
    super();
    this.title = title;
    this.text = text;
    this.author = author;
    this.slug = convertToSlug(title);
    this.description = this.text.substring(0, 999) + '…';
  }

}
```

And finally, let's edit "db.ts" to reference the proper import. The top should read:

```diff title="src/db.ts"
import {
    type EntityManager,
    type EntityRepository,
    MikroORM,
    type Options
  } from "@mikro-orm/mysql";
  import config from "./mikro-orm.config.js";
-  import { Article } from "./modules/article/article.entity.js";
+  import { Article } from "./modules/article/article.customEntity.js";
  import { Tag } from "./modules/article/tag.entity.js";
  import { User } from "./modules/user/user.entity.js";
  import { Comment } from "./modules/article/comment.entity.js";
```

However, this approach is one you may want to avoid in a "schema first" flow, because your custom class is now outside the entity generator's reach. Renaming the database table requires the extra step of renaming the tableName option in the custom class. Changing any property used in the constructor may break builds. In other words, the custom class requires the same care as the rest of your application code does when it accesses entity classes and properties.

Custom types, like what we did for the password, are also technically outside the entity generator's reach. However, they’re self-contained - they can still exist even if the entity changes shape entirely, and the entity may have a custom type swapped out during a regeneration.

Since we did introduce this in our code base though, we shold also address another problem this creates. Try to regenerate the entities again. You will notice there's now an error. The error happens because MikroORM is trying to import the ".customEntity" files, but that file can't run without the generated entity already being present. To fix the problem, we'll need to rename our overrides before regeneration (so that MikroORM doesn't recognize them during entity generation), and restore their names after regeneration.

To do this, install renamer:

```bash npm2yarn
npm install --save-dev renamer
```

and adjust the `regen` script to:

```json title="package.json"
    "regen": "rimraf -g ./src/**/*.entity.ts && renamer --silent --find /\\.customEntity\\.ts$/ --replace .customEntity.ts.bak ./src/** && mikro-orm-esm generate-entities --save && renamer --silent --find /\\.customEntity\\.ts\\.bak$/ --replace .customEntity.ts ./src/**",
```

### Adding virtual properties

Let's continue re-implementing more of the "code first" guide's application. We'll add JWT authentication to our endpoints, in a similar fashion to the way the "code first" guide does it - via a virtual property that holds the user's JWT.

First, let's add the property. Inside `onInitialMetadata`, for the user entity, we need to call the `addProperty()` method with an object representing the new property. The entity generator is optimized to work with objects that are pre-filled with the entire database metadata, and does very few checks for custom properties. So to ensure the generator doesn't crash, we should include the same type of information as if this was a real column, but with the added "persist" option set to "false". In our case, a nullable `varchar(255)` column mapped to a regular string type is what we need.

```ts title='src/mikro-orm.config.ts'
      const userEntity = metadata.find(meta => meta.className === 'User');
      if (userEntity) {
        userEntity.addProperty({
          persist: false,
          name: 'token',
          nullable: true,
          default: null,
          defaultRaw: 'null',
          fieldNames: [platform.getConfig().getNamingStrategy().propertyToColumnName('token')],
          columnTypes: ['varchar(255)'],
          type: 'string',
          runtimeType: 'string',
        });
        const passwordProp = userEntity.properties.password;
        passwordProp.hidden = true;
        passwordProp.lazy = true;
        passwordProp.type = 'PasswordType';
        passwordProp.runtimeType = 'Password';
      }
```

Regenerating the entities now will add this property in the entity. You don't even need to perform a migration here, since there is no "real" database change involved. From here, we still need to do the same things we had to do in the "code first" guide.

Install fastify JWT:

```bash npm2yarn
npm install @fastify/jwt
```

Then register it at the top of app.ts, and add jwt verify request hook after the ORM hook (to enable JWT verification to use the DB):

```ts title="src/app.ts"
import fastifyJWT from '@fastify/jwt';

// ...

const app = fastify();

// register JWT plugin
app.register(fastifyJWT, {
  secret: process.env.JWT_SECRET ?? '12345678', // fallback for testing
});

// register request context hook
app.addHook('onRequest', (request, reply, done) => {
    RequestContext.create(db.em, done);
});

// register auth hook after the ORM one to use the context
app.addHook('onRequest', async (request) => {
  try {
    const ret = await request.jwtVerify<{ id: number }>();
    request.user = await db.user.findOneOrFail(ret.id);
  } catch (e) {
    app.log.error(e);
    // ignore token errors, we validate the request.user exists only where needed
  }
});

// ...
```

And also add JWT signing to the login and register endpoints, to enable the client to see the signed JWT:

```ts title="src/app.ts"
// ...
  app.post('/sign-up', async request => {
    // ...
    await db.em.persist(user).flush();
  
    // after flush, we have the `user.id` set
    console.log(`User ${user.id} created`);
    
    user.token = app.jwt.sign({ id: user.id });
  
    return user;
  });

  app.post('/sign-in', async request => {
    // ...
    const user = await db.user.findOne({ email }, {
        populate: ['password'], // password is a lazy property, we need to populate it
      })
      // On failure, we return a pseudo user with an empty password hash.
      // This approach minimizes the effectiveness of timing attacks
      ?? { password: emptyHash, id: 0, token: undefined };

    if (await user.password.verifyAndMaybeRehash(password)) {
      await db.em.flush();
      user.token = app.jwt.sign({ id: user.id });
      return user;
    }

    throw err;
  });
```

And let's also now add a "/profile" endpoint, to show us the user currently logged in:

```ts title="src/app.ts"
app.get('/profile', async request => {
  if (!request.user) {
    throw new Error('Please provide your token via Authorization header');
  }

  return request.user as User;
});
```

## ⛳ Checkpoint 2

Our application now has JWT authentication and profile view. Meanwhile, we also did a full DB change cycle. Before we move onto more entity generation features, let's do some refactoring to make the big app.ts file more manageable, and add some tests. This will make the final version of our application, complete with its additional features, easier to reason about.

If you wanted to "manually" verify the application at this stage, you would need to issue the POST requests using curl, Postman or other similar tools. Or alternatively, use fetch() from a browser console or a separate Node REPL.

Like to register:
```js
await fetch(new Request('/sign-up', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: JSON.stringify({
    fullName: 'test',
    email: 'test@example.com',
    password: '1234'
  })
}));
```

and then to login:

```js
await fetch(new Request('/sign-in', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: '1234'
  })
}));
```

## Application refactor

### Move routes into the modules

Let's first move the routes in app.ts into the appropriate module folders, and connect them back with app.ts.

For each `*.routes.ts` file, we'll export a fastify async plugin, and register our routes. Each route file will be imported with a prefix, to allow them to define whatever routes they like, without conflicting with other `*.routes.ts` files.

Our basic boilerplate for `*.routes.ts` files:

```ts
import { type FastifyPluginAsync } from 'fastify';
import { type Services } from '../../db.js';

export default (async (app, { db }) => {
  //routes here
}) as FastifyPluginAsync<{ db: Services }>;
```

And specifically:

```ts title="src/modules/user/user.routes.ts"
import { type FastifyPluginAsync } from 'fastify';
import { type Services } from '../../db.js';
import { User } from './user.entity.js';
import { Password } from './password.runtimeType.js';
import { type EntityData } from '@mikro-orm/mysql';

const emptyHash = await Password.fromRaw('');

export default (async (app, { db }) => {

  // register new user
  app.post('/sign-up', async request => {
    const body = request.body as EntityData<User, true>;

    if (!body.email || !body.fullName || !body.password) {
      throw new Error('One of required fields is missing: email, fullName, password');
    }

    if ((await db.user.count({ email: body.email })) > 0) {
      throw new Error('This email is already registered, maybe you want to sign in?');
    }

    const user = db.user.create({
      fullName: body.fullName,
      email: body.email,
      password: await Password.fromRaw(body.password),
      bio: body.bio ?? '',
    });
    await db.em.persist(user).flush();

    // after flush, we have the `user.id` set
    console.log(`User ${user.id} created`);

    user.token = app.jwt.sign({ id: user.id });

    return user;
  });

  app.post('/sign-in', async request => {
    const { email, password } = request.body as { email: string; password: string };
    const err = new Error('Invalid combination of email and password');
    if (password === '' || email === '') {
      throw err;
    }

    const user = await db.user.findOne({ email }, {
        populate: ['password'], // password is a lazy property, we need to populate it
      })
      // On failure, we return a pseudo user with an empty password hash.
      // This approach minimizes the effectiveness of timing attacks
      ?? { password: emptyHash, id: 0, token: undefined };

    if (await user.password.verifyAndMaybeRehash(password)) {
      await db.em.flush();
      user.token = app.jwt.sign({ id: user.id });
      return user;//password is a hidden property, so it won't be returned, even on success.
    }

    throw err;
  });

  app.get('/profile', async request => {
    if (!request.user) {
      throw new Error('Please provide your token via Authorization header');
    }

    return request.user as User;
  });
}) as FastifyPluginAsync<{ db: Services }>;
```

and also

```ts title="src/modules/article/article.routes.ts"
import { type FastifyPluginAsync } from 'fastify';
import { type Services } from '../../db.js';

export default (async (app, { db }) => {
  app.get('/', async (request) => {
    const { limit, offset } = request.query as {
      limit?: number;
      offset?: number;
    };
    const [items, total] = await db.article.findAndCount(
      {},
      {
        limit,
        offset,
      }
    );

    return { items, total };
  });
}) as FastifyPluginAsync<{ db: Services }>;
```

and let's also move out the hooks too. These would require we wrap them with `fastify-plugin` instead, since we want these hooks across all prefixes.

```ts title="src/modules/common/hooks.ts"
import { fastifyPlugin } from 'fastify-plugin';
import { type Services } from '../../db.js';
import { RequestContext } from '@mikro-orm/mysql';

export default fastifyPlugin<{db: Services}>(async (app, { db }) => {

  // register request context hook
  app.addHook('onRequest', (request, reply, done) => {
    RequestContext.create(db.em, done);
  });

  // register auth hook after the ORM one to use the context
  app.addHook('onRequest', async (request) => {
    try {
      const ret = await request.jwtVerify<{ id: number }>();
      request.user = await db.user.findOneOrFail(ret.id);
    } catch (e) {
      app.log.error(e);
      // ignore token errors, we validate the request.user exists only where needed
    }
  });

  // shut down the connection when closing the app
  app.addHook('onClose', async () => {
    await db.orm.close();
  });

});
```

Which leaves our app.ts like:

```ts title="src/app.ts"
import { fastify } from 'fastify';
import fastifyJWT from '@fastify/jwt';
import { initORM } from './db.js';
import hooks from './modules/common/hooks.js';
import userRoutes from './modules/user/user.routes.js';
import articleRoutes from './modules/article/article.routes.js';

export async function bootstrap(port = 3001, migrate = true) {
  const db = await initORM({
      ensureDatabase: { create: false },
  });

  if (migrate) {
    // sync the schema
    await db.orm.migrator.up();
  }

  const app = fastify();

  // register JWT plugin
  app.register(fastifyJWT, {
    secret: process.env.JWT_SECRET ?? '12345678', // fallback for testing
  });

  await app.register(hooks, { db });

  // register routes here
  app.register(articleRoutes, { db, prefix: 'article' });
  app.register(userRoutes, { db, prefix: 'user' });

  const url = await app.listen({ port });

  return { app, url };
}
```

which is much nicer. Our URL endpoints are now "/article", "/user/sign-up", "/user/sign-in", "/user/profile".

### Making the config env dependent

We mentioned earlier that you could split your config files if you need tool-specific configs. However, more generally, you will at least want a dev vs prod config, with "dev" basically being "when running the MikroORM CLI", while "prod" would basically be "when the application is running".

We can detect whether we're running in the MikroORM CLI based on the arguments, and act accordingly.

And although we don't _require_ a tool-specific config, there is one annoying thing about entity generation that we can tackle with a config adjustment specifically to the entity generator. Because of the renames that we have to do for our entity regeneration after our mapped superclass was introduced, you may have seen your IDE fail to recognize the mapped superclass. And it stays like that until you restart your IDE's typescript server, or cut and paste the mapped superclass reference to force a re-check. We can avoid this annoyance by adjusting our config to not feature the entities at all, but only when running the regenerate-entities command from the MikroORM CLI.

```ts title='src/mikro-orm.config.ts'
import {
    defineConfig,
    type MikroORMOptions,
} from '@mikro-orm/mysql';
import { UnderscoreNamingStrategy } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import pluralize from 'pluralize';
import { join } from 'node:path';

const isInMikroOrmCli = process.argv[1]?.endsWith(join('@mikro-orm', 'cli', 'esm')) ?? false;
const isRunningGenerateEntities = isInMikroOrmCli && process.argv[2] === 'generate-entities';

const mikroOrmExtensions: MikroORMOptions['extensions'] = [Migrator];
if (isInMikroOrmCli) {
    mikroOrmExtensions.push((await import('@mikro-orm/entity-generator')).EntityGenerator);
}

export default defineConfig({
  extensions: mikroOrmExtensions,
  multipleStatements: isInMikroOrmCli,
  discovery: {
    warnWhenNoEntities: !isInMikroOrmCli,
  },
  entities: isRunningGenerateEntities ? [] : ['dist/**/*.customEntity.js', 'dist/**/*.entity.js'],
  entitiesTs: isRunningGenerateEntities ? [] : ['src/**/*.customEntity.ts', 'src/**/*.entity.ts'],
  // rest of the config
});
```

And with that in place, we can revert the changes we made before to the entity generation process, i.e.

```diff title="package.json"
-  "regen": "rimraf -g ./src/**/*.entity.ts && renamer --silent --find /\\.customEntity\\.ts$/ --replace .customEntity.ts.bak ./src/** && npx mikro-orm-esm generate-entities --save && renamer --silent --find /\\.customEntity\\.ts\\.bak$/ --replace .customEntity.ts ./src/**",
+  "regen": "rimraf -g ./src/**/*.entity.ts && npx mikro-orm-esm generate-entities --save",
```

and

```bash npm2yarn
npm uninstall renamer
```

We should further make it so that migrations run in a separate connection where `multipleStatements` is enabled, while it is disabled for everything else, for the sake of security.

Let's make app.ts be like:

```ts title="src/app.ts"
import { fastify } from 'fastify';
import fastifyJWT from '@fastify/jwt';
import { initORM } from './db.js';
import hooks from './modules/common/hooks.js';
import userRoutes from './modules/user/user.routes.js';
import articleRoutes from './modules/article/article.routes.js';

export async function bootstrap(port = 3001, migrate = true) {
  const db = await initORM(migrate ? { multipleStatements: true, ensureDatabase: { create: false } } : {});

  if (migrate) {
    // sync the schema
    await db.orm.migrator.up();
    await db.orm.reconnect({ multipleStatements: false });
  }

  const app = fastify();

  // register JWT plugin
  await app.register(fastifyJWT, {
    secret: process.env.JWT_SECRET ?? '12345678', // fallback for testing
  });

  await app.register(hooks, { db });

  // register routes here
  app.register(articleRoutes, { db, prefix: 'article' });
  app.register(userRoutes, { db, prefix: 'user' });

  const url = await app.listen({ port });

  return { app, url };
}
```

### Testing the endpoints

So far, when we've checked the resulting app, we've been doing so "manually". Let's add some tests, so that we can repeatedly check that everything is working as we make further changes and additions.

In a "code first" approach, you can let the schema generator create the test database's schema for you, based on your entity definitions. While you _could_ do the same in a "schema first" approach, if your database schema is sufficiently complex, you may end up in a situation where the schema generator will produce something slightly different from your true schema (which may be because of bugs originating in the entity generator not producing the correct/complete code, or because your schema includes features that MikroORM does not track yet in general, like triggers and routines), which will in turn make your test results be off, particularly when said differences are being relied on by your application. The best way to avoid issues like this is to simply run your migrations at the start of the test suite. If you have too many migrations, you may consider occasionally doing a database DDL dump using a tool native to your database engine (e.g. "mysqldump" in the case of MySQL) + a data dump of the MikroORM migrations table. Then execute these before running the rest of the migrations that were created after that dump.

To keep this guide simple, we will just run the migrations.

Let's create a test util to init our test database:

```ts title="test/utils.ts"
import { bootstrap } from '../src/app.js';
import { initORM } from '../src/db.js';

export async function initTestApp(port: number) {
  // this will create all the ORM services and cache them
  await initORM({
    // no need for debug information, it would only pollute the logs
    debug: false,
    // we will use a dynamic name, based on port. This way we can easily parallelize our tests
    dbName: `blog_test_${port}`,
    // create the schema so we can use the database
    ensureDatabase: { create: false },
    // required for the migrations
    multipleStatements: true,
  });

  const { app } = await bootstrap(port);

  return app;
}
```

and add a test for our "/article" endpoint:

```ts title="test/article.test.ts"
import { afterAll, beforeAll, expect, test } from 'vitest';
import { FastifyInstance } from 'fastify';
import { initTestApp } from './utils.js';

let app: FastifyInstance;

beforeAll(async () => {
  // we use different ports to allow parallel testing
  app = await initTestApp(30001);
});

afterAll(async () => {
  // we close only the fastify app - it will close the database connection via onClose hook automatically
  await app.close();
});

test('list all articles', async () => {
  // mimic the http request via `app.inject()`
  const res = await app.inject({
    method: 'get',
    url: '/article',
  });

  // assert it was successful response
  expect(res.statusCode).toBe(200);

  // with expected shape
  expect(res.json()).toMatchObject({
    items: [],
    total: 0,
  });
});
```

If you've previously gone through the "code first" guide, you know this breaks with the error message like

```
FAIL  test/article.test.ts [ test/article.test.ts ]
TypeError: Unknown file extension ".ts" for /blog-api/src/modules/article/article.entity.ts
```

and to fix it, we need to adjust the config to add a dynamic import:
```diff title="test/utils.ts"
import { bootstrap } from '../src/app.js';
import { initORM } from '../src/db.js';

export async function initTestApp(port: number) {
  // this will create all the ORM services and cache them
  await initORM({
    // no need for debug information, it would only pollute the logs
    debug: false,
    // we will use a dynamic name, based on port. This way we can easily parallelize our tests
    dbName: `blog_test_${port}`,
    // create the schema so we can use the database
    ensureDatabase: { create: false },
    // required for the migrations
    multipleStatements: true,
+    // required for vitest
+    dynamicImportProvider: id => import(id),
  });

  const { app } = await bootstrap(port);

  return app;
}
```

And now, trying to run it again... you should see a different error:

```
Error: Please provide either 'type' or 'entity' attribute in User.id. If you are using decorators, ensure you have 'emitDecoratorMetadata' enabled in your tsconfig.json.
```

But we did add `emitDecoratorMetadata` in our `tsconfig.json`, right? Yes, but vitest uses ESBuild to transpile the sources, and ESBuild doesn’t support this out of the box. There are several solutions to this problem. We may either

1. Use `@mikro-orm/reflection` to analyze the sources in a different fashion that doesn't rely on `emitDecoratorMetadata`.
2. Swap out ESBuild for SWC, and [configure SWC to support decorators](./usage-with-transpilers.md#swc).
3. Install `@anatine/esbuild-decorators` and add it to the vitest config.
4. Adjust the entity generator to always output the "type" property, thus bypassing the need to infer the type in the first place.

Option 1 is what the "code first" guide does, and that is a great solution if you are writing the entity definitions manually. Options 2 and 3 are a different alternative you may go for if you need `emitDecoratorMetadata` for other purposes as well. For this guide, we'll go with option 4, because it is the easiest to do.

Add to your config

```ts title='src/mikro-orm.config.ts'
  entityGenerator: {
    scalarTypeInDecorator: true,
    // rest of entity generator config
  }
```

and regenerate the entities. You can now run the test without an error. You may also remove `emitDecoratorMetadata` from `tsconfig.json` at this point, unless you need it for another library.

Now that we have the article test working, let's also add tests for the user endpoint. We'll register a user, try to login with them, see their profile, and remove the user at the end, to keep the test repeatable.

```ts title="test/user.test.ts"
import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { initTestApp } from './utils.js';
import { EntityData } from '@mikro-orm/core';
import { User } from '../src/modules/user/user.entity.js';
import { initORM } from '../src/db.js';

let app: FastifyInstance;

beforeAll(async () => {
  // we use different ports to allow parallel testing
  app = await initTestApp(30002);
});

afterAll(async () => {
  const db = await initORM();
  try {
    const fork = db.em.fork();
    await fork.removeAndFlush(await fork.findOneOrFail(User, { email: 'foo@bar.com' }));
  } catch (e: unknown) {
    console.error(e);
  }
  // we close only the fastify app - it will close the database connection via onClose hook automatically
  await app.close();
});

test('full flow', async () => {
  const res1 = await app.inject({
    method: 'post',
    url: '/user/sign-up',
    payload: {
      fullName: 'Foo Bar',
      email: 'foo@bar.com',
      password: 'password123',
    },
  });

  expect(res1.statusCode).toBe(200);
  expect(res1.json()).toMatchObject({
    fullName: 'Foo Bar',
  });

  const res1dup = await app.inject({
      method: 'post',
      url: '/user/sign-up',
      payload: {
          fullName: 'Foo Bar',
          email: 'foo@bar.com',
          password: 'password123',
      },
  });

  expect(res1dup.statusCode).toBe(500);
  expect(res1dup.json()).toMatchObject({
    message: 'This email is already registered, maybe you want to sign in?',
  });

  const res2 = await app.inject({
    method: 'post',
    url: '/user/sign-in',
    payload: {
      email: 'foo@bar.com',
      password: 'password123',
    },
  });

  expect(res2.statusCode).toBe(200);
  expect(res2.json()).toMatchObject({
    fullName: 'Foo Bar',
  });

  const res3 = await app.inject({
    method: 'post',
    url: '/user/sign-in',
    payload: {
      email: 'foo@bar.com',
      password: 'password456',
    },
  });

  expect(res3.statusCode).toBe(500);
  expect(res3.json()).toMatchObject({ message: 'Invalid combination of email and password' });

  const res4 = await app.inject({
    method: 'get',
    url: '/user/profile',
    headers: {
        'Authorization': `Bearer ${res2.json().token}`
    }
  });
  expect(res4.statusCode).toBe(200);
  expect(res2.json()).toMatchObject(res4.json());
});
```

This test should also pass with no errors. If all is good, we can move on to a few more application refactorings.

### Adding better error handling

Let's adjust the application so that it returns appropriate status codes, rather than just show status code 500 on any error. Add a dedicated error class file. As our own convention, let's say we'll be placing custom error classes in files with ".error.ts" suffix. There is no technical reason for this. It's purely organizational.

```ts title="src/modules/common/auth.error.ts"
export class AuthError extends Error {}
```

And then let's make it so that we return status 401 for this error. Add this handler to `hooks.ts`:

```ts title="src/modules/common/hooks.ts"
import { fastifyPlugin } from 'fastify-plugin';
import { type Services } from '../../db.js';
import { NotFoundError, RequestContext } from '@mikro-orm/mysql';
import { AuthError } from './auth.error.js';

export default fastifyPlugin<{db: Services}>(async (app, { db }) => {

  // rest of the code

  // register global error handler to process 404 errors from `findOneOrFail` calls
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AuthError) {
      return reply.status(401).send(error);
    }

    // we also handle not found errors automatically
    // `NotFoundError` is an error thrown by the ORM via `em.findOneOrFail()` method
    if (error instanceof NotFoundError) {
      return reply.status(404).send(error);
    }

    app.log.error(error);
    reply.status(500).send(error);
  }); 
});
```

And finally, let's actually throw that error on auth failures. Modify `user.routes.ts`:

```diff title="src/modules/user.routes.ts"
...
import { type EntityData } from '@mikro-orm/mysql';
+ import { AuthError } from '../common/auth.error.js';
...
    app.post('/sign-in', async request => {
      const { email, password } = request.body as { email: string; password: string };
-      const err = new Error('Invalid combination of email and password');
+      const err = new AuthError('Invalid combination of email and password');
...
    app.get('/profile', async request => {
      if (!request.user) {
-          throw new Error('Please provide your token via Authorization header');
+          throw new AuthError('Please provide your token via Authorization header');
      }
...
```

If you try to re-run the tests now, you should see a test failure at the status code check. Let's modify the test too, to reflect our new intended behavior:

```diff title="test/user.test.ts"
-  expect(res3.statusCode).toBe(500);
+  expect(res3.statusCode).toBe(401);
```

And now, the test passes again.

### Adding repositories

Let's move some of the user logic into a custom repository. First, let's define the repository. We'll include a method to check if an email exists, and to login users:

```ts title="src/modules/user/user.repository.ts"
import { EntityRepository } from '@mikro-orm/mysql';
import { User } from './user.entity.js';
import { AuthError } from '../common/auth.error.js';
import { Password } from './password.runtimeType.js';

const emptyHash = await Password.fromRaw('');

export class UserRepository extends EntityRepository<User> {

  async exists(email: string) {
    return (await this.count({ email })) > 0;
  }

  async login(email: string, password: string) {
    const err = new AuthError('Invalid combination of email and password');
    if (password === '' || email === '') {
      throw err;
    }

    const user = await this.findOne({ email }, {
        populate: ['password'], // password is a lazy property, we need to populate it
      })
      // On failure, we return a pseudo user with an empty password hash.
      // This approach minimizes the effectiveness of timing attacks
      ?? { password: emptyHash, id: 0, token: undefined };

    if (await user.password.verifyAndMaybeRehash(password)) {
      await this.getEntityManager().flush();
      return user;//password is a hidden property, so it won't be returned, even on success.
    }

    throw err;
  }
}
```

Next, we'll need to associate this repository with the user entity on the entity's side. To do that in a "schema first" approach, you need to fill in the `repositoryClass` property in extension hooks.

```diff title="src/mikro-orm.config.ts"
+          case 'UserRepository':
+              return `user/user.repository`;
          case 'User':
              return `user/${entityName.toLowerCase()}.entity`;
...
          const userEntity = metadata.find(meta => meta.className === 'User');
          if (userEntity) {
+            userEntity.repositoryClass = 'UserRepository';
...
```

and regenerate the entities.

The entity's options will now include a factory for the repository class, as well as a TypeScript hint. To use the custom repository class when available, and fallback to the default ones when not, we should modify our database wrapper to use the `GetRepository` type, like so:

```diff title="src/db.ts"
import {
    type EntityManager,
    type EntityRepository,
+    type GetRepository,
    MikroORM,
    type Options
  } from "@mikro-orm/mysql";
...

  export interface Services {
    orm: MikroORM;
    em: EntityManager;
-    user: EntityRepository<User>;
-    article: EntityRepository<Article>;
-    tag: EntityRepository<Tag>;
-    comment: EntityRepository<Comment>;
+    user: GetRepository<User, EntityRepository<User>>;
+    article: GetRepository<Article, EntityRepository<Article>>;
+    tag: GetRepository<Tag, EntityRepository<Tag>>;
+    comment: GetRepository<Comment, EntityRepository<Comment>>;
  }
...
```

The second type argument to the `GetRepository` type is a fallback class, in case the entity does not define a type hint. That fallback should match the class defined in the config as a default repository. We're using MikroORM's default, so we're just specifying that.

Now that we have the repository defined and available, we can use it in `user.routes.ts`, like so:

```diff title="src/modules/user/user.routes.ts"
...
-const emptyHash = await Password.fromRaw('');
...
    app.post('/sign-up', async request => {
      const body = request.body as EntityData<User, true>;
  
      if (!body.email || !body.fullName || !body.password) {
        throw new Error('One of required fields is missing: email, fullName, password');
      }
  
-      if ((await db.user.count({ email: body.email })) > 0) {
+      if (await db.user.exists(body.email)) {
        throw new Error('This email is already registered, maybe you want to sign in?');
      }
...
    app.post('/sign-in', async request => {
      const { email, password } = request.body as { email: string; password: string };
-      const err = new AuthError('Invalid combination of email and password');
-      if (password === '' || email === '') {
-        throw err;
-      }
-  
-      const user = await db.user.findOne({ email }, {
-        populate: ['password'], // password is a lazy property, we need to populate it
-      })
-        // On failure, we return a pseudo user with an empty password hash.
-        // This approach minimizes the effectiveness of timing attacks
-        ?? { password: emptyHash, id: 0, token: undefined };
-  
-      if (await user.password.verifyAndMaybeRehash(password)) {
-        await db.em.flush();
-        user.token = app.jwt.sign({ id: user.id });
-        return user;//password is a hidden property, so it won't be returned, even on success.
-      }
-  
-      throw err;
+      const user = await db.user.login(email, password);
+      user.token = app.jwt.sign({ id: user.id });
+      return user;
    });
```

### Adding input runtime validation via Zod

Every time we do `as` on something from `request`, we are effectively telling TypeScript we know what the user input will be shaped like. In reality, nothing is stopping the user from submitting something not comforming to that shape, or not even inputting JSON in the first place. We should validate all user input (which in our case means anything from "request") before passing it further along in our logic. One good way to do that is using Zod. Let's add such validation.

Install Zod:

```bash npm2yarn
npm install zod
```

First off, let's deal with the sign-in endpoint.

```diff title="src/modules/user.routes.ts"
...
+import { z } from 'zod';
+
...
+    const signInPayload = z.object({
+      email: z.string().min(1),
+      password: z.string().min(1),
+    });
+
    app.post('/sign-in', async request => {
-      const { email, password } = request.body as { email: string; password: string };
+      const { email, password } = signInPayload.parse(request.body);
...
```

Zod includes a validator for syntax validity of email, but we don't need it during sign-in. As long as the email is not empty, we can search it. If the email is not valid, it won't exist in the database to begin with. We'll make sure of that during the sign-up. Let's do that now, and while we're at it, let's automatically hash the password after validation, to simplify the call to the `create()` method:

```diff title="src/modules/user.routes.ts"
...
+  const signUpPayload = z.object({
+    email: z.string().email(),
+    password: z
+      .string()
+      .min(1)
+      .transform(async (raw) => Password.fromRaw(raw)),
+    fullName: z.string().min(1),
+    bio: z.string().optional().default(''),
+  });
+
  app.post('/sign-up', async request => {
-    const body = request.body as EntityData<User, true>;
-
-    if (!body.email || !body.fullName || !body.password) {
-      throw new Error('One of required fields is missing: email, fullName, password');
-    }
-
-    if ((await db.user.count({ email: body.email })) > 0) {
-      throw new Error('This email is already registered, maybe you want to sign in?');
-    }
-
-    const user = db.user.create({
-      fullName: body.fullName,
-      email: body.email,
-      password: await Password.fromRaw(body.password),
-      bio: body.bio ?? '',
-    });
+    const body = await signUpPayload.parseAsync(request.body);
+
+    if (await db.user.exists(body.email)) {
+      throw new Error('This email is already registered, maybe you want to sign in?');
+    }
+
+    const user = db.user.create(body);
...
```

You could add a check constraint for that instead (or in addition to Zod), but the check constraint would be applied later, after we spend time to hash the new password. To save time and server resources on long creation procedures like that, you should include as much validation as you can, as early as you can, like we did here.

Finally, let's add some validation for the query string in `article.routes.ts`. Unlike our sign-up and sign-in validator, there's a high chance we'll want to do paging in multiple places (e.g. in a list of users), so we should define our validator in a dedicated file.

```ts title="src/common/validators.ts"
import { z } from 'zod';

export const pagingParams = z.object({
    limit: z.number().int().positive().optional(),
    offset: z.number().int().nonnegative().optional(),
});
```

And now let's use it at the "/article" endpoint:

```diff title="src/modules/article/article.routes.ts"
import { type Services } from '../../db.js';
+import { pagingParams } from '../common/validators.js';
export default (async (app, { db }) => {
  app.get('/', async (request) => {
-    const { limit, offset } = request.query as {
-      limit?: number;
-      offset?: number;
-    };
+    const { limit, offset } = pagingParams.parse(request.query);
...
```

## Making backwards compatible changes to the database

Near the end there, you may have noticed that we still had to check whether the user's email exists before adding them to the database. On a busy server however, it's possible for a user to be added right in between our check and the flush of the new user. Further, if we had many users, we would need to do a linear search on the table, as there's no index on the email column. We can add one, and we should make it unique to prevent double insertion on a busy server.

Let's try to generate a new migration for that.

```ts title="src/migrations/Migration00000000000002.ts"
import { Migration } from '@mikro-orm/migrations';

export class Migration00000000000002 extends Migration {

  async up(): Promise<void> {
    await this.execute(`
      ALTER TABLE \`blog\`.\`users\` 
        ADD UNIQUE INDEX \`email_UNIQUE\` (\`email\` ASC) VISIBLE;
    `);
  }

  async down(): Promise<void> {
    await this.execute(`
      ALTER TABLE \`blog\`.\`users\` 
        DROP INDEX \`email_UNIQUE\` ;
    `);
  }

}
```

Because this migration is fully backwards compatible, and we are automatically running migrations during startup, we could deploy our code without regenerating the entities even. However, we should do that anyway, since the entity definitions have changed as a result of this.

After this migration is executed, we may now output a custom error when that unique constraint is violated. Note that we should still keep the application level check, performed before the `create` attempt. Attempting to insert will consume the auto increment ID even on unique constraint violations, so to prevent its early exhaustion, we should check in advance as well.

Let's add that custom error class first:

```ts title="src/modules/user/duplicate.error.ts"
export class DuplicateUserError extends Error {}
```

And then wrap violations of the unique constraint on sign-up:

```diff title="src/modules/user/user.routes.ts"
...
+import { DuplicateUserError } from './duplicate.error.js';
...

  // register new user
  app.post('/sign-up', async request => {
    const body = await signUpValidator.parseAsync(request.body);
    if (await db.user.exists(body.email)) {
-      throw new Error('This email is already registered, maybe you want to sign in?');
+      throw new DuplicateUserError('This email is already registered, maybe you want to sign in?');
    }
    const user = db.user.create(body);
      
-    await db.em.persist(user).flush();
-
-    // after flush, we have the `user.id` set
-    console.log(`User ${user.id} created`);
-
-    user.token = app.jwt.sign({ id: user.id });
+    try {
+      await db.em.persist(user).flush();
+  
+      // after flush, we have the `user.id` set
+      console.log(`User ${user.id} created`);
+      
+      user.token = app.jwt.sign({ id: user.id });
+    
+      return user;
+    } catch (e: unknown) {
+      if (e instanceof UniqueConstraintViolationException) {
+        throw new DuplicateUserError('This email is already registered, maybe you want to sign in?', { cause: e });
+      }
+      throw e;
+    }
  });
...
```

And finally, we can return a different status code on this error again. Status `409 Conflict` seems like the most appropriate.

```diff title="src/modules/common/hooks.ts"
...
import { AuthError } from './auth.error.js';
+import { DuplicateUserError } from '../user/duplicate.error.js';
...
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AuthError) {
      return reply.status(401).send(error);
    }
  
    // we also handle not found errors automatically
    // `NotFoundError` is an error thrown by the ORM via `em.findOneOrFail()` method
    if (error instanceof NotFoundError) {
      return reply.status(404).send(error);
    }
+
+    if (error instanceof DuplicateUserError) {
+      return reply.status(409).send(error);
+    }
...
```

We can now adjust our test accordingly:

```diff title="test/user.test.ts"
...
-  expect(res1dup.statusCode).toBe(500);
+  expect(res1dup.statusCode).toBe(409);
  expect(res1dup.json()).toMatchObject({
    message: 'This email is already registered, maybe you want to sign in?',
  });
...
```

:::info Exercise

You can try to generalize this to work for any unique constraint violation by analyzing the `sqlMessage` property of `UniqueConstraintViolationException` and searching the metadata based on the parsing results. You can then produce error messages that point the client to the one or multiple properties that causes a duplicate entry. Doing so will tie you to your SQL driver, and possibly even database engine version, so if you go on this route, you should do so with care. Do unit tests for your parsing in addition to your error conditions themselves, and make sure to run all tests after an upgrade of the database. If the error messages have changed, you will want to support parsing both forms until your production database is updated.

:::

### Reusing the user authentication check

We have the "/profile" endpoint, where we check whether the user is authenticated and return it if it is. For the sake of other endpoints that need to be authenticated, we should extract this into a function that will either give us the current user, or throw.

```ts title="src/modules/common/utils.ts"
import { FastifyRequest } from 'fastify';
import { type User } from '../user/user.entity.js';
import { AuthError } from './auth.error.ts';

export function getUserFromToken(req: FastifyRequest): User {
  if (!req.user) {
    throw new AuthError('Please provide your token via Authorization header');
  }

  return req.user as User;
}
```

and we can already adjust the `user.routes.ts` file to use it:

```diff title="src/modules/user/user.routes.ts"
...
-import { AuthError } from '../common/auth.error.js';
+import { getUserFromToken } from '../common/utils.js';
...
  app.get('/profile', async request => {
-    if (!request.user) {
-      throw new AuthError('Please provide your token via Authorization header');
-    }
-  
-    return request.user as User;
+    return getUserFromToken(request);
  });
```

### Modularizing the configuration

Our `mikro-orm.config.ts` file has already grown quite a lot, and grew a bit even between "Checkpoint 2" and now. As the number of your entities and the number of modifications you may wish to do grows, you may need to put related modifications into dedicated files, and just let `mikro-orm.config.ts` collect and apply them. Exactly how you do that depends on your project and your needs.

We will implement an organization similar to what we have been doing so far, and create files per module with all module related modifications, under a suffix to denote its purpose. Let's use the suffix `*.gen.ts`. Each such file will have a default export that is of type `GenerateOptions`. For each method, we will apply that method, if defined. We'll add a special case the empty string return value of `fileName` from our files to mean "Don't use this result, try next". If we were to do that in the main config, the entity generator will happily create a file with no name and `.ts` extension in the base folder, but we know we don't need that.

So, let's add

```ts title="src/modules/user/user.gen.ts"
import type { GenerateOptions } from "@mikro-orm/core";

const settings: GenerateOptions = {
  fileName: (entityName) => {
    switch (entityName) {
    case 'UserRepository':
      return `user/user.repository`;
    case 'User':
      return `user/${entityName.toLowerCase()}.entity`;
    case 'Password':
      return `user/password.runtimeType`;
    case 'PasswordType':
      return `user/password.type`;
    }
    return '';
  },
  onInitialMetadata: (metadata, platform) => {
    const userEntity = metadata.find(meta => meta.className === 'User');
    if (userEntity) {
      userEntity.repositoryClass = 'UserRepository';
      userEntity.addProperty({
        persist: false,
        name: 'token',
        nullable: true,
        default: null,
        defaultRaw: 'null',
        fieldNames: [platform.getConfig().getNamingStrategy().propertyToColumnName('token')],
        columnTypes: ['varchar(255)'],
        type: 'string',
        runtimeType: 'string',
      });
      const passwordProp = userEntity.properties.password;
      passwordProp.hidden = true;
      passwordProp.lazy = true;
      passwordProp.type = 'PasswordType';
      passwordProp.runtimeType = 'Password';
    }
  }
};
export default settings;
```

and

```ts title="src/modules/article/article.gen.ts"
import type { GenerateOptions } from "@mikro-orm/core";

const settings: GenerateOptions = {
  fileName: (entityName) => {
    switch (entityName) {
    case '_Article':
      return `article/article.entity`;
    case 'Article':
      return `article/article.customEntity`;
    case 'ArticleTag':
    case 'Tag':
    case 'Comment':
      return `article/${entityName.toLowerCase()}.entity`;
    }
    return '';
  },
  onInitialMetadata: (metadata, platform) => {
    const articleEntity = metadata.find(meta => meta.className === 'Article');
    if (articleEntity) {
      const textProp = articleEntity.properties.text;
      textProp.lazy = true;
    }
  },
  onProcessedMetadata: (metadata, platform) => {
    const articleEntity = metadata.find(meta => meta.className === 'Article');
    if (articleEntity) {
      articleEntity.className = '_Article';
      articleEntity.abstract = true;
    }
  },
};
export default settings;
```

And finally, let's hook them up in our config. We'll use `globby` to match all `*.gen.ts` files relative to the config itself. We're using `globby`, because it is already present - it is what MikroORM uses when searching for entities by a path. We'll pre-filter the results at the top, so that the actual entity processing is faster. Our full config is thus:

```ts title="src/mikro-orm.config.ts"
import {
  defineConfig,
  type MikroORMOptions,
} from '@mikro-orm/mysql';
import { UnderscoreNamingStrategy, type GenerateOptions } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import pluralize from 'pluralize';
import { join, dirname } from 'node:path';
import { sync } from 'globby';
import { fileURLToPath } from 'node:url';

const isInMikroOrmCli = process.argv[1]?.endsWith(join('@mikro-orm', 'cli', 'esm')) ?? false;
const isRunningGenerateEntities = isInMikroOrmCli && process.argv[2] === 'generate-entities';

const mikroOrmExtensions: MikroORMOptions['extensions'] = [Migrator];

const fileNameFunctions: NonNullable<GenerateOptions['fileName']>[] = [];
const onInitialMetadataFunctions: NonNullable<GenerateOptions['onInitialMetadata']>[] = [];
const onProcessedMetadataFunctions: NonNullable<GenerateOptions['onProcessedMetadata']>[] = [];

if (isInMikroOrmCli) {
  mikroOrmExtensions.push((await import('@mikro-orm/entity-generator')).EntityGenerator);
  if (isRunningGenerateEntities) {
    const fileDir = dirname(fileURLToPath(import.meta.url));
    const genExtensionFiles = sync('./modules/**/*.gen.ts', { cwd: fileDir });
    for (const file of genExtensionFiles) {
      const genExtension = (await import(file)).default as GenerateOptions;
      if (genExtension.fileName) {
        fileNameFunctions.push(genExtension.fileName);
      }
      if (genExtension.onInitialMetadata) {
        onInitialMetadataFunctions.push(genExtension.onInitialMetadata);
      }
      if (genExtension.onProcessedMetadata) {
        onProcessedMetadataFunctions.push(genExtension.onProcessedMetadata);
      }
    }
  }
}

export default defineConfig({
  extensions: mikroOrmExtensions,
  multipleStatements: isInMikroOrmCli,
  discovery: {
    warnWhenNoEntities: !isInMikroOrmCli,
  },
  entities: isRunningGenerateEntities ? [] : ['dist/**/*.customEntity.js', 'dist/**/*.entity.js'],
  entitiesTs: isRunningGenerateEntities ? [] : ['src/**/*.customEntity.ts', 'src/**/*.entity.ts'],
  host: 'localhost',
  user: 'root',
  password: '',
  dbName: 'blog',
  // enable debug mode to log SQL queries and discovery information
  debug: true,
  migrations: {
      path: 'dist/migrations',
      pathTs: 'src/migrations',
  },
  namingStrategy: class extends UnderscoreNamingStrategy {
    override getEntityName(tableName: string, schemaName?: string): string {
      return pluralize.singular(super.getEntityName(tableName, schemaName));
    }
  },
  entityGenerator: {
    scalarTypeInDecorator: true,
    fileName: (entityName) => {
      for (const f of fileNameFunctions) {
        const r = f(entityName);
        if (r === '') {
          continue;
        }
        return r;
      }
      return `common/${entityName.toLowerCase()}.entity`;
    },
    onInitialMetadata: (metadata, platform) => {
      return Promise.all(onInitialMetadataFunctions.map(f => f(metadata, platform))).then();
    },
    onProcessedMetadata: (metadata, platform) => {
      return Promise.all(onProcessedMetadataFunctions.map(f => f(metadata, platform))).then();
    },
    save: true,
    path: 'src/modules',
    esmImport: true,
    outputPurePivotTables: true,
    readOnlyPivotTables: true,
    bidirectionalRelations: true,
    customBaseEntityName: 'Base',
    useCoreBaseEntity: true,
  },
});
```

Regeneration at this point should produce results no different from what we've had so far. But you can now add extra `*.gen.ts` files, each modifying some aspect of some entities.

:::info Exercise

You can try to implement a different pattern for handling the `*.gen.ts` files, such as accepting the metadata of a given entity based on the table name, and register file name entries as needed during those extensions. By the time `fileName` is first called, `onInitialMetadata` and `onProcessedMetadata` have already finished executing, so they can determine its behavior. Doing this is probably overkill for most cases, but it may be helpful if you have extensions that you want to apply on different schemas, not just one you are fully in control of.

:::

## ⛳ Checkpoint 3

Our application is now structured like an enterprise level application, ready for further modules or further additions to the existing modules. We even made another migration along the way. We are now ready to add more features.

## Completing the project

### Add the remaining article endpoints

Let's add the remaining article endpoints.

Let's start with one about viewing an article by slug and adding a comment:

```ts title="src/modules/article/article.routes.ts"
// rest of the code

  const articleBySlugParams = z.object({
    slug: z.string().min(1),
  });
  
  app.get('/:slug', async request => {
    const { slug } = articleBySlugParams.parse(request.params);
    return db.article.findOneOrFail({ slug }, {
      populate: ['author', 'commentCollection.author', 'text'],
    });
  });

  const articleCommentPayload = z.object({
    text: z.string().min(1),
  });
  
  app.post('/:slug/comment', async request => {
    const { slug } = articleBySlugParams.parse(request.params);
    const { text } = articleCommentPayload.parse(request.body);
    const author = getUserFromToken(request);
    const article = await db.article.findOneOrFail({ slug });
    const comment = db.comment.create({ author, article, text });
  
    // We can add the comment to `article.comments` collection,
    // but in fact it is a no-op, as it will be automatically
    // propagated by setting Comment.author property.
    article.commentCollection.add(comment);
  
    // mention we don't need to persist anything explicitly
    await db.em.flush();
  
    return comment;
  });

// rest of the code
```

If you compare the code with the equivalent from the "code first" guide, you will notice that we've added Zod for some basic validation. Also, the generator used the name "commentCollection" to represent the relation to the "comments" table. The default is formed from the entity name, combined with the suffix "Collection" for 1:N relations, or "Inverse" for M:N relations. We could adjust that in the naming strategy by overriding `inverseSideName` if we'd like (e.g. by taking the entity name and converting it to plural with pluralize), but to avoid potential conflicts with properties defined in the table itself, let's keep it as is. We're more likely to name a column with the plural form of an entity than we are to name it with "_collection" or "_inverse" at the end, making conflicts less likely in their current form. 

Next, let's try to add the article creation endpoint:

```ts title="src/modules/article/article.routes.ts"
// rest of the code above

  const newArticlePayload = z.object({
    title: z.string().min(1),
    text: z.string().min(1),
    description: z.string().min(1).optional(),
  });

  app.post('/', async request => {
    const { title, text, description } = newArticlePayload.parse(request.body);
    const author = getUserFromToken(request);
    const article = db.article.create({
      title,
      text,
      author,
      description,
    });
  
    await db.em.flush();
  
    return article;
  });
// rest of the code
```

You should be seeing a type error. This is because our entity declares slug and description as required properties. There are three solutions here. The first possible solution is to use the article constructor directly and persist the new entity.

The second is to create a custom entity repository for article, in which we override the create method or add a custom one that calls the constructor and persists the new entity. We'll skip showing these solutions.

:::info Exercise

Try to implement these solutions as well. Step back as soon as you can build the application.

:::

And the third one is to declare those properties as optional. The best way to do that is to declare them as optional in our mapped superclass.

```diff title="src/modules/article/article.customEntity.ts"
-import { Entity, type Rel } from '@mikro-orm/core';
+import { Entity, OptionalProps, type Rel } from '@mikro-orm/core';
import { _Article } from './article.entity.js';
import { User } from '../user/user.entity.js';

function convertToSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

@Entity({ tableName: 'articles' })
export class Article extends _Article {
+
+  [OptionalProps]?: 'slug' | 'description';

  constructor(title: string, text: string, author: Rel<User>) {
    super();
    this.title = title;
    this.text = text;
    this.author = author;
    this.slug = convertToSlug(title);
    this.description = this.text.substring(0, 999) + '…';
  }

}
```

Technically, we could declare them as optional in the base class by modifying that in `onInitialMetadata` or `onProcessedMetadata`, but if we ever want to bypass the superclass for whatever reason, we will be prone to errors from the missing slug and description.

After the modifications to the mapped superclass, the code now compiles again.

For our next two endpoints, we'll want to ensure only the author of an article can update and delete it. The check itself is trivial, but let's make it so that we throw a separate error that results in `403 Forbidden` if the user is different from the author of an article.

Let's add the error:

```ts title="src/modules/common/disallowed.error.ts"
export class DisallowedError extends Error {}
```

And add handling for it in `hooks.ts`:

```diff title="src/modules/common/hooks.ts"
...
import { AuthError } from './auth.error.js';
+import { DisallowedError } from './disallowed.error.js';
...
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AuthError) {
      return reply.status(401).send(error);
    }
    
+    if (error instanceof DisallowedError) {
+      return reply.status(403).send(error);
+    }
...
```

And we're now ready to add the article endpoints to update and remove and article by ID:

```ts title="src/modules/article/article.routes.ts"
// rest of the imports
import { DisallowedError } from '../common/disallowed.error.js';
import { wrap } from '@mikro-orm/mysql';

// rest of the code

  const articleByIdParams = z.object({
    id: z.coerce.number().int().positive()
  });
  const updateArticlePayload = newArticlePayload.partial().extend({
    slug: z.string().min(1).optional(),
  });

  app.patch('/:id', async request => {
    const user = getUserFromToken(request);
    const { id } = articleByIdParams.parse(request.params);
    const article = await db.article.findOneOrFail(id);
    if (article.author !== user) {
      throw new DisallowedError('Only the author of an article is allowed to update it');
    }

    wrap(article).assign(updateArticlePayload.parse(request.body));
    await db.em.flush();
  
    return article;
  });

  app.delete('/:id', async request => {
    const user = getUserFromToken(request);
    const { id } = articleByIdParams.parse(request.params);
    const article = await db.article.findOneOrFail(id);
    if (article.author !== user) {
      throw new DisallowedError('Only the author of an article is allowed to delete it');
    }

    // mention `nativeDelete` alternative if we don't care about validations much
    await db.em.remove(article).flush();
  
    return { success: true };
  });
// rest of the code
```

Thanks to MikroORM's identity map, we can compare the objects like how we've done above.

Let's also add an endpoint to update our user profile:

```diff title="src/modules/user/user.routes.ts"
...
-import { UniqueConstraintViolationException } from '@mikro-orm/mysql';
+import { UniqueConstraintViolationException, wrap } from '@mikro-orm/mysql';
...
+  const profileUpdatePayload = signUpPayload.partial();
+  
+  app.patch('/profile', async (request) => {
+    const user = getUserFromToken(request);
+    wrap(user).assign(profileUpdatePayload.parse(request.body));
+    await db.em.flush();
+    return user;
+  });
```

:::info Exercise

Add unit tests for those new endpoints.

:::

### Embeddable entities

MikroORM offers embeddable objects, which can serve one of two purposes.

1. Group related columns in a table under a property.
2. Provide a more entity-like experience to querying JSON columns.

The entity generator is powerful enough to output such entities, when they are encoded in the metadata. However, we need to heavily alter the metadata to add new embeddable entities and add references to them. It is also perfectly valid to write embeddable entities manually, and just add references to them during entity generation.  We'll explore both types of embeddables and both ways of generating them.

#### Embeddable as a group of columns

First, for the grouping of columns. In most of our entities, we have "created_at" and "updated_at" columns, but not quite all of them (case in point: "article_tags" table). Let's make it a policy to add an optional "_track" property to any entity with such columns. That property will be an embeddable object having those two fields. We'll also remove them from their original properties, keeping only the copy in the emebeddable object. For simplicity, we'll assume the type and defaults of all such columns are correct. In practice, you may want to do extra checks on the column type, nullability and default value, before taking action to group them. Mistakes can happen during the authoring of migrations. Your entity generation extensions can be made resilient towards such mistakes.

Normally, embeddable objects map to a column formed by using the property as a prefix. In our case, that would be "track_creted_at" and "track_updated_at". We don't want that, so we will set the `prefix` option to `false`, so that in the end, we still map to `created_at` and `updated_at`.

```ts title="src/modules/common/track.gen.ts"
import { EntityMetadata, ReferenceKind, type GenerateOptions } from '@mikro-orm/core';

const settings: GenerateOptions = {
  onInitialMetadata: (metadata, platform) => {
    for (const meta of metadata) {
      if (typeof meta.properties.createdAt !== 'undefined' && typeof meta.properties.updatedAt !== 'undefined') {
        meta.removeProperty('createdAt', false);
        meta.removeProperty('updatedAt', false);
        meta.addProperty(
          {
            name: '_track',
            kind: ReferenceKind.EMBEDDED,
            optional: true,
            nullable: true,
            type: 'Track',
            runtimeType: 'Track',
            prefix: false,
            object: false,
          },
          false,
        );
        meta.sync();
      }
    }

    const trackClass = new EntityMetadata({
      className: 'Track',
      tableName: 'track',
      embeddable: true,
      relations: [],
    });
    trackClass.addProperty(
      {
        name: 'createdAt',
        fieldNames: ['created_at'],
        columnTypes: ['datetime'],
        type: 'datetime',
        runtimeType: 'Date',
        defaultRaw: 'CURRENT_TIMESTAMP',
      },
      false,
    );
    trackClass.addProperty(
      {
        name: 'updatedAt',
        fieldNames: ['updated_at'],
        columnTypes: ['datetime'],
        type: 'datetime',
        runtimeType: 'Date',
        defaultRaw: 'CURRENT_TIMESTAMP',
      },
      false,
    );
    trackClass.sync();

    metadata.push(trackClass);
  },
};
export default settings;
```

If you regenerate the entities now, you'll see "src/modules/common/track.entity.ts" created, and other classes are now referencing it. Since we are creating the class dynamically, we can keep it saved with an `*.entity.ts` extension.

#### Embeddable as a type of JSON column

While we explored custom types already, and can use them for JSON columns as well. But doing so means you opt out from MikroORM assisted queries to properties within the JSON. With a custom type, the JSON column is just a random object as far as MikroORM is concerned, and you only get to deal with it after having fetched it. You can always write queries to JSON properties, of course (it's still a JSON column), but there will be no type inference in your IDE. Not so with embeddable properties.

Our schema is currently lacking any JSON properties. Let's add one. We can use one to store social media accounts of users, for example.

Let's start by adding migration and regenerating our entities to include the "social" property.

```ts title="src/migrations/Migration00000000000003.ts"
import { Migration } from '@mikro-orm/migrations';

export class Migration00000000000003 extends Migration {

  async up(): Promise<void> {
    await this.execute(`
      ALTER TABLE \`users\`
        ADD COLUMN \`social\` JSON NULL DEFAULT NULL AFTER \`bio\`;
    `);
  }

  async down(): Promise<void> {
    await this.execute(`
      ALTER TABLE \`users\`
        DROP COLUMN \`social\`;
    `);
  }

}
```

Execute the migration and regenerate the entities. You should see the "social" column defined with runtime type "any". OK, time to add the embeddable.

We can define the embeddable class manually:

```ts title="src/modules/user/social.customEntity.ts"
import { Embeddable, Property, type Opt } from "@mikro-orm/mysql";

@Embeddable()
export class Social {

  @Property({ type: 'string' })
  twitter!: string & Opt;

  @Property({ type: 'string' })
  facebook!: string & Opt;

  @Property({ type: 'string' })
  linkedin!: string & Opt;

}
```

In fairness, this class is simple enough that we may as well define it dynamically. But if you'd like to add helper methods (e.g. for getting the full link, our of just a username), you may want to define it manually.

Now, let's modify our `user.gen.ts` to reference the embeddable:

```diff title="src/modules/user/user.gen.ts"
-import { type GenerateOptions } from "@mikro-orm/core";
+import { ReferenceKind, type GenerateOptions } from "@mikro-orm/core";
...
    case 'PasswordType':
      return `user/password.type`;
+    case 'Social':
+      return `user/social.customEntity`;
...
      passwordProp.runtimeType = 'Password';
+
+      const socialProp = userEntity.properties.social;
+      socialProp.kind = ReferenceKind.EMBEDDED;
+      socialProp.type = 'Social';
+      socialProp.prefix = false;
+      socialProp.object = true;
...
```

Regenerating the entities again, we now have the embeddable representing the contents of the JSON column. Just as with column groups, there is a prefix for the related JSON properties, but by setting "prefix" to "false", we can ensure the props in our entities map to the same properties in the JSON column. And the "object" option being set to "true" is how we set that property to represent a JSON column, rather than a group of columns.

:::info Exercise

Try to add a check constraint to the JSON column too. The embeddable helps ensure your application won't get exposed to unknown properties, or be able to enter unknown properties into the database. However, direct queries to your database may insert objects that won't have the required shape. Worse still, they may set the same properties, but with a diferent data type inside. That may ultimately crash your application if read out. A check constraint that at least checks the known properties will remove any possibility of that.

:::

We should update our user endpoints to accept this new property:

```diff title="src/modules/user/user.routes.ts"
  const signUpPayload = z.object({
    email: z.string().email(),
    password: z
      .string()
      .min(1)
      .transform(async (raw) => Password.fromRaw(raw)),
    fullName: z.string().min(1),
    bio: z.string().optional().default(''),
+    social: z
+      .object({
+        twitter: z.string().min(1).optional(),
+        facebook: z.string().min(1).optional(),
+        linkedin: z.string().min(1).optional(),
+      })
+      .optional(),
  });
```

### Formula properties

Sometimes, you want to include some dynamic data per row. Generated columns can help when all the data you need is in the row, but what about when you want to include something non-deterministic (like the current time) or something from other tables (an aggregation perhaps) as the value? In SQL, this can be done with a subquery in your `SELECT` clause. MikroORM allows you to define such subqueries as `@Formula` decorated properties. These are not inferred from the database, but you can add such with `onInitialMetadata` and `onProcessedMetadata`.

Let's add a count of comments to the article listing in that fashion. We'll make the property lazy, so that we don't necessarily compute it every time we get an article.

```diff title="src/modules/article/article.gen.ts"
...
      textProp.lazy = true;
+
+      articleEntity.addProperty({
+        name: 'commentsCount',
+        fieldNames: ['comments_count'],
+        columnTypes: ['INT'],
+        unsigned: true,
+        optional: true,
+        type: 'integer',
+        runtimeType: 'number',
+        default: 0,
+        lazy: true,
+        formula: (alias) => `(SELECT COUNT(*) FROM comments WHERE article = ${alias}.id)`,
+      });
...
```

And let's regenerate the entities. Lastly, let's ensure we add it to the listing:

```diff title="src/modules/article/article.routes.ts"
...
    const [items, total] = await db.article.findAndCount(
      {},
      {
+        populate: ['commentsCount'],
        limit,
        offset,
      },
    );
...
```

## Using the query builder during entity generation

Notice that we had to write the full query as a string. So what happens if we rename the columns in the future? No entity generation or build errors of any kind. We would only get an error at runtime, if we populate the property. That's not good. We can remedy that by constructing the query dynamically based on the metadata, and do the final replacement of the alias at the end. This will ensure we get errors during entity generation if we've renamed the involved table or columns.

```diff title="src/modules/article/article.gen.ts"
import type { GenerateOptions } from '@mikro-orm/core';
+import { type SqlEntityManager, Utils } from '@mikro-orm/mysql';
...
      textProp.lazy = true;

+      const commentEntity = metadata.find((meta) => meta.className === 'Comment');
+      if (!commentEntity) {
+        return;
+      }
+      const em = (platform.getConfig().getDriver().createEntityManager() as SqlEntityManager);
+      const qb = em.getKnex().queryBuilder().count().from(commentEntity.tableName).where(
+        commentEntity.properties.article.fieldNames[0],
+        '=',
+        em.getKnex().raw('??.??', [em.getKnex().raw('??'), commentEntity.properties.id.fieldNames[0]])
+      );
+      const formula = Utils.createFunction(new Map(), `return (alias) => ${JSON.stringify(`(${qb.toSQL().sql})`)}.replaceAll('??', alias)`);
+
      articleEntity.addProperty({
        name: 'commentsCount',
        fieldNames: ['comments_count'],
        columnTypes: ['INT'],
        unsigned: true,
        optional: true,
        type: 'integer',
        runtimeType: 'number',
        default: 0,
        lazy: true,
-        formula: (alias) => `(SELECT COUNT(*) FROM comments WHERE article = ${alias}.id)`,
+        formula,
      });
```

If you regenerate the entities now, you'll see a slightly different function in the output from what we had before, but it still does the same job. With this in place, if we rename the involved columns from `articles` or `comments`, the entity generator would error. If we delete or rename the `Comment` entity, generation would skip the commentsCount property, which would in turn create build errors if we were to reference it.

## Deployment

### Running without ts-node

We have already added a "check" script to check our code without emitting anything. Let's actually emit our output, and run it with node rather than ts-node:

```json title="package.json"
  "scripts": {
    "build": "tsc --build",
    "start:prod": "node ./dist/server.js",
    ...
  }
```

Because we already have "type" annotated everywhere, the application just works without further modifications. If you were to use a bundler instead of `tsc`, you may need to do additional config. If the bundler is mandling your class names and property names (e.g. NextJS projects do that by default), you may adjust your naming strategy to always generate `tableName` and `fieldNames` options (e.g. by unconditionally returning an empty string in `classToTableName` and `propertyToColumnName`), and regenerate your entities. This will ensure that no matter how the JS identifiers end up as in the production bundle, they will map to the correct tables and columns in your database.

## ⛳ Checkpoint 4

Our application is fully ready to be deployed. You can, of course, always add more features, optimize performance in some areas, make error handling nicer, use "as" even less, and so on.
