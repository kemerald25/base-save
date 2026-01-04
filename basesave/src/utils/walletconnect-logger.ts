'use client';

const LEVEL_VALUES = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
} as const;

type Level = keyof typeof LEVEL_VALUES;

type LoggerOptions = {
  level?: Level;
};

type LoggerFactoryOptions = {
  opts?: LoggerOptions;
  maxSizeInBytes?: number;
  loggerOverride?: SimpleLogger;
};

const CONTEXT_SYMBOL = Symbol('wcLoggerContext');

export const levels = { values: LEVEL_VALUES };
export const PINO_LOGGER_DEFAULTS: LoggerOptions = { level: 'info' };
export const PINO_CUSTOM_CONTEXT_KEY = 'custom_context';
export const MAX_LOG_SIZE_IN_BYTES_DEFAULT = 1000 * 1024;

const levelToConsole: Record<Level | 'fatal', keyof Console> = {
  fatal: 'error',
  error: 'error',
  warn: 'warn',
  info: 'info',
  debug: 'debug',
  trace: 'debug',
};

const safeStringify = (value: unknown) => {
  try {
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    return String(value);
  }
};

class InMemoryLogBuffer {
  private logs: string[] = [];
  private currentSize = 0;

  constructor(private readonly maxSize = MAX_LOG_SIZE_IN_BYTES_DEFAULT) {}

  append(entry: string) {
    this.logs.push(entry);
    this.currentSize += entry.length;

    while (this.currentSize > this.maxSize && this.logs.length) {
      const removed = this.logs.shift();
      this.currentSize -= removed?.length ?? 0;
    }
  }

  toArray() {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.currentSize = 0;
  }
}

export class ChunkLoggerController {
  private buffer: InMemoryLogBuffer;

  constructor(public level: Level = 'info', maxSizeInBytes = MAX_LOG_SIZE_IN_BYTES_DEFAULT) {
    this.buffer = new InMemoryLogBuffer(maxSizeInBytes);
  }

  private record(entry: string) {
    this.buffer.append(
      safeStringify({
        timestamp: new Date().toISOString(),
        entry,
      })
    );
  }

  write(entry: string) {
    this.record(entry);
  }

  appendToLogs(entry: string) {
    this.record(entry);
  }

  getLogs() {
    return this.buffer.toArray();
  }

  clearLogs() {
    this.buffer.clear();
  }

  getLogArray() {
    return this.getLogs();
  }

  logsToBlob(extra?: Record<string, unknown>) {
    if (typeof Blob === 'undefined') {
      return null;
    }

    const payload = this.getLogArray();
    if (extra) {
      payload.push(safeStringify({ extraMetadata: extra }));
    }

    return new Blob(payload, { type: 'application/json' });
  }

  downloadLogsBlobInBrowser(extra?: Record<string, unknown>) {
    if (typeof window === 'undefined') return;
    const blob = this.logsToBlob(extra);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'walletconnect-logs-' + new Date().toISOString() + '.txt';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}

class SimpleLogger {
  level: Level;
  bindings: Record<string, unknown>;

  constructor(private opts: LoggerOptions = {}, bindings: Record<string, unknown> = {}, private chunk?: ChunkLoggerController | null) {
    this.level = (opts?.level as Level) ?? PINO_LOGGER_DEFAULTS.level!;
    this.bindings = { ...bindings };
  }

  private log(level: Level, args: unknown[]) {
    const consoleMethod = levelToConsole[level] ?? 'log';
    const contextValue = getLoggerContext(this);
    const payload = contextValue ? ['[' + contextValue + ']', ...args] : args;
    const consoleTarget = (console as unknown as Record<string, unknown>)[consoleMethod];
    const loggerFn =
      typeof consoleTarget === 'function'
        ? (consoleTarget as (...loggerArgs: unknown[]) => void).bind(console)
        : console.log.bind(console);
    loggerFn(...payload);

    if (this.chunk) {
      this.chunk.write(
        safeStringify({
          level: LEVEL_VALUES[level],
          context: contextValue,
          message: payload.map(safeStringify).join(' '),
        })
      );
    }
  }

  fatal(...args: unknown[]) {
    this.log('fatal', args);
  }

  error(...args: unknown[]) {
    this.log('error', args);
  }

  warn(...args: unknown[]) {
    this.log('warn', args);
  }

  info(...args: unknown[]) {
    this.log('info', args);
  }

  debug(...args: unknown[]) {
    this.log('debug', args);
  }

  trace(...args: unknown[]) {
    this.log('trace', args);
  }

  child(bindings: Record<string, unknown> = {}) {
    return new SimpleLogger(this.opts, { ...this.bindings, ...bindings }, this.chunk);
  }
}

function ensureContextStore(logger: SimpleLogger) {
  if (!(logger as any)[CONTEXT_SYMBOL]) {
    (logger as any)[CONTEXT_SYMBOL] = {};
  }
  return (logger as any)[CONTEXT_SYMBOL] as Record<string, string>;
}

export function setLoggerContext(logger: SimpleLogger, value: string, key = PINO_CUSTOM_CONTEXT_KEY) {
  const store = ensureContextStore(logger);
  store[key] = value;
  logger.bindings[key] = value;
}

export function getLoggerContext(logger: SimpleLogger, key = PINO_CUSTOM_CONTEXT_KEY) {
  return ((logger as any)[CONTEXT_SYMBOL]?.[key] as string) ?? '';
}

export function formatChildLoggerContext(bindings: Record<string, unknown> | string | undefined, childName: string, key = PINO_CUSTOM_CONTEXT_KEY) {
  const base =
    typeof bindings === 'string'
      ? bindings
      : typeof bindings === 'object' && bindings !== null
        ? (bindings as Record<string, unknown>)[key]
        : '';
  return base ? base + '/' + childName : childName;
}

function createLogger(opts?: LoggerOptions, chunk?: ChunkLoggerController | null) {
  const logger = new SimpleLogger(opts, {}, chunk ?? undefined);
  if (opts?.level) {
    logger.level = opts.level;
  }
  return logger;
}

export function getDefaultLoggerOptions<T extends LoggerOptions>(opts?: T) {
  return opts ?? ({ ...PINO_LOGGER_DEFAULTS } as T);
}

export function generateClientLogger(options: LoggerFactoryOptions = {}) {
  const chunkLoggerController = new ChunkLoggerController(options?.opts?.level, options?.maxSizeInBytes);
  const logger = createLogger(options?.opts, chunkLoggerController);
  return { logger, chunkLoggerController };
}

export function generateServerLogger(options: LoggerFactoryOptions = {}) {
  return generateClientLogger(options);
}

export function generatePlatformLogger(options: LoggerFactoryOptions = {}) {
  if (options.loggerOverride && typeof options.loggerOverride !== 'string') {
    return { logger: options.loggerOverride, chunkLoggerController: null };
  }
  return typeof window === 'undefined' ? generateServerLogger(options) : generateClientLogger(options);
}

export function generateChildLogger(logger: SimpleLogger, childName: string, key = PINO_CUSTOM_CONTEXT_KEY) {
  const contextValue = formatChildLoggerContext(logger.bindings ?? { [key]: getLoggerContext(logger, key) }, childName, key);
  const child = logger.child({ [key]: contextValue });
  setLoggerContext(child, contextValue, key);
  return child;
}

export function pino(opts?: LoggerOptions) {
  const logger = createLogger(opts);
  return logger;
}

(pino as any).levels = levels;
(pino as any).pino = pino;

export default pino;
