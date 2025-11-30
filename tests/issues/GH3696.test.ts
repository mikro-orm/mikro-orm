import { FullTextType, MikroORM, Collection } from '@mikro-orm/postgresql';
import { Entity, Index, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';

@Entity()
@Unique({ properties: ['name'] })
class Artist {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Index({ type: 'fulltext' })
  @Property({ type: FullTextType, onUpdate: (artist: Artist) => artist.name })
  searchableName!: string;

  constructor(artist: any) {
    this.id = artist.id;
    this.name = artist.name;
    this.searchableName = artist.name;
  }

}

@Entity()
class Song {

  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @ManyToMany(() => Artist)
  artists = new Collection<Artist>(this);

  @Index({ type: 'fulltext' })
  @Property({ type: FullTextType, onUpdate: (song: Song) => song.title })
  searchableTitle!: string;

  constructor(song: any) {
    this.id = song.id;
    this.title = song.title;
    this.searchableTitle = song.title;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Song],
    dbName: 'mikro_orm_test_3696',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH issue 3696', async () => {
  const artist = orm.em.create(Artist, {
    name: 'Taylor Swift',
    searchableName: 'Taylor Swift',
  });
  const song = orm.em.create(Song, {
    title: 'Anti-Hero',
    searchableTitle: 'Anti--Hero',
  });
  song.artists.add(artist);
  await orm.em.flush();
  orm.em.clear();

  const results = await orm.em.find(Song, {
    searchableTitle: { $fulltext: 'anti' },
    artists: { searchableName: { $fulltext: 'taylor' } },
  }, { populate: ['artists'] });
  expect(results).toHaveLength(1);
  expect(results[0]).toMatchObject({
    title: 'Anti-Hero',
    searchableTitle: "'anti':1 'hero':2",
  });
  expect(results[0].artists[0]).toMatchObject({
    name: 'Taylor Swift',
    searchableName: "'swift':2 'taylor':1",
  });
});
