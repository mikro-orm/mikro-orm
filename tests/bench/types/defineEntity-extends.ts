#!/usr/bin/env -S node --import @swc-node/register/esm-register

import { bench } from '@ark/attest';
import { type InferEntity, defineEntity, p } from '@mikro-orm/core';

bench('entity extends entity', () => {
  const base = defineEntity({
    abstract: true,
    name: 'Base',
    properties: {
      id: p.integer().primary(),
    },
  });

  const child = defineEntity({
    extends: base,
    name: 'Child',
    properties: {
      extra: p.string(),
    },
  });
}).types([1460, 'instantiations']);

bench('entity extends entity with discriminator', () => {
  const base = defineEntity({
    abstract: true,
    discriminatorColumn: 'type',
    name: 'Base',
    properties: {
      id: p.integer().primary(),
      type: p.string(),
    },
  });

  const child = defineEntity({
    discriminatorValue: 'child',
    extends: base,
    name: 'Child',
    properties: {
      extra: p.string(),
    },
  });
}).types([1481, 'instantiations']);

bench('embeddable extends embeddable', () => {
  const base = defineEntity({
    abstract: true,
    embeddable: true,
    name: 'BaseEmb',
    properties: {
      foo: p.string(),
    },
  });

  const child = defineEntity({
    embeddable: true,
    extends: base,
    name: 'ChildEmb',
    properties: {
      bar: p.string(),
    },
  });
}).types([914, 'instantiations']);

bench('embeddable extends embeddable with discriminator', () => {
  const base = defineEntity({
    abstract: true,
    discriminatorColumn: 'type',
    embeddable: true,
    name: 'BaseEmb',
    properties: {
      type: p.string(),
      foo: p.string(),
    },
  });

  const child = defineEntity({
    discriminatorValue: 'child',
    embeddable: true,
    extends: base,
    name: 'ChildEmb',
    properties: {
      bar: p.string(),
    },
  });
}).types([935, 'instantiations']);

bench('polymorphic embeddables', () => {
  const base = defineEntity({
    abstract: true,
    name: 'Base',
    properties: {
      id: p.integer().primary(),
    },
  });

  const documentData = defineEntity({
    abstract: true,
    discriminatorColumn: 'discriminator',
    embeddable: true,
    name: 'DocumentData',
    properties: {
      discriminator: p.string().index(),
      iso: p.string().index(),
      type: p.string().index(),
    },
  });

  const documentDataAwEdCardIn = defineEntity({
    embeddable: true,
    name: 'DocumentDataAwEdCardIn',
    properties: {
      airline: p.string().nullable(),
      flightNumber: p.string().nullable(),
    },
  });

  const documentDataAwEdCardOut = defineEntity({
    embeddable: true,
    name: 'DocumentDataAwEdCardOut',
    properties: {
      city: p.string().nullable(),
    },
  });

  const documentDataAwEdCard = defineEntity({
    discriminatorValue: 'AW.ED-CARD',
    embeddable: true,
    extends: documentData,
    name: 'DocumentDataAwEdCard',
    properties: {
      in: () => p.embedded(documentDataAwEdCardIn).object(),
      out: () => p.embedded(documentDataAwEdCardOut).object(),
    },
  });

  const documentDataCoCheckMigIn = defineEntity({
    embeddable: true,
    name: 'DocumentDataCoCheckMigIn',
    properties: {
      checkpoint: p.string(),
      flightNumber: p.string().nullable(),
    },
  });

  const documentDataCoCheckMigOut = defineEntity({
    embeddable: true,
    name: 'DocumentDataCoCheckMigOut',
    properties: {
      state: p.string().nullable(),
    },
  });

  const documentDataCoCheckMig = defineEntity({
    discriminatorValue: 'CO.CHECK-MIG',
    embeddable: true,
    extends: documentData,
    name: 'DocumentDataCoCheckMig',
    properties: {
      in: () => p.embedded(documentDataCoCheckMigIn).object(),
      out: () => p.embedded(documentDataCoCheckMigOut).object(),
    },
  });

  const documentDataMvDiCardIn = defineEntity({
    embeddable: true,
    name: 'DocumentDataMvDiCardIn',
    properties: {
      flightNumber: p.string().nullable(),
      pnr: p.string(),
    },
  });

  const documentDataMvDiCardOut = defineEntity({
    embeddable: true,
    name: 'DocumentDataMvDiCardOut',
    properties: {
      country: p.string().nullable(),
    },
  });

  const documentDataMvDiCard = defineEntity({
    discriminatorValue: 'MV.DI-CARD',
    embeddable: true,
    extends: documentData,
    name: 'DocumentDataMvDiCard',
    properties: {
      in: () => p.embedded(documentDataMvDiCardIn).object(),
      out: () => p.embedded(documentDataMvDiCardOut).object(),
    },
  });

  const document = defineEntity({
    extends: base,
    name: 'Document',
    tableName: 'documents',
    properties: {
      data: () => p.embedded([documentDataAwEdCard, documentDataCoCheckMig, documentDataMvDiCard]).object(),
    },
  });
}).types([3253, 'instantiations']);

