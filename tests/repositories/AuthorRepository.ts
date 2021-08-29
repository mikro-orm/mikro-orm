import type { FilterQuery, FindOptions, Loaded } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/core';
import type { Author } from '../entities';

export class AuthorRepository extends EntityRepository<Author> {

  magic(data: string): string {
    return `111 ${data} 222`;
  }

  async find<P extends string = never>(where: FilterQuery<Author> = {}, options?: FindOptions<Author, P>): Promise<Loaded<Author, P>[]> {
    return super.find(where, options);
  }

}
