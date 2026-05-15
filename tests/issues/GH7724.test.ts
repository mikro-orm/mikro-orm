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

  test('self-referencing M:N on STI child can be joined via the STI root', async () => {
    await orm.em
      .qb(Animal, 'e')
      .leftJoinAndSelect('e.friends' as never, 'a')
      .leftJoinAndSelect('e.friendOf' as never, 'b')
      .getResultList();
  });
});
