#!/usr/bin/env -S node --import=tsx

import { bench } from '@ark/attest';
import {
  type AutoPath,
  type PopulatePath,
  type Collection,
  PrimaryKeyProp,
} from '@mikro-orm/core';

interface Author {
  id: number;
  name: string;
  createdAt: Date;
  books: Collection<Book>;
  [PrimaryKeyProp]?: 'id';
}

interface Book {
  id: number;
  title: string;
  [PrimaryKeyProp]?: 'id';
}

// Test: does 'createdAt.' get suggested?

function validatePath<T, P extends string>(
  _path: AutoPath<T, P, PopulatePath.ALL>,
): void { /* empty */ }

bench('AutoPath - scalar Date property should not expand', () => {
  // If this compiles with 'createdAt.' it means Date properties are being suggested
  // @ts-expect-error - createdAt is a Date, should not have nested paths
  validatePath<Author, 'createdAt.'>('createdAt.');
}).types([1303, 'instantiations']);

bench('AutoPath - relation should expand', () => {
  // Use 'books.title' - a valid nested path (not 'books.' which is just a prefix)
  validatePath<Author, 'books.title'>('books.title');
}).types([871, 'instantiations']);
