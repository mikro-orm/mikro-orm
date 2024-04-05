import { Entity } from '@mikro-orm/core';
import { BaseEntity2 } from './BaseEntity2';

@Entity({ readonly: true })
export class Dummy2 extends BaseEntity2 {}

