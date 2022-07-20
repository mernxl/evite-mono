import { Document, Model, Schema } from 'mongoose';

import dbConnection, {
  cleanMongooseConnections,
  waitForOpenConnection,
} from '../../config/mongoose';
import { ModelWithPaginatePlugin, WithPaginatePlugin } from '../pagination.utils';

interface IDummy extends Document {
  index: number;
}
interface IDummyModel extends Model<IDummy>, ModelWithPaginatePlugin {}

const DummySchema = new Schema<IDummy, IDummyModel>({ index: Number });
WithPaginatePlugin(DummySchema, { basePath: 'localhost' });

const DummyModel = dbConnection.model<IDummy, IDummyModel>('PaginationTest', DummySchema);

describe('pagination.utils', () => {
  beforeAll(async (done) => {
    await waitForOpenConnection(dbConnection);
    await dbConnection.dropDatabase();

    await DummyModel.create(
      Array(100)
        .fill(null)
        .map((value, index) => ({ index })),
    );

    done();
  });

  afterAll(async () => {
    await cleanMongooseConnections();
  });

  it('should fetch page data, with default perPage 30 and page 1', async () => {
    const page = await DummyModel.paginate(DummyModel.find(), { path: 'dummy' });

    expect(page.data).toBeTruthy();
    expect(page.currentPage).toEqual(1);
    expect(page.perPage).toEqual(30);
  });

  it('should fetch page with correct info', async () => {
    const { data, ...rest } = await DummyModel.paginate(DummyModel.find(), {
      path: '/dummy',
      perPage: 30,
      page: 1,
    });

    expect(data.length).toEqual(30);
    expect(rest).toMatchSnapshot();
  });

  it('should apply the mapping function', async () => {
    const { data } = await DummyModel.paginate(
      DummyModel.find().sort({ index: 1 }),
      {
        path: '/dummy',
        perPage: 30,
        page: 1,
      },
      (dataItem: IDummy) => dataItem.index,
    );

    expect(data[0]).toEqual(0);
    expect(data[20]).toEqual(20);
  });

  it('should apply filter correctly on count and items', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, ...rest } = await DummyModel.paginate(
      DummyModel.find({ index: { $lt: 25 } }),
      {
        path: '/dummy',
        perPage: 30,
        page: 1,
      },
      (dataItem: IDummy) => dataItem.index,
    );

    expect(rest).toMatchSnapshot();
  });
});
