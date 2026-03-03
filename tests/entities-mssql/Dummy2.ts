import { Entity } from '@mikro-orm/decorators/legacy';
import { BaseEntity2 } from './BaseEntity2.js';

@Entity({ readonly: true })
export class Dummy2 extends BaseEntity2 {}
