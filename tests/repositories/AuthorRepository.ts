import type { FilterQuery, FindOptions, Loaded } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/mongodb';
import type { Author } from '../entities/index.js';

export class AuthorRepository extends EntityRepository<Author> {

  magic(data: string): string {
    return `111 ${data} 222`;
  }

  override async find<P extends string = never, F extends string = '*', E extends string = never>(where: FilterQuery<Author> = {}, options?: FindOptions<Author, P, F, E>): Promise<Loaded<Author, P, F, E>[]> {
    return super.find(where, options);
  }

}
