import { FindConfig, Logger, Selector } from "@medusajs/medusa";
import { MedusaError } from "@medusajs/utils";
import MeiliSearchService from "../services/meilisearch";
import {
  IMeilisearchPluginOptions,
  IMeilisearchPluginSettingOptions,
  IMeilisearchPluginSubscriberSettingOptions,
  MEILISEARCH_ERROR_CODES,
  REGISTER_MEILISEARCH_INDEX_EVENT,
} from "../types";

interface IService<Entity> {
  list: (
    selector: Selector<Entity>,
    config?: FindConfig<Entity>
  ) => Promise<Entity[]>;
}

interface IEntity extends Record<string, unknown> {
  id: string;
}

class EntitySubscriber {
  private readonly _logger: Logger;
  private readonly _meiliSearchService: MeiliSearchService;
  private readonly _services: Record<string, IService<IEntity>>;

  private readonly _settings: Record<string, IMeilisearchPluginSettingOptions>;

  constructor(
    { logger, meilisearchService, eventBusService, ...services },
    { settings }: IMeilisearchPluginOptions
  ) {
    this._logger = logger;
    this._meiliSearchService = meilisearchService;
    this._services = services;
    this._settings = settings;

    eventBusService.subscribe(
      `${REGISTER_MEILISEARCH_INDEX_EVENT}`,
      this._handleAddEntityToIndex
    );
  }

  /**
   * add entities to the meilisearch index after register the index if not pass the entityId.
   * if the payload has the entityId, just only add this entity to the meilisearch index.
   *
   * @param payload
   * @param payload.indexName the index name
   * @param payload.entityId the entity id
   * @returns {Promise<void>} promise returning void
   */
  private _handleAddEntityToIndex = async ({
    indexName,
    entityId,
  }: {
    indexName: string;
    entityId?: string;
  }): Promise<void> => {
    try {
      this._logger.debug(
        `_handleAddEntityToIndex - indexName: ${indexName}, entityId: ${entityId}`
      );

      const subscriberSetting = await this._getSubscriberSetting({ indexName });

      if (entityId) {
        return this._addEntity({ indexName, subscriberSetting, entityId });
      }

      const canAdd = await this._canAddEntities({
        indexName,
        subscriberSetting,
      });
      if (!canAdd) return;

      await this._addEntities({ indexName, subscriberSetting });
    } catch (err) {
      this._logger.error(
        `_handleAddEntityToIndex - indexName: ${indexName} >>> error: ${err.message}`,
        err
      );
      throw err;
    }
  };

  /**
   * add batch entities to the meilisearch index
   *
   * @param payload
   * @param payload.indexName the meilisearch index.
   * @param payload.subscriberSetting the subscriber setting
   * @returns {Promise<void>} promise returning void
   */
  private _addEntities = async ({
    indexName,
    subscriberSetting,
  }: {
    indexName: string;
    subscriberSetting: IMeilisearchPluginSubscriberSettingOptions;
  }): Promise<void> => {
    const {
      relations = [],
      serviceName = "",
      indexType = indexName,
    } = subscriberSetting;
    try {
      const TAKE = 100;
      let hasMore = true;
      let count = 0;
      let lastSeenId = "";

      while (hasMore) {
        const entities = await this._retrieveNextEntities({
          lastSeenId,
          take: TAKE,
          relations,
          serviceName,
        });

        if (entities.length > 0) {
          await this._meiliSearchService.addDocuments(
            indexName,
            entities,
            indexType
          );
          lastSeenId = entities[entities.length - 1].id;
          count += entities.length;
        } else {
          hasMore = false;
        }
      }
      this._logger.debug(
        `_addEntities >>> indexName: ${indexName}, count: ${count}`
      );
    } catch (err) {
      throw err;
    }
  };

