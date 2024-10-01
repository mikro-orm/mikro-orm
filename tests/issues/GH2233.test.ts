import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

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
      entities: [Lock, File],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('cascade persist with pre-filled PK and with cycles', async () => {
    const file = new File();
    await orm.em.fork().persistAndFlush(file);
    const mapped = orm.em.map(File, { id: 1, lock: null });
    expect(mapped).toEqual({ id: 1, lock: null });
  });

});
