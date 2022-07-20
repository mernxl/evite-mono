import jwt, { SignOptions } from 'jsonwebtoken';

import { config } from '../../../config';
import { IAuthAccessTokenPayload, verifyToken } from '../../../config/authorization';
import { AuthorizationError, ErrorResponse } from '../../../utils';
import { AuthDBConnection, AuthModels } from '../auth.config';
import { JWT_ACCESS_TOKEN_EXP, JWT_DEFAULT_ISS, JWT_REFRESH_TOKEN_EXP } from '../auth.constants';
import { Authorization, IAuthRefreshTokenPayload } from '../auth.types';
import { IUser } from '../user';
import { SessionModel } from './session.model';
import { ISession, ISessionModel } from './session.types';

export type SessionStaticsType = typeof SessionStatics;

export const SessionStatics = {
  getAuthorizationObj(this: ISessionModel, user: IUser, session: ISession): Authorization {
    return {
      userId: user._id.toHexString(),
      email: user.email,

      sessionId: session._id.toHexString(),

      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
  },

  async getUserAuthorization(this: ISessionModel, user: IUser): Promise<Authorization> {
    const session = await this.createSession(user);

    await this.generateAccessToken(user, session);

    return this.getAuthorizationObj(user, session);
  },

  async createSession(this: ISessionModel, user: IUser): Promise<ISession> {
    // save to get confident and verified sid
    const session: ISession = await SessionModel.create({ userId: user._id });
    // const session = await newSession.save();

    const payload: IAuthRefreshTokenPayload = {
      userId: user._id,
      sessionId: session._id,
    };

    const JWTOptions: SignOptions = {
      issuer: JWT_DEFAULT_ISS,
      expiresIn: JWT_REFRESH_TOKEN_EXP,
    };

    session.iat = Date.now();
    session.iss = JWT_DEFAULT_ISS;
    session.refreshToken = jwt.sign(payload, config.JWT_SECRET, JWTOptions);

    await session.save();

    return session;
  },

  verifyRefreshToken(
    token: string,
  ): Promise<{ valid: boolean; err?: any; payload?: IAuthRefreshTokenPayload }> {
    return new Promise((resolve) =>
      jwt.verify(token, config.JWT_SECRET, (err, payload) => {
        if (err || !payload || !(payload as IAuthRefreshTokenPayload).sessionId) {
          return resolve({ err, valid: false });
        }

        return resolve({ payload: payload as IAuthRefreshTokenPayload, valid: true });
      }),
    );
  },

  async generateAccessToken(
    this: ISessionModel,
    user: IUser,
    session: ISession,
  ): Promise<ISession> {
    const payload: IAuthAccessTokenPayload = {
      userId: session.userId,
      sessionId: session._id,
    };

    const JWTOptions = {
      issuer: JWT_DEFAULT_ISS,
      expiresIn: JWT_ACCESS_TOKEN_EXP,
    };

    session.accessToken = jwt.sign(payload, config.JWT_SECRET, JWTOptions);

    return session.save();
  },

  async verifyAccessToken(
    this: ISessionModel,
    token: string,
  ): Promise<{ session: ISession; authPayload: IAuthAccessTokenPayload }> {
    let payload: IAuthAccessTokenPayload;

    try {
      payload = await verifyToken(token);
    } catch (err) {
      throw new AuthorizationError('Invalid Authentication Token', err);
    }

    const session = await this.findById(payload.sessionId).exec();

    if (!session || session.closed) {
      throw new AuthorizationError('Invalid Authentication Token');
    }

    return { session, authPayload: payload };
  },

  async refreshAccessToken(this: ISessionModel, refreshToken: string): Promise<Authorization> {
    const { valid, err, payload } = await this.verifyRefreshToken(
      refreshToken.replace('Bearer ', ''),
    );

    if (!valid || !payload) {
      throw new AuthorizationError('Invalid Refresh Token', err);
    }

    const [session, user] = await Promise.all([
      this.findById(payload.sessionId).exec(),
      AuthDBConnection.model<IUser>(AuthModels.User).findById(payload.userId).exec(),
    ]);

    if (!session || session.closed) {
      throw new AuthorizationError('Invalid Refresh Token', err);
    }

    if (!user) {
      throw new ErrorResponse('User information not found');
    }

    await this.generateAccessToken(user, session);

    return this.getAuthorizationObj(user, session);
  },
};
