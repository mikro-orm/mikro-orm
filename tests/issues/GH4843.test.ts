import {
  Collection,
  Entity,
  ManyToOne,
  PrimaryKey,
  OneToMany,
  TextType,
  PrimaryKeyProp,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';

class CitextType extends TextType {

  getColumnType() {
    return 'citext';
  }

  convertToJSValueSQL(key: string): string {
    return `lower(${key})`;
  }

}

@Entity()
class A {

  [PrimaryKeyProp]?: ['id1', 'id2'];

  @PrimaryKey({ type: CitextType })
  id1!: string;

  @PrimaryKey({ type: CitextType })
  id2!: string;

  @OneToMany(() => C, c => c.a)
  c = new Collection<C>(this);

}

@Entity()
class B {

  @PrimaryKey({ type: CitextType })
  id!: string;

  @OneToMany(() => C, c => c.b)
  c = new Collection<C>(this);

}

@Entity()
class C {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => A)
  a!: A;

  @ManyToOne(() => B)
  b!: B;

}

let orm: MikroORM;

describe('populate with citext', () => {

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B, C],
      dbName: 'test-4843',
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('create extension if not exists citext;');
    await orm.schema.refreshDatabase();

    await orm.em.insert('a', [{ id1: 'test1', id2: 'test2' }, { id1: 'asDf', id2: 'teST' }]);
    await orm.em.insert('b', [{ id: 'test3' }, { id: 'TEst' }]);
    await orm.em.insert('c', [{ a_id1: 'test1', a_id2: 'test2', b_id: 'test3' }, {
      a_id1: 'ASdF',
      a_id2: 'TEst',
      b_id: 'TEST',
    }]);
  });

  afterAll(() => orm.close());

  test('composite FK (select-in)', async () => {
    const a1 = await orm.em.fork().find(A, ['test1', 'test2'], { populate: ['c'], strategy: 'select-in' });
    expect(a1[0].c.$.toArray()).toEqual([{ id: 1, a: { id1: 'test1', id2: 'test2' }, b: 'test3' }]);

    const a2 = await orm.em.fork().find(A, ['asdf', 'test'], { populate: ['c'], strategy: 'select-in' });
    expect(a2[0].c.$.toArray()).toEqual([{ id: 2, a: { id1: 'asdf', id2: 'test' }, b: 'test' }]);
  });

  test('simple FK (select-in)', async () => {
    const b1 = await orm.em.fork().find(B, 'test3', { populate: ['c'], strategy: 'select-in' });
    expect(b1[0].c.$.toArray()).toEqual([{ id: 1, a: { id1: 'test1', id2: 'test2' }, b: 'test3' }]);

    const b2 = await orm.em.fork().find(B, 'test', { populate: ['c'], strategy: 'select-in' });
    expect(b2[0].c.$.toArray()).toEqual([{ id: 2, a: { id1: 'asdf', id2: 'test' }, b: 'test' }]);
  });

  test('composite FK (joined)', async () => {
    const a1 = await orm.em.fork().find(A, ['test1', 'test2'], { populate: ['c'] });
    expect(a1[0].c.$.toArray()).toEqual([{ id: 1, a: { id1: 'test1', id2: 'test2' }, b: 'test3' }]);

    const a2 = await orm.em.fork().find(A, ['asdf', 'test'], { populate: ['c'] });
    expect(a2[0].c.$.toArray()).toEqual([{ id: 2, a: { id1: 'asdf', id2: 'test' }, b: 'test' }]);
  });

  test('simple FK (joined)', async () => {
    const b1 = await orm.em.fork().find(B, 'test3', { populate: ['c'] });
    expect(b1[0].c.$.toArray()).toEqual([{ id: 1, a: { id1: 'test1', id2: 'test2' }, b: 'test3' }]);

    const b2 = await orm.em.fork().find(B, 'test', { populate: ['c'] });
    expect(b2[0].c.$.toArray()).toEqual([{ id: 2, a: { id1: 'asdf', id2: 'test' }, b: 'test' }]);
  });

});
