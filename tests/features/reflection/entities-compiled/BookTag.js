"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookTagSchema = exports.BookTag = void 0;
const core_1 = require("@mikro-orm/core");
const Book_1 = require("./Book");
class BookTag {
    constructor(name) {
        this.books = new core_1.Collection(this);
        this.name = name;
    }
}
exports.BookTag = BookTag;
exports.BookTagSchema = new core_1.EntitySchema({
    class: BookTag,
    properties: {
        _id: { type: 'ObjectId', primary: true },
        id: { type: 'string', serializedPrimaryKey: true },
        name: { type: 'string' },
        books: { reference: 'm:n', entity: () => Book_1.Book, mappedBy: 'tags' },
    },
});
