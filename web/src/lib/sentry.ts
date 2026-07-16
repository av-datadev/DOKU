import { serverEnv } from './env';

// Dependency-free Sentry capture for the SSR Worker.
//
// Why no SDK: @sentry/cloudflare would wrap the whole Worker entry and add
// weight/cold-start to the payment path. All we actually need is "when a
// request faults, put an event in Sentry so an email alert fires." That's a
// single POST to Sentry's envelope endpoint via fetch — no dependency, no
// build step, identical shape to what the Edge Functions send.
//
// Fire-and-forget: this NEVER throws and NEVER changes the response. Monitoring
// must not be able to break a checkout. Every failure path here is swallowed.
//
// The DSN is a write-only ingest key (same class as a browser Sentry DSN —
// safe to expose); it's read from the SENTRY_DSN Worker var, with the known
// project DSN as a fallback so capture still works before the var is set.
const FALLBACK_DSN =
  'https://c9e59ba11261521cfb64b18666157efb@o4511745144061952.ingest.de.sentry.io/4511745519779920';

interface CaptureOpts {
  locals?: App.Locals;
  request?: Request;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export async function captureError(err: unknown, opts: CaptureOpts = {}): Promise<void> {
  try {
    const dsn = serverEnv(opts.locals, 'SENTRY_DSN') || FALLBACK_DSN;
    const m = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(.+)$/);
    if (!m) return;
    const [, key, host, project] = m;

    const eid = crypto.randomUUID().replace(/-/g, '');
    const now = new Date().toISOString();
    const isErr = err instanceof Error;
    const message = isErr ? err.message : String(err);

    const event = {
      event_id: eid,
      timestamp: now,
      platform: 'javascript',
      level: 'error',
      server_name: 'doku-web',
      environment: 'production',
      transaction: opts.request ? new URL(opts.request.url).pathname : undefined,
      tags: { app: 'doku-web', ...opts.tags },
      extra: { ...opts.extra, ...(isErr && err.stack ? { stack: err.stack } : {}) },
      exception: { values: [{ type: isErr ? err.name : 'Error', value: message }] },
    };

    const body =
      `${JSON.stringify({ event_id: eid, sent_at: now })}\n` +
      `${JSON.stringify({ type: 'event' })}\n` +
      `${JSON.stringify(event)}\n`;

    await fetch(`https://${host}/api/${project}/envelope/?sentry_key=${key}&sentry_version=7`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      body,
    });
  } catch {
    /* monitoring must never break the request */
  }
}
