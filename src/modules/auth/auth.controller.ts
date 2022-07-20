import express from 'express';
import { StatusCodes } from 'http-status-codes';
import moment from 'moment';
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Patch,
  Post,
  Put,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';

import { IAuthAccessTokenPayload, SecuredRequest, verifyToken } from '../../config/authorization';
import { wLogger } from '../../config/winston';
import {
  addUpdateDocMetaUserTimestamp,
  AuthorizationError,
  ErrorResponse,
  isEmailValid,
  isModifiableData,
  sanitizeEmail,
  updateDoc,
  ValidationError,
} from '../../utils';
import {
  AuthIsTokenValidInput,
  AuthMeUpdateInput,
  Authorization,
  AuthRequestPasswordResetInput,
  AuthResetPasswordInput,
  AuthSignInInput,
  AuthSignUpInput,
  AuthUpdatePasswordInput,
  User,
} from './auth.types';
import { EPasswordRecoveryStrategies, IPassword, PasswordModel } from './password';
import { SessionModel } from './session';
import { IUser, IUserBase, UserModel } from './user';

/**
 * Authentication and Authorizations - Basic Security
 */
@Tags('Auth')
@Route('auth')
export class AuthController extends Controller {
  /**
   * Create User in System
   */
  @Post('sign-up')
  @SuccessResponse(StatusCodes.OK, 'User Authorization Credentials')
  public async signUp(
    @Request() req: express.Request,
    @Body() body: AuthSignUpInput,
  ): Promise<Authorization> {
    const user = await UserModel.createUser(body);

    return SessionModel.getUserAuthorization(user);
  }

  /**
   * Create User Authorization credential
   * @param req
   * @param body
   */
  @Post('sign-in')
  @SuccessResponse(StatusCodes.OK, 'User Authorization Credentials')
  public async signIn(
    @Request() req: express.Request,
    @Body() body: AuthSignInInput,
  ): Promise<Authorization> {
    const user = await UserModel.findOne({ email: sanitizeEmail(body.email) }).exec();
    const details: Partial<AuthSignInInput> = {};

    if (user) {
      const password = await PasswordModel.findById(user._id).exec();

      if (password) {
        // check if the account is currently locked
        if (password.isLocked()) {
          throw new AuthorizationError(
            `Account Locked, Try again ${moment(password.lockUntil).toNow()}.`,
          );
        }

        const correct = await password.comparePassword(body.password);

        if (correct) {
          if (password.loginAttempts > 0 || password.lockUntil > 1) {
            await password.resetPasswordLock();
          }

          return SessionModel.getUserAuthorization(user);
        } else {
          details.password = 'Incorrect Password';

          await password.incLoginAttempts();
        }
      }
    } else {
      details.email = `Unknown email, ${body.email}`;
    }

    throw new ValidationError(details, 'Authentication Failed!!');
  }

  /**
   * Terminates a session, nullifies the refresh token
   * @param req
   * @param auth
   */
  @Delete('sign-out')
  @Response(StatusCodes.NO_CONTENT, 'Session Terminated, RefreshToken Now null.')
  public async signOut(
    @Request() req: express.Request,
    @Header('Authorization') auth?: string,
  ): Promise<void> {
    if (auth) {
      try {
        const payload = await verifyToken(auth.replace('Bearer ', ''));

        const session = await SessionModel.findById(payload.sessionId).exec();

        if (session) {
          await session.closeSession();
        }
      } catch (e) {
        wLogger.error(e);
      }
    }

    return;
  }

  /**
   * Get the current user information. Details of the requester.
   * @param req
   */
  @Get('me')
  @Security('Bearer')
  public async index(
    @Request() req: express.Request & { auth: IAuthAccessTokenPayload },
  ): Promise<User> {
    const user = await UserModel.findById(req.auth.userId).exec();

    if (!user) {
      throw new ErrorResponse('User not Found in systems.');
    }

    return user.view();
  }

  /**
   * @summary Update user information, must be authenticated.
   * @param req
   * @param body
   */
  @Security('Bearer')
  @Patch('me')
  async mePut(@Request() req: SecuredRequest, @Body() body: AuthMeUpdateInput): Promise<User> {
    const user = await UserModel.getById(req.auth.userId);

    updateDoc<IUser, IUserBase>(
      user,
      addUpdateDocMetaUserTimestamp(isModifiableData(body), req.auth.userId),
    );

    return (await user.save()).view();
  }