bench('realistic entity (~20 props, relations, extends)', () => {
  const base = defineEntity({
    abstract: true,
    name: 'BaseEntity',
    properties: {
      id: p.integer().primary().autoincrement(),
      createdAt: p.datetime().onCreate(() => new Date()),
      updatedAt: p
        .datetime()
        .onCreate(() => new Date())
        .onUpdate(() => new Date()),
    },
  });

  const Tag = defineEntity({
    name: 'Tag',
    extends: base,
    properties: {
      name: p.string(),
      slug: p.string().unique(),
    },
  });

  const Publisher = defineEntity({
    name: 'Publisher',
    extends: base,
    properties: {
      name: p.string(),
      website: p.string().nullable(),
      country: p.string().nullable(),
    },
  });

  const Author = defineEntity({
    name: 'Author',
    extends: base,
    properties: {
      firstName: p.string().length(100),
      lastName: p.string().length(100),
      email: p.string().unique(),
      bio: p.text().nullable(),
      age: p.integer().nullable(),
      isActive: p.boolean().default(true),
      rating: p.double().default(0),
      avatarUrl: p.string().nullable(),
      website: p.string().nullable(),
      locale: p.string().default('en'),
      termsAccepted: p.boolean().default(false),
      registeredAt: p.datetime().nullable(),
      favouriteBook: () => p.manyToOne(Book).nullable(),
      books: () => p.oneToMany(Book).mappedBy('author'),
      friends: () => p.manyToMany(Author),
      tags: () => p.manyToMany(Tag),
      settings: p.json<{ theme: string; notifications: boolean }>().nullable(),
      metadata: p.json<Record<string, unknown>>().nullable(),
    },
  });

  const Book = defineEntity({
    name: 'Book',
    extends: base,
    properties: {
      title: p.string(),
      isbn: p.string().unique().nullable(),
      price: p.double().nullable(),
      publisher: () => p.manyToOne(Publisher).nullable(),
      author: () => p.manyToOne(Author),
      tags: () => p.manyToMany(Tag),
    },
  });
}).types([7249, 'instantiations']);

