import { MikroORM } from '@mikro-orm/sqlite';

import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
@Embeddable()
class D {
  @Property({ type: 'boolean', nullable: true })
  test?: boolean = false;
}

@Embeddable()
class C {
  @Embedded(() => D, { object: true, nullable: false })
  d!: D;
}

@Embeddable()
class B {
  @Embedded(() => C, { object: true, nullable: false })
  c!: C;

  @Embedded(() => C, { object: true, nullable: false })
  c2!: C;
}

@Entity()
class A {
  @PrimaryKey()
  id!: number;

  @Embedded(() => B, { array: true })
  b: B[] = [];
}

describe('GH issue 1616', () => {
  test('order of embeddables during discovery should not matter', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [C, D, A, B],
      dbName: ':memory:',
    });
    const schema = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(schema).toMatchSnapshot();
    await orm.close();
  });
});
