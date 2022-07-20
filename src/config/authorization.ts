import express, { Request } from 'express';
import { ReasonPhrases } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { isEmpty } from 'ramda';

import { AuthorizationError } from '../utils';
import { config } from './config';
import { wLogger } from './winston';

export type SecuredRequest = Request & { auth: IAuthAccessTokenPayload };

export interface IAuthAccessTokenPayload {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
}

export const isAuthAccessTokenPayload = (
  payload?: IAuthAccessTokenPayload | any,
): payload is IAuthAccessTokenPayload => {
  return payload && payload.sessionId && payload.userId;
};

export const verifyToken = (token: string): Promise<IAuthAccessTokenPayload> => {
  return new Promise((resolve, reject) =>
    jwt.verify(token, config.JWT_SECRET, (err, payload) => {
      if (err) {
        return reject(err);
      }

      try {
        if (isAuthAccessTokenPayload(payload)) {
          const auth: IAuthAccessTokenPayload = {
            userId: new Types.ObjectId(payload.userId),
            sessionId: new Types.ObjectId(payload.sessionId),
          };

          return resolve(auth);
        }
      } catch (e) {
        wLogger.error(e);
      }

      return reject('Could not parse user authorization token.');
    }),
  );
};

export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes: string[] = [],
): Promise<void> {
  if (securityName === 'Bearer') {
    const rawToken = String(request.get('authorization') || '');
    const token = rawToken.replace(/Bearer\s/, '');
    let auth: IAuthAccessTokenPayload;

    try {
      auth = await verifyToken(token);
      (request as SecuredRequest).auth = auth;
    } catch (e: any) {
      wLogger.error(e);

      throw new AuthorizationError(ReasonPhrases.UNAUTHORIZED, {
        tokenExpired: e.name === 'TokenExpiredError',
      });
    }

    // scopes are around shops
    // scopes are of form resource:action:possession | possessions are not mandatory
    if (!isEmpty(scopes)) {
      // do something
    }
  }
}
