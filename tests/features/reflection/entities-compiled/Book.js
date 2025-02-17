var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Cascade, Collection, Entity, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';
// import { Collection, Ref } from '../TsMorphMetadataProvider.test.js';
import { BaseEntity3 } from './BaseEntity3.js';
let Book = class Book extends BaseEntity3 {
    title;
    author;
    publisher;
    tags = new Collection(this);
    metaObject;
    metaArray;
    metaArrayOfStrings;
    constructor(title, author) {
        super();
        this.title = title;
        this.author = author;
    }
};
__decorate([
    Property()
], Book.prototype, "title", void 0);
__decorate([
    ManyToOne()
], Book.prototype, "author", void 0);
__decorate([
    ManyToOne({ cascade: [Cascade.PERSIST, Cascade.REMOVE] })
], Book.prototype, "publisher", void 0);
__decorate([
    ManyToMany()
], Book.prototype, "tags", void 0);
__decorate([
    Property()
], Book.prototype, "metaObject", void 0);
__decorate([
    Property()
], Book.prototype, "metaArray", void 0);
__decorate([
    Property()
], Book.prototype, "metaArrayOfStrings", void 0);
Book = __decorate([
    Entity()
], Book);
export { Book };
