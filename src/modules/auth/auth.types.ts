import { Types } from 'mongoose';

import { IDocMetaTimestamp } from '../../utils';
import { UserBase } from './user';

export interface Authorization {
  userId: string;
  email: string;

  sessionId: string;

  accessToken: string;
  refreshToken: string;
}

export interface IAuthRefreshTokenPayload {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
}

export interface AuthSignInInput {
  email: string;
  password: string;
}

export interface AuthSignUpInput {
  name: string;
  email: string;
  password: string;
}

/**
 * Update a users information
 */
export interface AuthMeUpdateInput {
  name?: string;
  email?: string;
}

export interface AuthUpdatePasswordInput {
  /**
   * Current Password
   */
  cur_password: string;

  /**
   * New Password to use.
   */
  new_password: string;
}

export interface AuthRequestPasswordResetInput {
  email: string;
}

export interface AuthResetPasswordInput {
  /**
   * Gotten after calling request-password-reset route
   *
   * If reset code already verified, then no need to send resetToken but obj needed
   */
  reset_token: string;
  new_password: string;
}

export interface AuthIsTokenValidInput {
  type: 'access' | 'refresh';
  token: string;
}

export type User = UserBase & IDocMetaTimestamp;
