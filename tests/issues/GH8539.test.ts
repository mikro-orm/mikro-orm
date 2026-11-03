import { MikroORM, PrimaryKeyProp, Ref } from '@mikro-orm/mssql';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Entity()
class Team {
  @PrimaryKey()
  id!: number;
}

@Entity()
class TeamMember {
  [PrimaryKeyProp]?: ['team', 'userId'];

  @ManyToOne(() => Team, { primary: true, ref: true })
  team!: Ref<Team>;

  @PrimaryKey()
  userId!: number;

  @Property({ type: 'date', nullable: true })
  startDate?: string | null;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '8539',
    password: 'Root.Root',
    entities: [Team, TeamMember],
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('GH #8539', async () => {
  const team = orm.em.create(Team, {});
  orm.em.create(TeamMember, { team, userId: 1, startDate: '2026-07-01' });
  orm.em.create(TeamMember, { team, userId: 2, startDate: '2026-07-01' });
  await orm.em.flush();
  orm.em.clear();

  const teamMembers = await orm.em.findAll(TeamMember);
  expect(teamMembers.map(teamMember => teamMember.startDate)).toEqual(['2026-07-01', '2026-07-01']);

  const mock = mockLogger(orm, ['query']);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
