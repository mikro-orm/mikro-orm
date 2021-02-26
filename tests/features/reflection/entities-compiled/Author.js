"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Author = void 0;
const core_1 = require("@mikro-orm/core");
const Book_1 = require("./Book");
const BaseEntity_1 = require("./BaseEntity");
const TsMorphMetadataProvider_test_1 = require("../TsMorphMetadataProvider.test");
let Author = class Author extends BaseEntity_1.BaseEntity {
    constructor(name, email) {
        super();
        this.termsAccepted = false;
        this.books = new TsMorphMetadataProvider_test_1.Collection(this);
        this.friends = new TsMorphMetadataProvider_test_1.Collection(this);
        this.name = name;
        this.email = email;
        this.foo = 'bar';
    }
};
__decorate([
    core_1.Property(),
    __metadata("design:type", String)
], Author.prototype, "name", void 0);
__decorate([
    core_1.Property(),
    __metadata("design:type", String)
], Author.prototype, "email", void 0);
__decorate([
    core_1.Property(),
    __metadata("design:type", Number)
], Author.prototype, "age", void 0);
__decorate([
    core_1.Property(),
    __metadata("design:type", Object)
], Author.prototype, "termsAccepted", void 0);
__decorate([
    core_1.Property(),
    __metadata("design:type", Boolean)
], Author.prototype, "optional", void 0);
__decorate([
    core_1.Property({ fieldName: 'identitiesArray' }),
    __metadata("design:type", Array)
], Author.prototype, "identities", void 0);
__decorate([
    core_1.Property({ type: core_1.DateType }),
    __metadata("design:type", Date)
], Author.prototype, "born", void 0);
__decorate([
    core_1.OneToMany('Book', 'author', { referenceColumnName: '_id', cascade: [core_1.Cascade.PERSIST], orphanRemoval: true }),
    __metadata("design:type", Object)
], Author.prototype, "books", void 0);
__decorate([
    core_1.ManyToMany(),
    __metadata("design:type", Object)
], Author.prototype, "friends", void 0);
__decorate([
    core_1.ManyToOne(),
    __metadata("design:type", Book_1.Book)
], Author.prototype, "favouriteBook", void 0);
__decorate([
    core_1.ManyToOne(),
    __metadata("design:type", Author)
], Author.prototype, "favouriteAuthor", void 0);
__decorate([
    core_1.Property({ persist: false }),
    __metadata("design:type", Number)
], Author.prototype, "version", void 0);
__decorate([
    core_1.Property({ persist: false }),
    __metadata("design:type", String)
], Author.prototype, "versionAsString", void 0);
Author = __decorate([
    core_1.Entity(),
    __metadata("design:paramtypes", [String, String])
], Author);
exports.Author = Author;
