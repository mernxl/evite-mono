import { Query, Types } from 'mongoose';

import { config } from '../../../config';
import { mailer } from '../../../config/notify';
import { generatePassword } from '../../../utils';
import { IUser } from '../user';
import { EPasswordRecoveryStrategies, IPassword, IPasswordModel } from './password.types';

export type PasswordStaticsType = typeof PasswordStatics;

export const PasswordStatics = {
  findByResetToken(this: IPasswordModel, resetToken: string): Query<IPassword | null, IPassword> {
    return this.findOne().where('newPasswordRequest.token', resetToken);
  },

  async generatePasswordResetToken(
    this: IPasswordModel,
    user: IUser,
    password: IPassword,
    strategy: EPasswordRecoveryStrategies,
  ): Promise<IPassword> {
    const token = new Types.ObjectId().toHexString();

    const _password = generatePassword(8);

    password.value = _password;
    password.newPasswordRequest = { token, strategy, date: new Date() };

    const pass = await password.save();

    if (strategy === EPasswordRecoveryStrategies.Email) {
      await mailer.sendMail({
        from: { name: config.app.support.name, address: config.app.support.email },
        to: user.email,
        subject: 'Reset your Evite Password',
        text: `Hi ${user.name}, 
        
We received a request to reset your Evite account password. If you requested this change, use the credentials below to login, then you can reset your password to required.

Username: ${user.email}
Password: ${_password}

If you have any questions, or need any further help, please send a mail at mernxl@gmail.com.

Best Regards,

Evite Support Team`,
      });
    }

    return pass;
  },
};
