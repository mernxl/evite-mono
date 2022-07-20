import { Document, Model, Types } from 'mongoose';

import { IDocMetaTimestamp } from '../../../utils';
import { PasswordMethodsType } from './password.methods';
import { PasswordStaticsType } from './password.statics';

export enum EPasswordRecoveryStrategies {
  Manual = 'manual', // the user changes
  Email = 'email',
}

export interface IPasswordModification extends Types.ArraySubdocument {
  setDate: Date;
  strategy: EPasswordRecoveryStrategies;
  requestDate?: Date;
}

export interface INewPasswordRequest {
  date: Date;
  password: string;
  strategy: EPasswordRecoveryStrategies;
  token: string; // bcrypt or random(uuid) string, client will be sent key through mail
}

export interface IPassword extends Document, IDocMetaTimestamp, PasswordMethodsType {
  _id: Types.ObjectId;
  userId: Types.ObjectId; // alias to _id

  value: string;
  lockUntil: number; // timestamp
  loginAttempts: number;
  lastModified: Date;

  newPasswordRequest?: Omit<INewPasswordRequest, 'password'>;

  modifications: Types.DocumentArray<IPasswordModification>; // ArrayType
}

export interface IPasswordModel extends Model<IPassword>, PasswordStaticsType {}
