import { Document, Model, Query, Schema } from 'mongoose';

/**
 * Page to get, pages start from 1 to infinity
 * @default 1
 * @minimum 1
 */
export type PageQueryParam = number;

/**`
 * Items Per page, maximum to get is 100, defaults is 30
 * @default 30
 * @maximum 100
 */
export type PerPageQueryParam = number;

export interface Page<T> {
  /**
   * Actual data as requested
   */
  data: T[];
  /**
   * Total Elements available in the query made.
   */
  total: number;
  /**
   * Items on each page
   */
  perPage: number;
  /**
   * Current page number
   */
  currentPage: number;

  /**
   * If it has next page from current page
   */
  hasNext: boolean;

  /**
   * If it has prev page from current page
   */
  hasPrev: boolean;

  /**
   * Link to next page
   */
  nextPage: string;
  /**
   * Link to previous page
   */
  prevPage: string;
  /**
   * Link to first page
   */
  firstPage: string;
  /**
   * Link to last page
   */
  lastPage: string;
}

export interface PageOptions {
  /**
   * Path will be concatenated on basePath passed when setting this plugin
   */
  path: string;
  page?: number;
  perPage?: number;
}

export interface WithPaginatePluginOptions {
  /**
   * basePath we are serving this app from, will be concatenated with a later passed path
   * on the paginate function
   */
  basePath: string;
}

export type DataMapFn<T extends Document, M = T> = (
  dataItem: T,
  index: number,
  array: T[],
) => M | Promise<M>;

export type ExecutableQuery<T> = { exec: () => Promise<T> | T };
export type PageQueryType<T> = [
  ExecutableQuery<number>,
  {
    (data: { skip: number; limit: number }): ExecutableQuery<T[]> | Promise<ExecutableQuery<T[]>>;
  },
];

export interface ModelWithPaginatePlugin {
  /**
   * A pagination handler that takes a query that returns an array and paginates it depending on the
   * pageOptions.
   *
   * This method is set on the schema using the WithPaginatePlugin Plugin
   *
   * @param query
   * @param pageOptions
   * @param dataMapFn A function to use in mapping the data or a string which identifies a method on
   * that `model` that can map the data. If undefined, we will just pass data as is.
   */
  paginate<T extends Document, M = T>(
    query: Query<T[], T> | PageQueryType<T>,
    pageOptions: PageOptions,
    dataMapFn?: DataMapFn<T, M> | string,
  ): Promise<Page<M>>;
}

export const WithPaginatePlugin = <
  DocType extends Document,
  ModelType extends Model<DocType> = any,
>(
  schema: Schema<DocType, ModelType>,
  options: WithPaginatePluginOptions,
): void => {
  const getLink = (path: string, page: number, perPage: number): string =>
    `${options.basePath}${path}?page=${page}&per_page=${perPage}`;

  schema.static(
    'paginate',
    async function (
      this: Model<any>,
      query: Query<any[], any> | PageQueryType<any>,
      pageOptions: PageOptions,
      dataMapFn?: DataMapFn<any> | string,
    ): Promise<Page<any>> {
      const { path } = pageOptions;
      const page = Math.max(1, pageOptions.page || 1);
      const perPage = Math.min(100, pageOptions.perPage || 30); // 0 becomes 30

      let promises: [ExecutableQuery<number>, ExecutableQuery<any[]>];

      if (Array.isArray(query)) {
        promises = [query[0], await query[1]({ skip: (page - 1) * perPage, limit: perPage })];
      } else {
        // lets clone this query and make our count query
        const countQuery = new (query.toConstructor())();

        // promises to count and data query
        promises = [countQuery.countDocuments(), query.skip((page - 1) * perPage).limit(perPage)];
      }

      const [count, data] = (await Promise.all(promises.map((q) => (q as any).exec()))) as [
        number,
        any[],
      ];

      let preparedData = [];
      if (dataMapFn) {
        let mapFn: DataMapFn<any> | undefined;

        if (typeof dataMapFn === 'string') {
          // get that method from the model
          if (typeof (this as any)[dataMapFn] === 'function') {
            mapFn = (this as any)[dataMapFn];
          }
        } else if (typeof dataMapFn === 'function') {
          mapFn = dataMapFn;
        }

        if (mapFn) {
          preparedData = await Promise.all(data.map(mapFn));
        }
      } else {
        preparedData = data;
      }

      const page_count = Math.max(1, Math.ceil(count / perPage));

      return {
        data: preparedData,
        total: count,
        perPage: perPage,
        currentPage: page,

        hasNext: page + 1 <= page_count,
        hasPrev: page - 1 <= page_count && page - 1 > 0,

        nextPage: getLink(path, page + 1, perPage),
        prevPage: getLink(path, page - 1, perPage),
        firstPage: getLink(path, 1, perPage),
        lastPage: getLink(path, page_count, perPage),
      };
    },
  );
};
