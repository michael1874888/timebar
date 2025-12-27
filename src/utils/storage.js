// localStorage 封裝
export const Storage = {
  save(key, data) {
    try {
      localStorage.setItem(`timebar_${key}`, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  },

  load(key, def = null) {
    try {
      const d = localStorage.getItem(`timebar_${key}`);
      return d ? JSON.parse(d) : def;
    } catch {
      return def;
    }
  },

  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('timebar_'))
      .forEach(k => localStorage.removeItem(k));
  },
};
