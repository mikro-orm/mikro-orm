import { Collection, Entity, ManyToMany, MetadataStorage, PrimaryKey, Property, ReferenceKind } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/better-sqlite';

@Entity({ schema: 'staff', tableName: 'person' })
class Person {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany({ entity: () => 'Phone', owner: true, pivotTable: 'tic.person_phone', joinColumn: 'person_id', inverseJoinColumn: 'phone_id' })
  phones = new Collection<Phone>(this);

}

@Entity({ schema: 'tic', tableName: 'phone' })
class Phone {

  @PrimaryKey()
  id!: number;

  @Property()
  number!: string;

  @ManyToMany({ entity: () => 'Person', mappedBy: (e: Person) => e.phones })
  people: Collection<Person> = new Collection<Person>(this);

}

@Entity()
class FooBar {

  @PrimaryKey()
  id!: number;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Person, Phone, FooBar],
    dbName: ':memory:',
    discovery: {
      onMetadata(meta) {
        // sqlite driver does not support schemas
        delete meta.schema;

        meta.tableName += '_2';

        for (const prop of meta.relations) {
          if (prop.kind === ReferenceKind.MANY_TO_MANY && prop.owner && prop.pivotTable.includes('.')) {
            prop.pivotTable = prop.pivotTable.split('.')[1];
          }
        }

        meta.addProperty({ name: 'version', version: true, type: 'integer' });
      },
      afterDiscovered(storage: MetadataStorage) {
        storage.reset('FooBar');
      },
    },
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('discovery hooks', async () => {
  await expect(orm.schema.getCreateSchemaSQL()).resolves.toMatchSnapshot();

  const person = new Person();
  person.name = 'John Wick';
  const phone = new Phone();
  phone.number = '666555444';
  person.phones.add(phone);
  await orm.em.persistAndFlush(person);

  orm.em.clear();
  const [personLoaded] = await orm.em.find(Person, {}, { populate: ['phones'] });
  personLoaded.phones.remove(personLoaded.phones[0]);
  await orm.em.flush();
});
