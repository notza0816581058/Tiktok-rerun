export interface HeartbeatStore { set(key: string, value: string, options: { EX: number }): Promise<unknown> }
export const heartbeatKey = 'livehub:worker:heartbeat';
export async function writeHeartbeat(store: HeartbeatStore, now = new Date()) {
  await store.set(heartbeatKey, now.toISOString(), { EX: 30 });
}