  /**
   * @summary Update user Email
   */
  @Put('me/email')
  @Security('Bearer')
  public async meEmailPut(
    @Request() req: SecuredRequest,
    @Body() body: { email: string },
  ): Promise<void> {
    const email = sanitizeEmail(body.email);

    if (!isEmailValid(email)) {
      throw new ValidationError({ email: 'Email does not match pattern' });
    }

    const user = await UserModel.getById(req.auth.userId);

    if (await UserModel.checkAvailable({ field: 'email', value: email, userId: user._id })) {
      throw new ValidationError(
        {
          email: `${email} already taken, try another email.`,
        },
        'Could not update account.',
      );
    }

    user.email = email;

    await user.save();

    return;
  }

  /**
   * Update user password, Should posses an authentication token, else 401.
   *
   * @param req
   * @param body
   */
  @Post('update-password')
  @Security('Bearer')
  @Response(StatusCodes.NO_CONTENT, 'Password update success.')
  public async updatePassword(
    @Request() req: SecuredRequest,
    @Body() body: AuthUpdatePasswordInput,
  ): Promise<void> {
    const password = await PasswordModel.findById(req.auth.userId).exec();

    if (!password) {
      throw new ErrorResponse('User parameters missing');
    }

    if (!(await password.comparePassword(body.cur_password))) {
      await password.incLoginAttempts();
      throw new ValidationError<AuthUpdatePasswordInput>({
        cur_password: 'Password incorrect, verify and try again.',
      });
    }

    await password.resetPassword({
      password: body.new_password,
      strategy: EPasswordRecoveryStrategies.Manual,
    });

    this.setStatus(StatusCodes.NO_CONTENT);

    return;
  }

  /**
   * ## NOTE
   * Currently, an email with a generated Password is sent. Token generate is not sent as of this version.
   *
   * Request a password reset. A token will be sent to the provided email address,
   * on presenting that token, one can reset account.
   *
   * Token has a validity period of 20 Minutes after which you will need to request new token to reset password.
   *
   * @summary Request a password reset, new password is generated and sent.
   */
  @Post('request-password-reset')
  @Response(StatusCodes.NO_CONTENT, 'Token has been sent to email, to be used for resetting.')
  public async requestPasswordReset(
    @Request() req: express.Request,
    @Body() body: AuthRequestPasswordResetInput,
  ): Promise<void> {
    const { query, method } = UserModel.getUserQueryByResetRequestObj(body);

    const user = await query.exec();

    if (!user) {
      throw new ValidationError<AuthRequestPasswordResetInput>({
        email: `No account matches this ${method}.`,
      });
    }

    const password = await PasswordModel.findById(user._id).exec();

    if (!password) {
      throw new ErrorResponse('User properties not found');
    }

    await PasswordModel.generatePasswordResetToken(user, password, method);

    this.setStatus(StatusCodes.NO_CONTENT);

    return;
  }

  /**
   * Reset a password, using a reset token.
   *
   * To reset, we need pass either token, generated and send via email
   *
   * @param req
   * @param body
   */
  @Post('reset-password')
  @Response(StatusCodes.NO_CONTENT, 'Password reset success.')
  public async resetPassword(
    @Request() req: express.Request,
    @Body() body: AuthResetPasswordInput,
  ): Promise<void> {
    const password: IPassword | null = await PasswordModel.findByResetToken(
      body.reset_token,
    ).exec();
    const method = EPasswordRecoveryStrategies.Email;

    if (!password || !password.isResetTokenValid) {
      throw new AuthorizationError('Invalid reset token provided, request a new token');
    }

    await password.resetPassword({
      strategy: method,
      password: body.new_password,
    });

    this.setStatus(StatusCodes.NO_CONTENT);

    return;
  }

  /**
   * Refresh Access token, old one could still be used until it expires.
   *
   * @summary Refresh access token
   * @param req
   * @param refreshToken RefreshToken that will be used to refresh access token
   */
  @Get('refresh-access-token')
  public async refreshAccessToken(
    @Request() req: express.Request,
    @Header('X-Auth') refreshToken: string,
  ): Promise<Authorization> {
    return SessionModel.refreshAccessToken(refreshToken);
  }

  /**
   * Verify if a token is valid, it may be an access or refresh token.
   *
   * Useful when deciding whether to redirect to signin when a 401 response
   * is ever received.
   *
   * @param req
   * @param body
   */
  @Post('is-token-valid')
  public async isTokenValid(
    @Request() req: express.Request,
    @Body() body: AuthIsTokenValidInput,
  ): Promise<boolean> {
    try {
      const payload = await verifyToken(body.token);
      const session = await SessionModel.findById(payload.sessionId).exec();

      if (session && !session.closed) {
        return true;
      }
    } catch (e) {
      wLogger.error(e);
    }

    return false;
  }
}
