import { MikroORM, OptionalProps, type Ref } from '@mikro-orm/postgresql';
import { Embeddable, Embedded, Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ abstract: true })
abstract class BaseEntity<E extends object = never, Optional extends keyof E = never> {

  [OptionalProps]?: 'createdAt' | 'updatedAt' | Optional;

  @PrimaryKey()
  id!: number;

  @Property({ onCreate: () => new Date() })
  createdAt = new Date();

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt = new Date();

}

@Embeddable()
class PropertyDetails {

  @ManyToOne(() => PropertyType, { ref: true, eager: true })
  type!: Ref<PropertyType>;

}

@Embeddable()
class ListingInfo {

  @Property()
  title!: string;

}

@Entity()
class PropertyType extends BaseEntity {

  @Property({ unique: true })
  name!: string;

}

@Entity()
class Listing extends BaseEntity {

  @Embedded(() => PropertyDetails, { object: true })
  property!: PropertyDetails;

  @Embedded(() => ListingInfo, { object: true })
  info!: ListingInfo;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'embedded-relation-query',
    entities: [BaseEntity, PropertyType, Listing],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('relationship inside embedded object', async () => {
  const house = orm.em.create(PropertyType, { name: 'house' });

  for (let i = 0; i < 10; i++) {
    orm.em.create(Listing, {
      property: {
        type: house,
      },
      info: {
        title: 'Spacious Apartment in City Center',
      },
    });
  }

  await orm.em.flush();
  orm.em.clear();

  const listings = await orm.em.findAll(Listing);
  expect(listings).toHaveLength(10);

  const listingType = await listings[0].property.type.loadOrFail();
  expect(listingType.name).toBe('house');
});
