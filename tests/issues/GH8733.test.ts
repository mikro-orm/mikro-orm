import { Collection, MikroORM, Ref } from '@mikro-orm/mssql';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Entity()
class Team {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'date', nullable: true })
  foundedAt?: string | null;

  @OneToMany(() => TeamMember, member => member.team)
  members = new Collection<TeamMember>(this);
}

@Entity()
class TeamMember {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Team, { ref: true })
  team!: Ref<Team>;

  @Property({ type: 'date', nullable: true })
  startDate?: string | null;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '8733',
    password: 'Root.Root',
    entities: [Team, TeamMember],
  });
  await orm.schema.refresh();

  const team = orm.em.create(Team, { foundedAt: '2026-01-15' });
  orm.em.create(TeamMember, { team, startDate: '2026-07-01' });
  orm.em.create(TeamMember, { team, startDate: '2026-07-02' });
  await orm.em.flush();
});

beforeEach(() => orm.em.clear());

afterAll(() => orm.close(true));

test('GH #8733 (joined collection)', async () => {
  const team = await orm.em.findOneOrFail(
    Team,
    { foundedAt: '2026-01-15' },
    { populate: ['members'], strategy: 'joined' },
  );
  expect(team.members.getItems().map(member => member.startDate)).toEqual(['2026-07-01', '2026-07-02']);

  const mock = mockLogger(orm, ['query']);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('GH #8733 (joined to-one relation)', async () => {
  const members = await orm.em.findAll(TeamMember, { populate: ['team'], strategy: 'joined', orderBy: { id: 'asc' } });
  expect(members.map(member => member.team.$.foundedAt)).toEqual(['2026-01-15', '2026-01-15']);

  const mock = mockLogger(orm, ['query']);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
