import { SearchTypes } from "@medusajs/types";
import { Config } from "meilisearch";

export const MEILISEARCH_DEFAULT_HOST = "localhost:7700";

export const REGISTER_MEILISEARCH_INDEX_EVENT =
  "REGISTER_MEILISEARCH_INDEX_EVENT";

export enum MEILISEARCH_ERROR_CODES {
  INDEX_NOT_FOUND = "INDEX_NOT_FOUND",
  API_KEY_NOT_FOUND = "API_KEY_NOT_FOUND",
  HOST_NOT_FOUND = "HOST_NOT_FOUND",
  SERVICE_NOT_FOUND = "SERVICE_NOT_FOUND",
  SUBSCRIBER_SETTING_NOT_FOUND = "SUBSCRIBER_SETTING_NOT_FOUND",
  ENTITY_NOT_FOUND = "ENTITY_NOT_FOUND",
}

export interface IMeilisearchPluginSubscriberSettingOptions {
  serviceName: string;
  relations?: string[];
  indexType?: string;
}

export type IMeilisearchPluginSettingOptions = SearchTypes.IndexSettings & {
  subscriberSetting?: IMeilisearchPluginSubscriberSettingOptions;
};

export interface IMeilisearchPluginOptions {
  // Meilisearch client configuration
  config: Config;
  // Index settings
  settings?: {
    [key: string]: IMeilisearchPluginSettingOptions;
  };
  // the prefix for index.
  prefix?: string;
}
