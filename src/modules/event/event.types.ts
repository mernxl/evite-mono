import { DocMetaUserAction, IDocMetaTimestamp } from '../../utils';
import { EventBase } from './event';
import { EviteBase } from './evite';

export interface CreateOneEventInput {
  name: string;
  description?: string;

  ticket?: {
    qrSize: string;
    qrPosition: { x: string; y: string };
  };

  keyword?: string; // if passed will be used as default keyword for all members

  authorityIds?: string[];
}

export interface EventPopulated {
  ticketUrl?: string;
}

export type Event = EventBase & EventPopulated & IDocMetaTimestamp;

export interface CreateOneEviteInput {
  eventId: string;

  keyword?: string; // if passed will be used as keyword for evite
}

export interface VerifyEviteInput {
  eviteId: string;
  keyword?: string; // if event or evite keyword
}

export interface VerifyEviteOutput {
  isValid: boolean;
}

export interface EviteTicketOutput {
  eviteId: string;
  url: string;
}

export type Evite = EviteBase & DocMetaUserAction & IDocMetaTimestamp;
