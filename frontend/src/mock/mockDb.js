// ============================================================================
// PRAGATI-RAIL — Stateful Mock Database (localStorage-backed)
// ----------------------------------------------------------------------------
// Provides a single, persistent "source of truth" for every mock endpoint so
// that CRUD actions (approve a block, submit a defect, send to planning...)
// have REAL, visible side-effects across pages — exactly like a live backend
// talking to MongoDB would, but 100% offline.
// ============================================================================

import {
  ZONES,
  DIVISIONS_BY_ZONE,
  TMS_DEFECTS,
  SMMS_DEFECTS,
  TDMS_DEFECTS,
  SYSTEM_ALERTS,
  SYSTEM_STATS
} from './apiData';

const DB_KEY = 'pragati_rail_mock_db_v1';
const DB_VERSION = 1;

// ---------------------------------------------------------------------------
// Seed builders
// ---------------------------------------------------------------------------
function cloneSeed(arr) {
  return JSON.parse(JSON.stringify(arr || []));
}

function buildInitialState() {
  const tms = cloneSeed(TMS_DEFECTS);
  const smms = cloneSeed(SMMS_DEFECTS);
  const tdms = cloneSeed(TDMS_DEFECTS);

  // Normalize a common shape across all three departments so the rest of the
  // mock layer can treat them uniformly.
  const normalize = (dept, arr) =>
    arr.map((d, idx) => ({
      status: 'Open',
      severityScore: d.severityScore ?? 70,
      urgencyScore: d.urgencyScore ?? 65,
      assetImpactScore: d.assetImpactScore ?? 60,
      trainImpactScore: d.trainImpactScore ?? 55,
      overdueDaysScore: d.overdueDaysScore ?? 40,
      department: dept,
      id: d.id || `${dept}-${1000 + idx}`,
      ...d,
      sentToBlockPlanning: !!d.sentToBlockPlanning
    }));

  const defects = {
    TMS: normalize('TMS', tms),
    SMMS: normalize('SMMS', smms),
    TDMS: normalize('TDMS', tdms)
  };

  // A handful of defects start life already sent to block planning so the
  // BDMS / AI screens aren't empty on first load.
  const blockRequests = [];
  ['TMS', 'SMMS', 'TDMS'].forEach((dept) => {
    defects[dept].slice(0, 3).forEach((d, i) => {
      d.sentToBlockPlanning = true;
      blockRequests.push(makeBlockRequestFromDefect(d, dept, i));
    });
  });

  return {
    __version: DB_VERSION,
    seededAt: new Date().toISOString(),
    zones: ZONES,
    divisionsByZone: DIVISIONS_BY_ZONE,
    defects,
    blockRequests,
    alerts: cloneSeed(SYSTEM_ALERTS),
    systemStats: { ...SYSTEM_STATS },
    idCounters: { block: blockRequests.length + 1, defect: 900 }
  };
}

function makeBlockRequestFromDefect(defect, dept, seedIdx = 0) {
  const priorityScore = computeStoredPriority(defect);
  const hour = 1 + ((seedIdx * 3) % 4);
  const durationHours = defect.severity === 'Critical' ? 6 : defect.severity === 'High' ? 4 : 3;
  return {
    _id: `BLK-${dept}-${defect.id}`,
    blockId: `BLK-${dept}-${defect.id}`,
    sourceDefectId: defect.id,
    department: dept,
    deptLabel: dept === 'TMS' ? 'Engineering (Track)' : dept === 'SMMS' ? 'Signal & Telecom' : 'Traction (OHE)',
    defectType: defect.defectType || defect.category || `${dept} Maintenance Work`,
    location: defect.location || defect.section || 'Section Unspecified',
    section: defect.section || defect.location,
    zone: defect.zone || 'NR',
    division: defect.division || 'DLI',
    date: defect.recommendedDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    startTime: `0${hour}:00`,
    endTime: `0${hour + durationHours}:00`,
    durationHours,
    priorityScore,
    severityScore: defect.severityScore ?? 70,
    urgencyScore: defect.urgencyScore ?? 65,
    assetImpactScore: defect.assetImpactScore ?? 60,
    trainImpactScore: defect.trainImpactScore ?? 55,
    overdueDaysScore: defect.overdueDaysScore ?? 40,
    status: 'Pending Review',
    isJointBlock: false,
    approvedBy: null,
    aiReasoning: `AI Priority Engine scored this ${dept} possession at ${priorityScore.toFixed(1)}/100 based on severity, traffic density (GMT) and historic failure trend for this asset.`,
    justification: `Recommended possession window optimised for lowest passenger-train disruption on ${defect.location || defect.section || 'this corridor'}.`,
    createdAt: new Date().toISOString()
  };
}

