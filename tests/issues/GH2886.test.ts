import { Entity, ManyToOne, OneToMany, Collection, MikroORM, PrimaryKey } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

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

  @OneToMany('Participant', 'session')
  participants = new Collection<Participant>(this);

  constructor(id: number, owner: Member) {
    this.id = id;
    this.owner = owner;
  }

}

@Entity()
export class Participant {

  @ManyToOne(() => Session, { eager: true, primary: true })
  session: Session;

  @ManyToOne(() => Member, { eager: true, primary: true })
  member: Member;

  constructor(session: Session, member: Member) {
    this.session = session;
    this.member = member;
  }

}

describe('GH #2886', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Provider, User, Member, Session, Participant],
      dbName: `:memory:`,
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  function createEntities(pks: [providerId: number, userId: number, sessionId: number]) {
    const provider = new Provider(pks[0]);
    const user = new User(pks[1]);
    const member = new Member(provider, user);
    const session = new Session(pks[2], member);
    const participant = new Participant(session, member);
    orm.em.persist([provider, user, member, session, participant]);
  }

  it('should be able to call init', async () => {
    const sessionId = 3;
    createEntities([1, 2, sessionId]);
    await orm.em.flush();
    orm.em.clear();

    const session = await orm.em.findOneOrFail(Session, { id: sessionId });
    await session.participants.init();
  });

});
