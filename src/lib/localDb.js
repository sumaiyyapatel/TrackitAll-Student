// Local, browser-only data store (localStorage).
// Exposes a small collection/doc/query API
// (collection/doc/query/where/orderBy/limit + CRUD) so pages stay unchanged in shape.

const STORAGE_KEY = 'trackitall-db';

let cache = null;

const load = () => {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    cache = {};
  }
  return cache;
};

const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to save local data:', error);
  }
};

const table = (name) => {
  const data = load();
  if (!data[name]) data[name] = {};
  return data[name];
};

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 20)
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

// Deep copy so callers can't mutate stored records by accident
const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

// Kept for call-site compatibility: `doc(db, ...)`, `collection(db, ...)`
export const db = { type: 'local' };

export const collection = (_db, name) => ({ type: 'collection', name });

export const doc = (_db, name, id) => ({ type: 'doc', collection: name, id });

export const where = (field, op, value) => ({ type: 'where', field, op, value });
export const orderBy = (field, direction = 'asc') => ({ type: 'orderBy', field, direction });
export const limit = (count) => ({ type: 'limit', count });

export const query = (coll, ...constraints) => ({
  type: 'query',
  name: coll.name,
  constraints: [...(coll.constraints || []), ...constraints]
});

// Stored as ISO strings; normalizeDate() already handles those
export const serverTimestamp = () => new Date().toISOString();

const makeDocSnap = (name, id, data) => ({
  id,
  ref: { type: 'doc', collection: name, id },
  exists: () => data !== undefined,
  data: () => clone(data)
});

const matches = (record, { field, op, value }) => {
  const v = record[field];
  switch (op) {
    case '==': return v === value;
    case '!=': return v !== value;
    case '<': return v < value;
    case '<=': return v <= value;
    case '>': return v > value;
    case '>=': return v >= value;
    case 'in': return Array.isArray(value) && value.includes(v);
    case 'array-contains': return Array.isArray(v) && v.includes(value);
    default: throw new Error(`Unsupported where operator: ${op}`);
  }
};

const compare = (a, b) => {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  return a < b ? -1 : 1;
};

export const getDocs = async (q) => {
  const records = table(q.name);
  let rows = Object.entries(records);

  for (const c of q.constraints || []) {
    if (c.type === 'where') rows = rows.filter(([, data]) => matches(data, c));
  }
  const sorts = (q.constraints || []).filter(c => c.type === 'orderBy');
  if (sorts.length) {
    rows.sort(([, a], [, b]) => {
      for (const s of sorts) {
        const r = compare(a[s.field], b[s.field]);
        if (r !== 0) return s.direction === 'desc' ? -r : r;
      }
      return 0;
    });
  }
  const lim = (q.constraints || []).find(c => c.type === 'limit');
  if (lim) rows = rows.slice(0, lim.count);

  const docs = rows.map(([id, data]) => makeDocSnap(q.name, id, data));
  return {
    docs,
    size: docs.length,
    empty: docs.length === 0,
    forEach: (fn) => docs.forEach(fn)
  };
};

export const getDoc = async (ref) => makeDocSnap(ref.collection, ref.id, table(ref.collection)[ref.id]);

export const addDoc = async (coll, data) => {
  const id = newId();
  table(coll.name)[id] = clone(data);
  save();
  return { type: 'doc', collection: coll.name, id };
};

export const setDoc = async (ref, data, options = {}) => {
  const records = table(ref.collection);
  records[ref.id] = options.merge
    ? { ...(records[ref.id] || {}), ...clone(data) }
    : clone(data);
  save();
};

// Apply updates where keys may be dotted paths ('participants.uid.progress' sets a nested field)
const applyUpdates = (target, data) => {
  const result = clone(target) || {};
  Object.entries(clone(data)).forEach(([key, value]) => {
    const path = key.split('.');
    let node = result;
    path.slice(0, -1).forEach(part => {
      if (typeof node[part] !== 'object' || node[part] === null) node[part] = {};
      node = node[part];
    });
    node[path[path.length - 1]] = value;
  });
  return result;
};

export const updateDoc = async (ref, data) => {
  const records = table(ref.collection);
  if (!records[ref.id]) throw new Error(`No document to update: ${ref.collection}/${ref.id}`);
  records[ref.id] = applyUpdates(records[ref.id], data);
  save();
};

export const deleteDoc = async (ref) => {
  delete table(ref.collection)[ref.id];
  save();
};
