import { Document, Model, Types } from 'mongoose';

import { IDocMetaTimestamp } from '../../../utils';
import { SessionMethodsType } from './Session.methods';
import { SessionStaticsType } from './session.statics';

export interface SessionBase {
  _id: string;
  userId: string;

  exp?: number;
  iat?: number;
  iss?: string;
  closed?: boolean;

  accessToken: string;
  refreshToken: string;
}

export type ISessionBase = Omit<SessionBase, '_id' | 'userId'>;

export interface ISession extends Document, ISessionBase, IDocMetaTimestamp, SessionMethodsType {
  _id: Types.ObjectId;
  userId: Types.ObjectId; // uuid
}

export interface ISessionModel extends Model<ISession>, SessionStaticsType {}
