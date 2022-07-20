import './signature';
import './signing-key';

import { Controller, Post, Request, Route, Security, Tags } from 'tsoa';

import { SecuredRequest } from '../../config/authorization';

@Tags('Crypto')
@Route('crypto')
export class CryptoController extends Controller {
  @Security('Bearer')
  @Post('sign')
  public async sign(@Request() req: SecuredRequest): Promise<string> {
    return req.path;
  }

  @Security('Bearer')
  @Post('verify')
  public async verify(@Request() req: SecuredRequest): Promise<string> {
    return req.path;
  }
}
