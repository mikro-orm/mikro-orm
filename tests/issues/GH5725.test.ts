import { ManyToOne, MikroORM, Ref } from '@mikro-orm/sqlite';
import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
@Index({ properties: ['age'] })
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  age!: number;

}

@Entity()
@Index({ properties: ['user'] })
class Apartment {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User, {
    fieldName: 'ref_user_id',
    ref: true,
  })
  user!: Ref<User>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Apartment],
  });
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 5725`, async () => {
  await orm.schema.refreshDatabase();
});
