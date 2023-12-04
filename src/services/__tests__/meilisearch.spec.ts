import { MeiliSearch } from "meilisearch";
import { SearchUtils } from "@medusajs/utils";
import MeiliSearchService from "../meilisearch";
import { MEILISEARCH_ERROR_CODES } from "../../enums";
import { mockProduct } from "../__mocks__/service.mock";
import { transformProduct } from "../../utils/transform";
class CustomError extends Error {
  code: string;
  constructor(msg: string, code: string) {
    super(msg);
    this.code = code;
  }
}

jest.mock("meilisearch", () => {
  return {
    MeiliSearch: jest.fn(),
  };
});

describe("service", () => {
  const logger = {
    warn: jest.fn(),
  };
  const serviceOptions = {
    config: {
      apiKey: "_apiKey",
      host: "_host",
    },
    prefix: "_prefix",
  };

  describe("constructor", () => {
    it("Should init service success", () => {
      // given
      const logger = {
        warn: jest.fn(),
      };
      const options = {
        config: {
          apiKey: "_apiKey",
          host: "_host",
        },
        prefix: "_prefix",
      };
      // when
      const expected = new MeiliSearchService({ logger }, options as any);
      // then
      expect(expected).not.toBeUndefined();
    });

    it(`Should warning ${`meiliSearchService: ${MEILISEARCH_ERROR_CODES.API_KEY_NOT_FOUND}`} when not found the apiKey`, () => {
      // given
      const logger = {
        warn: jest.fn(),
      };
      const options = {
        config: {
          host: "_host",
        },
        prefix: "_prefix",
      };
      // when
      new MeiliSearchService({ logger }, options as any);
      // then
      expect(logger.warn).toBeCalledWith(
        `meiliSearchService: ${MEILISEARCH_ERROR_CODES.API_KEY_NOT_FOUND}`
      );
    });

    it(`Should warning ${`meiliSearchService: ${MEILISEARCH_ERROR_CODES.HOST_NOT_FOUND}`} when not found the host`, () => {
      // given
      const logger = {
        warn: jest.fn(),
      };
      const options = {
        config: {
          apiKey: "_apiKey",
        },
        prefix: "_prefix",
      };
      // when
      new MeiliSearchService({ logger }, options as any);
      // then
      expect(logger.warn).toBeCalledWith(
        `meiliSearchService: ${MEILISEARCH_ERROR_CODES.HOST_NOT_FOUND}`
      );
    });
  });

  describe("createIndex", () => {
    it("Should create index successfully", async () => {
      // given
      const indexName = "_indexName";
      const options = { primaryKey: "id" };
      // when
      const mockCreateIndex = jest.fn();
      (MeiliSearch as jest.Mock).mockImplementationOnce(() => ({
        createIndex: mockCreateIndex,
      }));
      const meiliSearchService = new MeiliSearchService({ logger }, {
        ...serviceOptions,
        prefix: "",
      } as any);
      await meiliSearchService.createIndex(indexName, options);
      // then
      expect(mockCreateIndex).toBeCalledWith(`${indexName}`, options);
    });

    it("Should create index with an empty options", async () => {
      // given
      const indexName = "_indexName";
      // when
      const mockCreateIndex = jest.fn();
      (MeiliSearch as jest.Mock).mockImplementationOnce(() => ({
        createIndex: mockCreateIndex,
      }));
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      await meiliSearchService.createIndex(indexName);
      // then
      expect(mockCreateIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`,
        { primaryKey: "id" }
      );
    });
  });

  describe("getIndex", () => {
    it("Should get index successfully", () => {
      // given
      const indexName = "_indexName";
      const response = "_index";
      // when
      const mockGetIndex = jest.fn().mockReturnValueOnce(response);
      (MeiliSearch as jest.Mock).mockImplementationOnce(() => ({
        index: mockGetIndex,
      }));
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      const expected = meiliSearchService.getIndex(indexName);
      // then
      expect(mockGetIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`
      );
      expect(expected).toEqual(response);
    });
  });

  describe("addDocuments", () => {
    it("Should add the document to the index successfully", async () => {
      // given
      const indexName = "_indexName";
      const type = "_type";
      const documents = [{ attribute: "_value" }];
      // when
      const mockAddDocuments = jest.fn();
      const mockGetIndex = jest.fn().mockImplementationOnce(() => ({
        addDocuments: mockAddDocuments,
      }));
      (MeiliSearch as jest.Mock).mockImplementationOnce(() => ({
        index: mockGetIndex,
      }));
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      await meiliSearchService.addDocuments(indexName, documents, type);
      // then
      expect(mockGetIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`
      );
      expect(mockAddDocuments).toBeCalledWith(documents);
    });
  });

  describe("replaceDocuments", () => {
    it("Should replace the document to the index successfully", async () => {
      // given
      const indexName = "_indexName";
      const type = "_type";
      const documents = [{ attribute: "_value" }];
      // when
      const mockAddDocuments = jest.fn();
      const mockGetIndex = jest.fn().mockImplementationOnce(() => ({
        addDocuments: mockAddDocuments,
      }));
      (MeiliSearch as jest.Mock).mockImplementationOnce(() => ({
        index: mockGetIndex,
      }));
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      await meiliSearchService.replaceDocuments(indexName, documents, type);
      // then
      expect(mockGetIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`
      );
      expect(mockAddDocuments).toBeCalledWith(documents);
    });
  });

  describe("deleteDocument", () => {
    it("Should delete the document to the index successfully", async () => {
      // given
      const indexName = "_indexName";
      const documentId = "_documentId";
      // when
      const mockDeleteDocument = jest.fn();
      const mockGetIndex = jest.fn().mockImplementationOnce(() => ({
        deleteDocument: mockDeleteDocument,
      }));
      (MeiliSearch as jest.Mock).mockImplementationOnce(() => ({
        index: mockGetIndex,
      }));
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      await meiliSearchService.deleteDocument(indexName, documentId);
      // then
      expect(mockGetIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`
      );
      expect(mockDeleteDocument).toBeCalledWith(documentId);
    });
  });

  describe("deleteAllDocuments", () => {
    it("Should delete all documents to the index successfully", async () => {
      // given
      const indexName = "_indexName";
      // when
      const mockDeleteDocuments = jest.fn();
      const mockGetIndex = jest.fn().mockImplementationOnce(() => ({
        deleteAllDocuments: mockDeleteDocuments,
      }));
      (MeiliSearch as jest.Mock).mockImplementationOnce(() => ({
        index: mockGetIndex,
      }));
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      await meiliSearchService.deleteAllDocuments(indexName);
      // then
      expect(mockGetIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`
      );
      expect(mockDeleteDocuments).toBeCalled();
    });
  });

  describe("search", () => {
    it("Should search documents successfully", async () => {
      // given
      const indexName = "_indexName";
      const query = "_query";
      const options = {};
      const documents = [{ attribute: "_attribute" }];
      // when
      const mockSearchDocuments = jest.fn().mockResolvedValueOnce(documents);
      const mockGetIndex = jest.fn().mockImplementationOnce(() => ({
        search: mockSearchDocuments,
      }));
      (MeiliSearch as jest.Mock).mockImplementationOnce(() => ({
        index: mockGetIndex,
      }));
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      const payload = await meiliSearchService.search(
        indexName,
        query,
        options
      );
      // then
      expect(mockGetIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`
      );
      expect(mockSearchDocuments).toBeCalledWith(query, {});
      expect(payload).toEqual(documents);
    });

    it("Should search documents with empty options", async () => {
      // given
      const indexName = "_indexName";
      const query = "_query";
      const documents = [{ attribute: "_attribute" }];
      // when
      const mockSearchDocuments = jest.fn().mockResolvedValueOnce(documents);
      const mockGetIndex = jest.fn().mockImplementationOnce(() => ({
        search: mockSearchDocuments,
      }));
      (MeiliSearch as jest.Mock).mockImplementationOnce(() => ({
        index: mockGetIndex,
      }));
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      const payload = await meiliSearchService.search(indexName, query);
      // then
      expect(mockGetIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`
      );
      expect(mockSearchDocuments).toBeCalledWith(query, {});
      expect(payload).toEqual(documents);
    });
  });

  describe("updateSettings", () => {
    it("Should update settings for the index successfully", async () => {
      // given
      const indexName = "_indexName";
      const indexSettings = {
        searchableAttributes: [],
        displayedAttributes: [],
      };
      const settings = {
        indexSettings,
      };
      // when
      const mockUpdateSettings = jest.fn();
      const mockGetIndex = jest.fn().mockImplementationOnce(() => ({
        updateSettings: mockUpdateSettings,
      }));
      (MeiliSearch as jest.Mock).mockImplementationOnce(() => ({
        index: mockGetIndex,
      }));
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      await meiliSearchService.updateSettings(indexName, settings);
      // then
      expect(mockGetIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`
      );
      expect(mockUpdateSettings).toBeCalledWith(indexSettings);
    });

    it("Should update settings with empty settings parameter successfully", async () => {
      // given
      const indexName = "_indexName";
      const settings = {};
      // when
      const mockUpdateSettings = jest.fn();
      const mockGetIndex = jest.fn().mockImplementationOnce(() => ({
        updateSettings: mockUpdateSettings,
      }));
      (MeiliSearch as jest.Mock).mockImplementationOnce(() => ({
        index: mockGetIndex,
      }));
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      await meiliSearchService.updateSettings(indexName, settings as any);
      // then
      expect(mockGetIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`
      );
      expect(mockUpdateSettings).toBeCalledWith(settings);
    });

    it("Should throw error when calling service", async () => {
      // given
      const indexName = "_indexName";
      const error = "error";
      const settings = {
        indexSettings: {},
      };
      // when
      const mockUpdateSettings = jest
        .fn()
        .mockRejectedValueOnce(new Error(error));
      const mockGetIndex = jest.fn().mockImplementationOnce(() => ({
        updateSettings: mockUpdateSettings,
      }));
      (MeiliSearch as jest.Mock).mockImplementationOnce(() => ({
        index: mockGetIndex,
      }));
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      const expected = await meiliSearchService
        .updateSettings(indexName, settings)
        .catch((err) => err);
      // then
      expect(mockGetIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`
      );
      expect(mockUpdateSettings).toBeCalledWith({});
      expect(expected).toBeInstanceOf(Error);
    });
  });

  describe("upsertIndex", () => {
    it("Should get index successfully", async () => {
      // given
      const indexName = "_indexName";
      const settings = { indexSettings: {} };
      const index = "_index";
      // when
      const mockGetIndex = jest.fn().mockResolvedValueOnce(index);
      (MeiliSearch as jest.Mock).mockImplementationOnce(() => ({
        getIndex: mockGetIndex,
      }));
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      const payload = await meiliSearchService.upsertIndex(indexName, settings);
      // then
      expect(mockGetIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`
      );
      expect(payload).toEqual(index);
    });

    it(`Should create index when getting index throw ${MEILISEARCH_ERROR_CODES.INDEX_NOT_FOUND}`, async () => {
      // given
      const indexName = "_indexName";
      const settings = { indexSettings: {} };
      const index = "_index";
      // when
      const mockGetIndex = jest
        .fn()
        .mockRejectedValueOnce(
          new CustomError("asd", MEILISEARCH_ERROR_CODES.INDEX_NOT_FOUND)
        );
      const mockCreateIndex = jest.fn().mockResolvedValueOnce(index);
      (MeiliSearch as jest.Mock).mockImplementationOnce(() => ({
        getIndex: mockGetIndex,
        createIndex: mockCreateIndex,
      }));
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      const payload = await meiliSearchService.upsertIndex(indexName, settings);
      // then
      expect(mockGetIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`
      );
      expect(mockCreateIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`,
        { primaryKey: "id" }
      );
      expect(payload).toEqual(index);
    });

    it(`Should create index when getting index throw ${MEILISEARCH_ERROR_CODES.INDEX_NOT_FOUND} with an empty settings`, async () => {
      // given
      const indexName = "_indexName";
      const index = "_index";
      // when
      const mockGetIndex = jest
        .fn()
        .mockRejectedValueOnce(
          new CustomError("asd", MEILISEARCH_ERROR_CODES.INDEX_NOT_FOUND)
        );
      const mockCreateIndex = jest.fn().mockResolvedValueOnce(index);
      (MeiliSearch as jest.Mock).mockImplementationOnce(() => ({
        getIndex: mockGetIndex,
        createIndex: mockCreateIndex,
      }));
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      const payload = await meiliSearchService.upsertIndex(
        indexName,
        {} as any
      );
      // then
      expect(mockGetIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`
      );
      expect(mockCreateIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`,
        { primaryKey: "id" }
      );
      expect(payload).toEqual(index);
    });

    it(`Should create index when getting index throw ${MEILISEARCH_ERROR_CODES.INDEX_NOT_FOUND} and primaryKey get from settings`, async () => {
      // given
      const indexName = "_indexName";

      const index = "_index";
      const primaryKey = "_primaryKey";
      const settings = { indexSettings: {}, primaryKey };
      // when
      const mockGetIndex = jest
        .fn()
        .mockRejectedValueOnce(
          new CustomError("asd", MEILISEARCH_ERROR_CODES.INDEX_NOT_FOUND)
        );
      const mockCreateIndex = jest.fn().mockResolvedValueOnce(index);
      (MeiliSearch as jest.Mock).mockImplementationOnce(() => ({
        getIndex: mockGetIndex,
        createIndex: mockCreateIndex,
      }));
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      const payload = await meiliSearchService.upsertIndex(indexName, settings);
      // then
      expect(mockGetIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`
      );
      expect(mockCreateIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`,
        { primaryKey }
      );
      expect(payload).toEqual(index);
    });
  });

  describe("getTransformedDocuments", () => {
    it("Should return [] when passing an empty array", () => {
      // given
      const documents = [];
      const type = "_type";
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      // when
      const expected = meiliSearchService.getTransformedDocuments(
        type,
        documents
      );
      // then
      expect(expected).toEqual([]);
    });

    it("Should return documents with product formatted when the type is product", () => {
      // given
      const documents = [mockProduct()];
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      // when
      const expected = meiliSearchService.getTransformedDocuments(
        SearchUtils.indexTypes.PRODUCTS,
        documents
      );
      // then
      expect(expected).toEqual(documents.map(transformProduct));
    });

    it("Should return documents with product formatted when the type is product and passing the transformer function", () => {
      // given
      const documents = [mockProduct()];
      const transformer = (entity) => ({
        id: entity.id,
      });
      const meiliSearchService = new MeiliSearchService({ logger }, {
        ...serviceOptions,
        settings: {
          products: {
            transformer,
          },
        },
      } as any);
      // when
      const expected = meiliSearchService.getTransformedDocuments(
        SearchUtils.indexTypes.PRODUCTS,
        documents
      );
      // then
      expect(expected).toEqual(documents.map(transformer));
    });
  });
});
