import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';

enum GreatEnum {
  EnumValue = 'enumValue',
  AnotherEnumValue = 'anotherEnumValue'
}

@Entity()
class MyEntity {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'json', default: '[]' })
  greatProp: GreatEnum[] = [];

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'gh4555',
    entities: [MyEntity],
  });

  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

it('4555', async () => {
  const root = new MyEntity();
  root.greatProp = [GreatEnum.AnotherEnumValue];

  await orm.em.persistAndFlush(root);
});
