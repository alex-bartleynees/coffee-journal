import SqliteWorker from './sqlite.worker?worker';
import type { WorkerMsg, WorkerReply } from './sqlite.worker';

type Resolve<T> = (value: T) => void;
type Reject = (reason: unknown) => void;

let worker: Worker | null = null;
let nextId = 0;
let persistent = false;
const pending = new Map<number, [Resolve<Record<string, unknown>[] | null>, Reject]>();
let readyResolve: Resolve<void> | null = null;
let readyReject: Reject | null = null;
const readyPromise = new Promise<void>((resolve, reject) => {
	readyResolve = resolve;
	readyReject = reject;
});

function failAll(err: Error): void {
	readyReject?.(err);
	for (const [, reject] of pending.values()) reject(err);
	pending.clear();
}

function getWorker(): Worker {
	if (worker) return worker;
	worker = new SqliteWorker();
	worker.onmessage = ({ data }: MessageEvent<WorkerReply>) => {
		if ('type' in data && data.type === 'ready') {
			if (data.error) {
				readyReject?.(new Error(data.error));
			} else {
				persistent = data.hasOpfs;
				readyResolve?.();
			}
			return;
		}
		const handlers = pending.get(data.id);
		if (!handlers) return;
		pending.delete(data.id);
		if ('error' in data) {
			handlers[1](new Error(data.error as string));
		} else if ('result' in data) {
			handlers[0](data.result);
		}
	};
	worker.onerror = (e) => failAll(new Error(`SQLite worker crashed: ${e.message}`));
	return worker;
}

export function openDb(): Promise<void> {
	getWorker();
	return readyPromise;
}

/** Whether the database is backed by OPFS (survives reloads). False = in-memory only. */
export function isPersistent(): boolean {
	return persistent;
}

function send(msg: WorkerMsg): Promise<Record<string, unknown>[] | null> {
	return new Promise((resolve, reject) => {
		pending.set(msg.id, [resolve, reject]);
		getWorker().postMessage(msg);
	});
}

export async function exec(sql: string, bind?: (string | number | null)[]): Promise<void> {
	await send({ id: nextId++, type: 'exec', sql, bind });
}

export async function query<T extends Record<string, unknown>>(
	sql: string,
	bind?: (string | number | null)[]
): Promise<T[]> {
	const rows = await send({ id: nextId++, type: 'query', sql, bind });
	return (rows ?? []) as T[];
}
