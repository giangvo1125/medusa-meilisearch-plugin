import { MeiliSearch, Settings } from "meilisearch";
import { Logger } from "@medusajs/medusa";
import { SearchTypes } from "@medusajs/types";
import { AbstractSearchService, SearchUtils } from "@medusajs/utils";
import { IMeilisearchPluginOptions } from "../types";
import { MEILISEARCH_ERROR_CODES } from "../enums";
import { MEILISEARCH_DEFAULT_HOST } from "../constants";

class MeiliSearchService extends AbstractSearchService {
  isDefault = false;
  protected readonly _logger: Logger;
  protected readonly _config: IMeilisearchPluginOptions;
  protected readonly _client: MeiliSearch;
  protected readonly _prefix: string;

  constructor({ logger }, options: IMeilisearchPluginOptions) {
    super(arguments[0], options);
    this._logger = logger;
    if (options) {
      const { config } = options;
      if (!config.apiKey)
        this._logger.warn(
          `meiliSearchService: ${MEILISEARCH_ERROR_CODES.API_KEY_NOT_FOUND}`
        );

      if (!config.host) {
        this._logger.warn(
          `meiliSearchService: ${MEILISEARCH_ERROR_CODES.HOST_NOT_FOUND}`
        );
        options.config.host = MEILISEARCH_DEFAULT_HOST;
      }

      this._config = options;
      this._client = new MeiliSearch(options.config);
      this._prefix = options.prefix;
    }
  }

  async createIndex(
    indexName: string,
    options: Record<string, unknown> = { primaryKey: "id" }
  ) {
    const meilisearchIndexName = this._getIndexByPrefix(indexName);
    return await this._client.createIndex(meilisearchIndexName, options);
  }

  getIndex(indexName: string) {
    const meilisearchIndexName = this._getIndexByPrefix(indexName);
    return this._client.index(meilisearchIndexName);
  }

  async addDocuments(indexName: string, documents: any[]) {
    const transformedDocuments = this.transformDocument(indexName, documents);
    const meilisearchIndexName = this._getIndexByPrefix(indexName);
    return await this._client
      .index(meilisearchIndexName)
      .addDocuments(transformedDocuments);
  }

  async replaceDocuments(indexName: string, documents: any) {
    const transformedDocuments = this.transformDocument(indexName, documents);
    const meilisearchIndexName = this._getIndexByPrefix(indexName);
    return await this._client
      .index(meilisearchIndexName)
      .addDocuments(transformedDocuments);
  }

  async deleteDocument(indexName: string, documentId: string) {
    const meilisearchIndexName = this._getIndexByPrefix(indexName);
    return await this._client
      .index(meilisearchIndexName)
      .deleteDocument(documentId);
  }

  async deleteAllDocuments(indexName: string) {
    const meilisearchIndexName = this._getIndexByPrefix(indexName);
    return await this._client.index(meilisearchIndexName).deleteAllDocuments();
  }

  async search(
    indexName: string,
    query: string,
    options: Record<string, any> = {}
  ) {
    const { paginationOptions, filter, additionalOptions } = options;
    const meilisearchIndexName = this._getIndexByPrefix(indexName);
    return await this._client
      .index(meilisearchIndexName)
      .search(query, { filter, ...paginationOptions, ...additionalOptions });
  }

  async updateSettings(
    indexName: string,
    settings: SearchTypes.IndexSettings & Settings
  ) {
    try {
      const meilisearchIndexName = this._getIndexByPrefix(indexName);
      // backward compatibility
      const indexSettings = settings.indexSettings ?? settings ?? {};
      return await this._client
        .index(meilisearchIndexName)
        .updateSettings(indexSettings);
    } catch (err) {
      throw err;
    }
  }

  async upsertIndex(indexName: string, settings: SearchTypes.IndexSettings) {
    try {
      const meilisearchIndexName = this._getIndexByPrefix(indexName);
      return await this._client.getIndex(meilisearchIndexName);
    } catch (error) {
      if (error.code === MEILISEARCH_ERROR_CODES.INDEX_NOT_FOUND) {
        return this.createIndex(indexName, {
          primaryKey: settings?.primaryKey ?? "id",
        });
      }
    }
  }

  transformDocument(indexName: string, documents: any[]) {
    if (!documents?.length) {
      return [];
    }

    const transformer =
      this._config.settings?.[indexName]?.transformer ?? undefined;

    if (!transformer) return documents;

    return documents.map(transformer);
  }

  private _getIndexByPrefix = (indexName: string) =>
    `${this._prefix ? `${this._prefix}_` : ""}${indexName}`;
}

export default MeiliSearchService;
