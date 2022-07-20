import * as bcrypt from 'bcrypt';
import moment from 'moment';

import {
  PWD_LOCK_TIME,
  PWD_MAX_LOGIN_ATTEMPTS,
  PWD_RESET_TOKEN_EMAIL_EXP,
} from '../auth.constants';
import {
  EPasswordRecoveryStrategies,
  INewPasswordRequest,
  IPassword,
  IPasswordModification,
} from './password.types';

export type PasswordMethodsType = typeof PasswordMethods;

export const PasswordMethods = {
  isLocked(this: IPassword): boolean {
    return moment(this.lockUntil).isAfter(moment());
  },

  isResetTokenValid(this: IPassword): boolean {
    if (this.newPasswordRequest && this.newPasswordRequest.date) {
      if (this.newPasswordRequest.strategy === EPasswordRecoveryStrategies.Email) {
        return moment(this.newPasswordRequest.date)
          .add(PWD_RESET_TOKEN_EMAIL_EXP)
          .isAfter(moment());
      }
    }
    return false;
  },

  comparePassword(this: IPassword, candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.value);
  },

  resetPassword(
    this: IPassword,
    resetCred: Omit<INewPasswordRequest, 'date' | 'token' | 'otp'>,
  ): Promise<IPassword> {
    const modification = this.modifications.create({
      setDate: new Date(),
      strategy: resetCred.strategy,
      requestDate: this.newPasswordRequest?.date || new Date(), // if manual and today
    } as Pick<IPasswordModification, 'setDate' | 'strategy' | 'requestDate'>);

    this.value = resetCred.password;
    this.lockUntil = 1;
    this.loginAttempts = 0;
    this.newPasswordRequest = {} as any;

    return this.save().then(() =>
      this.updateOne({ $push: { modifications: modification } }).exec(),
    );
  },

  incLoginAttempts(this: IPassword): Promise<IPassword> {
    // if we have previous lock that had expired
    if (this.lockUntil > 1 && !this.isLocked()) {
      return this.resetPasswordLock();
    }

    const update: any = {
      $inc: { loginAttempts: 1 },
    };

    // lock the account if we've reached max attempts and it's not locked already
    if (this.loginAttempts >= PWD_MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
      // TODO: Implement send mail to client.
      // TODO: Implement log Account Locks.
      update.$set = {
        lockUntil: moment().add(PWD_LOCK_TIME).valueOf(),
      };
    }

    return this.updateOne(update).exec();
  },

  resetPasswordLock(this: IPassword): Promise<IPassword> {
    this.lockUntil = 1;
    this.loginAttempts = 0;

    return this.save();
  },
};
