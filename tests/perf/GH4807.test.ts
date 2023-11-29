import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey } from '@mikro-orm/core';
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
    entities: [Sea, Fish],
    dbName: ':memory:',
  });
  await orm.getSchemaGenerator().createSchema();
});

beforeEach(() => orm.schema.clearDatabase());
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
  await orm.em.persistAndFlush(mediterranean);
  const groupers = Array.from({ length: 10_000 }).map(() => new Fish());
  mediterranean.fishes.add(groupers);
  await orm.em.flush();
});
