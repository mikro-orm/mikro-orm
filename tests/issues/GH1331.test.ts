import {
  BaseEntity,
  Collection,
  Entity,
  JsonType,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  Rel,
} from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
// } from '@mikro-orm/mysql';

@Entity()
class ShippingMethod extends BaseEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => ShippingMethodArea, (area) => area.shippingMethod)
  areas = new Collection<ShippingMethodArea>(this);
}

@Entity()
class ShippingMethodArea extends BaseEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  price!: number;

  @ManyToOne(() => ShippingArea)
  shippingArea!: Rel<ShippingArea>;

  @ManyToOne(() => ShippingMethod)
  shippingMethod!: Rel<ShippingMethod>;
}

@Entity()
class ShippingArea extends BaseEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ type: JsonType })
  codes!: string[];
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    // dbName: 'testing',
    // host: 'localhost',
    // user: 'root',
    // password: 'secret',
    entities: [ShippingMethod, ShippingMethodArea, ShippingArea],
    debug: ['query', 'query-params'],
    allowGlobalContext: true, // only for testing
    metadataProvider: TsMorphMetadataProvider,
    metadataCache: { enabled: false },
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  orm.em.create(ShippingMethod, {
    name: 'Shipping method',
    areas: [
      {
        price: 100,
        shippingArea: {
          name: 'Area 1',
          codes: [
            '93700', '93830', '93900', '97999', '98999', '99135',
            '12310', '12350', '12380', '12400',
          ],
        },
      },
      {
        price: 200,
        shippingArea: {
          name: 'Area 2',
          codes: [
            '32830', '32860', '32910', '32920', '39920', '39930', '39940',
            '39960', '39965', '39980', '39990', '41240', '41260', '41270',
            '41500', '41520', '41530', '41540', '41550', '41560', '41580',
            '41710', '41730', '41750', '41770', '41820', '41870', '41880',
          ],
        },
      },
    ],
  });

  await orm.em.flush();

  orm.em.clear();

  const shippingMethod = await orm.em.findOneOrFail(ShippingMethod, {
    name: 'Shipping method',
  });

  await shippingMethod.areas.init({
    populate: [
      'shippingArea',
    ],
  });

  const areas = shippingMethod.areas.getItems();

  expect(areas[0].shippingArea.codes).toContain('93700');
});
