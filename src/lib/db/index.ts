import SqliteWorker from './sqlite.worker?worker';
import SqliteSharedWorker from './sqlite.shared-worker?sharedworker';
import type { WorkerMsg, WorkerReply, SqlValue } from './sqlite.worker';

type Resolve<T> = (value: T) => void;
type Reject = (reason: unknown) => void;

let router: SharedWorker | null = null;
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

function getRouter(): MessagePort {
	if (router) return router.port;
	if (!('SharedWorker' in globalThis)) {
		const error = new Error('This browser does not support SharedWorker, which Bloom needs for safe SQLite access');
		failAll(error);
		throw error;
	}
	if (!navigator.locks) {
		const error = new Error('This browser does not support Web Locks, which Bloom needs for safe SQLite access');
		failAll(error);
		throw error;
	}

	router = new SqliteSharedWorker();
	router.port.onmessage = ({ data }: MessageEvent<WorkerReply>) => {
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
	router.port.onmessageerror = () => failAll(new Error('SQLite router sent an unreadable message'));
	router.port.start();
	void electLeader(router.port).catch((error) =>
		failAll(error instanceof Error ? error : new Error(String(error)))
	);
	return router.port;
}

async function electLeader(routerPort: MessagePort): Promise<void> {
	while (true) {
		await navigator.locks.request('bloom-sqlite-active-tab', { mode: 'exclusive' }, async () => {
			const dbWorker = new SqliteWorker();
			const channel = new MessageChannel();
			dbWorker.postMessage({ type: 'activate' }, [channel.port1]);
			routerPort.postMessage({ type: 'leader' }, [channel.port2]);

			// The unresolved callback makes this tab the leader for its lifetime. The
			// browser releases the lock automatically when the tab closes or crashes.
			await new Promise<void>((resolve) => {
				dbWorker.onerror = () => {
					dbWorker.terminate();
					resolve();
				};
			});
		});
	}
}

export function openDb(): Promise<void> {
	getRouter();
	return readyPromise;
}

/** Whether the database is backed by OPFS (survives reloads). False = in-memory only. */
export function isPersistent(): boolean {
	return persistent;
}

function send(msg: WorkerMsg): Promise<Record<string, unknown>[] | null> {
	return new Promise((resolve, reject) => {
		pending.set(msg.id, [resolve, reject]);
		getRouter().postMessage(msg);
	});
}

export async function exec(sql: string, bind?: SqlValue[]): Promise<void> {
	await send({ id: nextId++, type: 'exec', sql, bind });
}

export async function query<T extends Record<string, unknown>>(
	sql: string,
	bind?: SqlValue[]
): Promise<T[]> {
	const rows = await send({ id: nextId++, type: 'query', sql, bind });
	return (rows ?? []) as T[];
}
