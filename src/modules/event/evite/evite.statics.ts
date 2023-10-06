import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Types } from 'mongoose';
import * as os from 'os';

import { config } from '../../../config';
import { downloadS3File, getPresignedUrl, s3Client } from '../../../config/aws';
import { DocMetaConfig, ErrorResponse } from '../../../utils';
import { CryptoServices } from '../../crypto';
import { EventServices } from '../event.config';
import { CreateOneEviteInput, EviteTicketOutput, VerifyEviteInput } from '../event.types';
import { composeDataAsQROnImage, getEviteObjectKey, getTicketObjectKey } from '../utils';
import { IEvite, IEviteModel } from './evite.types';
import { mkdir, mkdtemp } from 'fs';
import { promisify } from 'util';

export type EviteStaticsType = typeof EviteStatics;

export const EviteStatics = {
  async createOne(
    this: IEviteModel,
    createOneEviteInput: CreateOneEviteInput,
    docMetaConfig: DocMetaConfig,
  ): Promise<IEvite> {
    const event = await EventServices.Event().getById(createOneEviteInput.eventId);

    // check if this person is authorized
    await event.checkAuthorized(docMetaConfig.userId);

    const eviteId = new Types.ObjectId();

    const signatureIdHash = await CryptoServices.Signature().createOne({
      eviteId: eviteId.toHexString(),
      signingKeyIdHash: event.signingKeyIdHash,
      keyword: createOneEviteInput.keyword,
    });

    return this.create({
      _id: eviteId,
      eventId: new Types.ObjectId(createOneEviteInput.eventId),

      signatureIdHash,
      hasKeyword: !!createOneEviteInput.keyword,

      createdById: docMetaConfig.userId,
    });
  },

  async getById(this: IEviteModel, eviteId: string | Types.ObjectId): Promise<IEvite> {
    const evite = await this.findById(eviteId).exec();

    if (!evite) {
      throw new ErrorResponse('Evite not found', undefined, {
        eviteId,
      });
    }

    return evite;
  },

  async verifyEvite(
    this: IEviteModel,
    verifyEviteInput: VerifyEviteInput,
    docMetaConfig: DocMetaConfig,
  ): Promise<boolean> {
    const evite = await this.getById(verifyEviteInput.eviteId);
    const event = await EventServices.Event().getById(evite.eventId);

    // check if this person is authorized
    await event.checkAuthorized(docMetaConfig.userId);

    if ((evite.hasKeyword || event.hasKeyword) && !verifyEviteInput.keyword) {
      throw new ErrorResponse('Must provide keyword to verify event.', undefined, {
        evite: evite.hasKeyword,
        event: event.hasKeyword,
      });
    }

    return CryptoServices.Signature().verify({
      eviteId: evite._id.toHexString(),
      keyword: verifyEviteInput.keyword,
      signatureIdHash: evite.signatureIdHash,
      signingKeyIdHash: event.signingKeyIdHash,
    });
  },

  async getTicketUrl(this: IEviteModel, eviteId: string): Promise<EviteTicketOutput> {
    const evite = await this.getById(eviteId);
    const event = await EventServices.Event().getById(evite.eventId);

    if (!event.hasTicket || !event.ticket) {
      throw new ErrorResponse('No Event ticket to generate evite Ticket.');
    }

    const filePath = `${os.tmpdir()}/${getTicketObjectKey(event._id)}`;
    // ensure tickets dir
    await promisify(mkdir)(filePath.substring(0, filePath.lastIndexOf('/')), {
      recursive: true,
    });
    await downloadS3File(config.EVENT.BUCKET_NAME, getTicketObjectKey(event._id), filePath);

    const sharp = await composeDataAsQROnImage(evite._id.toHexString(), filePath, event.ticket);

    const command = new PutObjectCommand({
      Bucket: config.EVENT.BUCKET_NAME,
      Key: getEviteObjectKey(evite._id),
      Body: await sharp.png().toBuffer(),
      ContentType: 'image/png',
    });

    await s3Client.send(command);

    const url = await getPresignedUrl(
      config.EVENT.BUCKET_NAME,
      getEviteObjectKey(evite._id),
      60 * 60, // 60 minutes (secs)
    );

    return { eviteId: evite._id.toHexString(), url };
  },
};
