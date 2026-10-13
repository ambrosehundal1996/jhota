type Runner = () => Promise<void>;

let runner: Runner | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Registered by the sync engine at startup; keeps state modules free of network imports. */
export function registerSyncRunner(fn: Runner): void {
  runner = fn;
}

export function scheduleSync(delayMs = 600): void {
  if (!runner) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    runner?.().catch(() => undefined);
  }, delayMs);
}
