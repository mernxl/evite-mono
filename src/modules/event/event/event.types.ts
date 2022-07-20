import { Document, Model, Types } from 'mongoose';

import { IDocMetaTimestamp } from '../../../utils';
import { EventMethodsType } from './event.methods';
import { EventStaticsType } from './event.statics';

export interface EventTicketMeta {
  qrSize: string;
  qrPosition: { x: string; y: string };
}

export interface EventBase {
  _id: string;

  name: string;
  description?: string;

  ticket?: EventTicketMeta;
  hasTicket?: boolean;

  hasKeyword: boolean;

  organizerId: string;
  authorityIds: string[];

  signingKeyIdHash: string;
}

export type IEventBase = Omit<EventBase, '_id' | 'organizerId' | 'authorityIds'>;

export interface IEvent extends Document, IEventBase, IDocMetaTimestamp, EventMethodsType {
  _id: Types.ObjectId;

  organizerId: Types.ObjectId;
  authorityIds: Types.ObjectId[];
}

export interface IEventModel extends Model<IEvent>, EventStaticsType {}
