import { Collection, MikroORM } from '@mikro-orm/core';
import { Entity, Enum, ManyToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity({
  discriminatorColumn: 'type',
  discriminatorMap: { person: 'Person', employee: 'Employee' },
})
export abstract class BasePerson {

  @PrimaryKey()
  id!: number;

  @Enum()
  type!: 'person' | 'employee';

}

@Entity()
export class Person extends BasePerson {
  // ...
}

@Entity()
export class Employee extends BasePerson {

  @ManyToMany({ entity: () => PhotoFile, inversedBy: 'employees' })
  photos = new Collection<PhotoFile>(this);

}

@Entity({
  discriminatorColumn: 'type',
  discriminatorMap: { custom: 'CustomFile', photo: 'PhotoFile' },
})
export abstract class File {

  @PrimaryKey()
  id!: number;

  @Enum()
  type!: 'custom' | 'photo';

}

@Entity()
export class CustomFile extends File {
  // ...
}

@Entity()
export class PhotoFile extends File {

  @ManyToMany({ entity: () => Employee, mappedBy: 'photos' })
  employees = new Collection<Employee>(this);

}

describe('bidirectional many to many with multiple STI entities', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [BasePerson, Employee, Person, File, CustomFile, PhotoFile],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('Owning side', async () => {
    const b = new Employee();
    await orm.em.persist(b).flush();
    orm.em.clear();

    await orm.em.findOne(Employee, { id: 1 }, {
      populate: ['photos'],
    });
  });

  test('Inversed side', async () => {
    const a = new PhotoFile();
    await orm.em.persist(a).flush();
    orm.em.clear();

    await orm.em.findOne(PhotoFile, { id: 1 }, {
      populate: ['employees'],
    });
  });

});
