import cluster from 'cluster';

import { config } from './config';
import { app } from './config/express';

const runInCluster = false;
const listen = () => {
  // Bind to a port
  app.listen(config.SERVER_PORT, config.SERVER_HOST, () => {
    // eslint-disable-next-line no-console
    console.log(
      `🚀 Server started on http://${config.SERVER_HOST}:${config.SERVER_PORT} (${config.NODE_ENV})`,
    );
  });
};

// Code to run if we're in the master process
if (cluster.isPrimary && runInCluster) {
  // Count the machine's CPUs
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cpuCount = require('os').cpus().length;

  // Create a worker for each CPU
  for (let i = 0; i < cpuCount; i += 1) {
    cluster.fork();
  }

  // Code to run if we're in a worker process
} else {
  listen();
}
