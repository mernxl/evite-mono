/* eslint-disable @typescript-eslint/ban-types */
import { Document, Model, Query, Schema, Types } from 'mongoose';

export interface IDocMetaTimestamp {
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocMetaUserAction {
  createdById: Types.ObjectId;
  updatedById?: Types.ObjectId;
}

export interface DocMetaUserAction {
  createdById: string;
  updatedById?: string;
}

export type IDocMetaUserTimestamp = IDocMetaTimestamp & IDocMetaUserAction;

export interface UpdatableDocMeta {
  updatedAt: Date | undefined;
  updatedById: Types.ObjectId;
}

export type DocMetaConfig = { userId: Types.ObjectId };

export const addDocMetaTimestampToSchema = <
  DocType extends Document & IDocMetaTimestamp,
  ModelType extends Model<DocType> = any,
>(
  schema: Schema<DocType, ModelType>,
): void => {
  schema.set('timestamps', true);
};

export const addDocMetaUserActionToSchema = <
  DocType extends IDocMetaUserAction,
  ModelType extends Model<DocType> = any,
>(
  schema: Schema<DocType, ModelType>,
): void => {
  schema.add({
    createdById: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    updatedById: { type: Schema.Types.ObjectId, ref: 'User' },
  } as any);
};

export const addDocMetaToSchema = <
  DocType extends Document & IDocMetaUserTimestamp,
  ModelType extends Model<DocType> = any,
>(
  schema: Schema<DocType, ModelType>,
): void => {
  addDocMetaTimestampToSchema(schema);
  addDocMetaUserActionToSchema(schema);
};

export const addDocMetaUserTimestamp = <T extends object>(
  object: T,
  userId: Types.ObjectId | string,
): T & IDocMetaUserTimestamp => {
  const date = new Date();
  const userOId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

  return {
    ...object,
    createdAt: date,
    updatedAt: date,
    createdById: userOId,
    updatedById: userOId,
  };
};

export const addUpdateDocMetaUserTimestamp = <T extends object>(
  object: T,
  userId: Types.ObjectId | string,
): T & Required<Pick<IDocMetaUserTimestamp, keyof UpdatableDocMeta>> => ({
  ...object,
  updatedAt: new Date(),
  updatedById: typeof userId === 'string' ? new Types.ObjectId(userId) : userId,
});

export const updateDocMetaUserTimestamp = (
  doc: IDocMetaUserTimestamp,
  userId: Types.ObjectId | string,
): void => {
  const update = addUpdateDocMetaUserTimestamp({}, userId);

  doc.updatedAt = update.updatedAt;
  doc.updatedById = update.updatedById;
};

export const viewDocMetaTimeStamp = (doc: IDocMetaTimestamp): IDocMetaTimestamp => ({
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const viewDocMetaUserTimestamp = (
  doc: IDocMetaUserTimestamp,
): IDocMetaTimestamp & DocMetaUserAction => ({
  ...viewDocMetaTimeStamp(doc),
  createdById: doc.createdById.toHexString(),
  updatedById: doc.updatedById?.toHexString(),
});

export const scopeQueryToCreatedBy = <T, T2 extends Document>(
  query: Query<T, T2>,
  userId: Types.ObjectId | string,
): Query<T, T2> => query.where('createdById', userId);
