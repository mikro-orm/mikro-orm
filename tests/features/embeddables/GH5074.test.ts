import { MikroORM, Type } from '@mikro-orm/sqlite';
import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

class GeoPoint {

  constructor(
    readonly latitude: number,
    readonly longitude: number,
  ) {}

}

class GeoPointType extends Type<GeoPoint | undefined, string | undefined> {

  override convertToDatabaseValue(
    value: GeoPoint | undefined,
  ): string | undefined {
    if (!value) {
      return value;
    }

    return `point(${value.latitude} ${value.longitude})`;
  }

  override convertToJSValue(value: string | undefined): GeoPoint | undefined {
    const m = value?.match(/point\((-?\d+(\.\d+)?) (-?\d+(\.\d+)?)\)/i);

    if (!m) {
      return undefined;
    }

    return new GeoPoint(+m[1], +m[3]);
  }

  override convertToJSValueSQL(key: string) {
    return `ST_AsText(${key})`;
  }

  override convertToDatabaseValueSQL(key: string) {
    return `ST_PointFromText(${key}, 4326)`;
  }

  override getColumnType(): string {
    return 'point SRID 4326';
  }

}

@Embeddable()
class SnapshotMore {

  @Property({
    type: GeoPointType,
  })
  position!: GeoPoint;

  @Property({
    nullable: true,
  })
  description?: string;

}

@Embeddable()
class Snapshot {

  @Embedded(() => SnapshotMore, {
    object: true,
  })
  ref!: SnapshotMore;

}

@Entity()
class Outer {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Snapshot, {
    object: true,
  })
  bigSnapshot!: Snapshot;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Outer, Snapshot],
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 5074`, async () => {
  const snapshotMore = new SnapshotMore();
  snapshotMore.position = new GeoPoint(21, 32);

  const snapshot = new Snapshot();
  snapshot.ref = snapshotMore;

  const outer = new Outer();
  outer.id = 123_456;
  outer.bigSnapshot = snapshot;

  await orm.em.persist([outer]).flush();

  const result = await orm.em.fork().findOneOrFail(Outer, {
    id: outer.id,
  });
  expect(result.bigSnapshot.ref.position).toEqual({
    latitude: 21,
    longitude: 32,
  });
});
