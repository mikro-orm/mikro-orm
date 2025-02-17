import { MikroORM } from '@mikro-orm/sqlite';
import { Embeddable, Embedded, Entity, OneToOne, PrimaryKey, Property, Rel } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { mockLogger } from '../helpers.js';

@Entity()
class Course {

  @PrimaryKey()
  id: string = v4();

  @OneToOne({ entity: () => Customization, nullable: true })
  draft?: Rel<Customization>;

  @OneToOne({ entity: () => Customization, nullable: true })
  published?: Rel<Customization>;

}

@Entity()
class Customization {

  @PrimaryKey()
  id: string = v4();

  @Embedded(() => Topic, { array: true, nullable: true })
  topics?: Topic[] = [];

}


@Embeddable()
class Topic {

  @Property()
  private _name!: string;

  get name(): string {
    return this._name;
  }

}

function createCustomization() {
  const topic = new Topic();
  const customization = new Customization();
  customization.topics = [topic];

  return customization;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Course, Customization, Topic],
    dbName: ':memory:',
  });
  await orm.getSchemaGenerator().createSchema();

  const course1 = new Course();
  course1.published = createCustomization();
  orm.em.persist(course1);

  const course2 = new Course();
  course2.draft = createCustomization();
  orm.em.persist(course2);

  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('json property hydration', async () => {
  await orm.em.find(Course, {}, { populate: ['*'] });
  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
