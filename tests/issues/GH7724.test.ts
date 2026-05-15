import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, Enum, ManyToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ discriminatorColumn: 'kind', abstract: true, tableName: 'animal' })
abstract class Animal {
  @PrimaryKey()
  id!: number;

  @Enum()
  kind!: string;
}

@Entity({ discriminatorValue: 'cat' })
class Cat extends Animal {
  @ManyToMany({ entity: () => Cat, inversedBy: 'friendOf' })
  friends = new Collection<Cat>(this);

  @ManyToMany({ entity: () => Cat, mappedBy: 'friends' })
  friendOf = new Collection<Cat>(this);
}

describe('GH issue 7724', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Animal, Cat],
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('qb leftJoinAndSelect of child inverse M:N via the STI root', async () => {
    // original repro from the issue — joins the inverse M:N through the
    // STI root, which used to crash because the root's inlined copy of the
    // inverse property had a stale undefined `pivotEntity`.
    await orm.em
      .qb(Animal as typeof Cat, 'e')
      .leftJoinAndSelect('e.friends', 'a')
      .leftJoinAndSelect('e.friendOf', 'b')
      .getResultList();
  });

  test('em.find with filter on child inverse M:N via the STI root', async () => {
    // realistic usage hitting the same underlying bug: filtering by the
    // inverse M:N auto-joins it through the STI root.
    await orm.em.find(Animal as typeof Cat, { friendOf: { id: 1 } });
  });
});
