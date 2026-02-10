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
export class Lock {
  @Property()
  createdAt: Date = new Date();
}

@Entity()
export class File {
  @PrimaryKey()
  id!: number;

  @Embedded(() => Lock, {
    nullable: true,
    object: true, // error only throws with object mode
  })
  lock?: Lock;
}

describe('GH issue 2233', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Lock, File],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('cascade persist with pre-filled PK and with cycles', async () => {
    const file = new File();
    await orm.em.fork().persist(file).flush();
    const mapped = orm.em.map(File, { id: 1, lock: null });
    expect(mapped).toEqual({ id: 1, lock: null });
  });
});
