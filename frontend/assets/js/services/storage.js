import { config } from '../base/config.js';

// Retorna fallback/false se o armazenamento estiver indisponível ou sem espaço.
export const storage = {
  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(config.storagePrefix + key);
      return value === null ? fallback : JSON.parse(value);
    } catch { return fallback; }
  },
  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      if (serialized === undefined) return false;
      localStorage.setItem(config.storagePrefix + key, serialized);
      return true;
    } catch { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(config.storagePrefix + key); return true; }
    catch { return false; }
  },
};
