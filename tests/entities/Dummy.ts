import { Entity } from '@mikro-orm/decorators/legacy';
import { BaseEntity } from './BaseEntity.js';

@Entity({ readonly: true })
export class Dummy extends BaseEntity<Dummy> {}
