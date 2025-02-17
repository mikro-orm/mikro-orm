var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { DateType, Collection, Cascade, Entity, ManyToMany, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity.js';
// import { Collection } from '../TsMorphMetadataProvider.test.js';
let Author = class Author extends BaseEntity {
    name;
    email;
    age = null;
    termsAccepted = false;
    optional;
    identities;
    born;
    books = new Collection(this);
    friends = new Collection(this);
    favouriteBook;
    favouriteAuthor;
    version;
    versionAsString;
    constructor(name, email) {
        super();
        this.name = name;
        this.email = email;
        this.foo = 'bar';
    }
    getCode() {
        return `${this.email} - ${this.name}`;
    }
};
__decorate([
    Property()
], Author.prototype, "name", void 0);
__decorate([
    Property()
], Author.prototype, "email", void 0);
__decorate([
    Property()
], Author.prototype, "age", void 0);
__decorate([
    Property()
], Author.prototype, "termsAccepted", void 0);
__decorate([
    Property()
], Author.prototype, "optional", void 0);
__decorate([
    Property({ fieldName: 'identitiesArray' })
], Author.prototype, "identities", void 0);
__decorate([
    Property({ type: new DateType() })
], Author.prototype, "born", void 0);
__decorate([
    OneToMany('Book', 'author', { referenceColumnName: '_id', cascade: [Cascade.PERSIST], orphanRemoval: true })
], Author.prototype, "books", void 0);
__decorate([
    ManyToMany()
], Author.prototype, "friends", void 0);
__decorate([
    ManyToOne()
], Author.prototype, "favouriteBook", void 0);
__decorate([
    ManyToOne()
], Author.prototype, "favouriteAuthor", void 0);
__decorate([
    Property({ persist: false })
], Author.prototype, "version", void 0);
__decorate([
    Property({ persist: false })
], Author.prototype, "versionAsString", void 0);
__decorate([
    Property({ name: 'code' })
], Author.prototype, "getCode", null);
Author = __decorate([
    Entity()
], Author);
export { Author };
