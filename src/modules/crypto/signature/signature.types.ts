import { Document, Model, Types } from 'mongoose';

import { IDocMetaTimestamp } from '../../../utils';
import { SignatureMethodsType } from './signature.methods';
import { SignatureStaticsType } from './signature.statics';

export interface SignatureBase {
  _id: string;

  signature: string;

  keywordHash?: string;
}

export type ISignatureBase = Omit<SignatureBase, '_id'>;

export interface ISignature
  extends Document,
    ISignatureBase,
    IDocMetaTimestamp,
    SignatureMethodsType {
  _id: Types.ObjectId;
}

export interface ISignatureModel extends Model<ISignature>, SignatureStaticsType {}
