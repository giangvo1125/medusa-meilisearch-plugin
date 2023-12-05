export const mockSubscriberSettings = ({
  indexName,
  serviceName = "service",
  take,
}: {
  indexName?: string;
  serviceName?: string;
  take?: number;
}) => ({
  [indexName]: {
    subscriberSetting: { serviceName, relations: [], take },
  },
});

export const mockEntity = ({
  id = Math.random().toLocaleString(),
  name = `entityName.${Math.random()}`,
}: {
  id?: string;
  name?: string;
}) => ({
  id,
  name,
});
