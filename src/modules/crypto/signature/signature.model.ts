import { CryptoCollections, CryptoDBConnection, CryptoModels } from '../crypto.config';
import { SignatureMethods } from './signature.methods';
import { SignatureSchema } from './signature.schema';
import { SignatureStatics } from './signature.statics';
import { ISignature, ISignatureModel } from './signature.types';

SignatureSchema.methods = SignatureMethods;
SignatureSchema.statics = SignatureStatics;

export const SignatureModel = CryptoDBConnection.model<ISignature, ISignatureModel>(
  CryptoModels.Signature,
  SignatureSchema,
  CryptoCollections.Signature,
);
