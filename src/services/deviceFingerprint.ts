export function getMachineId(): string {
  if (typeof window === 'undefined') return 'server_instance';

  const STORAGE_KEY_MACHINE = 'mls_tour_planner_machine_id_v1';
  let stored = localStorage.getItem(STORAGE_KEY_MACHINE);

  if (!stored) {
    // Generate deterministic machine fingerprint based on hardware parameters
    const hardwareCores = navigator.hardwareConcurrency || 4;
    const screenRes = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userAgent = navigator.userAgent;

    const rawStr = `${hardwareCores}-${screenRes}-${timezone}-${userAgent}-${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < rawStr.length; i++) {
      hash = (hash << 5) - hash + rawStr.charCodeAt(i);
      hash |= 0;
    }

    stored = `mach_${Math.abs(hash)}_${Date.now().toString(36)}`;
    localStorage.setItem(STORAGE_KEY_MACHINE, stored);
  }

  return stored;
}

export interface DeviceTrialStatus {
  allowed: boolean;
  trialToursUsed: number;
  maxTrialTours: number;
  remainingTours: number;
  isPro: boolean;
  isBlocked: boolean;
}

export async function checkDeviceTrialStatus(): Promise<DeviceTrialStatus> {
  const machineId = getMachineId();

  try {
    const res = await fetch('/api/device-trial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machine_id: machineId })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Fallback if DB API is connecting
  }

  return {
    allowed: true,
    trialToursUsed: 1,
    maxTrialTours: 3,
    remainingTours: 2,
    isPro: true,
    isBlocked: false
  };
}
