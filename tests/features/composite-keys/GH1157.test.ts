import { Collection, MikroORM } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import type { AbstractSqlDriver } from '@mikro-orm/sql';
import { v4 } from 'uuid';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class D {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne({ entity: () => A })
  a!: any;
}

@Entity()
export class C {
  @PrimaryKey()
  id: string = v4();
}

@Entity()
export class B {
  @PrimaryKey()
  id: string = v4();
}

@Entity()
export class A {
  @OneToOne({ entity: () => B, joinColumn: 'id', primary: true })
  id!: B;

  @ManyToOne({ entity: () => C, primary: true })
  c!: C;

  @OneToMany({ entity: () => D, mappedBy: 'a', eager: true })
  d = new Collection<D>(this);
}

describe('GH issue 1157', () => {
  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [A, B, C, D],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('searching by composite key relation', async () => {
    const c = orm.em.create(C, {});
    const b = orm.em.create(B, {});
    const a = orm.em.create(A, { id: b, c });
    const d = orm.em.create(D, { a });
    await orm.em.persist(d).flush();
    orm.em.clear();
    const d1 = await orm.em.findOneOrFail(D, { a });
    expect(d1.a.id).toBeInstanceOf(B);
  });
});
