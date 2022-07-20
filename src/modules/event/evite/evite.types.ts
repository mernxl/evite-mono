import { Document, Model, Types } from 'mongoose';

import { IDocMetaUserTimestamp } from '../../../utils';
import { EviteMethodsType } from './evite.methods';
import { EviteStaticsType } from './evite.statics';

export enum EviteActivityType {
  CheckIn = 'check-in',
  CheckOut = 'check-out',
  Cancelled = 'cancelled',
}

export interface EviteBase {
  _id: string;

  eventId: string;

  hasKeyword: boolean;

  signatureIdHash: string;

  activity: { type: EviteActivityType; data?: string; timestamp: Date }[];
}

export type IEviteBase = Omit<EviteBase, '_id' | 'eventId'>;

export interface IEvite extends Document, IEviteBase, IDocMetaUserTimestamp, EviteMethodsType {
  _id: Types.ObjectId;

  eventId: Types.ObjectId;
}

export interface IEviteModel extends Model<IEvite>, EviteStaticsType {}
