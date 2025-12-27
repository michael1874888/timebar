// localStorage 封裝
export const Storage = {
  save(key: string, data: any): boolean {
    try {
      localStorage.setItem(`timebar_${key}`, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  },

  load<T>(key: string, def?: T): T | null {
    try {
      const d = localStorage.getItem(`timebar_${key}`);
      return d ? JSON.parse(d) : (def ?? null);
    } catch {
      return def ?? null;
    }
  },

  clear(): void {
    Object.keys(localStorage)
      .filter(k => k.startsWith('timebar_'))
      .forEach(k => localStorage.removeItem(k));
  },
};
