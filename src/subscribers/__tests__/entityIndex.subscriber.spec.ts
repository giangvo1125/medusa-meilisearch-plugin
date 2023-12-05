import { when } from "jest-when";
import { REGISTER_MEILISEARCH_INDEX_EVENT } from "../../constants";
import EntitySubscriber from "../entityIndex.subscriber";
import {
  mockEntity,
  mockSubscriberSettings,
} from "../__mocks__/entityIndex.mock";
import { MEILISEARCH_ERROR_CODES } from "../../enums";

jest.mock("meilisearch", () => {
  return {
    MeiliSearch: jest.fn(),
  };
});

describe("entityIndex.subscriber", () => {
  describe("constructor", () => {
    it("Should init subscriber success", () => {
      // given
      const logger = {
        debug: jest.fn(),
      };
      const meilisearchService = jest.fn();
      const eventBusService = {
        subscribe: jest.fn(),
      };
      const options = {
        config: {
          apiKey: "_apiKey",
          host: "_host",
        },
        prefix: "_prefix",
        settings: {},
      };
      // when
      const expected = new EntitySubscriber(
        { logger, meilisearchService, eventBusService },
        options as any
      );
      // then
      expect(expected).not.toBeUndefined();
      expect(eventBusService.subscribe).toBeCalledWith(
        `${REGISTER_MEILISEARCH_INDEX_EVENT}`,
        // @ts-ignore
        expected._handleAddEntityToIndex
      );
    });
  });

  describe("_handleAddEntityToIndex", () => {
    const logger = {
      debug: jest.fn(),
      error: jest.fn(),
    };
    const options = {
      config: {
        apiKey: "_apiKey",
        host: "_host",
      },
      prefix: "_prefix",
      settings: {},
    };
    const eventBusService = {
      subscribe: jest.fn(),
    };
    it("Should add entity to index", async () => {
      // given
      const uid = "_uid";
      const indexName = "_indexName";
      const entityId = "_entityId";
      const serviceName = "_serviceName";
      const hits = [];
      const entities = [mockEntity({})];
      const settings = mockSubscriberSettings({ indexName, serviceName });
      // when
      const meilisearchService = {
        getIndex: jest.fn().mockReturnValueOnce({ uid }),
        search: jest.fn().mockResolvedValueOnce({ hits }),
        addDocuments: jest.fn().mockResolvedValueOnce(null),
      };
      const selectedService = {
        list: jest.fn().mockResolvedValueOnce(entities),
      };
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      // @ts-ignore
      await entitySubscriber._handleAddEntityToIndex({ indexName, entityId });
      // then
      expect(meilisearchService.search).toBeCalledWith(indexName, entityId);
      expect(selectedService.list).toBeCalledWith({ id: entityId });
      expect(meilisearchService.addDocuments).toBeCalledWith(
        indexName,
        entities
      );
    });

    it("Should add all entities to index", async () => {
      // given
      const uid = "_uid";
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const take = 2;
      const hits = [];
      const entities = [mockEntity({})];
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {
        getIndex: jest.fn().mockReturnValueOnce({ uid }),
        search: jest.fn().mockResolvedValueOnce({ hits }),
        addDocuments: jest.fn().mockResolvedValueOnce(null),
      };
      const selectedServiceListFn = jest.fn();
      const selectedService = {
        list: selectedServiceListFn,
      };
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      when(selectedServiceListFn)
        .calledWith(
          { id: { gt: "" } },
          {
            relations: settings[indexName].subscriberSetting.relations,
            take: 1,
            order: { id: "DESC" },
          }
        )
        .mockResolvedValueOnce(entities);
      when(selectedServiceListFn)
        .calledWith(
          { id: { gt: "" } },
          {
            relations: settings[indexName].subscriberSetting.relations,
            take,
            order: { id: "ASC" },
          }
        )
        .mockResolvedValueOnce(entities);
      when(selectedServiceListFn)
        .calledWith(
          { id: { gt: entities[0].id } },
          {
            relations: settings[indexName].subscriberSetting.relations,
            take,
            order: { id: "ASC" },
          }
        )
        .mockResolvedValueOnce([]);
      // @ts-ignore
      await entitySubscriber._handleAddEntityToIndex({ indexName });
      // then
      expect(selectedServiceListFn).toBeCalledTimes(3);
      expect(meilisearchService.addDocuments).toBeCalledWith(
        indexName,
        entities
      );
    });

    it("Should not allow to add new entity", async () => {
      // given
      const uid = "_uid";
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const take = 2;
      const hits = [];
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {
        getIndex: jest.fn().mockReturnValueOnce({ uid }),
        search: jest.fn().mockResolvedValueOnce({ hits }),
        addDocuments: jest.fn().mockResolvedValueOnce(null),
      };
      const selectedServiceListFn = jest.fn();
      const selectedService = {
        list: selectedServiceListFn,
      };
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      when(selectedServiceListFn)
        .calledWith(
          { id: { gt: "" } },
          {
            relations: settings[indexName].subscriberSetting.relations,
            take: 1,
            order: { id: "DESC" },
          }
        )
        .mockResolvedValueOnce([]);
      // @ts-ignore
      await entitySubscriber._handleAddEntityToIndex({ indexName });
      // then
      expect(selectedServiceListFn).toBeCalledTimes(1);
      expect(meilisearchService.addDocuments).not.toBeCalled();
    });

    it("Should throw error when executing", async () => {
      // throw err
      // given
      const uid = "_uid";
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const take = 2;
      const hits = [];
      const errorMsg = "_error";
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {
        getIndex: jest.fn().mockReturnValueOnce({ uid }),
        search: jest.fn().mockResolvedValueOnce({ hits }),
        addDocuments: jest.fn().mockResolvedValueOnce(null),
      };
      const selectedServiceListFn = jest.fn();
      const selectedService = {
        list: selectedServiceListFn,
      };
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      when(selectedServiceListFn)
        .calledWith(
          { id: { gt: "" } },
          {
            relations: settings[indexName].subscriberSetting.relations,
            take: 1,
            order: { id: "DESC" },
          }
        )
        .mockRejectedValueOnce(new Error(errorMsg));
      const expected = await entitySubscriber
        // @ts-ignore
        ._handleAddEntityToIndex({ indexName })
        .catch((err) => err);
      // then
      expect(selectedServiceListFn).toBeCalledTimes(1);
      expect(meilisearchService.addDocuments).not.toBeCalled();
      expect(expected).toBeInstanceOf(Error);
      expect(expected.message).toEqual(errorMsg);
    });
  });

  describe("_addEntities", () => {
    const logger = {
      debug: jest.fn(),
      error: jest.fn(),
    };
    const options = {
      config: {
        apiKey: "_apiKey",
        host: "_host",
      },
      prefix: "_prefix",
      settings: {},
    };
    const eventBusService = {
      subscribe: jest.fn(),
    };

    it("Should add entities successfully", async () => {
      // given
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const take = 2;
      const entities = [mockEntity({})];
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {
        addDocuments: jest.fn().mockResolvedValueOnce(null),
      };
      const selectedServiceListFn = jest.fn();
      const selectedService = {
        list: selectedServiceListFn,
      };
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      when(selectedServiceListFn)
        .calledWith(
          { id: { gt: "" } },
          {
            relations: settings[indexName].subscriberSetting.relations,
            take,
            order: { id: "ASC" },
          }
        )
        .mockResolvedValueOnce(entities);
      when(selectedServiceListFn)
        .calledWith(
          { id: { gt: entities[0].id } },
          {
            relations: settings[indexName].subscriberSetting.relations,
            take,
            order: { id: "ASC" },
          }
        )
        .mockResolvedValueOnce([]);
      // @ts-ignore
      await entitySubscriber._addEntities({
        indexName,
        subscriberSetting: settings[indexName].subscriberSetting,
      });
      // then
      expect(selectedServiceListFn).toBeCalledTimes(2);
      expect(meilisearchService.addDocuments).toBeCalledWith(
        indexName,
        entities
      );
    });

    it("Should not add documents when not found entities", async () => {
      // given
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const take = 2;
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {
        addDocuments: jest.fn().mockResolvedValueOnce(null),
      };
      const selectedServiceListFn = jest.fn();
      const selectedService = {
        list: selectedServiceListFn,
      };
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      when(selectedServiceListFn)
        .calledWith(
          { id: { gt: "" } },
          {
            relations: settings[indexName].subscriberSetting.relations,
            take,
            order: { id: "ASC" },
          }
        )
        .mockResolvedValueOnce([]);
      // @ts-ignore
      await entitySubscriber._addEntities({
        indexName,
        subscriberSetting: settings[indexName].subscriberSetting,
      });
      // then
      expect(selectedServiceListFn).toBeCalledTimes(1);
      expect(meilisearchService.addDocuments).not.toBeCalled();
    });

    it("Should throw error when executing", async () => {
      // given
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const take = 2;
      const errMsg = "_err";
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {
        addDocuments: jest.fn().mockResolvedValueOnce(null),
      };
      const selectedServiceListFn = jest.fn();
      const selectedService = {
        list: selectedServiceListFn,
      };
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      when(selectedServiceListFn)
        .calledWith(
          { id: { gt: "" } },
          {
            relations: settings[indexName].subscriberSetting.relations,
            take,
            order: { id: "ASC" },
          }
        )
        .mockRejectedValueOnce(new Error(errMsg));
      const expected = await entitySubscriber
        // @ts-ignore
        ._addEntities({
          indexName,
          subscriberSetting: settings[indexName].subscriberSetting,
        })
        .catch((err) => err);
      // then
      expect(selectedServiceListFn).toBeCalledTimes(1);
      expect(meilisearchService.addDocuments).not.toBeCalled();
      expect(expected).toBeInstanceOf(Error);
      expect(expected.message).toEqual(errMsg);
    });
  });

  describe("_addEntity", () => {
    const logger = {
      debug: jest.fn(),
      error: jest.fn(),
    };
    const options = {
      config: {
        apiKey: "_apiKey",
        host: "_host",
      },
      prefix: "_prefix",
      settings: {},
    };
    const eventBusService = {
      subscribe: jest.fn(),
    };

    it("Should add entity successfully", async () => {
      // given
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const take = 2;
      const entityId = "_entityId";
      const hits = [];
      const entities = [mockEntity({})];
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {
        addDocuments: jest.fn().mockResolvedValueOnce(null),
        search: jest.fn().mockResolvedValueOnce({ hits }),
      };
      const selectedServiceListFn = jest.fn();
      const selectedService = {
        list: selectedServiceListFn,
      };
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      when(selectedServiceListFn)
        .calledWith({ id: entityId })
        .mockResolvedValueOnce(entities);
      // @ts-ignore
      await entitySubscriber._addEntity({
        indexName,
        subscriberSetting: settings[indexName].subscriberSetting,
        entityId,
      });
      // then
      expect(selectedServiceListFn).toBeCalledTimes(1);
      expect(meilisearchService.search).toBeCalledWith(indexName, entityId);
      expect(meilisearchService.addDocuments).toBeCalledWith(
        indexName,
        entities
      );
    });

    it(`Should throw ${MEILISEARCH_ERROR_CODES.ENTITY_NOT_FOUND} when not found the entity`, async () => {
      // given
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const take = 2;
      const entityId = "_entityId";
      const hits = [];
      const entities = [];
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {
        addDocuments: jest.fn().mockResolvedValueOnce(null),
        search: jest.fn().mockResolvedValueOnce({ hits }),
      };
      const selectedServiceListFn = jest.fn();
      const selectedService = {
        list: selectedServiceListFn,
      };
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      when(selectedServiceListFn)
        .calledWith({ id: entityId })
        .mockResolvedValueOnce(entities);
      const expected = await entitySubscriber
        // @ts-ignore
        ._addEntity({
          indexName,
          subscriberSetting: settings[indexName].subscriberSetting,
          entityId,
        })
        .catch((err) => err);
      // then
      expect(selectedServiceListFn).toBeCalledTimes(1);
      expect(meilisearchService.search).not.toBeCalled();
      expect(meilisearchService.addDocuments).not.toBeCalled();
      expect(expected).toBeInstanceOf(Error);
      expect(expected.message).toEqual(
        MEILISEARCH_ERROR_CODES.ENTITY_NOT_FOUND
      );
    });

    it("Should return and not do anything when found the entity in the search index", async () => {
      // given
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const take = 2;
      const entityId = "_entityId";
      const hits = [{ id: entityId }];
      const entities = [mockEntity({})];
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {
        addDocuments: jest.fn().mockResolvedValueOnce(null),
        search: jest.fn().mockResolvedValueOnce({ hits }),
      };
      const selectedServiceListFn = jest.fn();
      const selectedService = {
        list: selectedServiceListFn,
      };
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      when(selectedServiceListFn)
        .calledWith({ id: entityId })
        .mockResolvedValueOnce(entities);
      // @ts-ignore
      await entitySubscriber._addEntity({
        indexName,
        subscriberSetting: settings[indexName].subscriberSetting,
        entityId,
      });
      // then
      expect(selectedServiceListFn).toBeCalledTimes(1);
      expect(meilisearchService.search).toBeCalledWith(indexName, entityId);
      expect(meilisearchService.addDocuments).not.toBeCalled();
    });
  });

  describe("_canAddEntities", () => {
    const logger = {
      debug: jest.fn(),
      error: jest.fn(),
    };
    const options = {
      config: {
        apiKey: "_apiKey",
        host: "_host",
      },
      prefix: "_prefix",
      settings: {},
    };
    const eventBusService = {
      subscribe: jest.fn(),
    };

    it("Should return true for adding the entity", async () => {
      // given
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const take = 2;
      const entityId = "_entityId";
      const hits = [];
      const entities = [mockEntity({ id: entityId })];
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {
        search: jest.fn().mockResolvedValueOnce({ hits }),
      };
      const selectedServiceListFn = jest.fn();
      const selectedService = {
        list: selectedServiceListFn,
      };
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      when(selectedServiceListFn)
        .calledWith(
          { id: { gt: "" } },
          {
            relations: settings[indexName].subscriberSetting.relations,
            take: 1,
            order: { id: "DESC" },
          }
        )
        .mockResolvedValueOnce(entities);
      // @ts-ignore
      const expected = await entitySubscriber._canAddEntities({
        indexName,
        subscriberSetting: settings[indexName].subscriberSetting,
      });
      // then
      expect(selectedServiceListFn).toBeCalledTimes(1);
      expect(meilisearchService.search).toBeCalledWith(indexName, entityId);
      expect(expected).toBeTruthy();
    });

    it("Should return true for adding the entity with an empty settings", async () => {
      // given
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const take = 2;
      const entityId = "_entityId";
      const hits = [];
      const entities = [mockEntity({ id: entityId })];
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {
        search: jest.fn().mockResolvedValueOnce({ hits }),
      };
      const selectedServiceListFn = jest.fn();
      const selectedService = {
        list: selectedServiceListFn,
      };
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      when(selectedServiceListFn)
        .calledWith(
          { id: { gt: "" } },
          {
            relations: [],
            take: 1,
            order: { id: "DESC" },
          }
        )
        .mockResolvedValueOnce(entities);
      // @ts-ignore
      const expected = await entitySubscriber._canAddEntities({
        indexName,
        subscriberSetting: { serviceName } as any,
      });
      // then
      expect(selectedServiceListFn).toBeCalledTimes(1);
      expect(meilisearchService.search).toBeCalledWith(indexName, entityId);
      expect(expected).toBeTruthy();
    });

    it("Should return false when not found the latest entity", async () => {
      // given
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const take = 2;
      const hits = [];
      const entities = [];
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {
        search: jest.fn().mockResolvedValueOnce({ hits }),
      };
      const selectedServiceListFn = jest.fn();
      const selectedService = {
        list: selectedServiceListFn,
      };
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      when(selectedServiceListFn)
        .calledWith(
          { id: { gt: "" } },
          {
            relations: settings[indexName].subscriberSetting.relations,
            take: 1,
            order: { id: "DESC" },
          }
        )
        .mockResolvedValueOnce(entities);
      // @ts-ignore
      const expected = await entitySubscriber._canAddEntities({
        indexName,
        subscriberSetting: settings[indexName].subscriberSetting,
      });
      // then
      expect(selectedServiceListFn).toBeCalledTimes(1);
      expect(meilisearchService.search).not.toBeCalled();
      expect(expected).toBeFalsy();
    });

    it("Should return false when found this entity in the search index", async () => {
      // given
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const take = 2;
      const entityId = "_entityId";
      const hits = [{ id: entityId }];
      const entities = [mockEntity({ id: entityId })];
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {
        search: jest.fn().mockResolvedValueOnce({ hits }),
      };
      const selectedServiceListFn = jest.fn();
      const selectedService = {
        list: selectedServiceListFn,
      };
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      when(selectedServiceListFn)
        .calledWith(
          { id: { gt: "" } },
          {
            relations: settings[indexName].subscriberSetting.relations,
            take: 1,
            order: { id: "DESC" },
          }
        )
        .mockResolvedValueOnce(entities);
      // @ts-ignore
      const expected = await entitySubscriber._canAddEntities({
        indexName,
        subscriberSetting: settings[indexName].subscriberSetting,
      });
      // then
      expect(selectedServiceListFn).toBeCalledTimes(1);
      expect(meilisearchService.search).toBeCalledWith(indexName, entityId);
      expect(expected).toBeFalsy();
    });
  });

  describe("_getSubscriberSetting", () => {
    const logger = {
      debug: jest.fn(),
      error: jest.fn(),
    };
    const options = {
      config: {
        apiKey: "_apiKey",
        host: "_host",
      },
      prefix: "_prefix",
      settings: {},
    };
    const eventBusService = {
      subscribe: jest.fn(),
    };

    it("Should get subscriber setting successfully", async () => {
      // given
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const take = 2;
      const uid = "_uid";
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {
        getIndex: jest.fn().mockReturnValueOnce({ uid }),
      };
      const selectedService = {};
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      // @ts-ignore
      const expected = await entitySubscriber._getSubscriberSetting({
        indexName,
      });
      // then
      expect(meilisearchService.getIndex).toBeCalledWith(indexName);
      expect(expected).toEqual(settings[indexName].subscriberSetting);
    });

    it(`Should throw ${MEILISEARCH_ERROR_CODES.SUBSCRIBER_SETTING_NOT_FOUND} when not found the subscriber setting by this indexName`, async () => {
      // given
      const indexName = "_indexName";
      const anotherIndexName = "_anotherIndexName";
      const serviceName = "_serviceName";
      const take = 2;
      const settings = mockSubscriberSettings({
        indexName,
        serviceName,
        take,
      });
      // when
      const meilisearchService = {
        getIndex: jest.fn(),
      };
      const selectedService = {};
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      const expected = await entitySubscriber
        // @ts-ignore
        ._getSubscriberSetting({
          indexName: anotherIndexName,
        })
        .catch((err) => err);
      // then
      expect(meilisearchService.getIndex).not.toBeCalled();
      expect(expected).toBeInstanceOf(Error);
      expect(expected.message).toEqual(
        MEILISEARCH_ERROR_CODES.SUBSCRIBER_SETTING_NOT_FOUND
      );
    });

    it(`Should throw ${MEILISEARCH_ERROR_CODES.INDEX_NOT_FOUND} when not found the search index`, async () => {
      // given
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const take = 2;
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {
        getIndex: jest.fn().mockReturnValueOnce({}),
      };
      const selectedService = {};
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      const expected = await entitySubscriber
        // @ts-ignore
        ._getSubscriberSetting({
          indexName,
        })
        .catch((err) => err);
      // then
      expect(meilisearchService.getIndex).toBeCalledWith(indexName);
      expect(expected).toBeInstanceOf(Error);
      expect(expected.message).toEqual(MEILISEARCH_ERROR_CODES.INDEX_NOT_FOUND);
    });
  });

  describe("_getServiceByServiceName", () => {
    const logger = {
      debug: jest.fn(),
      error: jest.fn(),
    };
    const options = {
      config: {
        apiKey: "_apiKey",
        host: "_host",
      },
      prefix: "_prefix",
      settings: {},
    };
    const eventBusService = {
      subscribe: jest.fn(),
    };

    it("Should get service based on the subscriber setting", async () => {
      // given
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const take = 2;
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {};
      const selectedService = { methodA: () => {} };
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      // @ts-ignore
      const expected = await entitySubscriber._getServiceByServiceName(
        serviceName
      );
      // then
      expect(expected).toEqual(selectedService);
    });

    it(`Should throw ${MEILISEARCH_ERROR_CODES.SERVICE_NOT_FOUND} when not found the service`, async () => {
      // given
      const indexName = "_indexName";
      const serviceName = "_serviceName";
      const anotherServiceName = "_anotherServiceName";
      const take = 2;
      const settings = mockSubscriberSettings({ indexName, serviceName, take });
      // when
      const meilisearchService = {};
      const selectedService = { methodA: () => {} };
      const entitySubscriber = new EntitySubscriber(
        {
          logger,
          meilisearchService,
          eventBusService,
          [serviceName]: selectedService,
        },
        { ...options, settings } as any
      );
      const expected = await entitySubscriber
        // @ts-ignore
        ._getServiceByServiceName(anotherServiceName)
        .catch((err) => err);
      // then
      expect(expected).toBeInstanceOf(Error);
      expect(expected.message).toEqual(
        MEILISEARCH_ERROR_CODES.SERVICE_NOT_FOUND
      );
    });
  });
});
