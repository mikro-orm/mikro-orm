import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, OneToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
export class First {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => Second, second => second.first)
  second?: any;
}

@Entity()
export class Second {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => First)
  first!: First;

  constructor(first: First) {
    this.first = first;
  }
}

describe('GH issue 2238', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [First, Second],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('flush after removeAndFlush', async () => {
    const a = new First();
    const b = new Second(a);
    orm.em.persist([a, b]);
    await orm.em.flush();
    orm.em.clear();

    const seconds = await orm.em.find(Second, {});
    await orm.em.remove(seconds).flush();
    const result1 = await orm.em.find(Second, {});
    expect(result1.length).toBe(0);
    await orm.em.flush();
    const result2 = await orm.em.find(Second, {});
    expect(result2.length).toBe(0);
    const result3 = await orm.em.find(First, {});
    expect(result3.length).toBe(1);
  });
});
