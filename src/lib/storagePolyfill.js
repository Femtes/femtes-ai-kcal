// storagePolyfill.js
//
// Portion.jsx (kopierad rakt av från Claude-artefakten) anropar
// `window.storage.get/set/delete/list`, en funktion som bara finns
// inuti Claude.ai. Den här filen återskapar samma API med localStorage
// som lagringsplats, så appen fungerar identiskt direkt när du kör den
// lokalt eller på Vercel — helt utan att du behöver ändra i Portion.jsx.
//
// OBS: det här är EN ENHET (webbläsaren), inte ett konto i molnet.
// Data följer alltså inte med om användaren byter enhet/webbläsare.
// Följ README.md i supabase-migration/ för att gradvis flytta varje
// datatyp (måltider, vikt, träning osv.) till riktiga Supabase-tabeller
// via funktionerna i dataAccess.js — då försvinner den här filen helt.

const PREFIX = "femtes:";

function storageKey(key, shared) {
  return `${PREFIX}${shared ? "shared" : "personal"}:${key}`;
}

window.storage = {
  async get(key, shared = false) {
    const raw = localStorage.getItem(storageKey(key, shared));
    if (raw === null) {
      throw new Error(`Key not found: ${key}`);
    }
    return { key, value: raw, shared };
  },

  async set(key, value, shared = false) {
    localStorage.setItem(storageKey(key, shared), value);
    return { key, value, shared };
  },

  async delete(key, shared = false) {
    localStorage.removeItem(storageKey(key, shared));
    return { key, deleted: true, shared };
  },

  async list(prefix = "", shared = false) {
    const fullPrefix = storageKey(prefix, shared);
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(fullPrefix)) {
        keys.push(k.slice(`${PREFIX}${shared ? "shared" : "personal"}:`.length));
      }
    }
    return { keys, prefix, shared };
  },
};
