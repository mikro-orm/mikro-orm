import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { JsonType, MikroORM, Platform } from '@mikro-orm/postgresql';

interface MyEvent {
  title: string;
  date: Date;
}

class EventType extends JsonType {

  convertToJSValue(rawValue: MyEvent, platform: Platform): MyEvent {
    const value = super.convertToJSValue(rawValue, platform) as MyEvent;

    if (typeof value === 'string') {
      throw new Error('Invalid value for MyEvent');
    }

    return {
      title: value.title,
      date: new Date(value.date),
    };
  }

}

@Entity()
class EntityWithCustomType {
  @PrimaryKey({ type: 'string' })
  id: string;

  @Property({ type: new EventType() })
  event: MyEvent;

  constructor(id: string, event: MyEvent) {
    this.id = id;
    this.event = event;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'mikro-orm-reproduction-123',
    entities: [EntityWithCustomType],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('Custom Type', async () => {
  const event: MyEvent = {
    title: 'Test Event',
    date: new Date(2024, 6, 1),
  };
  // Setup
  const entityWithArray = new EntityWithCustomType('1', event);
  orm.em.persist(entityWithArray);
  await orm.em.flush();
  orm.em.clear();

  // Test
  const partialEntity = await orm.em.findOneOrFail(EntityWithCustomType, '1', { fields: ['id'] });
  expect(partialEntity).toBeDefined();

  const populatedEntity = await orm.em.findOneOrFail(EntityWithCustomType, '1', { populate: ['event'] });
  expect(populatedEntity).toBeDefined();
  expect(populatedEntity.event.date).toEqual(new Date(2024, 6, 1));
});
