import { EventBusService } from "@medusajs/medusa";
import { MedusaContainer } from "@medusajs/modules-sdk";
import { Logger } from "@medusajs/types";
import MeiliSearchService from "../services/meilisearch";
import { IMeilisearchPluginOptions } from "../types";
import { REGISTER_MEILISEARCH_INDEX_EVENT } from "../constants";

/**
 * upsert the meilisearch index on startup.
 *
 * @param container the medusa container
 * @param options the plugin option
 */
export default async (
  container: MedusaContainer,
  options: IMeilisearchPluginOptions
): Promise<void> => {
  const logger: Logger = container.resolve("logger");
  const eventBusService: EventBusService = container.resolve("eventBusService");
  logger.debug("meilisearch plugin loader >>> init all indexes");
  try {
    const meilisearchService: MeiliSearchService =
      container.resolve("meilisearchService");

    const { settings } = options;

    // get all indexes from settings plugin option and create index.
    await Promise.all(
      Object.entries(settings || {}).map(
        async ([indexName, { primaryKey, ...value }]) => {
          const eventName = REGISTER_MEILISEARCH_INDEX_EVENT;
          const options: Record<string, string> = {};
          if (primaryKey) options.primaryKey = primaryKey;
          await meilisearchService.createIndex(`${indexName}`, options);
          await meilisearchService.updateSettings(`${indexName}`, value);
          return eventBusService.emit(eventName, {
            indexName,
          });
        }
      )
    );
    logger.debug("meilisearch plugin loader >>> DONE");
  } catch (err) {
    // ignore the error
    logger.error(err);
  }
};
