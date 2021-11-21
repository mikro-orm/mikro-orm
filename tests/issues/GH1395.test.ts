import { ObjectId } from 'bson';
import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';

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

});
