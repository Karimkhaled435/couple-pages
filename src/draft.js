// حفظ المسودة على جهاز المستخدم: النصوص في localStorage والصور في IndexedDB.
// كده لو النت فصل أو الصفحة اتقفلت أو اتعمل Refresh، مفيش حاجة بتضيع.
const TEXT_KEY = "couplepages:draft:v2";
const DB_NAME = "couplepages-draft";
const STORE = "kv";

export function loadDraft() {
  try {
    const raw = localStorage.getItem(TEXT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d && typeof d === "object" ? d : null;
  } catch { return null; }
}

export function saveDraft(data) {
  try { localStorage.setItem(TEXT_KEY, JSON.stringify(data)); return true; }
  catch { return false; }
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no indexedDB"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(mode, fn) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req?.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

export async function saveImages(images) {
  try { await withStore("readwrite", (s) => s.put(images, "images")); return true; }
  catch { return false; }
}

export async function loadImages() {
  try {
    const v = await withStore("readonly", (s) => s.get("images"));
    return Array.isArray(v) ? v : null;
  } catch { return null; }
}

export async function clearDraft() {
  try { localStorage.removeItem(TEXT_KEY); } catch { /* ignore */ }
  try { await withStore("readwrite", (s) => s.delete("images")); } catch { /* ignore */ }
}