bench('realistic entity - InferEntity usage', () => {
  const base = defineEntity({
    abstract: true,
    name: 'BaseEntity',
    properties: {
      id: p.integer().primary().autoincrement(),
      createdAt: p.datetime().onCreate(() => new Date()),
      updatedAt: p
        .datetime()
        .onCreate(() => new Date())
        .onUpdate(() => new Date()),
    },
  });

  const Tag = defineEntity({
    name: 'Tag',
    extends: base,
    properties: {
      name: p.string(),
      slug: p.string().unique(),
    },
  });

  const Publisher = defineEntity({
    name: 'Publisher',
    extends: base,
    properties: {
      name: p.string(),
      website: p.string().nullable(),
      country: p.string().nullable(),
    },
  });

  const Author = defineEntity({
    name: 'Author',
    extends: base,
    properties: {
      firstName: p.string().length(100),
      lastName: p.string().length(100),
      email: p.string().unique(),
      bio: p.text().nullable(),
      age: p.integer().nullable(),
      isActive: p.boolean().default(true),
      rating: p.double().default(0),
      avatarUrl: p.string().nullable(),
      website: p.string().nullable(),
      locale: p.string().default('en'),
      termsAccepted: p.boolean().default(false),
      registeredAt: p.datetime().nullable(),
      favouriteBook: () => p.manyToOne(Book).nullable(),
      books: () => p.oneToMany(Book).mappedBy('author'),
      friends: () => p.manyToMany(Author),
      tags: () => p.manyToMany(Tag),
      settings: p.json<{ theme: string; notifications: boolean }>().nullable(),
      metadata: p.json<Record<string, unknown>>().nullable(),
    },
  });

  const Book = defineEntity({
    name: 'Book',
    extends: base,
    properties: {
      title: p.string(),
      isbn: p.string().unique().nullable(),
      price: p.double().nullable(),
      publisher: () => p.manyToOne(Publisher).nullable(),
      author: () => p.manyToOne(Author),
      tags: () => p.manyToMany(Tag),
    },
  });

  type IAuthor = InferEntity<typeof Author>;
  type IBook = InferEntity<typeof Book>;
  type ITag = InferEntity<typeof Tag>;
  type IPublisher = InferEntity<typeof Publisher>;

  // Force evaluation of all entity types
  const _check: [IAuthor, IBook, ITag, IPublisher] = {} as any;
}).types([7341, 'instantiations']);

bench('realistic entity - setClass pattern', () => {
  const BaseSchema = defineEntity({
    abstract: true,
    name: 'BaseEntity',
    properties: {
      id: p.integer().primary().autoincrement(),
      createdAt: p.datetime().onCreate(() => new Date()),
      updatedAt: p
        .datetime()
        .onCreate(() => new Date())
        .onUpdate(() => new Date()),
    },
  });

  const TagSchema = defineEntity({
    name: 'Tag',
    extends: BaseSchema,
    properties: {
      name: p.string(),
      slug: p.string().unique(),
    },
  });

  const PublisherSchema = defineEntity({
    name: 'Publisher',
    extends: BaseSchema,
    properties: {
      name: p.string(),
      website: p.string().nullable(),
      country: p.string().nullable(),
    },
  });

  const AuthorSchema = defineEntity({
    name: 'Author',
    extends: BaseSchema,
    properties: {
      firstName: p.string().length(100),
      lastName: p.string().length(100),
      email: p.string().unique(),
      bio: p.text().nullable(),
      age: p.integer().nullable(),
      isActive: p.boolean().default(true),
      rating: p.double().default(0),
      avatarUrl: p.string().nullable(),
      website: p.string().nullable(),
      locale: p.string().default('en'),
      termsAccepted: p.boolean().default(false),
      registeredAt: p.datetime().nullable(),
      favouriteBook: () => p.manyToOne(Book).nullable(),
      books: () => p.oneToMany(Book).mappedBy('author'),
      friends: () => p.manyToMany(Author),
      tags: () => p.manyToMany(Tag),
      settings: p.json<{ theme: string; notifications: boolean }>().nullable(),
      metadata: p.json<Record<string, unknown>>().nullable(),
    },
  });

  const BookSchema = defineEntity({
    name: 'Book',
    extends: BaseSchema,
    properties: {
      title: p.string(),
      isbn: p.string().unique().nullable(),
      price: p.double().nullable(),
      publisher: () => p.manyToOne(Publisher).nullable(),
      author: () => p.manyToOne(Author),
      tags: () => p.manyToMany(Tag),
    },
  });

  class Tag extends TagSchema.class {}
  class Publisher extends PublisherSchema.class {}
  class Author extends AuthorSchema.class {
    fullName() {
      return `${this.firstName} ${this.lastName}`;
    }
  }
  class Book extends BookSchema.class {}

  TagSchema.setClass(Tag);
  PublisherSchema.setClass(Publisher);
  AuthorSchema.setClass(Author);
  BookSchema.setClass(Book);
}).types([7357, 'instantiations']);
