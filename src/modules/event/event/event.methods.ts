import { Types } from 'mongoose';
import { find } from 'ramda';

import { config } from '../../../config';
import { getPresignedUrl } from '../../../config/aws';
import { ForbiddenError, viewDocMetaTimeStamp } from '../../../utils';
import { Event } from '../event.types';
import { getTicketObjectKey } from '../utils';
import { IEvent } from './event.types';

export type EventMethodsType = typeof EventMethods;

export const EventMethods = {
  async checkAuthorized(this: IEvent, userId: Types.ObjectId): Promise<boolean> {
    const isAuthorized =
      this.organizerId.equals(userId) ||
      !!find((authorityId) => authorityId.equals(userId), this.authorityIds);

    if (!isAuthorized) {
      throw new ForbiddenError('You are not allowed to perform actions on this event');
    }
    return true;
  },

  async view(this: IEvent): Promise<Event> {
    return {
      _id: this._id.toHexString(),
      name: this.name,
      description: this.description,

      ticket: this.ticket,
      hasTicket: this.hasTicket,

      hasKeyword: this.hasKeyword,

      organizerId: this.organizerId.toHexString(),
      authorityIds: this.authorityIds.map((id) => id.toHexString()),

      signingKeyIdHash: this.signingKeyIdHash,

      ticketUrl: this.hasTicket
        ? await getPresignedUrl(
            config.EVENT.BUCKET_NAME,
            getTicketObjectKey(this._id),
            60 * 60 * 24 * 5, // 5 days
          )
        : undefined,
      ...viewDocMetaTimeStamp(this),
    };
  },
};
