# @giangvo1125/medusa-meilisearch-plugin

- Provide powerful indexing and searching features in your commerce application with MeiliSearch.
- Read more about the meilisearch [**here**](https://www.meilisearch.com/).

## Version specification

- node: 18.12.0
- typescript: 4.9.2
- meilisearch: 0.30.0

## Features

- Flexible configurations for specifying searchable and retrievable attributes.
- Utilize MeiliSearch's powerful search functionalities including typo-tolerance, synonyms, filtering, and more.
- Automatically to add all entities when starting the application if match with the configuration.

## Install

- Install to the project

```sh
yarn add @giangvo1125/medusa-meilisearch-plugin
```

## Guide

- Set the following environment variables in `.env`

```bash
MEILISEARCH_HOST=<YOUR_MEILISEARCH_HOST>
MEILISEARCH_API_KEY=<YOUR_MASTER_KEY>
```

- Import the plugin to `medusa-config.js`:

```js
// medusa-config.js
const plugins = [
  // ...
  {
    resolve: `@giangvo1125/medusa-meilisearch-plugin`,
    options: {
      config: {
        host: process.env.MEILISEARCH_HOST,
        apiKey: process.env.MEILISEARCH_API_KEY,
      },
      prefix: "",
      settings: {
        "<your-index-name>": {
          indexSettings: {
            searchableAttributes: [],
            displayedAttributes: [],
          },
          subscriberSetting: {
            serviceName: "productService",
            relations: [],
          },
          primaryKey: "id",
          transformer: (entity) => ({
            id: entity.id,
            // other attributes...
          }),,
        },
      },
    },
  },
];

/** @type {import('@medusajs/medusa').ConfigModule} */
module.exports = {
  projectConfig: {},
  plugins,
  modules: {},
};
```

- Then import to use:

```ts
// ...
const searchService = req.scope.resolve("meilisearchService");
const indexName = `<your-index-name>`;
const results = await searchService.search(indexName, q, {
  paginationOptions,
  filter,
  additionalOptions: options,
});
// ...
```

- We can update import new data by emitting the event, the subscriber will subscribe this event and add new documents:

```ts
import { REGISTER_MEILISEARCH_INDEX_EVENT } from "@giangvo1125/medusa-meilisearch-plugin";
// ...
const eventBusService: EventBusService = container.resolve("eventBusService");
const eventName = REGISTER_MEILISEARCH_INDEX_EVENT;
const indexName = "<your-index-name>";
await eventBusService.emit(eventName, {
  indexName,
});
```

- We can only add selected entity by passing the `entityId` to the payload when emitting the event:

```ts
import { REGISTER_MEILISEARCH_INDEX_EVENT } from "@giangvo1125/medusa-meilisearch-plugin";
// ...
const eventBusService: EventBusService = container.resolve("eventBusService");
const eventName = REGISTER_MEILISEARCH_INDEX_EVENT;
const indexName = "<your-index-name>";
const entityId = "<your-created-entity-id>";
await eventBusService.emit(eventName, {
  indexName,
  entityId,
});
```

## Options

- **`config`**: the configuration for meilisearch. We will put the meilisearch host and the master key for this project.
- **`prefix`**: the prefix string for each env if we want to use same host for multiple env. (e.g. we can use `products` index for `dev` and `qa` env if we set `dev` prefix for dev and `qa` for qa env).
- **`settings`**: you can add settings specific to each index. The settings are of the following format:
  - **`indexName`**: an object which the object key is the name of the index to create in `meilisearch`. (e.g. products) that includes the following properties:
    - **`indexSettings`**: an object that includes the following properties:
      - **`searchableAttributes`**: an array of strings indicating the attributes in the entity that can be searched.
      - **`displayedAttributes`**: an array of strings indicating the attributes in the entity that should be displayed in the search results.
      - **`primaryKey`**: an optional string indicating which property acts as a primary key of a document. It's used to enforce unique documents in an index. The default value is **`id`**. You can learn more in [**this documentation**](https://www.meilisearch.com/docs/learn/core_concepts/primary_key#primary-field).
      - **`transformer`**: an optional function that will transform the result to the expectation result.
    - **`subscriberSetting`**: an object using for the subscriber that includes the following properties:
      - **`relations`**: an optional array of strings indicating the relation of entity when retrieve the entities.
      - **`serviceName`**: an required string indicating the service that will use to retrieve entities for adding **documents** to the **`meilisearch`**.
      - **`take`**: an optional number indicating the default take documents to add to the index.

## Notes

- [How to create a medusa plugin](https://docs.medusajs.com/development/plugins/create)

- [Some troubleshoot error when creating the medusa plugin](https://docs.medusajs.com/development/plugins/create#troubleshoot-errors)
