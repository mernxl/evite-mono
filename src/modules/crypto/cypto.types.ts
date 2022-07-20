export interface CreateOneSigningKeyInput {
  keyword?: string;
}

export interface CreateOneSignatureInput {
  signingKeyIdHash: string;
  eviteId: string;
  keyword?: string;
}

export interface VerifySignatureInput {
  signingKeyIdHash: string;
  signatureIdHash: string;
  eviteId: string;
  keyword?: string;
}
