import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DateTimeService } from '@sanad/database';
import { AllExceptionsFilter, ResponseEnvelopeInterceptor } from '@sanad/util';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { requestContextMiddleware } from './core/middlewares/index.js';
import { loadGatewayEnv } from './env.js';
import { corsOptions, helmetOptions } from './security/helpers/index.js';

/**
 * Every body through this gateway is JSON — media upload is presigned direct-to-R2, so no
 * multipart ever reaches Node. 1 MB is generous headroom over the largest real payload (a
 * bilingual rich-text page) and far below anything abusive; nothing posts a form at all.
 * Nest's own default is 100 kb, which a large page tree would exceed.
 */
const JSON_BODY_LIMIT = '1mb';
const URLENCODED_BODY_LIMIT = '100kb';

/**
 * Gateway entrypoint. Reads + validates env once (fails fast, U19), applies the
 * single response envelope + error filter (N9), enables graceful shutdown so
 * in-flight work drains on rollover (MS8), and serves behind nginx under `/api`.
 * `reflect-metadata` MUST be the first import for Nest DI.
 */
async function bootstrap(): Promise<void> {
  const env = loadGatewayEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const clock = new DateTimeService();

  // FIRST, and before anything reads `req.ip`: it decides which x-forwarded-for entry Express
  // resolves to the client. nginx APPENDS to that header, so without this the leftmost hop —
  // whatever the caller typed — would look like the client, and the rate limiter keyed on it
  // would be bypassable by rotating the header (P8.10.A).
  app.set('trust proxy', env.TRUST_PROXY_HOPS);
  app.disable('x-powered-by');

  // Before the router, so the headers land on 404s and errors too, not only matched routes.
  app.use(helmet(helmetOptions(env)));
  app.enableCors(corsOptions(env));

  app.setGlobalPrefix('api');
  // Opens the request-context scope (ip / user-agent / request id) that `forwardHeaders` and
  // the global rate-limit guard both read, so every downstream RMQ call carries it (P8.8).
  // Express middleware, not a Nest interceptor — an interceptor's `next.handle()` is subscribed
  // after it returns, outside the scope.
  app.use(requestContextMiddleware);

  // AFTER the three above, and the order is load-bearing: `useBodyParser` calls `this.use()`
  // IMMEDIATELY (it does not defer to `init()`), so a parser registered first would short-circuit
  // malformed JSON and 413s to Express's `finalhandler` — an HTML body with no helmet headers and
  // no `X-Request-Id`, i.e. exactly the responses you most want to be able to trace. Nest's own
  // 100 kb parsers still register during `init()`, but `registerParserMiddleware` skips a parser
  // whose function name (`jsonParser`/`urlencodedParser`) is already on the stack, so these
  // replace them rather than stacking.
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.useBodyParser('urlencoded', {
    limit: URLENCODED_BODY_LIMIT,
    extended: true,
  });
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor(clock));
  app.useGlobalFilters(new AllExceptionsFilter(clock));
  app.enableShutdownHooks();

  await app.listen(env.PORT, env.HOST);
}

void bootstrap();
