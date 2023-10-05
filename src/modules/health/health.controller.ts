import './signature';
import './signing-key';

import { Controller, Get, Route, Tags } from 'tsoa';

import { config } from '../../config';

@Tags('Health')
@Route('health')
export class HealthController extends Controller {
  @Get('/')
  async health(): Promise<string> {
    return config.app.name + ' Service is healthy.';
  }
}
