import { Collection } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Sea {
  @PrimaryKey()
  id!: number;

  @OneToMany(() => Fish, ({ sea }) => sea)
  fishes = new Collection<Fish>(this);
}

@Entity()
class Fish {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Sea)
  sea!: Sea;
}

let orm: MikroORM;
beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Sea, Fish],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

beforeEach(() => orm.schema.clear());
afterAll(() => orm.close(true));

test('when persisting the whole model, it is slow', async () => {
  const mediterranean = new Sea();
  const groupers = Array.from({ length: 10_000 }).map(() => new Fish());
  mediterranean.fishes.add(groupers);
  orm.em.persist(mediterranean);
  await orm.em.flush();
});

test('when flushing the container before the contained data, it is fast', async () => {
  const mediterranean = new Sea();
  await orm.em.persist(mediterranean).flush();
  const groupers = Array.from({ length: 10_000 }).map(() => new Fish());
  mediterranean.fishes.add(groupers);
  await orm.em.flush();
});
