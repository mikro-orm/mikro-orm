import { Collection, EntitySchema, MikroORM } from '@mikro-orm/sqlite';

// A piece of Content can belong to many Archives
class Content {

  id!: number;
  name!: string;
  type!: string;

  archives = new Collection<Archive>(this);

}

// An Archive contains many items of Content, and can also be treated as Content itself
class Archive extends Content {

  items = new Collection<Content>(this);

}

// Video Archive
class VideoArchive extends Archive {

  studioName?: string;

}


const ContentSchema = new EntitySchema<Content>({
  class: Content,
  discriminatorColumn: 'type',
  discriminatorValue: 'content',
  properties: {
    id: { type: 'number', primary: true },
    name: { type: 'string' },
    type: { type: 'string' },
    archives: {
      kind: 'm:n',
      entity: () => 'Archive',
      mappedBy: 'items',
      owner: false,
    },
  },
});

// MidEntity schema extending BaseSchema
const ArchiveSchema = new EntitySchema<Archive, Content>({
  class: Archive,
  extends: ContentSchema,
  discriminatorValue: 'archive',
  properties: {
    items: {
      kind: 'm:n',
      entity: () => 'Content',
      owner: true,
      pivotTable: 'content_archive',
      joinColumn: 'archive_id',
      inverseJoinColumn: 'content_id',
    },
  },
});

// ParentEntity schema extending MidSchema
const VideoArchiveSchema = new EntitySchema<VideoArchive, Archive>({
  class: VideoArchive,
  extends: ArchiveSchema,
  discriminatorValue: 'videoArchive',
  properties: {
    studioName: { type: 'string' },
  },
});

test('should not pollute second orm', async () => {
  const ormLocal = await MikroORM.init({
    entities: [ContentSchema, ArchiveSchema, VideoArchiveSchema],
    dbName: ':memory:',
    contextName: 'db-1',
  });

  await ormLocal.schema.refresh();
  const em1 = ormLocal.em.fork();

  const content1 = new Content();
  content1.name = 'Content 1';
  await em1.persist(content1).flush();

  const foundEntity = await em1.findOne(Content, { name: 'Content 1' });
  expect(foundEntity).toBeDefined();
  expect(foundEntity?.name).toBe('Content 1');

  await ormLocal.close();

  const ormLocal2 = await MikroORM.init({
    entities: [ContentSchema, ArchiveSchema],
    dbName: ':memory:',
    contextName: 'db-2',
  });

  await ormLocal2.schema.refresh();
  const em2 = ormLocal2.em.fork();

  const content2 = new Content();
  content2.name = 'Content 2';
  await em2.persist(content2).flush();

  const foundEntity2 = await em2.findOne(Content, { name: 'Content 2' });
  expect(foundEntity2).toBeDefined();
  expect(foundEntity2?.name).toBe('Content 2');

  await ormLocal2.close();
});
