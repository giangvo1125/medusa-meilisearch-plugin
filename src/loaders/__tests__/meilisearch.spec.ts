import meilisearchLoader from "../meilisearch";
import { getMeilisearchLoaderContainerMock } from "../__mocks__/meilisearch.mock";
import { REGISTER_MEILISEARCH_INDEX_EVENT } from "../../constants";

describe("loaders", () => {
  describe("meilisearch", () => {
    it("Should run without the options", async () => {
      // given
      const debugFnMock = jest.fn();
      const emitFnMock = jest.fn();
      const createIndexMock = jest.fn();
      const updateSettingsMock = jest.fn();
      // when
      const container = getMeilisearchLoaderContainerMock({
        loggerMock: {
          debug: debugFnMock,
        },
        eventBusServiceMock: {
          emit: emitFnMock,
        },
        meilisearchServiceMock: {
          createIndex: createIndexMock,
          updateSettings: updateSettingsMock,
        },
      });
      await meilisearchLoader(container, {} as any);
      // then
      expect(debugFnMock).toBeCalledTimes(2);
      expect(emitFnMock).not.toBeCalled();
      expect(createIndexMock).not.toBeCalled();
      expect(updateSettingsMock).not.toBeCalled();
    });

    it("Should run with the options and create the index successfully", async () => {
      // given
      const debugFnMock = jest.fn();
      const emitFnMock = jest.fn();
      const createIndexMock = jest.fn();
      const updateSettingsMock = jest.fn();
      const settings = {
        test: {
          indexSettings: {
            searchableAttributes: ["id", "name"],
            displayedAttributes: ["name", "description"],
          },
          subscriberSetting: {
            serviceName: "testService",
            relations: [],
          },
          primaryKey: "id",
        },
        anotherTest: {
          indexSettings: {
            searchableAttributes: ["id", "name"],
            displayedAttributes: ["name", "description"],
          },
          subscriberSetting: {
            serviceName: "anotherTestService",
            relations: [],
          },
          primaryKey: "id",
        },
      };
      // when
      const container = getMeilisearchLoaderContainerMock({
        loggerMock: {
          debug: debugFnMock,
        },
        eventBusServiceMock: {
          emit: emitFnMock,
        },
        meilisearchServiceMock: {
          createIndex: createIndexMock,
          updateSettings: updateSettingsMock,
          getIndex: (indexName: string) => indexName,
        },
      });
      await meilisearchLoader(container, { settings } as any);
      // then
      expect(debugFnMock).toBeCalledTimes(2);
      Object.keys(settings).forEach((indexName) => {
        const { primaryKey, ...value } = settings[indexName];
        expect(createIndexMock).toBeCalledWith(indexName, { primaryKey });
        expect(updateSettingsMock).toBeCalledWith(indexName, value);
        expect(emitFnMock).toBeCalledWith(REGISTER_MEILISEARCH_INDEX_EVENT, {
          indexName,
        });
      });
    });

    it("Should only log the error and ignore it when the function has error", async () => {
      // given
      const debugFnMock = jest.fn();
      const errorFnMock = jest.fn();
      const emitFnMock = jest.fn();
      const createIndexMock = jest.fn();
      const updateSettingsMock = jest.fn();
      const settings = {
        test: {
          indexSettings: {
            searchableAttributes: ["id", "name"],
            displayedAttributes: ["name", "description"],
          },
          subscriberSetting: {
            serviceName: "testService",
            relations: [],
          },
          primaryKey: "id",
        },
      };
      // when
      createIndexMock.mockRejectedValueOnce("unknown error");
      const container = getMeilisearchLoaderContainerMock({
        loggerMock: {
          debug: debugFnMock,
          error: errorFnMock,
        },
        eventBusServiceMock: {
          emit: emitFnMock,
        },
        meilisearchServiceMock: {
          createIndex: createIndexMock,
          updateSettings: updateSettingsMock,
          getIndex: (indexName: string) => indexName,
        },
      });
      await meilisearchLoader(container, { settings } as any).catch(
        (err) => err
      );
      // then
      expect(debugFnMock).toBeCalled();
      expect(createIndexMock).toBeCalledTimes(1);
      expect(emitFnMock).not.toBeCalled();
      expect(updateSettingsMock).not.toBeCalled();
      expect(errorFnMock).toBeCalled();
    });
  });
});
