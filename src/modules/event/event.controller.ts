import { StatusCodes } from 'http-status-codes';
import {
  Body,
  Controller,
  File,
  Get,
  Path,
  Post,
  Put,
  Request,
  Route,
  Security,
  Tags,
  UploadedFile,
} from 'tsoa';

import { SecuredRequest } from '../../config/authorization';
import { EventModel } from './event';
import {
  CreateOneEventInput,
  CreateOneEviteInput,
  Event,
  Evite,
  EviteTicketOutput,
  VerifyEviteInput,
  VerifyEviteOutput,
} from './event.types';
import { EviteModel } from './evite';

@Tags('Event')
@Route('events')
export class EventController extends Controller {
  @Security('Bearer')
  @Post()
  public async create(
    @Request() req: SecuredRequest,
    @Body() body: CreateOneEventInput,
  ): Promise<Event> {
    const event = await EventModel.createOne(body, { userId: req.auth.userId });

    return event.view();
  }

  @Security('Bearer')
  @Put('/:eventId/tickets')
  public async updateTicket(
    @Request() req: SecuredRequest,
    @Path() eventId: string,
    @UploadedFile() image: File,
  ): Promise<void> {
    await EventModel.saveTicketImage(eventId, image);

    this.setStatus(StatusCodes.NO_CONTENT);
  }

  @Security('Bearer')
  @Post('/evites')
  public async eviteCreate(
    @Request() req: SecuredRequest,
    @Body() body: CreateOneEviteInput,
  ): Promise<Evite> {
    const evite = await EviteModel.createOne(body, { userId: req.auth.userId });

    return evite.view();
  }

  @Security('Bearer')
  @Post('/evites/verify')
  public async eviteVerify(
    @Request() req: SecuredRequest,
    @Body() body: VerifyEviteInput,
  ): Promise<VerifyEviteOutput> {
    const isValid = await EviteModel.verifyEvite(body, { userId: req.auth.userId });

    return { isValid };
  }

  @Security('Bearer')
  @Get('/evites/:eviteId/ticket')
  public eviteTicket(
    @Request() req: SecuredRequest,
    @Path() eviteId: string,
  ): Promise<EviteTicketOutput> {
    return EviteModel.getTicketUrl(eviteId);
  }
}
