<!--
DO NOT EDIT README.md DIRECTLY!

README.md is generated using the handlebars template at .readme.hbs.md (perhaps
this file).
-->
[![view on npm](http://img.shields.io/npm/v/mongodb-extended.svg)](https://www.npmjs.org/package/mongodb-extended)
[![npm module downloads](http://img.shields.io/npm/dt/mongodb-extended.svg)](https://www.npmjs.org/package/mongodb-extended)
![test workflow](https://github.com/speedytwenty/mongodb-extended/actions/workflows/test.yml/badge.svg?event=push)
[![Coverage Status](https://coveralls.io/repos/github/speedytwenty/mongodb-extended/badge.svg?branch=master)](https://coveralls.io/github/speedytwenty/mongodb-extended?branch=master)
[![Maintainability](https://codeclimate.com/github/speedytwenty/mongodb-extended/badges/gpa.svg)](https://codeclimate.com/github/speedytwenty/mongodb-extended/maintainability)

# MongoDB Extended (mongodb-extended)

Extends the Node.js driver adding a useful API for modeling MongoDB objects and
keeping database structures in sync across environments.

**Use case:**

When using MongoDB _without_ a tool like [Mongoose](https://mongoosejs.com/), it
can be burdensome and problematic to maintain indexes, schemas, etc. across
environments.

This module provides a mechanism for configuring your MongoDB collections in
code and keeping things in sync across multiple environments.

**MongoDB driver version:**

* **Version 1.x:** Supports mongodb driver version 3.x
* **Version 2.x:** Supports mongodb driver version 4.x

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

`npm i mongodb-extended`

*With Yarn:*

`yarn add mongodb-extended`

## API Reference 

<a name="module_connect"></a>

## connect ⇒ <code>Promise</code>
Connect to MongoDB and optionally initialize the database configuration and
collections.

**Returns**: <code>Promise</code> - Resolves an objecting the MongoDB client, db, and
collections.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| dbConf | [<code>Configuration</code>](#module_connect.Configuration) |  | Full configuration. See the type definition for details. |
| [options] | <code>object</code> |  | Run-time options. |
| [options.initialize] | <code>boolean</code> | <code>false</code> | Whether to initialize the db and collections. |
| [options.concurrency] | <code>number</code> |  | Override the concurrency for all relevant operations. |

**Example** *(Basic connection.)*  
```js
const connect = require('mongodb-extended');

connect({
  collections: {
    myCollection: {
      indexes: {
        name: { keys: { name: 1 }, options: { unique: true } },
      },
      // MongoDB collection options. Providing a simple schema validator.
      options: {
        validator: {
          $jsonSchema: {
            required: ['name', 'value'],
            properties: {
              name: { type: 'string' },
              value: { type: 'string|number' },
            },
          },
        },
      },
      // Pre-populate our db with data
      data: [
        { name: 'foo', value: 'bar' },
        { name: 'abc', value: 123 },
      ],
      // Ensure old indexes that are no longer used are removed
      dropIndexes: [
        'legacyIndex1',
        'legacyIndex2',
      ],
    },
    myView: {
      options: {
        viewOn: 'myCollection',
        pipeline: [
          { $group: { _id: '$value', names: { $addToSet: '$name' } } },
          { $sort: { _id: -1 } },
        ],
      },
    },
  },
  // Ensure old collections that are no longer used are removed.
  dropCollections: [
    'legacyCollection1',
    'legacyCollection2',
  ],
  // Syncronize the database server parameters with the parameters specified
  // here. WARNING: These settings affect the entire database server.
  serverParameters: {
    notablescan: true,
  },
  // This initialize flag triggers the initialization operations. When true
  // server parameters and collection settings are synchonized with the
  // database.
}, { initialize: true }).then(({ client, collections }) => {
  collections.foo.findOne({ name: 'bar' })
    .then((document) => {
      console.log(document);
      client.close();
    })
    .catch((e) => {
      client.close();
      console.error(e);
    });
});
```

* [connect](#module_connect) ⇒ <code>Promise</code>
    * [.connect](#module_connect.connect) ⇒ <code>Promise</code>
    * [.connectAndInitialize](#module_connect.connectAndInitialize) ⇒ <code>Promise</code>
    * [.dropCollections](#module_connect.dropCollections) ⇒ <code>Promise</code>
    * [.ensureCollection](#module_connect.ensureCollection) ⇒ <code>Promise</code>
        * [.CollectionOptions](#module_connect.ensureCollection.CollectionOptions) : <code>object</code>
    * [.ensureIndexes](#module_connect.ensureIndexes) ⇒ <code>Promise</code>
        * [.IndexKeySpec](#module_connect.ensureIndexes.IndexKeySpec) : <code>string</code> \| <code>number</code>
        * [.IndexSpec](#module_connect.ensureIndexes.IndexSpec) : <code>object</code>
    * [.initializeAll](#module_connect.initializeAll) ⇒ <code>Promise</code>
    * [.initializeCollection](#module_connect.initializeCollection) ⇒ <code>Promise</code>
        * [.CollectionSpec](#module_connect.initializeCollection.CollectionSpec) : <code>object</code>
    * [.initializeCollections](#module_connect.initializeCollections) ⇒ [<code>Promise.&lt;InitializeCollectionsResult&gt;</code>](#module_connect.initializeCollections.InitializeCollectionsResult)
        * [.InitializeCollectionsType](#module_connect.initializeCollections.InitializeCollectionsType) : [<code>object.&lt;CollectionSpec&gt;</code>](#module_connect.initializeCollection.CollectionSpec) \| [<code>Array.&lt;CollectionSpec&gt;</code>](#module_connect.initializeCollection.CollectionSpec)
        * [.InitializeCollectionsOptions](#module_connect.initializeCollections.InitializeCollectionsOptions) : <code>object</code>
        * [.InitializeCollectionsResult](#module_connect.initializeCollections.InitializeCollectionsResult) : [<code>object.&lt;initializeCollections&gt;</code>](#module_connect.initializeCollections)
    * [.initializeServer](#module_connect.initializeServer) ⇒ <code>Promise</code>
    * [.Configuration](#module_connect.Configuration) : <code>object</code>

<a name="module_connect.connect"></a>

### connect.connect ⇒ <code>Promise</code>
Connect to mongodb with extended configuration options.

**Kind**: static property of [<code>connect</code>](#module_connect)  
**Returns**: <code>Promise</code> - Resolves an object containing the client, db, and
collections.  

| Param | Type | Description |
| --- | --- | --- |
| conf | <code>object</code> | Extended database configuration. |

<a name="module_connect.connectAndInitialize"></a>

### connect.connectAndInitialize ⇒ <code>Promise</code>
Connect and initialize (sync database and collection settings).

**Kind**: static property of [<code>connect</code>](#module_connect)  
**Returns**: <code>Promise</code> - Resolves an object containing the MongoDB client, db,
and an object with each configured collection.  

| Param | Type | Description |
| --- | --- | --- |
| conf | [<code>Configuration</code>](#module_connect.Configuration) | Full database and collection configuration. |

<a name="module_connect.dropCollections"></a>

### connect.dropCollections ⇒ <code>Promise</code>
Ensure collections do not exist. If a provided collection exists, it will be
dropped.

**Kind**: static property of [<code>connect</code>](#module_connect)  
**Returns**: <code>Promise</code> - Resolves an array of collection names that existed and
were dropped.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>module:connect.Db</code> | Active MongoDB database object. |
| colNames | <code>Array.&lt;string&gt;</code> | Array of collection names to ensure do not exist. |

<a name="module_connect.ensureCollection"></a>

### connect.ensureCollection ⇒ <code>Promise</code>
Ensure collection is in sync.

**Kind**: static property of [<code>connect</code>](#module_connect)  
**Returns**: <code>Promise</code> - Resolves the collection object.  
**Throws**:

- <code>Error</code> For invalid arguments or invalid options.


| Param | Type | Description |
| --- | --- | --- |
| db | [<code>connect</code>](#module_connect) | Active MongoDB database object. |
| colName | <code>string</code> | The name of the collection. |
| [options] | [<code>CollectionOptions</code>](#module_connect.ensureCollection.CollectionOptions) | Collection options. |

<a name="module_connect.ensureCollection.CollectionOptions"></a>

#### ensureCollection.CollectionOptions : <code>object</code>
MongoDB Collection options.

**Kind**: static typedef of [<code>ensureCollection</code>](#module_connect.ensureCollection)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [validator] | <code>object</code> | Custom validaor. |

<a name="module_connect.ensureIndexes"></a>

### connect.ensureIndexes ⇒ <code>Promise</code>
Ensure indexes exist and are in sync.

**Kind**: static property of [<code>connect</code>](#module_connect)  
**Returns**: <code>Promise</code> - Resolves an object containing the results of the
operation.  

| Param | Type | Description |
| --- | --- | --- |
| collection | <code>module:connect.Collection</code> | The collection object to ensure indexes on. |
| indexes | [<code>object.&lt;IndexSpec&gt;</code>](#module_connect.ensureIndexes.IndexSpec) | The indexes to ensure. |


* [.ensureIndexes](#module_connect.ensureIndexes) ⇒ <code>Promise</code>
    * [.IndexKeySpec](#module_connect.ensureIndexes.IndexKeySpec) : <code>string</code> \| <code>number</code>
    * [.IndexSpec](#module_connect.ensureIndexes.IndexSpec) : <code>object</code>

<a name="module_connect.ensureIndexes.IndexKeySpec"></a>

#### ensureIndexes.IndexKeySpec : <code>string</code> \| <code>number</code>
Index key specification.

**Kind**: static typedef of [<code>ensureIndexes</code>](#module_connect.ensureIndexes)  
<a name="module_connect.ensureIndexes.IndexSpec"></a>

#### ensureIndexes.IndexSpec : <code>object</code>
Index specification.

**Kind**: static typedef of [<code>ensureIndexes</code>](#module_connect.ensureIndexes)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| keys | [<code>object.&lt;IndexKeySpec&gt;</code>](#module_connect.ensureIndexes.IndexKeySpec) | Index key specifications. |
| [options] | <code>object</code> | MongoDB index options. Refer to the [documentation](https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/#options-for-all-index-types) for full details of available options. |

<a name="module_connect.initializeAll"></a>

### connect.initializeAll ⇒ <code>Promise</code>
Connect and initialize (sync database and collection settings).

**Kind**: static property of [<code>connect</code>](#module_connect)  
**Returns**: <code>Promise</code> - Resolves and array of the operation results.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>module:connect.Db</code> | MongoDB database object. |
| conf | <code>object</code> | Full database and collection configuration. |

<a name="module_connect.initializeCollection"></a>

### connect.initializeCollection ⇒ <code>Promise</code>
Initialize a collection while keeping configured indexes and options in
sync.

**Kind**: static property of [<code>connect</code>](#module_connect)  
**Returns**: <code>Promise</code> - Resolves the collection object.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>module:connect.Db</code> | An active database object. |
| colName | <code>string</code> | The name of the collection to initialize. |
| colConf | [<code>CollectionSpec</code>](#module_connect.initializeCollection.CollectionSpec) | Collection configuration specification. |

<a name="module_connect.initializeCollection.CollectionSpec"></a>

#### initializeCollection.CollectionSpec : <code>object</code>
Collection specifiction.

**Kind**: static typedef of [<code>initializeCollection</code>](#module_connect.initializeCollection)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [options] | [<code>CollectionOptions</code>](#module_connect.ensureCollection.CollectionOptions) | Collection options. |
| data | <code>Array.&lt;object&gt;</code> | Optionally initialize with preset data. |
| [indexes] | [<code>Array.&lt;IndexSpec&gt;</code>](#module_connect.ensureIndexes.IndexSpec) \| [<code>object.&lt;IndexSpec&gt;</code>](#module_connect.ensureIndexes.IndexSpec) | Initialize the collection with configured indexes and keep the database indexes in sync. |
| dropIndexes | <code>Array.&lt;string&gt;</code> | List of indexes that will be dropped if they exist. |

<a name="module_connect.initializeCollections"></a>

### connect.initializeCollections ⇒ [<code>Promise.&lt;InitializeCollectionsResult&gt;</code>](#module_connect.initializeCollections.InitializeCollectionsResult)
Initialize multiple collections.

**Kind**: static property of [<code>connect</code>](#module_connect)  
**Returns**: [<code>Promise.&lt;InitializeCollectionsResult&gt;</code>](#module_connect.initializeCollections.InitializeCollectionsResult) - Resolves an object keyed with collection names containing their corresponding
(extended) MongoDB collection.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>module:connect.Db</code> | An active database object. |
| collectionsConf | [<code>object.&lt;CollectionSpec&gt;</code>](#module_connect.initializeCollection.CollectionSpec) | The collections configuration object. |
| [options] | [<code>InitializeCollectionsOptions</code>](#module_connect.initializeCollections.InitializeCollectionsOptions) | Execution options. |


* [.initializeCollections](#module_connect.initializeCollections) ⇒ [<code>Promise.&lt;InitializeCollectionsResult&gt;</code>](#module_connect.initializeCollections.InitializeCollectionsResult)
    * [.InitializeCollectionsType](#module_connect.initializeCollections.InitializeCollectionsType) : [<code>object.&lt;CollectionSpec&gt;</code>](#module_connect.initializeCollection.CollectionSpec) \| [<code>Array.&lt;CollectionSpec&gt;</code>](#module_connect.initializeCollection.CollectionSpec)
    * [.InitializeCollectionsOptions](#module_connect.initializeCollections.InitializeCollectionsOptions) : <code>object</code>
    * [.InitializeCollectionsResult](#module_connect.initializeCollections.InitializeCollectionsResult) : [<code>object.&lt;initializeCollections&gt;</code>](#module_connect.initializeCollections)

<a name="module_connect.initializeCollections.InitializeCollectionsType"></a>

#### initializeCollections.InitializeCollectionsType : [<code>object.&lt;CollectionSpec&gt;</code>](#module_connect.initializeCollection.CollectionSpec) \| [<code>Array.&lt;CollectionSpec&gt;</code>](#module_connect.initializeCollection.CollectionSpec)
Parameter structure for initializeCollections.

Either an array of collection specifications with a "name" field added to
the spec, or an object keyed by the collectionNames.

**Kind**: static typedef of [<code>initializeCollections</code>](#module_connect.initializeCollections)  
<a name="module_connect.initializeCollections.InitializeCollectionsOptions"></a>

#### initializeCollections.InitializeCollectionsOptions : <code>object</code>
Operation run-time options for initializeCollections().

**Kind**: static typedef of [<code>initializeCollections</code>](#module_connect.initializeCollections)  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| [concurrency] | <code>number</code> | <code>0</code> | Limit the number of collections that are processed in parallel. |

<a name="module_connect.initializeCollections.InitializeCollectionsResult"></a>

#### initializeCollections.InitializeCollectionsResult : [<code>object.&lt;initializeCollections&gt;</code>](#module_connect.initializeCollections)
Result structure for initializeCollections().

The resulting object is derrived from the collection specifications provided.
Each collection with be keyed by name with the corresponding Collection
object.

**Kind**: static typedef of [<code>initializeCollections</code>](#module_connect.initializeCollections)  
<a name="module_connect.initializeServer"></a>

### connect.initializeServer ⇒ <code>Promise</code>
Initialize server parameters.

**Kind**: static property of [<code>connect</code>](#module_connect)  
**Returns**: <code>Promise</code> - Resolves the command result.  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>module:connect.Db</code> | The MongoDB database object. |
| serverParams | <code>object</code> | Server parameters object. |

<a name="module_connect.Configuration"></a>

### connect.Configuration : <code>object</code>
Complete configuration for connecting and initializing with mongodb-extended.

**Kind**: static typedef of [<code>connect</code>](#module_connect)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The name of the database. |
| [url] | <code>string</code> | The MongoDB URL. |
| [options] | <code>object</code> | MongoDB connection options. |
| [collections] | [<code>object.&lt;CollectionSpec&gt;</code>](#module_connect.initializeCollection.CollectionSpec) | The collection specifications for the application. |
| [dropCollections] | <code>Array.&lt;string&gt;</code> | List of collections that will be dropped if they exist. |
| [serverParameters] | <code>object</code> | Optionally set server parameters on initialization. |


## Support

Feel free to report a bug or open a feature request on [Github](https://github.com/speedytwenty/mongodb-extended).

## Testing

`npm i && npm test`

_Developed by [Chris Lee](https://github.com/speedytwenty). Sponsored by [CodeCatalysts](https://github.com/codecatalysts)._

_API reference generated with [jsdoc2md](https://github.com/jsdoc2md/jsdoc-to-markdown)._
