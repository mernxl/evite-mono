import { Document, Model, Types } from 'mongoose';

import { IDocMetaTimestamp } from '../../../utils';
import { SigningKeyMethodsType } from './signing-key.methods';
import { SigningKeyStaticsType } from './signing-key.statics';

export interface SigningKeyBase {
  _id: string;

  privateKeyHash: string;
  publicKeyHash: string;

  keywordHash?: string;
}

export type ISigningKeyBase = Omit<SigningKeyBase, '_id'>;

export interface ISigningKey
  extends Document,
    ISigningKeyBase,
    IDocMetaTimestamp,
    SigningKeyMethodsType {
  _id: Types.ObjectId;
}

export interface ISigningKeyModel extends Model<ISigningKey>, SigningKeyStaticsType {}
