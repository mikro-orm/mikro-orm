import { Collection, Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';

@Entity({ schema: 'staff', tableName: 'person' })
class Person {

  @PrimaryKey({ nullable: true })
  id?: number;

  @Property()
  name!: string;

  @ManyToMany({ entity: () => 'Phone', owner: true, pivotTable: 'tic.person_phone', joinColumn: 'person_id', inverseJoinColumn: 'phone_id' })
  phones = new Collection<Phone>(this);

}

@Entity({ schema: 'tic', tableName: 'phone' })
class Phone {

  @PrimaryKey({ nullable: true })
  id?: number;

  @Property()
  number!: string;

  @ManyToMany({ entity: () => 'Person', mappedBy: (e: Person) => e.phones })
  people: Collection<Person> = new Collection<Person>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Person, Phone],
    dbName: '4516',
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH issue 4516', async () => {
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
