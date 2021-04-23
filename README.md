[![view on npm](http://img.shields.io/npm/v/mongodb-extended.svg)](https://www.npmjs.org/package/mongodb-extended)
[![npm module downloads](http://img.shields.io/npm/dt/mongodb-extended.svg)](https://www.npmjs.org/package/mongodb-extended)
[![Build Status](https://travis-ci.com/speedytwenty/mongodb-extended.svg?branch=master)](https://travis-ci.com/speedytwenty/mongodb-extended)
[![Coverage Status](https://coveralls.io/repos/github/speedytwenty/mongodb-extended/badge.svg?branch=master)](https://coveralls.io/github/speedytwenty/mongodb-extended?branch=master)

# MongoDB Extended (mongodb-extended)

Extends the Node.js driver adding a useful API for modeling MongoDB objects and
keeping database structures in sync across environments.

**Use case:**

When using MongoDB _without_ a tool like [Mongoose](https://mongoosejs.com/), it
can be burdensome and problematic to maintain indexes, schemas, etc. across
environments.

This module provides a mechanism for configuring your MongoDB collections in
code and keeping things in sync across multiple environments.

### Collection Configuration Management

With mongodb-extended, your application can configure each collection as necessary
and mongodb-extended will keep the database in sync with your configuration.

This includes:

* Keeping indexes in sync between the database and configuration.
* Keeping collection options in sync between the database and configuration.
* Dropping legacy indexes as denoted in configuration.
* Pre-populating a collection with documents.

## Installation

*With NPM:*

`npm i mongodb-extended mongodb`

*With Yarn:*

`yarn add mongodb-extended mongodb`

## Usage

**Using mongodb-extended as the MongoDB driver:**

```js
const connect = require('mongodb-extended');
const config = {
  url: 'my://mongodb/url',
  options:
    useUnifiedTopology: true,
  name: 'myDatabaseName',
  collections: {
    myCollection: {
      indexes: {
        name: {
          // Index keys
          keys: { name: 1 },
          // Index options
          options: { unique: true },
        },
      },
      // Array of index names that should be dropped (if it exists)
      dropIndexes: ['legeacyIndexName'],
      // Array of documents to pre-populate the collection with
      data: [{
        name: 'John',
      }],
      // Collection options
      options: { capped: true, size: 12 },
    },
  },
};

connect(config, { initialize: true }).then(({ client, db, collections }) => {
  collections.myCollection.findOne({ name: 'John' }).then((document) => {
    return client.close();
  });
});
```

**Using mongodb-extended with mongodb:**

```js
const connect = require('mongodb');
const { initializeCollections } = require('mongodb');

connect('my://mongodb/url')
  .then((client) => client.db('myDb'))
  .then((db) => initializeCollections(db, {
      myCollection: {
        indexes: {
          name: {
            // Index keys
            keys: { name: 1 },
            // Index options
            options: { unique: true },
          },
        },
        dropIndexes: ['legeacyIndexName'],
        data: [{
          name: 'John',
        }],
        options: { capped: true, size: 12 },
      },
    })
    .then(({ myCollection }) => {
      return myCollection.findOne({ name: 'John' }).then((document) => {
        return db.close();
      })
    });
```

## Support

Feel free to report a bug or open a feature request on [Github](https://github.com/speedytwenty/mongodb-extended).

## Testing

`npm i && npm test`

_Developed by [Chris Lee](https://github.com/speedytwenty). Sponsored by [CodeCatalysts](https://github.com/codecatalysts)._
