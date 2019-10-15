---
---

# Deployment

Under the hood, `MikroORM` uses [`ts-morph`](https://github.com/dsherret/ts-morph) to read 
TypeScript source files of all entities to be able to detect all types. Thanks to this, 
defining the type is enough for runtime validation.

This has some consequences for deployment of your application. Sometimes you will want to 
deploy only your compiled output, without TS source files at all. In that case, discovery 
process will probably fail. You have several options:

## Deploy pre-built cache

By default, output of metadata discovery will be cached in `temp` folder. You can reuse this 
cache in your deployed application. Currently the cache is saved in files named like the entity
source file, e.g. `Author.ts` entity will store cache in `temp/Author.ts.json` file.

When running compiled code, JS entities will be taken into account instead, so you will need to 
generate the cache by running the compiled code locally. That will generate `temp/Author.js.json`, 
which is the file you will need to deploy alongside your application. 

## Fill type or entity attributes everywhere

What discovery process does is to sniff TS types and save their value to string, so it can be 
used later for validation. You can skip the whole process by simply providing those values 
manually:

```typescript
@Entity()
export class Book implements IdEntity<Book> {

  @PrimaryKey({ type: 'number' })
  id: number;

  @Property({ type: 'string' })
  title: string;

  @ManyToOne(() => Author) // or `@ManyToOne({ type: 'Author' })` or `@ManyToOne({ entity: () => Author })`
  author1: Author;

  // or
  @ManyToOne({ type: 'Author' })
  author2: Author;

  // or
  @ManyToOne({ entity: () => Author })
  author3: Author;

}
```

## Deploy your entity source files

Usually it does not matter much that you deploy more files than needed, so the easiest way
is to just deploy your TS source files next to the compiled output, just like during development.
