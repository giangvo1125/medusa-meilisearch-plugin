import { MedusaContainer } from "@medusajs/medusa";
import { createContainer, asClass } from "awilix";

export const getMeilisearchLoaderContainerMock = ({
  loggerMock,
  eventBusServiceMock,
  meilisearchServiceMock,
}: {
  loggerMock: Record<string, typeof jest.fn | unknown>;
  eventBusServiceMock: Record<string, typeof jest.fn | unknown>;
  meilisearchServiceMock: Record<string, typeof jest.fn | unknown>;
}): MedusaContainer => {
  const container = createContainer() as MedusaContainer;
  container.registerAdd = jest.fn();
  container.createScope = jest.fn();
  container.register({
    logger: asClass(jest.fn().mockImplementationOnce(() => loggerMock)),
    eventBusService: asClass(
      jest.fn().mockImplementationOnce(() => eventBusServiceMock)
    ),
    meilisearchService: asClass(
      jest.fn().mockImplementationOnce(() => meilisearchServiceMock)
    ),
  });

  return container;
};
