import { Types } from 'mongoose';
import QRCode, { QRCodeToDataURLOptions } from 'qrcode';
import sharp, { Sharp } from 'sharp';
import util from 'util';

import { ErrorResponse } from '../../utils';
import { EventTicketMeta } from './event';

export const getTicketObjectKey = (eventId: Types.ObjectId) => `tickets/${eventId.toHexString()}`;
export const getEviteObjectKey = (eviteId: Types.ObjectId) => `evites/${eviteId.toHexString()}.png`;

const toDataURL: (text: string, options: QRCodeToDataURLOptions) => Promise<string> =
  util.promisify(QRCode.toDataURL);

const textToQrBuffer = async (text: string, options: QRCodeToDataURLOptions) => {
  const dataURL = await toDataURL(text, options);
  const regex = /^data:.+\/(.+);base64,(.*)$/; // for matching sections of the base64 encoded string

  const matches = dataURL.match(regex);

  if (!matches) {
    throw new ErrorResponse(undefined, undefined, 'QR code could not be generated');
  }

  return { ext: matches[1], buffer: Buffer.from(matches[2], 'base64') };
};

export const composeDataAsQROnImage = async (
  data: string,
  filePath: string,
  ticketMeta: EventTicketMeta,
): Promise<Sharp> => {
  const image = sharp(filePath);

  const metadata = await image.metadata();

  const getValueFromString = (size: string, refValue: number): number => {
    if (size.includes('%')) {
      const array = size.split('%');
      return Math.round((parseInt(array[0]) / 100) * refValue);
    } else {
      return parseInt(size);
    }
  };

  // Let's resize the qr code to 1/3 the height of the image (or predefined) it's a square image, only need one side
  const new_size = getValueFromString(ticketMeta.qrSize, metadata.height!);

  // if we resize after creating image, it becomes a little blurred out, somehow python does it better
  const imgQr = sharp((await textToQrBuffer(data, { width: new_size })).buffer);

  return image.composite([
    {
      input: await imgQr.resize(new_size, new_size).toBuffer(),
      top: getValueFromString(ticketMeta.qrPosition.y, metadata.height!), // metadata.height! / 2 - new_width / 2,
      left: getValueFromString(ticketMeta.qrPosition.x, metadata.width!), // 200
    },
  ]);
};
