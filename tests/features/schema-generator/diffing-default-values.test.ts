import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';

export class Foo {

  @PrimaryKey()
  id!: number;

  @Property({ defaultRaw: "'test'" })
  bar0!: string;

  @Property({ default: 'test' })
  bar1!: string;

}

@Entity()
export class Foo1 extends Foo {

  @Property({ defaultRaw: 'now()' })
  bar2!: Date;

  @Property({ defaultRaw: 'now(6)', length: 6 })
  bar3!: Date;

}

@Entity()
export class Foo2 extends Foo {

  @Property({ defaultRaw: 'now()' })
  bar2!: Date;

  @Property({ defaultRaw: 'now()', length: 6 })
  bar3!: Date;

}

@Entity()
export class Foo3 extends Foo {

  @Property({ defaultRaw: 'now' })
  bar2!: Date;

}

describe('diffing default values (GH #2385)', () => {

  test('string defaults do not produce additional diffs [mysql]', async () => {
    const orm = await MikroORM.init({
      entities: [Foo1],
      dbName: 'mikro_orm_test_gh_2385',
      type: 'mysql',
      port: 3307,
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
    expect(await orm.getSchemaGenerator().getCreateSchemaSQL()).toMatchSnapshot();
    await expect(orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close();
  });

  test('string defaults do not produce additional diffs [mariadb]', async () => {
    const orm = await MikroORM.init({
      entities: [Foo1],
      dbName: 'mikro_orm_test_gh_2385',
      type: 'mariadb',
      port: 3309,
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
    expect(await orm.getSchemaGenerator().getCreateSchemaSQL()).toMatchSnapshot();
    await expect(orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close();
  });

  test('string defaults do not produce additional diffs [postgres]', async () => {
    const orm = await MikroORM.init({
      entities: [Foo2],
      dbName: 'mikro_orm_test_gh_2385',
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
    expect(await orm.getSchemaGenerator().getCreateSchemaSQL()).toMatchSnapshot();
    await expect(orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close();
  });

  test('string defaults do not produce additional diffs [sqlite]', async () => {
    const orm = await MikroORM.init({
      entities: [Foo3],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
    expect(await orm.getSchemaGenerator().getCreateSchemaSQL()).toMatchSnapshot();
    await expect(orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close();
  });

});
