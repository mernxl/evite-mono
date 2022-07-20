import { createSign, createVerify } from 'crypto';
import { Types } from 'mongoose';

import { config } from '../../../config';
import { ErrorResponse } from '../../../utils';
import { CryptoServices } from '../crypto.config';
import { SIGNING_HASH_ALGO } from '../crypto.constants';
import { CreateOneSignatureInput, VerifySignatureInput } from '../cypto.types';
import { decodeFernetToken, getFernetToken } from '../utils';
import { ISignature, ISignatureModel } from './signature.types';

export type SignatureStaticsType = typeof SignatureStatics;

export const SignatureStatics = {
  async createOne(
    this: ISignatureModel,
    createOneSignatureInput: CreateOneSignatureInput,
  ): Promise<string> {
    const token = getFernetToken();

    const signingKey = await CryptoServices.SigningKey().getByIdHash(
      createOneSignatureInput.signingKeyIdHash,
    );

    let keywordHash: string | undefined = undefined;
    let keyword = createOneSignatureInput.keyword;

    if (keyword) {
      keywordHash = token.encode(keyword);
    } else {
      keyword = signingKey.keywordHash
        ? decodeFernetToken(signingKey.keywordHash)
        : config.CRYPTO.SYSTEM_SECRET;
    }

    // sign the data eviteId:keyword
    const sign = createSign(SIGNING_HASH_ALGO)
      .update(`${createOneSignatureInput.eviteId}:${keyword}`)
      .end();

    const signature: ISignature = await this.create({
      _id: new Types.ObjectId(),

      // sign and store as base64 string
      signature: sign.sign(decodeFernetToken(signingKey.privateKeyHash)).toString('base64'),

      keywordHash,
    });

    return token.encode(signature._id.toHexString()); // signatureIdHash
  },

  async getByIdHash(this: ISignatureModel, signatureIdHash: string): Promise<ISignature> {
    const signatureId = decodeFernetToken(signatureIdHash);

    const signature = await this.findById(signatureId).exec();

    if (!signature) {
      throw new ErrorResponse('Signature not found', undefined, { signatureIdHash });
    }

    return signature;
  },

  async verify(
    this: ISignatureModel,
    verifySignatureInput: VerifySignatureInput,
  ): Promise<boolean> {
    const signature = await this.getByIdHash(verifySignatureInput.signatureIdHash);
    const signingKey = await CryptoServices.SigningKey().getByIdHash(
      verifySignatureInput.signingKeyIdHash,
    );

    const keyword =
      verifySignatureInput.keyword ||
      (signingKey.keywordHash
        ? decodeFernetToken(signingKey.keywordHash)
        : config.CRYPTO.SYSTEM_SECRET);

    // create verification the data eviteId:keyword
    const verify = createVerify(SIGNING_HASH_ALGO)
      .update(`${verifySignatureInput.eviteId}:${keyword}`)
      .end();

    return verify.verify(
      decodeFernetToken(signingKey.publicKeyHash),
      Buffer.from(signature.signature, 'base64'), // signature needs to be a buffer
    );
  },
};
