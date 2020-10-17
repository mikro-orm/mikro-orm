import { Entity, Enum, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ discriminatorColumn: 'type', abstract: true })
export abstract class Person {

  @PrimaryKey()
  id!: string;

  @Enum()
  type!: 'gardener' | 'teacher' | 'chef';

}

@Entity({ discriminatorValue: 'chef' })
export class Chef extends Person {

  @Property()
  kitchen?: string;

}

@Entity({ discriminatorValue: 'gardener' })
export class Gardener extends Person {

  @Property()
  plant?: string;

}

@Entity({ discriminatorValue: 'teacher' })
export class Teacher extends Person {

  @Property()
  subject?: string;

}

describe('GH issue 923', () => {

  test(`discovery with STI is not dependent on order of entities 1`, async () => {
    const orm = await MikroORM.init({
      entities: [Person, Chef, Teacher, Gardener],
      type: 'sqlite',
      dbName: ':memory:',
    }, false);
    const meta = orm.getMetadata().get('Person');
    expect(meta.discriminatorMap).toEqual({ chef: 'Chef', teacher: 'Teacher', gardener: 'Gardener' });
  });

  test(`discovery with STI is not dependent on order of entities 2`, async () => {
    const orm = await MikroORM.init({
      entities: [Chef, Teacher, Gardener, Person],
      type: 'sqlite',
      dbName: ':memory:',
    }, false);
    const meta = orm.getMetadata().get('Person');
    expect(meta.discriminatorMap).toEqual({ chef: 'Chef', teacher: 'Teacher', gardener: 'Gardener' });
  });

  test(`discovery with STI is not dependent on order of entities 3`, async () => {
    const orm = await MikroORM.init({
      entities: [Chef, Teacher, Person, Gardener],
      type: 'sqlite',
      dbName: ':memory:',
    }, false);
    const meta = orm.getMetadata().get('Person');
    expect(meta.discriminatorMap).toEqual({ chef: 'Chef', teacher: 'Teacher', gardener: 'Gardener' });
  });

  test(`discovery with STI is not dependent on order of entities 4`, async () => {
    const orm = await MikroORM.init({
      entities: [Chef, Person, Teacher, Gardener],
      type: 'sqlite',
      dbName: ':memory:',
    }, false);
    const meta = orm.getMetadata().get('Person');
    expect(meta.discriminatorMap).toEqual({ chef: 'Chef', teacher: 'Teacher', gardener: 'Gardener' });
  });

});
