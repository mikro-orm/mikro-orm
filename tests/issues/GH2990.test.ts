import { Entity, EntityLoader, ManyToOne, MikroORM, PrimaryKey } from '@mikro-orm/sqlite';

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

  @ManyToOne(() => Member, { eager: true, nullable: true })
  activeParticipant: Member | null = null;

  constructor(id: number, owner: Member) {
    this.id = id;
    this.owner = owner;
  }

}

describe('GH issue 2990', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Provider, User, Member, Session],
      dbName: `:memory:`,
    });
  });

  afterAll(async () => {
    await orm.close(true);
  });

  it('should lookup all (non-circular) eager relationships for population', async () => {
    const loader = new EntityLoader(orm.em);
    const populate = loader.normalizePopulate<Session>('Session', []);

    const owner = populate.find(p => p.field === 'owner');
    expect(owner?.children?.some(p => p.field === 'provider')).toBe(true);
    expect(owner?.children?.some(p => p.field === 'user')).toBe(true);

    const activeParticipant = populate.find(p => p.field === 'activeParticipant');

    expect(activeParticipant?.children?.some(p => p.field === 'provider')).toBe(true);
    expect(activeParticipant?.children?.some(p => p.field === 'user')).toBe(true);
  });

});
