import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';

@Entity()
class Guild {

  @PrimaryKey()
  id!: number;

}

@Entity()
class Vendor {

  @PrimaryKey()
  id!: number;

}

@Unique({ properties: ['vendor', 'guild', 'timestamp', 'timeframe'] })
@Entity()
class GuildVendorTally {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'text' })
  timeframe: string;

  @Property({ type: 'text' })
  timestamp: string;

  @ManyToOne({ entity: () => Guild })
  guild: Guild;

  @ManyToOne({ entity: () => Vendor })
  vendor: Vendor;

  constructor(timeframe: string, timestamp: string, guild: Guild, vendor: Vendor) {
    this.timeframe = timeframe;
    this.timestamp = timestamp;
    this.guild = guild;
    this.vendor = vendor;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '6042',
    entities: [GuildVendorTally],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6042', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toMatch('alter table "guild_vendor_tally" add constraint "guild_vendor_tally_vendor_id_guild_id_timestamp_t_7a52c_unique" unique ("vendor_id", "guild_id", "timestamp", "timeframe");');
  const diff = await orm.schema.getUpdateSchemaSQL();
  expect(diff).toBe('');
});
