import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';

@Embeddable()
export class D {

  @Property({ type: 'boolean', nullable: true })
  test?: boolean = false;

}

@Embeddable()
export class C {

  @Embedded(() => D, { object: true, nullable: false })
  d!: D;

}

@Embeddable()
export class B {

  @Embedded(() => C, { object: true, nullable: false })
  c!: C;

  @Embedded(() => C, { object: true, nullable: false })
  c2!: C;

}

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @Embedded(() => B, { array: true })
  b: B[] = [];

}

describe('GH issue 1616', () => {

  test('order of embeddables during discovery should not matter', async () => {
    const orm = await MikroORM.init({
      entities: [C, D, A, B],
      dbName: ':memory:',
      type: 'sqlite',
    });
    const schema = await orm.getSchemaGenerator().getCreateSchemaSQL(false);
    expect(schema).toMatchSnapshot();
    await orm.close();
  });

});
