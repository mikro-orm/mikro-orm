import type {
  EntityManager } from '@mikro-orm/core';
import {
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { v4 as uuid } from 'uuid';

@Entity({ tableName: 'users' })
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  readonly username: string;

  constructor(username: string) {
    this.username = username;
  }

}

async function getOrmInstance(): Promise<MikroORM<PostgreSqlDriver>> {
  const orm = await MikroORM.init({
    entities: [User],
    dbName: 'mikro_orm_test_gh_1176',
    type: 'postgresql',
  });

  return orm as MikroORM<PostgreSqlDriver>;
}

describe('GH issue 1176', () => {
  let orm: MikroORM<PostgreSqlDriver>;
  let em: EntityManager;

  beforeAll(async () => {
    orm = await getOrmInstance();
    await orm.getSchemaGenerator().dropDatabase('mikro_orm_test_gh_1176');
    await orm.getSchemaGenerator().createDatabase('mikro_orm_test_gh_1176');
  });

  afterAll(async () => {
    await orm.close();
  });

  beforeEach(() => {
    em = orm.em.fork();
  });

  describe('immediate constraints (failures on insert)', () => {
    beforeAll(async () => {
      const orm = await getOrmInstance();
      await orm.em.getConnection().execute(
        `
          drop table if exists users;
          create table users (
            id serial primary key,
            username varchar(50) not null unique deferrable initially immediate
          );
          `,
      );
      await orm.close();
    });
    describe('implicit transactions', () => {
      let username: string;
      it('creating a new user succeeds', async () => {
        username = uuid();
        const user = new User(username);
        em.persist(user);

        await expect(em.flush()).resolves.toBeUndefined();
      });
      it('flush fails when a database constraint fails', async () => {
        const user = new User(username);
        em.persist(user);

        await expect(em.flush()).rejects.toThrowError(
          /^insert.+duplicate key value/,
        );
      });
    });

    describe('explicit transactions with "transactional()"', () => {
      let username: string;
      it('creating a new user succeeds', async () => {
        const work = em.transactional(async em => {
          username = uuid();
          const user = new User(username);
          em.persist(user);
        });

        await expect(work).resolves.toBeUndefined();
      });
      it('transactional throws when a database constraint fails', async () => {
        const work = em.transactional(async em => {
          const user = new User(username);
          em.persist(user);
        });

        await expect(work).rejects.toThrowError(/^insert.+duplicate key value/);
      });
    });

    describe('explicit transactions with explicit begin/commit method calls', () => {
      let username: string;
      it('creating a new user succeeds', async () => {
        await em.begin();
        username = uuid();
        const user = new User(username);
        em.persist(user);

        await expect(em.commit()).resolves.toBeUndefined();
      });
      it('commit throws when a database constraint fails', async () => {
        await em.begin();
        const work = async () => {
          try {
            const user = new User(username);
            em.persist(user);
            await em.commit();
          } catch (error) {
            await em.rollback();
            throw error;
          }
        };

        await expect(work).rejects.toThrowError(/^insert.+duplicate key value/);
      });
    });
  });

  describe('deferred constraints (failures on commit)', () => {
    beforeAll(async () => {
      const orm = await getOrmInstance();
      await orm.em.getConnection().execute(
        `
        drop table if exists users;
        create table users (
          id serial primary key,
          username varchar(50) not null unique deferrable initially deferred
        );
          `,
      );
      await orm.close();
    });

    describe('implicit transactions', () => {
      let username: string;
      it('creating a new user succeeds', async () => {
        username = uuid();
        const user = new User(username);
        em.persist(user);

        await expect(em.flush()).resolves.toBeUndefined();
      });
      it('flush throws when a database constraint fails', async () => {
        const user = new User(username);
        em.persist(user);

        await expect(em.flush()).rejects.toThrowError(
          /^COMMIT.+duplicate key value/,
        );
      });
    });

    describe('explicit transactions with "transactional()"', () => {
      let username: string;
      it('creating a new user succeeds', async () => {
        const work = em.transactional(async em => {
          username = uuid();
          const user = new User(username);
          em.persist(user);
        });

        await expect(work).resolves.toBeUndefined();
      });
      it('transactional throws when a database constraint fails', async () => {
        const work = async () => {
          await em.transactional(async em => {
            const user = new User(username);
            em.persist(user);
          });
        };

        await expect(work).rejects.toThrowError(/^COMMIT.+duplicate key value/);
      });
    });

    describe('explicit transactions with explicit begin/commit/rollback method calls', () => {
      let username: string;
      it('creating a new user succeeds', async () => {
        await em.begin();
        username = uuid();
        const user = new User(username);
        em.persist(user);

        await expect(em.commit()).resolves.toBeUndefined();
      });
      it('commit throws when a database constraint fails', async () => {
        await em.begin();
        const work = async () => {
          try {
            const user = new User(username);
            em.persist(user);
            await em.commit();
          } catch (error) {
            await em.rollback();
            throw error;
          }
        };

        await expect(work).rejects.toThrowError(/^COMMIT.+duplicate key value/);
      });
    });
  });
});
