import { Entity, Enum, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity({ discriminatorColumn: 'type', abstract: true })
abstract class Person {

  @PrimaryKey()
  id!: string;

  @Enum()
  type!: 'gardener' | 'teacher' | 'chef';

}

@Entity({ discriminatorValue: 'chef' })
class Chef extends Person {

  @Property()
  kitchen?: string;

}

@Entity({ discriminatorValue: 'gardener' })
class Gardener extends Person {

  @Property()
  plant?: string;

}

@Entity({ discriminatorValue: 'teacher' })
class Teacher extends Person {

  @Property()
  subject?: string;

}

describe('GH issue 923', () => {

  test(`discovery with STI is not dependent on order of entities 1`, async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Person, Chef, Teacher, Gardener],
      dbName: ':memory:',
    });
    const meta = orm.getMetadata().get('Person');
    expect(meta.discriminatorMap).toEqual({ chef: 'Chef', teacher: 'Teacher', gardener: 'Gardener' });
  });

  test(`discovery with STI is not dependent on order of entities 2`, async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Chef, Teacher, Gardener, Person],
      dbName: ':memory:',
    });
    const meta = orm.getMetadata().get('Person');
    expect(meta.discriminatorMap).toEqual({ chef: 'Chef', teacher: 'Teacher', gardener: 'Gardener' });
  });

  test(`discovery with STI is not dependent on order of entities 3`, async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Chef, Teacher, Person, Gardener],
      dbName: ':memory:',
    });
    const meta = orm.getMetadata().get('Person');
    expect(meta.discriminatorMap).toEqual({ chef: 'Chef', teacher: 'Teacher', gardener: 'Gardener' });
  });

  test(`discovery with STI is not dependent on order of entities 4`, async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Chef, Person, Teacher, Gardener],
      dbName: ':memory:',
    });
    const meta = orm.getMetadata().get('Person');
    expect(meta.discriminatorMap).toEqual({ chef: 'Chef', teacher: 'Teacher', gardener: 'Gardener' });
  });

});
