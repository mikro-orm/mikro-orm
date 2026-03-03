import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

@Entity()
class Video {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @OneToMany(() => Comment, comment => comment.commentable)
  comments = new Collection<Comment>(this);
}

@Entity()
class Photo {
  @PrimaryKey()
  id!: number;

  @Property()
  caption!: string;

  @OneToMany(() => Comment, comment => comment.commentable)
  comments = new Collection<Comment>(this);
}

@Entity()
class Comment {
  @PrimaryKey()
  id!: number;

  @Property()
  text!: string;

  @ManyToOne(() => [Video, Photo])
  commentable!: Video | Photo;
}

describe('polymorphic relations with ts-morph', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Video, Photo, Comment],
      dbName: ':memory:',
      metadataProvider: TsMorphMetadataProvider,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(Comment, {});
    await orm.em.nativeDelete(Video, {});
    await orm.em.nativeDelete(Photo, {});
    orm.em.clear();
  });

  test('metadata is correctly initialized', () => {
    const meta = orm.getMetadata().get(Comment);
    const commentableProp = meta.properties.commentable;

    expect(commentableProp.polymorphic).toBe(true);
    expect(commentableProp.discriminator).toBe('commentable');
    expect(commentableProp.polymorphTargets).toHaveLength(2);
    expect(commentableProp.fieldNames).toContain('commentable_type');
    expect(commentableProp.fieldNames).toContain('commentable_id');
  });

  test('can create and persist comment to Video', async () => {
    const video = orm.em.create(Video, { title: 'My Video' });
    const comment = orm.em.create(Comment, {
      text: 'Great video!',
      commentable: video,
    });

    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Comment, { id: comment.id });
    expect(loaded.commentable).toBeInstanceOf(Video);

    await orm.em.populate(loaded, ['commentable']);
    expect((loaded.commentable as Video).title).toBe('My Video');
  });

  test('can create and persist comment to Photo', async () => {
    const photo = orm.em.create(Photo, { caption: 'Beautiful sunset' });

    const comment = orm.em.create(Comment, {
      text: 'Stunning!',
      commentable: photo,
    });

    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Comment, { id: comment.id });
    expect(loaded.commentable).toBeInstanceOf(Photo);

    await orm.em.populate(loaded, ['commentable']);
    expect((loaded.commentable as Photo).caption).toBe('Beautiful sunset');
  });

  test('inverse side collection works', async () => {
    const video = orm.em.create(Video, { title: 'Video' });
    const c1 = orm.em.create(Comment, { text: 'C1', commentable: video });
    const c2 = orm.em.create(Comment, { text: 'C2', commentable: video });

    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(
      Video,
      { id: video.id },
      {
        populate: ['comments'],
      },
    );

    expect(loaded.comments).toHaveLength(2);
    expect(
      loaded.comments
        .getItems()
        .map(c => c.text)
        .sort(),
    ).toEqual(['C1', 'C2']);
  });

  test('can update polymorphic relation', async () => {
    const video = orm.em.create(Video, { title: 'Video' });
    const photo = orm.em.create(Photo, { caption: 'Photo' });
    const comment = orm.em.create(Comment, { text: 'Comment', commentable: video });

    await orm.em.flush();
    orm.em.clear();

    const loadedComment = await orm.em.findOneOrFail(Comment, { id: comment.id });
    const loadedPhoto = await orm.em.findOneOrFail(Photo, { id: photo.id });

    loadedComment.commentable = loadedPhoto;

    await orm.em.flush();
    orm.em.clear();

    const reloaded = await orm.em.findOneOrFail(Comment, { id: comment.id });
    await orm.em.populate(reloaded, ['commentable']);
    expect((reloaded.commentable as Photo).caption).toBe('Photo');
  });
});
