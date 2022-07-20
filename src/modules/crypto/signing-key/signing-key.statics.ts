import { generateKeyPair, generateKeyPairSync } from 'crypto';
import fernet from 'fernet';
import { Types } from 'mongoose';
import { promisify } from 'util';

import { ErrorResponse } from '../../../utils';
import { SIGNING_KEY_CURVE } from '../crypto.constants';
import { CreateOneSigningKeyInput } from '../cypto.types';
import { decodeFernetToken, getFernetToken } from '../utils';
import { ISigningKey, ISigningKeyModel, SigningKeyBase } from './signing-key.types';

export type SigningKeyStaticsType = typeof SigningKeyStatics;

export const SigningKeyStatics = {
  async createOne(
    this: ISigningKeyModel,
    createOneSigningKeyInput: CreateOneSigningKeyInput,
  ): Promise<string> {
    const token = getFernetToken();
    const { privateKeyHash, publicKeyHash } = await this.generateAndEncryptKeyPair(token);

    const keywordHash = createOneSigningKeyInput.keyword
      ? token.encode(createOneSigningKeyInput.keyword)
      : undefined;

    const signingKey: ISigningKey = await this.create({
      _id: new Types.ObjectId(),

      privateKeyHash,
      publicKeyHash,

      keywordHash,
    });

    return token.encode(signingKey._id.toHexString()); // signingKeyIdHash
  },

  async getByIdHash(this: ISigningKeyModel, signingKeyIdHash: string): Promise<ISigningKey> {
    const signingKeyId = decodeFernetToken(signingKeyIdHash);

    const signingKey = await this.findById(signingKeyId).exec();

    if (!signingKey) {
      throw new ErrorResponse('Signing Key not found', undefined, { signingKeyIdHash });
    }

    return signingKey;
  },

  async generateAndEncryptKeyPair(
    token: fernet.Token,
  ): Promise<Pick<SigningKeyBase, 'privateKeyHash' | 'publicKeyHash'>> {
    const { privateKey, publicKey } = await promisify(generateKeyPair)('ec', {
      namedCurve: SIGNING_KEY_CURVE,
    });

    return {
      privateKeyHash: token.encode(privateKey.export({ type: 'sec1', format: 'pem' }).toString()),
      publicKeyHash: token.encode(publicKey.export({ type: 'spki', format: 'pem' }).toString()),
    };
  },
};
