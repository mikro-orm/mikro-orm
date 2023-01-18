import { Collection, Entity, Index, ManyToMany, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { FullTextType, MikroORM } from '@mikro-orm/postgresql';

@Entity()
@Unique({ properties: ['name'] })
export class Artist {

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
export class Song {

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
    entities: [Song],
    dbName: 'mikro_orm_test_3696',
  });
  await orm.schema.refreshDatabase();
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
