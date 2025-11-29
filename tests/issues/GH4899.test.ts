import { Collection } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @OneToMany({ entity: () => UserSkill, mappedBy: 'user' })
  userSkills = new Collection<UserSkill>(this);

}

@Entity()
class Skill {

  @PrimaryKey()
  id!: number;

  @Property()
  label!: string;

  @OneToMany(() => UserSkill, 'skill')
  userSkills = new Collection<UserSkill>(this);

}

@Entity()
@Unique({ properties: ['user', 'skill'] })
class UserSkill {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => Skill)
  skill!: Skill;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [UserSkill, User, Skill],
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('4899', async () => {
  orm.em.create(User, {
    id: 1,
  });
  orm.em.create(Skill, {
    id: 10,
    label: 'JS',
  });
  orm.em.create(Skill, {
    id: 11,
    label: 'TS',
  });
  orm.em.create(UserSkill, {
    id: 20,
    skill: 10,
    user: 1,
  });
  orm.em.create(UserSkill, {
    id: 21,
    skill: 11,
    user: 1,
  });

  await orm.em.flush();
  orm.em.clear();

  const userSkill = await orm.em.findOneOrFail(
    UserSkill,
    { skill: [10] },
    {
      populate: ['user.userSkills.skill', 'user.userSkills.user'],
    },
  );

  expect(userSkill.id).toBe(20);
  expect(userSkill.user.userSkills).toHaveLength(2);
  expect(userSkill.user.userSkills[0].skill).toHaveProperty('label', 'JS');
  expect(userSkill.user.userSkills[1].skill).toHaveProperty('label', 'TS');
});
