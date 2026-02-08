import { ObjectId } from 'bson';
import { wrap } from '@mikro-orm/core';
import { Embeddable, Embedded, Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/mongodb';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

@Embeddable()
class ApiIpApiRequest {
  @Property()
  body?: Record<string, unknown>;

  @Property()
  headers?: Record<string, unknown>;

  @Property()
  method!: string;

  @Property()
  url!: string;
}

@Embeddable()
class ApiIpApiResponse {
  @Property()
  json?: Record<string, unknown>;
}

@Entity()
class ApiIpApi {
  @PrimaryKey()
  _id!: ObjectId;

  @Embedded(() => ApiIpApiRequest, { object: true })
  request?: ApiIpApiRequest;

  @Embedded(() => ApiIpApiResponse, { object: true })
  response?: ApiIpApiResponse;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [ApiIpApi],
    clientUrl: 'mongodb://localhost:27017/mikro-orm-test-4755',
    metadataProvider: TsMorphMetadataProvider,
    metadataCache: { enabled: false },
  });
  await orm.em.insert(ApiIpApi, {
    request: {
      body: { ip: '123.123.123', foo: 'bar', lol: true, num: 123 },
      method: 'post',
      url: 'url',
    },
  });
});

afterAll(() => orm.close(true));

test('GH #4755', async () => {
  const foo = await orm.em.findOneOrFail(ApiIpApi, {
    request: {
      body: {
        ip: '123.123.123',
      },
    },
  });
  expect(wrap(foo).toObject()).toEqual({
    _id: foo._id.toString(),
    request: {
      body: { ip: '123.123.123', foo: 'bar', lol: true, num: 123 },
      method: 'post',
      url: 'url',
    },
  });
});
