import { ObjectId } from 'bson';
import { Entity, MikroORM, PrimaryKey, Property, t, wrap } from '@mikro-orm/core';

export interface EmailMessageTest {
  html?: string;
  language?: string;
}

@Entity()
export class TestTemplate {

  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  name!: string;

  @Property({ type: 'json', nullable: true })
  messages?: EmailMessageTest[];

  @Property({ type: t.json, nullable: false })
  geometry?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };

}

describe('GH issue 1395', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [TestTemplate],
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test?replicaSet=rs',
      type: 'mongo',
    });
    await orm.em.nativeDelete(TestTemplate, {});
  });

  afterAll(() => orm.close(true));

  test('json prop with array of objects', async () => {
    let item = orm.em.create(TestTemplate, {
      name: 'test',
      messages: [
        { html: 'aaa', language: 'en' },
        { html: 'bbb', language: 'fr' },
      ],
    });
    await orm.em.persistAndFlush(item);

    expect(item.messages).toEqual([
      { html: 'aaa', language: 'en' },
      { html: 'bbb', language: 'fr' },
    ]);

    orm.em.clear();
    item = await orm.em.findOneOrFail(TestTemplate, item);

    expect(item.messages).toEqual([
      { html: 'aaa', language: 'en' },
      { html: 'bbb', language: 'fr' },
    ]);

    orm.em.assign(item, {
      name: 'test new name',
      messages: [
        { html: 'xxx', language: 'en' },
        { html: 'yyy', language: 'fr' },
      ],
    });
    expect(item.messages).toEqual([
      { html: 'xxx', language: 'en' },
      { html: 'yyy', language: 'fr' },
    ]);
    await orm.em.flush();

    orm.em.clear();
    item = await orm.em.findOneOrFail(TestTemplate, item);

    expect(item.messages).toEqual([
      { html: 'xxx', language: 'en' },
      { html: 'yyy', language: 'fr' },
    ]);
  });

  test('assign to JSON property (GH #2492)', async () => {
    const item1 = orm.em.create(TestTemplate, {
      name: 'test',
      messages: [
        { html: 'aaa', language: 'en' },
        { html: 'bbb', language: 'fr' },
      ],
      geometry: {
        top: 0,
        left: 0,
        width: 640,
        height: 480,
      },
    });
    expect(item1).toMatchObject({
      name: 'test',
      messages: [ { html: 'aaa', language: 'en' }, { html: 'bbb', language: 'fr' } ],
      geometry: { top: 0, left: 0, width: 640, height: 480 },
    });

    const item2 = orm.em.create(TestTemplate, {});
    wrap(item2).assign({
      name: 'test',
      messages: [
        { html: 'aaa', language: 'en' },
        { html: 'bbb', language: 'fr' },
      ],
      geometry: {
        top: 0,
        left: 0,
        width: 640,
        height: 480,
      },
    });
    expect(item2).toMatchObject({
      name: 'test',
      messages: [ { html: 'aaa', language: 'en' }, { html: 'bbb', language: 'fr' } ],
      geometry: { top: 0, left: 0, width: 640, height: 480 },
    });
  });

});
