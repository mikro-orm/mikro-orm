import { Entity, EntityRepositoryType, ManyToOne, MikroORM, PrimaryKey } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/knex';

class ProviderRepository extends EntityRepository<Provider> {}
class UserRepository extends EntityRepository<User> {}
class MemberRepository extends EntityRepository<Member> {}
class SessionRepository extends EntityRepository<Session> {}
class ParticipantRepository extends EntityRepository<Participant> {

  async get(session: Session, member: Member) {
    return this.findOne({ session, member });
  }

}

@Entity({ customRepository: () => ProviderRepository })
export class Provider {

  [EntityRepositoryType]?: ProviderRepository;

  @PrimaryKey()
  id: number;

  constructor(id: number) {
    this.id = id;
  }

}

@Entity({ customRepository: () => UserRepository })
export class User {

  [EntityRepositoryType]?: UserRepository;

  @PrimaryKey()
  id: number;

  constructor(id: number) {
    this.id = id;
  }

}

@Entity({ customRepository: () => MemberRepository })
export class Member {

  [EntityRepositoryType]?: MemberRepository;

  @ManyToOne(() => Provider, { eager: true, primary: true })
  provider: Provider;

  @ManyToOne(() => User, { eager: true, primary: true })
  user: User;

  constructor(a: Provider, b: User) {
    this.provider = a;
    this.user = b;
  }

}

@Entity({ customRepository: () => SessionRepository })
export class Session {

  [EntityRepositoryType]?: SessionRepository;

  @PrimaryKey()
  id: number;

  @ManyToOne(() => Member, { eager: true })
  owner: Member;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @ManyToOne(() => Participant, { nullable: true, default: null, eager: true })
  lastActionBy: Participant | null = null;

  constructor(id: number, owner: Member) {
    this.id = id;
    this.owner = owner;
  }

}

@Entity({ customRepository: () => ParticipantRepository })
export class Participant {

  [EntityRepositoryType]?: ParticipantRepository;

  @ManyToOne(() => Session, { eager: true, primary: true })
  session: Session;

  @ManyToOne(() => Member, { eager: true, primary: true })
  member: Member;

  constructor(session: Session, member: Member) {
    this.session = session;
    this.member = member;
  }

}

describe('GH #2647, #2742', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Provider, User, Member, Session, Participant],
      dbName: `:memory:`,
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(Participant, {});
    await orm.em.nativeDelete(Session, {});
    await orm.em.nativeDelete(Member, {});
    await orm.em.nativeDelete(User, {});
    await orm.em.nativeDelete(Provider, {});
  });

  function createEntities(pks: [providerId: number, userId: number, sessionId: number]) {
    const provider = new Provider(pks[0]);
    const user = new User(pks[1]);
    const member = new Member(provider, user);
    const session = new Session(pks[2], member);
    const participant = new Participant(session, member);
    session.lastActionBy = participant;
    orm.em.persist([provider, user, member, session, participant]);

    return { provider, user, member, session, participant };
  }

  it('should be able to populate circularity', async () => {
    const { session, member } = createEntities([1, 2, 3]);
    await orm.em.flush();
    orm.em.clear();

    const res = await orm.em.find(Participant, { session, member });
    expect(res).toHaveLength(1);
    expect(res[0]).toBe(res[0].session.lastActionBy);
  });

  it('should be able to find entity with nested composite key (multi insert)', async () => {
    createEntities([11, 12, 13]);
    createEntities([21, 22, 23]);
    createEntities([31, 32, 33]);
    await orm.em.flush();
    orm.em.clear();

    const res = await orm.em.find(Participant, {});
    expect(res).toHaveLength(3);
    expect(res[0]).toBe(res[0].session.lastActionBy);
    expect(res[1]).toBe(res[1].session.lastActionBy);
    expect(res[2]).toBe(res[2].session.lastActionBy);
  });

});
