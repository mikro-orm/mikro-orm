import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/es';

@Entity()
class User {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'string' })
  name: string;

  @ManyToOne(() => User, { mapToPk: true })
  manager: number;

  @ManyToOne(() => User)
  friend: User;

  constructor(name: string, manager: number, friend: User) {
    this.name = name;
    this.manager = manager;
    this.friend = friend;
  }
}

test('mapToPk maps to scalar type with new decorators (GH 7817)', async () => {
  const orm = await MikroORM.init({
    entities: [User],
    dbName: ':memory:',
  });
  await orm.schema.create();

  const meta = orm.getMetadata().get(User);
  expect(meta.properties.manager.mapToPk).toBe(true);

  await orm.close(true);
});
