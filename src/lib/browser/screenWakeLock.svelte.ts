export function useScreenWakeLock(active: () => boolean): void {
  let wakeLock: WakeLockSentinel | undefined;
  let requestId = 0;

  async function requestWakeLock(id: number): Promise<void> {
    if (!("wakeLock" in navigator) || document.visibilityState !== "visible")
      return;

    try {
      const lock = await navigator.wakeLock.request("screen");
      if (id !== requestId) {
        await lock.release();
        return;
      }

      wakeLock = lock;
      lock.addEventListener("release", () => {
        if (wakeLock === lock) wakeLock = undefined;
      });
    } catch {
      // Wake locks are best-effort and may be denied by the browser or OS.
    }
  }

  $effect(() => {
    if (!active()) {
      return;
    }

    const id = ++requestId;
    void requestWakeLock(id);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !wakeLock) {
        void requestWakeLock(id);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      requestId++;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      const lock = wakeLock;
      wakeLock = undefined;
      void lock?.release();
    };
  });
}
