import { Document, Model, Types } from 'mongoose';

import { IDocMetaTimestamp, ModelWithPaginatePlugin } from '../../../utils';
import { UserMethodsType } from './user.methods';
import { UserStaticsType } from './user.statics';

export interface UserBase {
  _id: string;

  name: string;
  email: string;
}

export type IUserBase = Omit<UserBase, '_id'>;

export interface IUser extends IUserBase, Document, IDocMetaTimestamp, UserMethodsType {
  _id: Types.ObjectId;
}

// static(Model) Methods
// passing query-helpers to model kinda bugs my IDE
export interface IUserModel extends Model<IUser>, ModelWithPaginatePlugin, UserStaticsType {}
