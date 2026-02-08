import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, Enum, ManyToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({
  discriminatorColumn: 'type',
  discriminatorMap: { person: 'Person', employee: 'Employee' },
})
abstract class BasePerson {
  @PrimaryKey()
  id!: number;

  @Enum()
  type!: 'person' | 'employee';
}

@Entity()
class Person extends BasePerson {
  // ...
}

@Entity()
class Employee extends BasePerson {
  @ManyToMany({ entity: () => PhotoFile, inversedBy: 'employees' })
  photos = new Collection<PhotoFile>(this);
}

@Entity({
  discriminatorColumn: 'type',
  discriminatorMap: { custom: 'CustomFile', photo: 'PhotoFile' },
})
abstract class File {
  @PrimaryKey()
  id!: number;

  @Enum()
  type!: 'custom' | 'photo';
}

@Entity()
class CustomFile extends File {
  // ...
}

@Entity()
class PhotoFile extends File {
  @ManyToMany({ entity: () => Employee, mappedBy: 'photos' })
  employees = new Collection<Employee>(this);
}

describe('bidirectional many to many with multiple STI entities', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [BasePerson, Employee, Person, File, CustomFile, PhotoFile],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('Owning side', async () => {
    const b = new Employee();
    await orm.em.persist(b).flush();
    orm.em.clear();

    await orm.em.findOne(
      Employee,
      { id: 1 },
      {
        populate: ['photos'],
      },
    );
  });

  test('Inversed side', async () => {
    const a = new PhotoFile();
    await orm.em.persist(a).flush();
    orm.em.clear();

    await orm.em.findOne(
      PhotoFile,
      { id: 1 },
      {
        populate: ['employees'],
      },
    );
  });
});
