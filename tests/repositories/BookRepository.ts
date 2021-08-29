import { EntityRepository } from '@mikro-orm/core';
import type { Book } from '../entities';

export class BookRepository extends EntityRepository<Book> {

  magic(data: string): string {
    return `333 ${data} 444`;
  }

}
