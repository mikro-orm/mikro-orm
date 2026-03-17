import { Cascade, defineEntity, MikroORM, p } from '@mikro-orm/postgresql';

const MediaSetSchema = defineEntity({
  name: 'MediaSet',
  properties: {
    id: p.integer().primary(),
    medias: () => p.oneToMany(Media).mappedBy('set'),
  },
});
class MediaSet extends MediaSetSchema.class {}
MediaSetSchema.setClass(MediaSet);

const MediaSchema = defineEntity({
  name: 'Media',
  properties: {
    id: p.integer().primary(),
    url: p.text(),
    set: () => p.manyToOne(MediaSet).nullable(),
  },
});
class Media extends MediaSchema.class {}
MediaSchema.setClass(Media);

const MediaOwnerSchema = defineEntity({
  name: 'MediaOwner',
  properties: {
    id: p.integer().primary(),
    imageList: () => p.oneToOne(MediaSet).cascade(Cascade.ALL),
  },
});
class MediaOwner extends MediaOwnerSchema.class {}
MediaOwnerSchema.setClass(MediaOwner);

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'ghx30',
    entities: [Media, MediaSet, MediaOwner],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.schema.drop();
  await orm.close(true);
});

test('deleting MediaOwner should set media.set to NULL', async () => {
  const em = orm.em.fork();

  const media1 = em.create(Media, { url: '/m1' });
  const media2 = em.create(Media, { url: '/m2' });
  const mediaSet = em.create(MediaSet, { medias: [media1, media2] });
  const owner = em.create(MediaOwner, { imageList: mediaSet });

  await em.flush();
  em.clear();

  // Delete the media owner (should cascade delete MediaSet, and set media.set to NULL)
  const em2 = em.fork();
  const fetchedOwner = await em2.findOneOrFail(MediaOwner, owner.id, {
    populate: ['imageList', 'imageList.medias'],
  });
  em2.remove(fetchedOwner);
  await em2.flush();
  em2.clear();

  // Verify media.set is NULL
  const em3 = em.fork();
  const verifyMedia1 = await em3.findOneOrFail(Media, media1.id);
  const verifyMedia2 = await em3.findOneOrFail(Media, media2.id);

  expect(verifyMedia1.set).toBeNull();
  expect(verifyMedia2.set).toBeNull();
});
