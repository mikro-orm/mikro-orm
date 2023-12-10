import type { FilterQuery, FindOptions, Loaded } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/mongodb';
import type { Author } from '../entities';

export class AuthorRepository extends EntityRepository<Author> {

  magic(data: string): string {
    return `111 ${data} 222`;
  }

  override async find<P extends string = never, F extends string = '*'>(where: FilterQuery<Author> = {}, options?: FindOptions<Author, P, F>): Promise<Loaded<Author, P, F>[]> {
    return super.find(where, options);
  }

}
