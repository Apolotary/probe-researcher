import { startWebServer } from '../web/server.js';

interface WebCommandOptions {
  port?: string;
  host?: string;
  noOpen?: boolean;
}

export async function webCommand(opts: WebCommandOptions): Promise<void> {
  const port = opts.port ? parseInt(opts.port, 10) : 4470;
  await startWebServer({
    port: Number.isFinite(port) ? port : 4470,
    host: opts.host ?? '127.0.0.1',
    open: opts.noOpen !== true,
  });
}
