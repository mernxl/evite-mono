import { ClientSession, Query, Types } from 'mongoose';
import { isEmpty } from 'ramda';

import { config } from '../../../config';
import { mailer } from '../../../config/notify';
import { wLogger } from '../../../config/winston';
import {
  ErrorResponse,
  isEmailValid,
  sanitizeEmail,
  sanitizePhone,
  sessionAwareMethod,
  ValidationError,
} from '../../../utils';
import { AuthRequestPasswordResetInput, AuthSignUpInput } from '../auth.types';
import { EPasswordRecoveryStrategies, IPassword, PasswordModel } from '../password';
import { UserModel } from './user.model';
import { IUser, IUserBase, IUserModel } from './user.types';

export type UserStaticsType = typeof UserStatics;

export const UserStatics = {
  async validateEmail(this: IUserModel, signUpInput: AuthSignUpInput): Promise<void> {
    if (signUpInput.email) {
      if (!isEmailValid(signUpInput.email)) {
        throw new ValidationError({ email: 'Email does not match pattern' });
      }

      if (!isEmpty(await UserModel.find({ email: sanitizeEmail(signUpInput.email) }).exec())) {
        throw new ValidationError(
          {
            email: `${sanitizeEmail(signUpInput.email)} already taken, try another email.`,
          },
          'Could not create account.',
        );
      }
    }
  },

  async createUser(
    this: IUserModel,
    signUpInput: AuthSignUpInput,
    session?: ClientSession,
  ): Promise<IUser> {
    return sessionAwareMethod({ db: this.db, session }, async (session) => {
      await this.validateEmail(signUpInput);

      const [user] = await this.create<IUserBase>([signUpInput], { session });

      await PasswordModel.create<Pick<IPassword, '_id' | 'value'>>(
        [
          {
            _id: user._id,
            value: signUpInput.password,
          },
        ],
        { session },
      );

      /* TODO: send mails
      try {
        await mailer.sendMail({
          from: { name: config.app.support.name, address: config.app.support.email },
          to: user.email,
          subject: 'Welcome Dear User',
          text: `Hi ${user.name},

Welcome to the Evite Platform.

Best Regards,

Evite Support Team`,
        });
      } catch (e) {
        wLogger.error(e);
      }*/

      return user;
    });
  },

  fetchUser(this: IUserModel, email: string, session?: ClientSession): Promise<IUser | null> {
    const query = this.findOne().where({ email: sanitizeEmail(email) });

    return query.setOptions({ session }).exec();
  },

  async getById(
    this: IUserModel,
    userId: Types.ObjectId | string,
    session?: ClientSession,
  ): Promise<IUser> {
    const user = await this.findById(userId).setOptions({ session }).exec();

    if (!user) {
      throw new ErrorResponse('User Information not found', undefined, { userId });
    }

    return user;
  },

  getUserQueryByResetRequestObj(
    this: IUserModel,
    resetRequest: AuthRequestPasswordResetInput,
  ): { query: Query<IUser | null, IUser>; method: EPasswordRecoveryStrategies } {
    const query = UserModel.findOne();
    let method = EPasswordRecoveryStrategies.Manual;

    query.where('email', sanitizeEmail(resetRequest.email));
    method = EPasswordRecoveryStrategies.Email;

    return { query, method };
  },

  async checkAvailable(
    this: IUserModel,
    {
      field,
      value,
      userId,
    }: { field: 'phone' | 'email'; value: string; userId?: Types.ObjectId | string },
  ): Promise<boolean> {
    let sanitizedValue = value;

    switch (field) {
      case 'phone':
        sanitizedValue = sanitizePhone(value);
        break;
      case 'email':
        sanitizedValue = sanitizeEmail(value);
        break;
    }

    return Boolean(
      await this.findOne()
        .and([
          { [field]: sanitizedValue },
          { [field]: { $ne: undefined }, ...(userId ? { _id: { $ne: userId } } : undefined) },
        ])
        .countDocuments()
        .exec(),
    );
  },
};