function computeStoredPriority(d) {
  const s = d.severityScore ?? 70;
  const u = d.urgencyScore ?? 65;
  const a = d.assetImpactScore ?? 60;
  const t = d.trainImpactScore ?? 55;
  const o = d.overdueDaysScore ?? 40;
  return s * 0.35 + u * 0.25 + a * 0.2 + t * 0.12 + o * 0.08;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
let cache = null;

function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.__version === DB_VERSION) {
        cache = parsed;
        return cache;
      }
    }
  } catch (e) {
    console.warn('[mockDb] Failed to parse persisted state, reseeding.', e);
  }
  cache = buildInitialState();
  persist();
  return cache;
}

function persist() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('[mockDb] Failed to persist state to localStorage', e);
  }
}

export function resetDemoData() {
  cache = buildInitialState();
  persist();
  return cache;
}

// ---------------------------------------------------------------------------
// Public accessors used by the mock adapter
// ---------------------------------------------------------------------------
export const mockDb = {
  state() {
    return load();
  },

  getDefects(dept) {
    const db = load();
    if (!dept || dept === 'ALL') {
      return [...db.defects.TMS, ...db.defects.SMMS, ...db.defects.TDMS];
    }
    return db.defects[dept.toUpperCase()] || [];
  },

  addDefect(dept, defect) {
    const db = load();
    const d = dept.toUpperCase();
    if (!db.defects[d]) db.defects[d] = [];
    const newId = `${d}-${db.idCounters.defect++}`;
    const record = { id: newId, department: d, status: 'Open', sentToBlockPlanning: false, ...defect };
    db.defects[d].unshift(record);
    persist();
    return record;
  },

  markDefectSent(dept, defectId, extra = {}) {
    const db = load();
    const d = dept.toUpperCase();
    const list = db.defects[d] || [];
    const found = list.find((x) => String(x.id) === String(defectId));
    if (found) {
      found.sentToBlockPlanning = true;
      found.status = 'Sent to Block Planning';
      Object.assign(found, extra);
    }
    persist();
    return found;
  },

  getBlockRequests(filter = {}) {
    const db = load();
    let list = [...db.blockRequests];
    if (filter.division && filter.division !== 'ALL') {
      list = list.filter((b) => b.division === filter.division);
    }
    if (filter.zone && filter.zone !== 'ALL') {
      list = list.filter((b) => b.zone === filter.zone);
    }
    return list;
  },

  addBlockRequest(block) {
    const db = load();
    db.blockRequests.unshift(block);
    persist();
    return block;
  },

  approveBlockRequest(id) {
    const db = load();
    const found = db.blockRequests.find((b) => b._id === id || b.blockId === id);
    if (found) {
      found.status = 'Approved';
      found.approvedBy = 'Vikramaditya Rao (Chief Controller)';
      found.approvedAt = new Date().toISOString();
      db.systemStats.approvedBlocks = (db.systemStats.approvedBlocks || 0) + 1;
      db.systemStats.pendingBlocks = Math.max(0, (db.systemStats.pendingBlocks || 1) - 1);
    }
    persist();
    return found;
  },

  editBlockRequest(id, payload) {
    const db = load();
    const found = db.blockRequests.find((b) => b._id === id || b.blockId === id);
    if (found) {
      Object.assign(found, payload, { status: 'Pending Review', priorityScore: computeStoredPriority({ ...found, ...payload }) });
    }
    persist();
    return found;
  },

  mergeBlockRequests(ids, mergedFields = {}) {
    const db = load();
    db.blockRequests.forEach((b) => {
      if (ids.includes(b._id) || ids.includes(b.blockId)) {
        b.isJointBlock = true;
        b.status = 'Merged Joint Block';
        Object.assign(b, mergedFields);
      }
    });
    persist();
  },

  getAlerts() {
    return load().alerts;
  },

  getSystemStats() {
    return load().systemStats;
  },

  bumpStat(key, delta) {
    const db = load();
    db.systemStats[key] = (db.systemStats[key] || 0) + delta;
    persist();
  }
};

export default mockDb;
