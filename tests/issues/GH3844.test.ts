import { Entity, PrimaryKey, Property, OneToOne, Ref, ref } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class GamePoolEntity {

  @PrimaryKey()
  contract_address!: string;

  @PrimaryKey()
  chain_id!: number;

  @Property()
  rpc_url!: string;

  @Property()
  referral_percents!: number[];

  @Property()
  referral_campaign_id!: number;

  @OneToOne(() => GamePoolScannerEntity, e => e.game_pool, {
    orphanRemoval: true,
    ref: true,
  })
  scanner!: Ref<GamePoolScannerEntity>;

  @Property()
  created_at: Date = new Date();

  @Property({
    onUpdate: () => new Date(),
  })
  updated_at: Date = new Date();

}

@Entity()
class GamePoolScannerEntity {

  @OneToOne(() => GamePoolEntity, e => e.scanner, {
    primary: true,
    owner: true,
    fieldNames: ['contract_address', 'chain_id'],
    ref: true,
  })
  game_pool!: Ref<GamePoolEntity>;

  @Property()
  start_block!: number;

  @Property({ nullable: true })
  current_block?: number;

  @Property()
  min_confirmations!: number;

  @Property()
  created_at: Date = new Date();

  @Property({
    onUpdate: () => new Date(),
  })
  updated_at: Date = new Date();

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [GamePoolEntity],
    dbName: `:memory:`,
  });
  await orm.schema.refreshDatabase();
});

beforeEach(async () => orm.schema.clearDatabase());

afterAll(() => orm.close(true));

test('GH3844', async () => {
  let em = orm.em.fork();

  const gamePool = new GamePoolEntity();
  gamePool.contract_address = '0x22';
  gamePool.chain_id = 5;
  gamePool.rpc_url = 'https://aaa.com';
  gamePool.referral_percents = [10_000];
  gamePool.referral_campaign_id = 10;
  gamePool.created_at = new Date();
  gamePool.updated_at = new Date();

  const gamePoolScanner = new GamePoolScannerEntity();
  gamePoolScanner.created_at = new Date();
  gamePoolScanner.game_pool = ref(gamePool);
  gamePoolScanner.min_confirmations = 15;
  gamePoolScanner.start_block = 1;
  gamePoolScanner.updated_at = new Date();

  em.persist(gamePoolScanner);

  await em.flush();

  em = orm.em.fork();

  const loadedGamePool = await em.findOneOrFail(
    GamePoolEntity,
    {
      contract_address: '0x22',
      chain_id: 5,
    },
    { populate: ['scanner'] },
  );
  expect(loadedGamePool).toBe(loadedGamePool.scanner.unwrap().game_pool.unwrap());

  em = orm.em.fork();

  const loadGamePoolScanner = await em.findOneOrFail(GamePoolScannerEntity, {
    game_pool: {
      contract_address: '0x22',
      chain_id: 5,
    },
  });
});

test('GH3844 with QB', async () => {
  const gamePool = new GamePoolEntity();
  gamePool.contract_address = '0x22';
  gamePool.chain_id = 5;
  gamePool.rpc_url = 'https://aaa.com';
  gamePool.referral_percents = [10_000];
  gamePool.referral_campaign_id = 10;
  gamePool.created_at = new Date();
  gamePool.updated_at = new Date();
  await orm.em.createQueryBuilder(GamePoolEntity).insert(gamePool).execute();

  const gamePoolScanner = new GamePoolScannerEntity();
  gamePoolScanner.created_at = new Date();
  gamePoolScanner.game_pool = ref(gamePool);
  gamePoolScanner.min_confirmations = 15;
  gamePoolScanner.start_block = 1;
  gamePoolScanner.updated_at = new Date();

  await orm.em.createQueryBuilder(GamePoolScannerEntity).insert(gamePoolScanner).execute();
});
