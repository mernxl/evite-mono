import bcrypt from 'bcrypt';
import { Document } from 'mongoose';

import { AuthCollections, AuthDBConnection, AuthModels } from '../auth.config';
import { PWD_SALT_WORK_FACTOR } from '../auth.constants';
import { PasswordMethods } from './password.methods';
import { PasswordSchema } from './password.schema';
import { PasswordStatics } from './password.statics';
import { IPassword, IPasswordModel } from './password.types';

/**
 * We harsh the password when a change occurs before saving
 */
PasswordSchema.pre<IPassword & Document>('save', async function (next) {
  const password = this as IPassword;

  password.lastModified = new Date();

  try {
    // only harsh modified password - isModified
    if (password.isModified('value')) {
      // generate a salt
      const salt = await bcrypt.genSalt(PWD_SALT_WORK_FACTOR);

      // replacing clear-text with harsh
      // harsh the password along with our new salt
      password.value = await bcrypt.hash(password.value, salt);
    }
  } catch (error: any) {
    return next(error);
  }

  return next();
});

PasswordSchema.methods = PasswordMethods;
PasswordSchema.statics = PasswordStatics;

export const PasswordModel = AuthDBConnection.model<IPassword, IPasswordModel>(
  AuthModels.Password,
  PasswordSchema,
  AuthCollections.Password,
);
