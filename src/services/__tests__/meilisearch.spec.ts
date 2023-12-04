import { MeiliSearch } from "meilisearch";
import MeiliSearchService from "../meilisearch";
import { MEILISEARCH_ERROR_CODES } from "../../enums";

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
      const meiliSearchService = new MeiliSearchService(
        { logger },
        serviceOptions as any
      );
      await meiliSearchService.createIndex(indexName, options);
      // then
      expect(mockCreateIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`,
        options
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
      await meiliSearchService.replaceDocuments(indexName, documents, type);
      // then
      expect(mockGetIndex).toBeCalledWith(
        `${serviceOptions.prefix}_${indexName}`
      );
      expect(mockAddDocuments).toBeCalledWith(documents);
    });
  });
});
