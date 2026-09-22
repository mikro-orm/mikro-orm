import { MikroORM, OptionalProps, StringType, Utils } from '@mikro-orm/sql';
import type { AbstractSqlDriver } from '@mikro-orm/sql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PLATFORMS } from '../../bootstrap.js';
import { mockLogger } from '../../helpers.js';

@Entity({ inheritance: 'tpt' })
abstract class Parent {
  [OptionalProps]?: 'version';
  @PrimaryKey({ type: 'integer' })
  id!: number;
  @Property({ type: new StringType({ trim: true }), returning: true })
  name!: string;
  @Property({ type: 'integer', version: true })
  version!: number;
}
@Entity()
class Child extends Parent {
  @Property({ type: new StringType({ trim: true, case: 'upper' }), returning: true })
  code!: string;
}

@Entity({ abstract: true, discriminatorColumn: 'kind' })
abstract class Vehicle {
  @PrimaryKey({ type: 'integer' })
  id!: number;
  @Property({ type: new StringType({ trim: true }), returning: true })
  name!: string;
}
@Entity({ discriminatorValue: 'car' })
class Car extends Vehicle {
  @Property({ type: new StringType({ case: 'upper' }), returning: true })
  registration!: string;
}
@Entity({ discriminatorValue: 'bike' })
class Bike extends Vehicle {
  @Property({ type: new StringType({ case: 'lower' }), returning: true })
  colour!: string;
}

const options = {
  postgresql: { dbName: 'mikro_orm_test_returning_inheritance' },
  sqlite: { dbName: ':memory:' },
  mssql: { dbName: 'mikro_orm_test_returning_inheritance', password: 'Root.Root' },
};

describe.each(Utils.keys(options))('returning with inheritance [%s]', type => {
  let orm: MikroORM<AbstractSqlDriver>;
  beforeAll(async () => {
    orm = await MikroORM.init<AbstractSqlDriver>({
      entities: [Parent, Child, Vehicle, Car, Bike],
      metadataProvider: ReflectMetadataProvider,
      driver: PLATFORMS[type],
      ...options[type],
    });
    await orm.schema.refresh();
  });
  beforeEach(() => orm.schema.clear({ truncate: false }));
  afterAll(() => orm.close(true));

  test.each([false, true])('TPT returns only columns owned by each table (batch=%s)', async batch => {
    const em = orm.em.fork();
    const children = [1, 2].map(id => em.create(Child, { id, name: 'Initial', code: 'OLD' }));
    await em.flush();
    orm.config.set('useBatchUpdates', batch);
    children.forEach(child => {
      child.name = ` Child ${child.id} `;
      child.code = ` new ${child.id} `;
    });
    const mock = mockLogger(orm);
    await em.flush();
    children.forEach(child =>
      expect(child).toMatchObject({ name: `Child ${child.id}`, code: `NEW ${child.id}`, version: 2 }),
    );
    const updates = mock.mock.calls.map(([q]) => q as string).filter(q => q.includes('update '));
    expect(updates).toHaveLength(batch ? 2 : 4);
    for (const query of updates) {
      if (/update ["`[]parent/.test(query)) {
        expect(query).not.toContain('code');
      } else {
        expect(query).not.toMatch(/\bname\b|\bversion\b/);
      }
    }
    mock.mockClear();
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
    for (const child of children) {
      expect(await em.fork().findOneOrFail(Child, child.id)).toMatchObject({
        name: child.name,
        code: child.code,
        version: 2,
      });
    }
  });

  test('mixed STI batches return properties from both child types', async () => {
    orm.config.set('useBatchUpdates', true);
    const em = orm.em.fork();
    const car = em.create(Car, { id: 2, name: 'Car', registration: 'OLD' });
    const bike = em.create(Bike, { id: 1, name: 'Bike', colour: 'old' });
    await em.flush();
    car.name = ' Updated car ';
    car.registration = 'new';
    bike.name = ' Updated bike ';
    bike.colour = 'BLUE';
    const mock = mockLogger(orm);
    await em.flush();
    expect(car).toMatchObject({ name: 'Updated car', registration: 'NEW' });
    expect(bike).toMatchObject({ name: 'Updated bike', colour: 'blue' });
    expect(mock.mock.calls.filter(([q]) => (q as string).includes('update '))).toHaveLength(1);
    mock.mockClear();
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  });

  test('TPT upserts keep the required reload across parent and child tables', async () => {
    for (const revision of [1, 2]) {
      const em = orm.em.fork();
      const child = await em.upsert(Child, { id: 1, name: ` Child ${revision} `, code: ` code ${revision} ` });
      expect(child).toMatchObject({ name: `Child ${revision}`, code: `CODE ${revision}` });
      const mock = mockLogger(orm);
      await em.flush();
      expect(mock).not.toHaveBeenCalled();
    }
  });
});
