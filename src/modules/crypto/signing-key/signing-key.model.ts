import { CryptoCollections, CryptoDBConnection, CryptoModels } from '../crypto.config';
import { SigningKeyMethods } from './signing-key.methods';
import { SigningKeySchema } from './signing-key.schema';
import { SigningKeyStatics } from './signing-key.statics';
import { ISigningKey, ISigningKeyModel } from './signing-key.types';

SigningKeySchema.methods = SigningKeyMethods;
SigningKeySchema.statics = SigningKeyStatics;

export const SigningKeyModel = CryptoDBConnection.model<ISigningKey, ISigningKeyModel>(
  CryptoModels.SigningKey,
  SigningKeySchema,
  CryptoCollections.SigningKey,
);