  /**
   * add entity to the meilisearch index by the entity id
   *
   * @param payload
   * @param payload.indexName the meilisearch index.
   * @param payload.subscriberSetting the subscriber setting
   * @param payload.entityId the entity reference id
   * @returns {Promise<void>} promise returning void
   */
  private _addEntity = async ({
    indexName,
    subscriberSetting: { serviceName, indexType },
    entityId,
  }: {
    indexName: string;
    subscriberSetting: IMeilisearchPluginSubscriberSettingOptions;
    entityId: string;
  }): Promise<void> => {
    const service = this._getServiceByServiceName(serviceName);
    const [entity] = await service.list({ id: entityId });
    if (!entity) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        MEILISEARCH_ERROR_CODES.ENTITY_NOT_FOUND
      );
    }

    const { hits } = await this._meiliSearchService.search(indexName, entityId);

    if (hits.length > 0) {
      this._logger.debug(
        `_addEntity - indexName: ${indexName}, entityId: ${entityId} >>>> no need to execute`
      );
      return;
    }

    await this._meiliSearchService.addDocuments(indexName, [entity], indexType);
    this._logger.debug(
      `_addEntity - indexName: ${indexName}, entityId: ${entityId} >>>> added`
    );
  };

  /**
   * get the next batch entities.
   *
   * @param payload
   * @param payload.lastSeenId the last entities id from the previous batch.
   * @param payload.take the limit to get
   * @param payload.relations the other entity related with the entity to retrieve
   * @param payload.serviceName the service name related with entity
   * @returns {Promise<IEntity[]>} promise returning the batch entities.
   */
  protected _retrieveNextEntities = async ({
    lastSeenId,
    take,
    relations,
    serviceName,
  }: {
    lastSeenId: string;
    take: number;
    relations?: string[];
    serviceName: string;
  }): Promise<IEntity[]> => {
    const service = this._getServiceByServiceName(serviceName);
    return await service.list(
      { id: { gt: lastSeenId } },
      {
        relations,
        take: take,
        order: { id: "ASC" },
      }
    );
  };

  /**
   * retrieve the last entity.
   *
   * @param payload
   * @param payload.relations the other entity related with the entity to retrieve
   * @param payload.serviceName the service name related with entity
   * @returns {Promise<Entity|undefined>} promise returning entity or undefined
   */
  private _retrieveLastEntity = async (
    {
      relations = [],
      serviceName = "",
    }: {
      relations?: string[];
      serviceName: string;
    } = { serviceName: "" }
  ): Promise<IEntity | undefined> => {
    const service = this._getServiceByServiceName(serviceName);
    const [entity] = await service.list(
      { id: { gt: "" } },
      {
        relations,
        take: 1,
        order: { id: "DESC" },
      }
    );

    return entity || undefined;
  };

  /**
   * verify that we added the entity or not
   *
   * @param payload
   * @param payload.indexName the meilisearch index name
   * @param payload.subscriberSetting the subscriber setting
   * @returns {Promise<boolean>} promise returning boolean
   */
  private _canAddEntities = async ({
    indexName,
    subscriberSetting,
  }: {
    indexName: string;
    subscriberSetting: IMeilisearchPluginSubscriberSettingOptions;
  }): Promise<boolean> => {
    const { relations = [], serviceName = "" } = subscriberSetting;
    const lastEntity = await this._retrieveLastEntity({
      relations,
      serviceName,
    });
    if (!lastEntity) {
      this._logger.debug(
        `_canAddEntities - indexName: ${indexName} >>>> not found last entity`
      );
      return false;
    }

    const { hits } = await this._meiliSearchService.search(
      indexName,
      lastEntity.id
    );

    if (hits.length > 0) {
      this._logger.debug(
        `_canAddEntities - indexName: ${indexName} >>>> no need to execute`
      );
      return false;
    }

    return true;
  };

  /**
   * get the subscriber setting and verify the index exists or not
   *
   * @param indexName the meilisearch index.
   * @returns {Promise<IMeilisearchPluginSubscriberSettingOptions>} returning the subscriber setting.
   */
  private _getSubscriberSetting = async ({
    indexName,
  }: {
    indexName: string;
  }): Promise<IMeilisearchPluginSubscriberSettingOptions> => {
    const subscriberSetting =
      this._retrieveSubscriberSettingByIndexName(indexName);

    if (!subscriberSetting) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        MEILISEARCH_ERROR_CODES.SUBSCRIBER_SETTING_NOT_FOUND
      );
    }

    const { uid } = this._meiliSearchService.getIndex(indexName);

    if (!uid) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        MEILISEARCH_ERROR_CODES.INDEX_NOT_FOUND
      );
    }

    return subscriberSetting;
  };

  /**
   * retrieve the subscriber setting by the meilisearch index name
   *
   * @param indexName the meilisearch index name
   * @returns {IMeilisearchPluginSubscriberSettingOptions | undefined} the subscriber setting
   */
  private _retrieveSubscriberSettingByIndexName = (
    indexName: string
  ): IMeilisearchPluginSubscriberSettingOptions | undefined => {
    return this._settings[indexName]?.subscriberSetting;
  };

  /**
   * retrieve the service that will use for retrieve the entities by the service name
   *
   * @param serviceName the service name related with entity
   * @returns {IService<IEntity>} the selected service
   */
  private _getServiceByServiceName = (
    serviceName: string
  ): IService<IEntity> => {
    const service = this._services[serviceName];
    if (!service) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        MEILISEARCH_ERROR_CODES.SERVICE_NOT_FOUND
      );
    }
    return service;
  };
}

export default EntitySubscriber;
