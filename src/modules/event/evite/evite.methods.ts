import { viewDocMetaUserTimestamp } from '../../../utils';
import { Evite } from '../event.types';
import { IEvite } from './evite.types';

export type EviteMethodsType = typeof EviteMethods;

export const EviteMethods = {
  view(this: IEvite): Evite {
    return {
      _id: this._id.toHexString(),

      eventId: this.eventId.toHexString(),

      hasKeyword: this.hasKeyword,
      signatureIdHash: this.signatureIdHash,

      activity: this.activity,

      ...viewDocMetaUserTimestamp(this),
    };
  },
};
