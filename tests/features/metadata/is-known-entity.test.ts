import { MetadataStorage } from '@mikro-orm/core';

describe('MetadataStorage.isKnownEntity', () => {
  beforeEach(() => MetadataStorage.clear());

  test('knows entities registered before and after the first lookup', () => {
    MetadataStorage.getMetadata('Author', '/path/to/author.ts');
    expect(MetadataStorage.isKnownEntity('Author')).toBe(true);
    expect(MetadataStorage.isKnownEntity('Book')).toBe(false);
    expect(MetadataStorage.isKnownEntity('Publisher')).toBe(false);

    class Publisher {}
    MetadataStorage.getMetadata('Book', '/path/to/book.ts');
    MetadataStorage.getMetadata('Publisher', '/path/to/publisher.ts', Publisher);

    expect(MetadataStorage.isKnownEntity('Book')).toBe(true);
    expect(MetadataStorage.isKnownEntity('Publisher')).toBe(true);
  });

  test('forgets entities on clear()', () => {
    class Publisher {}
    MetadataStorage.getMetadata('Author', '/path/to/author.ts');
    MetadataStorage.getMetadata('Publisher', '/path/to/publisher.ts', Publisher);
    expect(MetadataStorage.isKnownEntity('Author')).toBe(true);
    expect(MetadataStorage.isKnownEntity('Publisher')).toBe(true);

    MetadataStorage.clear();
    expect(MetadataStorage.isKnownEntity('Author')).toBe(false);
    expect(MetadataStorage.isKnownEntity('Publisher')).toBe(false);

    // the class keeps its metadata, registering it again makes it known again
    MetadataStorage.getMetadata('Publisher', '/path/to/publisher.ts', Publisher);
    expect(MetadataStorage.isKnownEntity('Author')).toBe(false);
    expect(MetadataStorage.isKnownEntity('Publisher')).toBe(true);
  });

  test('stays in sync with another copy of the module that shares the global registry', async () => {
    expect(MetadataStorage.isKnownEntity('Author')).toBe(false);

    vi.resetModules();
    const { MetadataStorage: other } = await import('@mikro-orm/core');
    expect(other).not.toBe(MetadataStorage);

    other.getMetadata('Author', '/path/to/author.ts');
    expect(MetadataStorage.isKnownEntity('Author')).toBe(true);

    other.clear();
    expect(MetadataStorage.isKnownEntity('Author')).toBe(false);
  });
});
