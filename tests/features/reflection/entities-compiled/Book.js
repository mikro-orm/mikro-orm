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
exports.Book = void 0;
const core_1 = require("@mikro-orm/core");
const Author_1 = require("./Author");
const TsMorphMetadataProvider_test_1 = require("../TsMorphMetadataProvider.test");
const BaseEntity3_1 = require("./BaseEntity3");
let Book = class Book extends BaseEntity3_1.BaseEntity3 {
    constructor(title, author) {
        super();
        this.tags = new TsMorphMetadataProvider_test_1.Collection(this);
        this.title = title;
        this.author = author;
    }
};
__decorate([
    core_1.Property(),
    __metadata("design:type", String)
], Book.prototype, "title", void 0);
__decorate([
    core_1.ManyToOne(),
    __metadata("design:type", Author_1.Author)
], Book.prototype, "author", void 0);
__decorate([
    core_1.ManyToOne({ cascade: [core_1.Cascade.PERSIST, core_1.Cascade.REMOVE] }),
    __metadata("design:type", Object)
], Book.prototype, "publisher", void 0);
__decorate([
    core_1.ManyToMany(),
    __metadata("design:type", TsMorphMetadataProvider_test_1.Collection)
], Book.prototype, "tags", void 0);
__decorate([
    core_1.Property(),
    __metadata("design:type", Object)
], Book.prototype, "metaObject", void 0);
__decorate([
    core_1.Property(),
    __metadata("design:type", Array)
], Book.prototype, "metaArray", void 0);
__decorate([
    core_1.Property(),
    __metadata("design:type", Array)
], Book.prototype, "metaArrayOfStrings", void 0);
Book = __decorate([
    core_1.Entity(),
    __metadata("design:paramtypes", [String, Author_1.Author])
], Book);
exports.Book = Book;
