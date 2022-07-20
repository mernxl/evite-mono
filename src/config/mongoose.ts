import { NODE_ENV } from '@xelgrp/configu';
import type { MongoMemoryReplSet } from 'mongodb-memory-server';
import type { MongoMemoryReplSetOpts } from 'mongodb-memory-server-core/lib/MongoMemoryReplSet';
import mongoose, { Connection, ConnectOptions } from 'mongoose';

import { config } from './config';
import { wLogger } from './winston';

const DB_ENV =
  config.NODE_ENV === NODE_ENV.PRODUCTION
    ? ''
    : config.NODE_ENV === NODE_ENV.DEVELOPMENT
    ? 'dev'
    : config.NODE_ENV;

const isDBProtected = (opts: CreateMongooseConnectionOptions) => opts.password && opts.username;

export interface CreateMongooseConnectionOptions {
  host?: string;
  port?: string;

  // full mongoUri to use
  uri?: string;
  dbName?: string | null;

  username?: string | null;
  password?: string | null;
}

const MemServers: MongoMemoryReplSet[] = [];

/**
 * Stop all MemServers and all the mongoose connections as well
 */
export const cleanMongooseConnections = async (): Promise<void> => {
  await mongoose.disconnect();

  const promises = [];
  for (const server of MemServers) {
    promises.push(server.stop());
  }

  await Promise.all(promises);

  return;
};

export function createMongooseConnection(
  moduleName: string,
  options?: CreateMongooseConnectionOptions,
): Connection {
  const opts: CreateMongooseConnectionOptions = {
    uri: config.mongodb.uri,
    host: config.mongodb.host,
    port: String(config.mongodb.port),
    username: config.mongodb.user,
    password: config.mongodb.pass,
    ...options,
  };

  const MONGODB_URI = opts.uri ? opts.uri : `mongodb://${opts.host}:${opts.port}`;

  // auth options
  const connectOptions: ConnectOptions = {};

  if (!config.MONGODB_USE_IN_MEMORY_DB && isDBProtected(opts)) {
    connectOptions.user = opts.username!;
    connectOptions.pass = opts.password!;
  }

  connectOptions.dbName = opts.dbName ? opts.dbName : `${moduleName}${DB_ENV ? '_' + DB_ENV : ''}`;

  // on production, autoIndexes are not set
  // connectionOptions.autoIndex = config.NODE_ENV !== NODE_ENV.PRODUCTION;
  connectOptions.autoIndex = true;

  let connection: Connection;
  if (config.MONGODB_USE_IN_MEMORY_DB) {
    connection = mongoose.createConnection();

    // since we use Transactions (retryableWrites)
    // We can only deploy to replica sets with a primary having wiredTiger storage engine
    // @see https://docs.mongodb.com/manual/core/inmemory/#transactions
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const MemSever = require('mongodb-memory-server');

    const options: Partial<MongoMemoryReplSetOpts> = {
      replSet: { storageEngine: 'wiredTiger' },
    };
    const server: MongoMemoryReplSet = new MemSever.MongoMemoryReplSet(options);

    server
      .start()
      .then(() => server.waitUntilRunning())
      .then(() => server.getUri(connectOptions.dbName))
      .then((mongoUri) => connection.openUri(mongoUri, connectOptions))
      .catch((error) => wLogger.error(error));

    MemServers.push(server);
  } else {
    connection = mongoose.createConnection(MONGODB_URI, connectOptions);
  }

  connection.on('error', (error: string) => wLogger.error(error, `Module [${moduleName}]`));

  return connection;
}

export const waitForOpenConnection = async (connection: Connection): Promise<Connection> => {
  if (connection.readyState === mongoose.STATES.connected) {
    return connection;
  }

  return new Promise<Connection>((resolve, reject) => {
    let called = false;
    connection.on('open', () => {
      if (!called) {
        resolve(connection);
      }
      called = true;
    });
    connection.on('error', (err) => {
      if (!called) {
        reject(err);
      }
      called = true;
    });
  });
};

export const createMongooseTestConnection = (
  moduleName = config.mongodb.defaultDb,
  options?: CreateMongooseConnectionOptions,
): Promise<Connection> => {
  const connection = createMongooseConnection(moduleName, options);

  return waitForOpenConnection(connection);
};

const dbConnection = createMongooseConnection(config.mongodb.defaultDb);

export default dbConnection;
