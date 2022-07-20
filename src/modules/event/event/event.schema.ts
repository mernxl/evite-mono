import { Schema } from 'mongoose';

import { IEvent, IEventModel } from './event.types';

const EventSchema = new Schema<IEvent, IEventModel>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },

    name: { type: String, required: true },
    description: { type: String },

    ticket: {
      qrSize: String, // could be a percentile or absolute value
      qrPosition: { x: String, y: String },
    },
    hasTicket: Boolean,

    hasKeyword: {
      type: Boolean,
      description: 'Will be used as default keyword for all members',
    },

    organizerId: Schema.Types.ObjectId,
    authorityIds: [Schema.Types.ObjectId],

    signingKeyIdHash: String,
  },
  {
    timestamps: true,
  },
);

export { EventSchema };
