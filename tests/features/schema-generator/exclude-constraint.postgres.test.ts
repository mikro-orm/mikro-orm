import { EntitySchema, MikroORM } from '@mikro-orm/postgresql';
import { Check, Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
@Check({ name: 'room_booking_no_overlap', expression: `exclude using gist (room_id with =, during with &&)` })
class RoomBooking {
  @PrimaryKey()
  id!: number;

  @Property()
  room_id!: number;

  @Property({ columnType: 'tstzrange' })
  during!: string;
}

describe('exclude constraint [postgres]', () => {
  test('exclude constraint roundtrip — create, then no diff on stable schema [postgres]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [RoomBooking],
      dbName: `mikro_orm_test_exclude_1`,
    });

    // btree_gist is required for the `=` operator on a regular type in a gist index
    await orm.schema.ensureDatabase();
    await orm.em.getConnection().execute('create extension if not exists btree_gist');

    const createSql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(createSql).toContain(
      `alter table "room_booking" add constraint "room_booking_no_overlap" exclude using gist (room_id with =, during with &&)`,
    );
    expect(createSql).not.toContain('check (exclude using');

    await orm.schema.execute(createSql);

    // After creation the diff must be empty — pg stores EXCLUDE as contype='x',
    // and introspection has to round-trip it back to the same expression for diffing
    // to see no change.
    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // Sanity: the constraint actually fires — overlapping inserts must be rejected
    await orm.em
      .getConnection()
      .execute(`insert into "room_booking" ("id", "room_id", "during") values (1, 1, '[2026-01-01, 2026-01-05)')`);
    await expect(
      orm.em
        .getConnection()
        .execute(`insert into "room_booking" ("id", "room_id", "during") values (2, 1, '[2026-01-03, 2026-01-10)')`),
    ).rejects.toThrow(/conflicting key value violates exclusion constraint/);

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('exclude constraint diff — add, change, remove [postgres]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [RoomBooking],
      dbName: `mikro_orm_test_exclude_2`,
    });

    await orm.schema.ensureDatabase();
    await orm.em.getConnection().execute('create extension if not exists btree_gist');
    const meta = orm.getMetadata();

    const tableMeta = new EntitySchema({
      properties: {
        id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
        room_id: { type: 'number', name: 'room_id', fieldName: 'room_id', columnType: 'int' },
        during: { type: 'string', name: 'during', fieldName: 'during', columnType: 'tstzrange' },
      },
      name: 'BookingDiff',
      tableName: 'booking_diff',
      checks: [],
    }).init().meta;
    meta.set(tableMeta.class, tableMeta);

    // Initial create — no exclude constraint yet
    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    await orm.schema.execute(diff);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // Add the EXCLUDE constraint
    tableMeta.checks = [
      { name: 'booking_diff_no_overlap', expression: 'exclude using gist (room_id with =, during with &&)' },
    ];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain(`add constraint "booking_diff_no_overlap" exclude using gist`);
    await orm.schema.execute(diff);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // Change the expression (drop the room_id predicate)
    tableMeta.checks = [{ name: 'booking_diff_no_overlap', expression: 'exclude using gist (during with &&)' }];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain(`drop constraint "booking_diff_no_overlap"`);
    expect(diff).toContain(`add constraint "booking_diff_no_overlap" exclude using gist (during with &&)`);
    await orm.schema.execute(diff);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // Remove the constraint
    tableMeta.checks = [];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain(`drop constraint "booking_diff_no_overlap"`);
    expect(diff).not.toContain(`add constraint`);
    await orm.schema.execute(diff);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropDatabase();
    await orm.close();
  });
});
