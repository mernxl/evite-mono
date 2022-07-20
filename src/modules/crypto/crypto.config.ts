import dbConnection from '../../config/mongoose';
import { modelNameToCollectionName } from '../../utils';
import { ISignature, ISignatureModel } from './signature/signature.types';
import { ISigningKey, ISigningKeyModel } from './signing-key/signing-key.types';

export enum CryptoModels {
  Signature = 'CryptoSignature',
  SigningKey = 'CryptoSigningKey',
}

export const CryptoCollections = {
  Signature: modelNameToCollectionName(CryptoModels.Signature, 's'),
  SigningKey: modelNameToCollectionName(CryptoModels.SigningKey, 's'),
};

export const CryptoServices = {
  Signature: () => CryptoDBConnection.model<ISignature, ISignatureModel>(CryptoModels.Signature),
  SigningKey: () =>
    CryptoDBConnection.model<ISigningKey, ISigningKeyModel>(CryptoModels.SigningKey),
};

export const CryptoDBConnection = dbConnection;
