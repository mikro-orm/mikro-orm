import { Entity, OneToOne, PrimaryKey, Property, Rel } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';

@Entity()
export class Profile {

  @PrimaryKey()
  id!: number;

  @OneToOne({ entity: () => Rating, inversedBy: 'profile' })
  rating!: Rel<Rating>;

}

@Entity()
export class Rating {

  @OneToOne({ entity: () => Profile, mappedBy: 'rating', primary: true })
  profile!: Profile;

  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  @Property()
  rating: number = 1000;

}

test('validation of FK as PK being the owning side', async () => {
  await expect(MikroORM.init({
    entities: [Profile, Rating],
    dbName: `mikro_orm_test_gh_3869`,
    cache: { enabled: false },
    connect: false,
  })).rejects.toThrow(`Rating.profile cannot be primary key as it is defined as inverse side. Maybe you should swap the use of 'inversedBy' and 'mappedBy'.`);
});
