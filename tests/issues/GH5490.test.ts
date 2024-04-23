import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  raw,
} from '@mikro-orm/sqlite';

@Entity()
class Player {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => GameSession, gameSession => gameSession.player, { orphanRemoval: true, hidden: true })
  gameSessions = new Collection<GameSession>(this);

}

@Entity({ tableName: 'game_session' })
class GameSession {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Player, { joinColumn: 'player', nullable: true })
  player?: Player;

  @OneToMany(() => GameAction, gameAction => gameAction.gameSession, { orphanRemoval: true })
  gameActions = new Collection<GameAction>(this);

}

@Entity({ tableName: 'game_action' })
class GameAction {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => GameSession, { joinColumn: 'game_session', nullable: true })
  gameSession?: GameSession;

  @Property()
  value!: number;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Player],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('5490', async () => {
  const qb = orm.em.createQueryBuilder(Player, 'p');

  const query = qb
    .select([
      raw('max(ga.value) as max'),
      raw('avg(ga.value) as avg'),
    ])
    .leftJoin('gameSessions', 'gs')
    .leftJoin('gs.gameActions', 'ga')
    .where({ id: 123 });

  const result = await query
    .execute<{ max: number | null; avg: number | string | null }>('get');
  expect(result).toMatchObject({ max: null, avg: null });
});
