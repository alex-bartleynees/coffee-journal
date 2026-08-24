/// <reference lib="webworker" />
import type { WorkerMsg, WorkerReply } from './sqlite.worker';

type RoutedRequest = {
	client: MessagePort;
	originalId: number;
	message: WorkerMsg;
};

const clients = new Set<MessagePort>();
const queued: RoutedRequest[] = [];
const inFlight = new Map<number, RoutedRequest>();
let activeWorker: MessagePort | null = null;
let activeGeneration = 0;
let nextRouteId = 0;
let ready: Extract<WorkerReply, { type: 'ready' }> | null = null;

function sendToWorker(request: RoutedRequest): void {
	if (!activeWorker || !ready || ready.error) {
		queued.push(request);
		return;
	}
	const routeId = nextRouteId++;
	inFlight.set(routeId, request);
	activeWorker.postMessage({ ...request.message, id: routeId } satisfies WorkerMsg);
}

function flushQueue(): void {
	for (const request of queued.splice(0)) sendToWorker(request);
}

function failInFlight(message: string): void {
	for (const { client, originalId } of inFlight.values()) {
		client.postMessage({ id: originalId, error: message } satisfies WorkerReply);
	}
	inFlight.clear();
}

function attachActiveWorker(port: MessagePort): void {
	activeGeneration += 1;
	const generation = activeGeneration;
	activeWorker?.close();
	activeWorker = port;
	ready = null;
	failInFlight('The active database tab changed while the operation was running; please retry');

	port.onmessage = ({ data }: MessageEvent<WorkerReply>) => {
		if (generation !== activeGeneration) return;
		if ('type' in data && data.type === 'ready') {
			ready = data;
			for (const client of clients) client.postMessage(data);
			if (!data.error) flushQueue();
			return;
		}

		const request = inFlight.get(data.id);
		if (!request) return;
		inFlight.delete(data.id);
		if ('result' in data) {
			request.client.postMessage({ id: request.originalId, result: data.result } satisfies WorkerReply);
		} else if ('error' in data && typeof data.error === 'string') {
			request.client.postMessage({ id: request.originalId, error: data.error } satisfies WorkerReply);
		}
	};
	port.start();
}

(self as unknown as SharedWorkerGlobalScope).onconnect = ({ ports }: MessageEvent) => {
	const client = ports[0];
	clients.add(client);
	client.onmessage = ({ data, ports: transferred }: MessageEvent<WorkerMsg | { type: 'leader' }>) => {
		if (data.type === 'leader') {
			if (transferred[0]) attachActiveWorker(transferred[0]);
			return;
		}
		sendToWorker({ client, originalId: data.id, message: data });
	};
	client.onmessageerror = () => clients.delete(client);
	client.start();
	if (ready) client.postMessage(ready);
};
