import { MikroORM, PrimaryKeyProp } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
export class Provider {

  @PrimaryKey()
  id: number;

  constructor(id: number) {
    this.id = id;
  }

}

@Entity()
export class User {

  @PrimaryKey()
  id: number;

  constructor(id: number) {
    this.id = id;
  }

}

@Entity()
export class Member {

  [PrimaryKeyProp]?: ['provider', 'user'];

  @ManyToOne(() => Provider, { eager: true, primary: true })
  provider: Provider;

  @ManyToOne(() => User, { eager: true, primary: true })
  user: User;

  constructor(a: Provider, b: User) {
    this.provider = a;
    this.user = b;
  }

}

@Entity()
export class Session {

  @PrimaryKey()
  id: number;

  @ManyToOne(() => Member, { eager: true })
  owner: Member;

  @ManyToOne(() => Participant, { nullable: true, default: null, eager: true })
  lastActionBy: Participant | null = null;

  constructor(id: number, owner: Member) {
    this.id = id;
    this.owner = owner;
  }

}

@Entity()
export class Participant {

  [PrimaryKeyProp]?: ['session', 'member'];

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
      metadataProvider: ReflectMetadataProvider,
      entities: [Provider, User, Member, Session, Participant],
      dbName: ':memory:',
    });
    await orm.schema.create();
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

  it('should be able to populate circularity (select-in)', async () => {
    const { session, member } = createEntities([1, 2, 3]);
    await orm.em.flush();
    orm.em.clear();

    const res = await orm.em.find(Participant, { session, member }, { strategy: 'select-in' });
    expect(res).toHaveLength(1);
    expect(res[0]).toBe(res[0].session.lastActionBy);
    orm.em.getUnitOfWork().computeChangeSets();
    expect(orm.em.getUnitOfWork().getChangeSets()).toHaveLength(0);
  });

  it('should be able to find entity with nested composite key (multi insert, select-in)', async () => {
    createEntities([11, 12, 13]);
    createEntities([21, 22, 23]);
    createEntities([31, 32, 33]);
    await orm.em.flush();
    orm.em.clear();

    const res = await orm.em.find(Participant, {}, { strategy: 'select-in' });
    expect(res).toHaveLength(3);
    expect(res[0]).toBe(res[0].session.lastActionBy);
    expect(res[1]).toBe(res[1].session.lastActionBy);
    expect(res[2]).toBe(res[2].session.lastActionBy);
  });

  it('should be able to populate circularity (joined)', async () => {
    const { session, member } = createEntities([1, 2, 3]);
    await orm.em.flush();
    orm.em.clear();

    const res = await orm.em.find(Participant, { session, member }, { strategy: 'joined' });
    expect(res).toHaveLength(1);
    expect(res[0]).toBe(res[0].session.lastActionBy);
    orm.em.getUnitOfWork().computeChangeSets();
    expect(orm.em.getUnitOfWork().getChangeSets()).toHaveLength(0);
  });

  it('should be able to find entity with nested composite key (multi insert, joined)', async () => {
    createEntities([11, 12, 13]);
    createEntities([21, 22, 23]);
    createEntities([31, 32, 33]);
    await orm.em.flush();
    orm.em.clear();

    const res = await orm.em.find(Participant, {}, { strategy: 'joined' });
    expect(res).toHaveLength(3);
    expect(res[0]).toBe(res[0].session.lastActionBy);
    expect(res[1]).toBe(res[1].session.lastActionBy);
    expect(res[2]).toBe(res[2].session.lastActionBy);
  });

  test('creating entity instance from POJO', async () => {
    const participant = orm.em.getEntityFactory().create(Participant, {
      session: {
        id: 3,
        owner: { provider: { id: 1 }, user: { id: 2 } },
        lastActionBy: [3, [1, 2]],
      },
      member: { provider: { id: 1 }, user: { id: 2 } },
    }, { merge: true, newEntity: false });
    expect(participant).toBe(participant.session.lastActionBy);
  });

});
