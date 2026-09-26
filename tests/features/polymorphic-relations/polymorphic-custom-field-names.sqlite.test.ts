import { Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Embeddable,
  Embedded,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Product {
  @PrimaryKey()
  id!: number;

  @Property()
  price!: number;

  @OneToMany(() => Image, image => image.imageable)
  images = new Collection<Image>(this);
}

@Entity()
class Article {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @OneToMany(() => Image, image => image.imageable)
  images = new Collection<Image>(this);
}

@Entity()
class Image {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => [Product, Article], { fieldNames: ['imageableType', 'imageableId'] })
  imageable!: Product | Article;
}

@Entity()
class Attachment {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => [Product, Article], {
    fieldNames: ['attachableType', 'attachableId'],
    joinColumns: ['attachableId'],
  })
  attachable!: Product | Article;
}

@Entity()
class Thumbnail {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => [Product, Article], { joinColumn: 'thumbnailableId' })
  thumbnailable!: Product | Article;
}

@Embeddable()
class Owner {
  @ManyToOne(() => [Product, Article], { fieldNames: ['ownerType', 'ownerId'] })
  entity!: Product | Article;
}

@Entity()
class Note {
  @PrimaryKey()
  id!: number;

  @Embedded(() => Owner)
  owner!: Owner;
}

describe('polymorphic relations with custom fieldNames', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Product, Article, Image, Attachment, Thumbnail, Owner, Note],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('first field name is the discriminator column, the rest are join columns', () => {
    const imageable = orm.getMetadata().get(Image).properties.imageable;
    expect(imageable.discriminatorColumn).toBe('imageableType');
    expect(imageable.fieldNames).toEqual(['imageableType', 'imageableId']);
    expect(imageable.joinColumns).toEqual(['imageableId']);

    const attachable = orm.getMetadata().get(Attachment).properties.attachable;
    expect(attachable.discriminatorColumn).toBe('attachableType');
    expect(attachable.fieldNames).toEqual(['attachableType', 'attachableId']);
    expect(attachable.joinColumns).toEqual(['attachableId']);

    const thumbnailable = orm.getMetadata().get(Thumbnail).properties.thumbnailable;
    expect(thumbnailable.discriminatorColumn).toBe('thumbnailable_type');
    expect(thumbnailable.fieldNames).toEqual(['thumbnailable_type', 'thumbnailableId']);
    expect(thumbnailable.joinColumns).toEqual(['thumbnailableId']);

    const owner = orm.getMetadata().get(Note).properties['owner_entity' as keyof Note];
    expect(owner.discriminatorColumn).toBe('owner_ownerType');
    expect(owner.fieldNames).toEqual(['owner_ownerType', 'owner_ownerId']);
    expect(owner.joinColumns).toEqual(['owner_ownerId']);
  });

  test('persist, populate and filter use the custom columns', async () => {
    const em = orm.em.fork();
    const product = em.create(Product, { price: 20 });
    const article = em.create(Article, { title: 'foo' });
    em.create(Image, { imageable: product });
    em.create(Image, { imageable: article });
    em.create(Attachment, { attachable: product });
    em.create(Attachment, { attachable: article });
    em.create(Thumbnail, { thumbnailable: product });
    em.create(Note, { owner: { entity: product } });
    await em.flush();
    em.clear();

    const images = await em.find(Image, {}, { populate: ['imageable'], orderBy: { id: 'asc' } });
    expect(images.map(i => i.imageable.constructor.name)).toEqual(['Product', 'Article']);
    const attachments = await em.find(Attachment, {}, { populate: ['attachable'], orderBy: { id: 'asc' } });
    expect(attachments.map(a => a.attachable.constructor.name)).toEqual(['Product', 'Article']);
    const thumbnail = await em.findOneOrFail(
      Thumbnail,
      { thumbnailable: { price: 20 } },
      { populate: ['thumbnailable'] },
    );
    expect(thumbnail.thumbnailable).toBeInstanceOf(Product);
    const note = await em.findOneOrFail(Note, { owner: { entity: { price: 20 } } }, { populate: ['owner.entity'] });
    expect(note.owner.entity).toBeInstanceOf(Product);
    em.clear();

    const expensive = await em.find(Image, { imageable: { price: { $gt: 10 } } });
    expect(expensive).toHaveLength(1);
    const expensiveAttachments = await em.find(Attachment, { attachable: { price: { $gt: 10 } } });
    expect(expensiveAttachments).toHaveLength(1);

    const articleWithImages = await em.findOneOrFail(Article, article.id, { populate: ['images'] });
    expect(articleWithImages.images).toHaveLength(1);
  });
});
