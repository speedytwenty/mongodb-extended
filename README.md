<!--
DO NOT EDIT README.md DIRECTLY!

README.md is generated using the handlebars template at .readme.hbs.md (perhaps
this file).
-->
[![view on npm](http://img.shields.io/npm/v/mongodb-extended.svg)](https://www.npmjs.org/package/mongodb-extended)
[![npm module downloads](http://img.shields.io/npm/dt/mongodb-extended.svg)](https://www.npmjs.org/package/mongodb-extended)
[![Build Status](https://travis-ci.com/speedytwenty/mongodb-extended.svg?branch=master)](https://travis-ci.com/speedytwenty/mongodb-extended)
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

## Modules

<dl>
<dt><a href="#module_connect">connect</a> ⇒ <code>Promise</code></dt>
<dd><p>Connect to MongoDB and optionally initialize the database configuration and
collections.</p>
</dd>
</dl>

## Classes

<dl>
<dt><a href="#Collection">Collection</a></dt>
<dd><p>Extended MongoDB collection.</p>
</dd>
<dt><a href="#Db">Db</a></dt>
<dd><p>Extended MongoDB database.</p>
<p>Adds useful methods for initialization and maintenance to native MongoDB
database objects.</p>
</dd>
</dl>

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
        * [.InitializeCollectionsResult](#module_connect.initializeCollections.InitializeCollectionsResult) : [<code>object.&lt;Collection&gt;</code>](#Collection)
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
| db | [<code>Db</code>](#Db) | Active MongoDB database object. |
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
| db | [<code>Db</code>](#Db) | An active database object. |
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
| collection | [<code>Collection</code>](#Collection) | The collection object to ensure indexes on. |
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
| db | [<code>Db</code>](#Db) | MongoDB database object. |
| conf | <code>object</code> | Full database and collection configuration. |

<a name="module_connect.initializeCollection"></a>

### connect.initializeCollection ⇒ <code>Promise</code>
Initialize a collection while keeping configured indexes and options in
sync.

**Kind**: static property of [<code>connect</code>](#module_connect)  
**Returns**: <code>Promise</code> - Resolves the collection object.  

| Param | Type | Description |
| --- | --- | --- |
| db | [<code>Db</code>](#Db) | An active database object. |
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
| db | [<code>Db</code>](#Db) | An active database object. |
| collectionsConf | [<code>object.&lt;CollectionSpec&gt;</code>](#module_connect.initializeCollection.CollectionSpec) | The collections configuration object. |
| [options] | [<code>InitializeCollectionsOptions</code>](#module_connect.initializeCollections.InitializeCollectionsOptions) | Execution options. |


* [.initializeCollections](#module_connect.initializeCollections) ⇒ [<code>Promise.&lt;InitializeCollectionsResult&gt;</code>](#module_connect.initializeCollections.InitializeCollectionsResult)
    * [.InitializeCollectionsType](#module_connect.initializeCollections.InitializeCollectionsType) : [<code>object.&lt;CollectionSpec&gt;</code>](#module_connect.initializeCollection.CollectionSpec) \| [<code>Array.&lt;CollectionSpec&gt;</code>](#module_connect.initializeCollection.CollectionSpec)
    * [.InitializeCollectionsOptions](#module_connect.initializeCollections.InitializeCollectionsOptions) : <code>object</code>
    * [.InitializeCollectionsResult](#module_connect.initializeCollections.InitializeCollectionsResult) : [<code>object.&lt;Collection&gt;</code>](#Collection)

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

#### initializeCollections.InitializeCollectionsResult : [<code>object.&lt;Collection&gt;</code>](#Collection)
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
| db | [<code>Db</code>](#Db) | The MongoDB database object. |
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

<a name="Collection"></a>

## Collection
Extended MongoDB collection.

**Kind**: global class  
<a name="Collection+initializeData"></a>

### collection.initializeData(data, [options]) ⇒ <code>Promise</code>
Initialize a collection with fixed data.

Each data document in the provided data is handled individually and results
may vary based on the state of the collection (whether it is empty or not)
and whether or not the document has an _id.

1. If a document has an _id, then it can be added to a non-empty collection if
it hasn't already been added.

2. If a document does NOT have an _id, then it will only be inserted if
the collection was empty when this operation was invoked.

**Kind**: instance method of [<code>Collection</code>](#Collection)  
**Returns**: <code>Promise</code> - Resolves void.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array.&lt;object&gt;</code> | An array of document objects. |
| [options] | <code>object</code> | Optional settings. |
| [options.concurrency] | <code>number</code> | The number of concurrent documents to process at once. Defaults to 0 (all). |

<a name="Db"></a>

## Db
Extended MongoDB database.

Adds useful methods for initialization and maintenance to native MongoDB
database objects.

**Kind**: global class  

* [Db](#Db)
    * [.ensureCollection(collectionName, options)](#Db+ensureCollection) ⇒ [<code>Promise.&lt;Collection&gt;</code>](#Collection)
    * [.initializeCollection(collectionName, collectionSpec)](#Db+initializeCollection) ⇒ [<code>Promise.&lt;Collection&gt;</code>](#Collection)
    * [.initializeCollections(collections, options)](#Db+initializeCollections) ⇒ [<code>Promise.&lt;InitializeCollectionsResult&gt;</code>](#module_connect.initializeCollections.InitializeCollectionsResult)
    * [.initializeServer(serverParams)](#Db+initializeServer) ⇒ <code>Promise.&lt;module:connect.initializeServer.InitializeServerResult&gt;</code>

<a name="Db+ensureCollection"></a>

### db.ensureCollection(collectionName, options) ⇒ [<code>Promise.&lt;Collection&gt;</code>](#Collection)
Ensure a collection exists in the database and it's options are in sync with
what is provided.

**Kind**: instance method of [<code>Db</code>](#Db)  
**Returns**: [<code>Promise.&lt;Collection&gt;</code>](#Collection) - Promise resolves the collection.  

| Param | Type | Description |
| --- | --- | --- |
| collectionName | <code>string</code> | The name of the collection. |
| options | [<code>CollectionOptions</code>](#module_connect.ensureCollection.CollectionOptions) | The collection options. |

<a name="Db+initializeCollection"></a>

### db.initializeCollection(collectionName, collectionSpec) ⇒ [<code>Promise.&lt;Collection&gt;</code>](#Collection)
Synchronize a single collection specification with the database.

**Kind**: instance method of [<code>Db</code>](#Db)  
**Returns**: [<code>Promise.&lt;Collection&gt;</code>](#Collection) - Resolves the initialized collection.  

| Param | Type | Description |
| --- | --- | --- |
| collectionName | <code>string</code> | The name of the collection to initialize. |
| collectionSpec | [<code>CollectionSpec</code>](#module_connect.initializeCollection.CollectionSpec) | The collection specification. |

<a name="Db+initializeCollections"></a>

### db.initializeCollections(collections, options) ⇒ [<code>Promise.&lt;InitializeCollectionsResult&gt;</code>](#module_connect.initializeCollections.InitializeCollectionsResult)
Synchonize multiple collection specifications with the database.

**Kind**: instance method of [<code>Db</code>](#Db)  
**Returns**: [<code>Promise.&lt;InitializeCollectionsResult&gt;</code>](#module_connect.initializeCollections.InitializeCollectionsResult) - Object keyed by collection name with corresponding collection objects.  

| Param | Type | Description |
| --- | --- | --- |
| collections | [<code>InitializeCollectionsType</code>](#module_connect.initializeCollections.InitializeCollectionsType) | Collection specifications for one or more collections. |
| options | [<code>InitializeCollectionsOptions</code>](#module_connect.initializeCollections.InitializeCollectionsOptions) | Initialization options. |

<a name="Db+initializeServer"></a>

### db.initializeServer(serverParams) ⇒ <code>Promise.&lt;module:connect.initializeServer.InitializeServerResult&gt;</code>
Set the specified server parameters on the database server during
initialization.

**Kind**: instance method of [<code>Db</code>](#Db)  
**Returns**: <code>Promise.&lt;module:connect.initializeServer.InitializeServerResult&gt;</code> - Resolves an object indicating the status of each parameter.  

| Param | Type | Description |
| --- | --- | --- |
| serverParams | <code>object</code> | The server params and corresponding values to synchronize. |


## Support

Feel free to report a bug or open a feature request on [Github](https://github.com/speedytwenty/mongodb-extended).

## Testing

`npm i && npm test`

_Developed by [Chris Lee](https://github.com/speedytwenty). Sponsored by [CodeCatalysts](https://github.com/codecatalysts)._

_API reference generated with [jsdoc2md](https://github.com/jsdoc2md/jsdoc-to-markdown)._
