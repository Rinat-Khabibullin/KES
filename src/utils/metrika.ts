export type MetrikaGoal =
  | "chat_open"
  | "chat_message_sent"
  | "avito_click"
  | "photo_estimate_open"
  | "calculator_open"
  | "estimate_first_item"
  | "estimate_discuss"
  | "phone_copy";

type MetrikaParamValue = string | number | boolean | null;

export type MetrikaParams = Record<string, MetrikaParamValue>;

type YandexMetrika = {
  (counterId: number, method: "reachGoal", goal: MetrikaGoal, params?: MetrikaParams): void;
  (counterId: number, method: "hit", url: string, params?: MetrikaParams): void;
};

declare global {
  interface Window {
    ym?: YandexMetrika;
  }
}

const validCounterIdPattern = /^\d+$/;

let lastTrackedHitUrl = "";
let lastCalculatorOpenKey = "";
let lastPhotoEstimateOpenKey = "";

const debug = (message: string, payload?: unknown) => {
  if (!import.meta.env.DEV) {
    return;
  }

  if (payload === undefined) {
    console.debug(`[metrika] ${message}`);
    return;
  }

  console.debug(`[metrika] ${message}`, payload);
};

export const getMetrikaCounterId = () => {
  const rawId = import.meta.env.VITE_YM_ID?.trim();

  if (!rawId || !validCounterIdPattern.test(rawId)) {
    debug("skip: VITE_YM_ID is empty or invalid");
    return null;
  }

  const counterId = Number(rawId);

  if (!Number.isSafeInteger(counterId) || counterId <= 0) {
    debug("skip: VITE_YM_ID is not a positive integer");
    return null;
  }

  return counterId;
};

const getYandexMetrika = () => {
  if (typeof window === "undefined" || typeof window.ym !== "function") {
    debug("skip: window.ym is unavailable");
    return null;
  }

  return window.ym;
};

const sanitizeParams = (params?: Record<string, unknown>): MetrikaParams | undefined => {
  if (!params) {
    return undefined;
  }

  const entries = Object.entries(params).filter(([, value]) => {
    if (value === null || typeof value === "string" || typeof value === "boolean") {
      return true;
    }

    return typeof value === "number" && Number.isFinite(value);
  }) as Array<[string, MetrikaParamValue]>;

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

export const reachGoal = (goal: MetrikaGoal, params?: Record<string, unknown>) => {
  const counterId = getMetrikaCounterId();
  const ym = getYandexMetrika();

  if (!counterId || !ym) {
    return false;
  }

  const safeParams = sanitizeParams(params);

  try {
    ym(counterId, "reachGoal", goal, safeParams);
    debug(`goal: ${goal}`, safeParams);
    return true;
  } catch (error) {
    debug(`goal failed: ${goal}`, error);
    return false;
  }
};

export const trackAvitoClick = () => reachGoal("avito_click");

export const trackPageHit = (url: string) => {
  const counterId = getMetrikaCounterId();
  const ym = getYandexMetrika();

  if (!counterId || !ym || !url || lastTrackedHitUrl === url) {
    return false;
  }

  lastTrackedHitUrl = url;

  try {
    ym(counterId, "hit", url, { title: document.title });
    debug("hit", url);
    return true;
  } catch (error) {
    debug("hit failed", error);
    return false;
  }
};

export const trackCalculatorOpen = (locationKey: string) => {
  if (!locationKey || lastCalculatorOpenKey === locationKey) {
    return false;
  }

  lastCalculatorOpenKey = locationKey;
  return reachGoal("calculator_open");
};

export const trackPhotoEstimateOpen = (locationKey: string) => {
  if (!locationKey || lastPhotoEstimateOpenKey === locationKey) {
    return false;
  }

  lastPhotoEstimateOpenKey = locationKey;
  return reachGoal("photo_estimate_open");
};

const copyWithExecCommand = (text: string) => {
  if (typeof document === "undefined") {
    return false;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "-1000px";
  textArea.style.left = "-1000px";

  document.body.append(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();

  return copied;
};

export const copyPhoneToClipboard = async (phone: string) => {
  const value = phone.trim();

  if (!value || typeof window === "undefined") {
    return false;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      reachGoal("phone_copy");
      return true;
    }

    const copied = copyWithExecCommand(value);

    if (copied) {
      reachGoal("phone_copy");
    }

    return copied;
  } catch (error) {
    debug("phone copy failed", error);
    return false;
  }
};

export const resetMetrikaTrackingStateForTests = () => {
  lastTrackedHitUrl = "";
  lastCalculatorOpenKey = "";
  lastPhotoEstimateOpenKey = "";
};
