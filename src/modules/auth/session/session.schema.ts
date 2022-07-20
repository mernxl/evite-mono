import { Schema } from 'mongoose';

import { ISession, ISessionModel } from './session.types';

export const SessionSchema = new Schema<ISession, ISessionModel>(
  {
    userId: { type: Schema.Types.ObjectId, index: { sparse: true } }, // userId of user

    exp: Date, // expiresIn
    iat: Date, // issuedAt
    iss: String, // issuer

    closed: Boolean,

    accessToken: { type: String }, // jwt string
    refreshToken: { type: String }, // jwt string
  },
  {
    timestamps: true,
  },
);
