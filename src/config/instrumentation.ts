import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { awsEcsDetector } from '@opentelemetry/resource-detector-aws';
import { containerDetector } from '@opentelemetry/resource-detector-container';
import {
  envDetector,
  hostDetector,
  osDetector,
  processDetector,
  Resource,
} from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import process from 'process';

import { config } from './config';

// configure the SDK to export telemetry data to the console
// enable all auto-instrumentations from the meta package
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: config.app.name,
    [SemanticResourceAttributes.SERVICE_VERSION]: config.app.version,
  }),
  //traceExporter: new ConsoleSpanExporter(),
  traceExporter: new OTLPTraceExporter({
    // optional - default url is http://localhost:4318/v1/traces
    url: `${config.NEW_RELIC_OTEL_ENDPOINT}/v1/traces`,
    // optional - collection of custom headers to be sent with each request, empty by default
    headers: {
      'api-key': config.NEW_RELIC_API_KEY,
    },
  }),
  metricReader: new PeriodicExportingMetricReader({
    // exporter: new ConsoleMetricExporter(),
    exporter: new OTLPMetricExporter({
      url: `${config.NEW_RELIC_OTEL_ENDPOINT}/v1/metrics`, // url is optional and can be omitted - default is http://localhost:4318/v1/metrics
      headers: {
        'api-key': config.NEW_RELIC_API_KEY,
      },
    }),
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingRequestHook: (request) => {
          return Boolean(request.url?.endsWith('/health')); // skip health check endpoints to avoid polluting data
        },
      },
      // only instrument fs if it is part of another trace
      '@opentelemetry/instrumentation-fs': {
        requireParentSpan: true,
      },
    }),
  ],
  resourceDetectors: [
    hostDetector,
    processDetector,
    envDetector,
    osDetector,
    containerDetector,
    awsEcsDetector,
  ],
});

// initialize the SDK and register with the OpenTelemetry API
// this enables the API to record telemetry
sdk.start();

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error: any) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
