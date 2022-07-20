import { Schema } from 'mongoose';

import { ISigningKey, ISigningKeyModel } from './signing-key.types';

const SigningKeySchema = new Schema<ISigningKey, ISigningKeyModel>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },

    privateKeyHash: { type: String, description: 'Discourage Brute forcing by storing the hash' },
    publicKeyHash: { type: String, description: 'Discourage Brute forcing by storing the hash' },

    keywordHash: {
      type: String,
      description: 'Event Keyword hash, will be used when non specified by user',
    },
  },
  {
    timestamps: true,
  },
);

export { SigningKeySchema };
