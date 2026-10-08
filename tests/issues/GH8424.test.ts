import { Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity({ discriminatorColumn: 'industry' })
class Company {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Posting, p => p.company)
  postings = new Collection<Posting>(this);
}

@Entity({ discriminatorValue: 'CULTURE' })
class CultureCompany extends Company {}

@Entity({ discriminatorValue: 'MEDIA' })
class MediaCompany extends Company {}

@Entity({ discriminatorValue: 'NEWS' })
class NewsCompany extends MediaCompany {}

@Entity()
class Posting {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Company)
  company!: Company;

  @ManyToOne(() => MediaCompany, { nullable: true })
  mediaCompany?: MediaCompany;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Company, CultureCompany, MediaCompany, NewsCompany, Posting],
    dbName: ':memory:',
  });
  await orm.schema.create();

  const em = orm.em.fork();
  const culture = em.create(CultureCompany, { name: 'culture' });
  const news = em.create(NewsCompany, { name: 'news' });
  em.create(Posting, { company: culture });
  em.create(Posting, { company: news, mediaCompany: news });
  await em.flush();
});

afterAll(() => orm.close(true));

test('nested filter through m:1 to non-abstract STI root matches subtypes', async () => {
  const em = orm.em.fork();
  const postings = await em.find(Posting, { company: { name: 'culture' } });
  expect(postings).toHaveLength(1);
  const postings2 = await em.find(Posting, { mediaCompany: { name: 'news' } });
  expect(postings2).toHaveLength(1);
});

test('joined populate of m:1 to non-abstract STI root loads subtypes', async () => {
  const em = orm.em.fork();
  const postings = await em.find(
    Posting,
    {},
    { populate: ['company', 'mediaCompany'], strategy: 'joined', orderBy: { id: 'asc' } },
  );
  expect(postings[0].company).toBeInstanceOf(CultureCompany);
  expect(postings[0].company.name).toBe('culture');
  expect(postings[1].company).toBeInstanceOf(NewsCompany);
  expect(postings[1].mediaCompany).toBeInstanceOf(NewsCompany);
});
