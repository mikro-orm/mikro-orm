import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ schema: '*' })
class Person {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne({ entity: () => User, nullable: true })
  representsUser?: any;

}

@Entity({ schema: 'shared' })
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

  @OneToOne(() => Person, 'representsUser', { lazy: true })
  person?: Person;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '7082',
    entities: [User, Person],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
  await orm.schema.update({ schema: 'theSpecificSchema' });
});

afterAll(async () => {
  await orm.close(true);
});

test('person should be looked for in theSpecificSchema not in shared', async () => {
  const em = orm.em.fork({ schema: 'theSpecificSchema' });
  const res = await em.findAll(User, { fields: ['name', 'person.id'] });
});
