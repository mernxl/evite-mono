import { Schema } from 'mongoose';

import { IPassword, IPasswordModel } from './password.types';

const PasswordSchema = new Schema<IPassword, IPasswordModel>(
  {
    _id: { type: Schema.Types.ObjectId, alias: 'userId', required: true }, // userId

    value: { type: String, required: true },
    lockUntil: { type: Number, default: 1 },
    loginAttempts: { type: Number, default: 0 },
    lastModified: { type: Date, Default: new Date() },

    newPasswordRequest: {
      date: Date,
      strategy: String,
      token: { type: String, index: true, space: true },
    },

    modifications: {
      type: [{ setDate: Date, strategy: String, requestDate: Date }],
      select: 0,
      _id: false,
    },
  },
  {
    timestamps: true,
  },
);

export { PasswordSchema };
