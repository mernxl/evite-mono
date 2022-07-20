import { NODE_ENV } from '@xelgrp/configu';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPPool from 'nodemailer/lib/smtp-pool';

import { config } from './config';
import { wLogger } from './winston';

export const createMailTransport = (configOptions: SMTPPool.Options): Mail => {
  const options: SMTPPool.Options = {
    secure: true, // use TLS
    port: config.mailer.port,
    host: config.mailer.host,

    auth: {
      pass: config.mailer.pass,
      user: config.mailer.user,
    },
    debug: config.NODE_ENV === NODE_ENV.DEVELOPMENT,
    logger: wLogger as any, // https://github.com/trentm/node-bunyan#levels compatible
    ...configOptions,
  };

  return nodemailer.createTransport(options);
};

const mailer = createMailTransport({ pool: true });

export { mailer };
