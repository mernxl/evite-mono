import fernet from 'fernet';

import { config } from '../../config';

export const getFernetToken = (): fernet.Token =>
  new fernet.Token({
    secret: new fernet.Secret(config.CRYPTO.SYSTEM_SECRET),
  });

export const decodeFernetToken = (token: string): string =>
  new fernet.Token({
    secret: new fernet.Secret(config.CRYPTO.SYSTEM_SECRET),
    token,
    ttl: 0,
  }).decode();
