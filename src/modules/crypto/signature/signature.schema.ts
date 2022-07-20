import { Schema } from 'mongoose';

import { ISignature, ISignatureModel } from './signature.types';

const SignatureSchema = new Schema<ISignature, ISignatureModel>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },

    signature: {
      type: String,
      description: 'Base64 sting of the signature',
    },

    keywordHash: {
      type: String,
      description: 'Evite keyword hash, will be used to verify signature',
    },
  },
  {
    timestamps: true,
  },
);

export { SignatureSchema };
