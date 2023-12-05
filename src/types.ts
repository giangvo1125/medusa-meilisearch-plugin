import { SearchTypes } from "@medusajs/types";
import { Config } from "meilisearch";

export interface IMeilisearchPluginSubscriberSettingOptions {
  serviceName: string;
  relations?: string[];
  indexType?: string;
  take?: number;
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
