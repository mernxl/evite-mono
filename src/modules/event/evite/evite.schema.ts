import { Schema } from 'mongoose';

import { enumObjectValues } from '../../../utils';
import { EviteActivityType, IEvite, IEviteModel } from './evite.types';

const EviteSchema = new Schema<IEvite, IEviteModel>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },

    eventId: { type: Schema.Types.ObjectId, required: true },

    hasKeyword: {
      type: Boolean,
      description: 'If a customer user keyword was used, will be requested at signing.',
    },

    signatureIdHash: String,

    activity: [
      { type: String, enum: enumObjectValues(EviteActivityType), data: String, timestamp: Date },
    ],
  },
  {
    timestamps: true,
  },
);

export { EviteSchema };
