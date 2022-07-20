import { Schema } from 'mongoose';

import { isEmailValid, sanitizeEmail } from '../../../utils';
import { IUser, IUserModel } from './user.types';

export const UserSchema = new Schema<IUser, IUserModel>(
  {
    name: { type: String, required: true, index: true },

    email: {
      type: String,
      index: { sparse: true },
      validate: [(email?: string) => (email ? isEmailValid(email) : true), 'Email must be valid.'],
      set: sanitizeEmail,
    },
  },
  {
    timestamps: true,
  },
);
