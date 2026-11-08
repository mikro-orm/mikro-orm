import { MikroORM, Ref } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, PrimaryKey, Unique } from '@mikro-orm/decorators/legacy';

@Entity()
class Carrier {
  @PrimaryKey({ type: 'integer' })
  id!: number;
}

@Entity()
@Unique({ properties: ['id', 'carrier'] })
class System {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @ManyToOne(() => Carrier, { ref: true })
  carrier!: Ref<Carrier>;
}

// the FK references the target PK plus a column of a composite unique key, which `carrier` owns
@Entity()
class Location {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @ManyToOne(() => Carrier, { ref: true })
  carrier!: Ref<Carrier>;

  @ManyToOne(() => System, {
    ref: true,
    nullable: true,
    joinColumns: ['system_id', 'carrier_id'],
    referencedColumnNames: ['id', 'carrier_id'],
  })
  system?: Ref<System> | null;
}

// the same FK with the shared column first
@Entity()
class Route {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @ManyToOne(() => Carrier, { ref: true })
  carrier!: Ref<Carrier>;

  @ManyToOne(() => System, {
    ref: true,
    nullable: true,
    joinColumns: ['carrier_id', 'system_id'],
    referencedColumnNames: ['carrier_id', 'id'],
  })
  system?: Ref<System> | null;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Carrier, System, Location, Route],
    dbName: 'mikro_orm_test_batch_update_shared_fk',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('batch update of a composite FK sharing a column with another relation', async () => {
  await orm.em
    .fork()
    .execute(
      `insert into carrier values (1); insert into system values (1, 1), (2, 1); insert into location values (1, 1, 1), (2, 1, 1); insert into route values (1, 1, 1), (2, 1, 1)`,
    );
  const em = orm.em.fork();
  const locations = await em.find(Location, {}, { orderBy: { id: 1 } });
  locations.forEach(l => (l.system = em.getReference(System, 2, { wrapped: true })));
  await em.flush();

  const rows = () => orm.em.getConnection().execute(`select * from location order by id`);
  expect(await rows()).toEqual([
    { id: 1, carrier_id: 1, system_id: 2 },
    { id: 2, carrier_id: 1, system_id: 2 },
  ]);

  // unsetting the relation clears the column it owns, the shared one stays with `carrier`
  locations.forEach(l => (l.system = null));
  await em.flush();
  expect(await rows()).toEqual([
    { id: 1, carrier_id: 1, system_id: null },
    { id: 2, carrier_id: 1, system_id: null },
  ]);

  const routes = await em.find(Route, {}, { orderBy: { id: 1 } });
  routes.forEach(r => (r.system = em.getReference(System, 2, { wrapped: true })));
  await em.flush();
  const routeRows = () => orm.em.getConnection().execute(`select * from route order by id`);
  expect(await routeRows()).toEqual([
    { id: 1, carrier_id: 1, system_id: 2 },
    { id: 2, carrier_id: 1, system_id: 2 },
  ]);

  // a single update used to write the scalar to the first join column, i.e. the shared one
  routes[0].system = em.getReference(System, 1, { wrapped: true });
  await em.flush();
  expect(await routeRows()).toEqual([
    { id: 1, carrier_id: 1, system_id: 1 },
    { id: 2, carrier_id: 1, system_id: 2 },
  ]);
});
