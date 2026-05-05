// Layered device identity:
//   - browserInstanceId  : random UUID kept in localStorage. Identifies THIS
//                          browser install on this OS user. Easy to lose
//                          (cleared by "Clear site data", lost in incognito).
//   - deviceFingerprint  : stable hash from FingerprintJS (visitorId). Same
//                          value across browsers/incognito on the same physical
//                          machine. Survives storage clears. The PRIMARY signal
//                          the backend matches against.
//   - dvid cookie        : an HttpOnly cookie issued by the backend on first
//                          successful login. Owned by the server; not exposed
//                          here.
//
// The legacy `getDeviceId()` export is kept for backward compatibility and
// returns the per-browser localStorage UUID.

import FingerprintJS from "@fingerprintjs/fingerprintjs";

const BROWSER_INSTANCE_KEY = "browserInstanceId";
const LEGACY_DEVICE_KEYS = ["deviceId", "deviceIdentifier"];

const safeStorage = () => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }
  return window.localStorage;
};

const generateUuid = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`;
};

// Stable per-browser UUID. Migrates older `deviceId` / `deviceIdentifier`
// keys into the new key so existing devices are not orphaned.
export const getBrowserInstanceId = () => {
  const storage = safeStorage();
  if (!storage) return "";

  let id = storage.getItem(BROWSER_INSTANCE_KEY);
  if (!id) {
    for (const legacyKey of LEGACY_DEVICE_KEYS) {
      const legacy = storage.getItem(legacyKey);
      if (legacy) {
        id = legacy;
        break;
      }
    }
  }
  if (!id) {
    id = `bi_${generateUuid().slice(0, 28)}`;
  }

  storage.setItem(BROWSER_INSTANCE_KEY, id);
  // keep the legacy keys in sync so any other code still reading them works
  for (const legacyKey of LEGACY_DEVICE_KEYS) {
    storage.setItem(legacyKey, id);
  }
  return id;
};

let fingerprintAgentPromise = null;
let cachedFingerprint = null;

const ensureFingerprintAgent = () => {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }
  if (!fingerprintAgentPromise) {
    fingerprintAgentPromise = FingerprintJS.load();
  }
  return fingerprintAgentPromise;
};

// Returns the stable visitorId hash (~80–95% accurate). Resolves to "" on
// the server or if the agent fails to load (network blocked, very old browser).
export const getDeviceFingerprint = async () => {
  if (cachedFingerprint) return cachedFingerprint;
  try {
    const agent = await ensureFingerprintAgent();
    if (!agent) return "";
    const result = await agent.get();
    cachedFingerprint = result?.visitorId || "";
    return cachedFingerprint;
  } catch {
    return "";
  }
};

// One-call helper that returns every identifier the backend understands.
// Use this for any request where the backend needs to identify the device
// (login, 2FA verify, rename device, etc.).
export const getDeviceIdentity = async () => {
  const browserInstanceId = getBrowserInstanceId();
  const deviceFingerprint = await getDeviceFingerprint();
  return {
    browserInstanceId,
    deviceFingerprint,
    // Kept for backward compatibility with older endpoints that still expect
    // a single `DeviceIdentifier` / `DeviceId` field. Prefer the fingerprint
    // when present so the value is stable across browsers on the same machine.
    deviceIdentifier: deviceFingerprint || browserInstanceId,
  };
};

// Adds the standard device-identity headers to a fetch headers object.
// Pass the result of `await getDeviceIdentity()`.
export const buildDeviceHeaders = (identity) => {
  if (!identity) return {};
  const headers = {};
  if (identity.deviceFingerprint) {
    headers["X-Device-Fingerprint"] = identity.deviceFingerprint;
  }
  if (identity.browserInstanceId) {
    headers["X-Browser-Instance-Id"] = identity.browserInstanceId;
  }
  if (identity.deviceIdentifier) {
    headers["X-Device-Identifier"] = identity.deviceIdentifier;
    headers["X-Device-Id"] = identity.deviceIdentifier;
  }
  return headers;
};

// Backward-compatible synchronous accessor used by older callers that still
// expect a single string. Returns the per-browser localStorage UUID.
export const getDeviceId = () => getBrowserInstanceId();

export const formatDeviceIdForDisplay = (value) => {
  if (value === null || value === undefined) {
    return "N/A";
  }
  const stringValue = String(value).trim();
  if (!stringValue) {
    return "N/A";
  }
  return stringValue;
};

export const resolveDeviceDisplayId = (device, fallbackCurrentDeviceId = "") => {
  if (!device) {
    return "N/A";
  }

  const candidate =
    device.deviceFingerprint ||
    device.deviceIdentifier ||
    device.browserInstanceId ||
    device.deviceId ||
    (device.isCurrentDevice ? fallbackCurrentDeviceId : "") ||
    device.id;

  return formatDeviceIdForDisplay(candidate);
};

export default getDeviceId;
