// ============================================================================
// PRAGATI-RAIL — Transparent Mock Backend Adapter
// ----------------------------------------------------------------------------
// Installed as the Axios adapter on `apiClient`. Every request the React app
// makes (via services/*.js or apiClient directly) is pattern-matched against
// the route table below and answered with realistic, stateful, ML-simulated
// data — with no live backend, database, or Python process required.
//
// Toggle: set VITE_USE_MOCK=false in .env to disable (falls back to the real
// network adapter, e.g. once the real backend/ML services are online).
// ============================================================================

import { mockDb, resetDemoData } from './mockDb';
import { classifySeverityAndPriority, predictBlockOutcome, simulateLatency } from './mlEngine';
import { DEMO_ACCOUNTS } from './demoAccounts';
import {
  ZONAL_PERFORMANCE_MATRIX,
  CORRIDORS_DATA,
  STATION_BOARDS
} from './apiData';
import { DIVISION_MAP_CONFIGS, GIS_DEFECTS } from './gisData';

// ---------------------------------------------------------------------------
// Simulation-mode status pill (read by AppShell)
// ---------------------------------------------------------------------------
const listeners = new Set();
export const mockStatus = {
  active: 0,
  lastCall: null
};
export function subscribeMockStatus(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify(event) {
  mockStatus.lastCall = event;
  listeners.forEach((fn) => fn({ ...mockStatus }));
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function parseUrl(rawUrl) {
  const [path, queryString] = String(rawUrl).split('?');
  const query = {};
  if (queryString) {
    new URLSearchParams(queryString).forEach((v, k) => {
      query[k] = v;
    });
  }
  return { path: path.replace(/\/+$/, '') || '/', query };
}

function matchPattern(pattern, path) {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i];
    if (pp.startsWith(':')) {
      params[pp.slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (pp !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

function decodeToken(headers) {
  const auth = headers?.Authorization || headers?.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token || !token.startsWith('mock-token-')) return null;
  const userId = token.replace('mock-token-', '');
  return DEMO_ACCOUNTS.find((a) => a.userId === userId) || null;
}

function ok(data, status = 200) {
  return { data, status, statusText: 'OK' };
}

function fail(status, message) {
  const err = new Error(message);
  err.response = { status, data: { message } };
  err.isAxiosError = true;
  throw err;
}

function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return { captchaId: `cap_${Date.now()}`, captcha: code };
}

// ---------------------------------------------------------------------------
// Route table: { method, pattern, handler(ctx) }
// ctx = { params, query, body, headers }
// ---------------------------------------------------------------------------
const routes = [
  // ---- AUTH -----------------------------------------------------------
  {
    method: 'get',
    pattern: '/auth/captcha',
    handler: () => generateCaptcha()
  },
  {
    method: 'post',
    pattern: '/auth/signin',
    handler: ({ body }) => {
      const { userId, password } = body || {};
      const account = DEMO_ACCOUNTS.find((a) => a.userId === userId && a.password === password);
      if (!account) fail(401, 'Invalid User ID or Password. Use a demo account (see login screen).');
      const { password: _pw, ...user } = account;
      return { token: `mock-token-${account.userId}`, user };
    }
  },
  {
    method: 'get',
    pattern: '/auth/me',
    handler: ({ headers }) => {
      const account = decodeToken(headers);
      if (!account) fail(401, 'Not authenticated');
      const { password: _pw, ...user } = account;
      return { user };
    }
  },

  // ---- OVERVIEW DASHBOARD ----------------------------------------------
  {
    method: 'get',
    pattern: '/overview/dashboard',
    handler: ({ query }) => {
      const zone = query.zone || 'ALL';
      const division = query.division || 'ALL';
      const stats = mockDb.getSystemStats();
      const blocks = mockDb.getBlockRequests({ zone, division });
      const pendingBlocks = blocks.filter((b) => b.status === 'Pending Review').length;
      const approvedBlocks = blocks.filter((b) => b.status === 'Approved').length;

      const allDefects = mockDb.getDefects('ALL');
      const topPriorityTasks = [...allDefects]
        .filter((d) => !d.sentToBlockPlanning)
        .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
        .slice(0, 8)
        .map((d) => ({
          id: d.id,
          zone: d.zone || 'NR',
          division: d.division || 'DLI',
          department: d.department,
          defectType: d.defectType || d.category,
          location: d.location || d.section,
          severity: d.severity,
          priorityScore: d.priorityScore || 60,
          status: d.status
        }));

      const recentAlerts = mockDb.getAlerts().slice(0, 6);

      return {
        success: true,
        dynamicStats: {
          totalDefects: stats.totalDefects + allDefects.length - 0,
          totalDefectsTrend: stats.totalDefectsTrend,
          pendingBlocks: pendingBlocks || stats.pendingBlocks,
          pendingBlocksTrend: stats.pendingBlocksTrend,
          approvedBlocks: approvedBlocks || stats.approvedBlocks,
          approvedBlocksTrend: stats.approvedBlocksTrend,
          emergencyBlocks: stats.emergencyBlocks,
          emergencyBlocksTrend: stats.emergencyBlocksTrend,
          blockHoursSaved: stats.blockHoursSaved,
          blockHoursSavedTrend: stats.blockHoursSavedTrend,
          tasksMerged: stats.tasksMerged,
          tasksMergedTrend: stats.tasksMergedTrend
        },
        zonalMatrix: ZONAL_PERFORMANCE_MATRIX,
        topPriorityTasks,
        recentAlerts
      };
    }
  },

  // ---- AI OPTIMIZATION RESULTS ------------------------------------------
  {
    method: 'get',
    pattern: '/ai-optimization/results',
    handler: ({ headers }) => {
      const account = decodeToken(headers);
      const isCOA = !account || account.department === 'COA';
      const dept = account?.department;

      let blocks = mockDb.getBlockRequests();
      if (!isCOA && dept) blocks = blocks.filter((b) => b.department === dept);

      let approvedList = blocks.filter((b) => b.status === 'Approved' || b.isJointBlock);
      if (approvedList.length === 0) approvedList = blocks.slice(0, 5); // keep the demo non-empty

      const totalApprovedCount = approvedList.length;
      const unoptimizedHours = approvedList.reduce((s, b) => s + (b.durationHours || 3) * 1.6, 0);
      const optimizedHours = approvedList.reduce((s, b) => s + (b.durationHours || 3), 0);
      const savedHours = Math.max(0, unoptimizedHours - optimizedHours);
      const savingsPercent = unoptimizedHours > 0 ? (savedHours / unoptimizedHours) * 100 : 0;
      const trainsAvoided = Math.round(totalApprovedCount * 1.4);
      const conflictsResolved = approvedList.filter((b) => b.isJointBlock).length || Math.round(totalApprovedCount * 0.4);

      const buckets = [
        { range: '0-25', count: 0 },
        { range: '25-50', count: 0 },
        { range: '50-75', count: 0 },
        { range: '75-100', count: 0 }
      ];
      approvedList.forEach((b) => {
        const p = b.priorityScore || 50;
        if (p < 25) buckets[0].count++;
        else if (p < 50) buckets[1].count++;
        else if (p < 75) buckets[2].count++;
        else buckets[3].count++;
      });

      const durationAccuracyData = CORRIDORS_DATA.slice(0, 4).map((c, i) => ({
        name: c.name?.split(' ')[0] || `Corridor ${i + 1}`,
        unoptimized: Number(((c.passengerTrainCount || 100) / 25).toFixed(1)),
        optimized: Number(((c.passengerTrainCount || 100) / 40).toFixed(1))
      }));

      const deptColors = { TMS: '#0284c7', SMMS: '#d97706', TDMS: '#7c3aed' };
      const deptSplitData = isCOA
        ? ['TMS', 'SMMS', 'TDMS'].map((d) => ({
            name: d,
            value: blocks.filter((b) => b.department === d).length,
            color: deptColors[d]
          }))
        : [
            { name: 'Critical', value: approvedList.filter((b) => (b.severityScore || 0) >= 85).length, color: '#dc2626' },
            { name: 'High', value: approvedList.filter((b) => (b.severityScore || 0) >= 65 && (b.severityScore || 0) < 85).length, color: '#d97706' },
            { name: 'Medium', value: approvedList.filter((b) => (b.severityScore || 0) < 65).length, color: '#059669' }
          ];

      return {
        success: true,
        summary: {
          unoptimizedHours: Number(unoptimizedHours.toFixed(1)),
          optimizedHours: Number(optimizedHours.toFixed(1)),
          savedHours: Number(savedHours.toFixed(1)),
          savingsPercent: Number(savingsPercent.toFixed(1)),
          trainsAvoided,
          conflictsResolved,
          totalApprovedCount
        },
        priorityDistData: buckets,
        durationAccuracyData,
        deptSplitData,
        approvedList,
        isCOA,
        userRole: account ? 'Authenticated' : 'Guest',
        userDept: dept || 'COA'
      };
    }
  },

  // ---- BLOCK REQUESTS (BDMS / COA) --------------------------------------
  {
    method: 'get',
    pattern: '/block-requests',
    handler: ({ query }) => mockDb.getBlockRequests(query)
  },
  {
    method: 'put',
    pattern: '/block-requests/:id/approve',
    handler: ({ params }) => {
      const block = mockDb.approveBlockRequest(params.id);
      if (!block) fail(404, 'Block request not found');
      return { success: true, message: `Block ${params.id} Approved!`, block };
    }
  },
  {
    method: 'put',
    pattern: '/block-requests/:id',
    handler: ({ params, body }) => {
      const block = mockDb.editBlockRequest(params.id, body || {});
      if (!block) fail(404, 'Block request not found');
      return { success: true, message: 'Block plan updated successfully', block };
    }
  },

  // ---- BDMS MAINTENANCE SCHEDULE -----------------------------------------
  {
    method: 'get',
    pattern: '/bdms/maintenance-schedule',
    handler: ({ query }) => {
      const blocks = mockDb.getBlockRequests(query);
      const totalIndividualHours = blocks.reduce((s, b) => s + (b.durationHours || 3) * 1.5, 0);
      const optimizedDurationHours = blocks.reduce((s, b) => s + (b.durationHours || 3), 0);
      const hoursSaved = Math.max(0, totalIndividualHours - optimizedDurationHours);
      return {
        success: true,
        blocks,
        availableDates: [...new Set(blocks.map((b) => b.date))],
        availableSections: [...new Set(blocks.map((b) => b.location || b.section).filter(Boolean))],
        departmentBreakdown: {
          TMS: blocks.filter((b) => b.department === 'TMS').length,
          SMMS: blocks.filter((b) => b.department === 'SMMS').length,
          TDMS: blocks.filter((b) => b.department === 'TDMS').length
        },
        summary: {
          totalRequests: blocks.length,
          totalIndividualHours: Number(totalIndividualHours.toFixed(1)),
          optimizedDurationHours: Number(optimizedDurationHours.toFixed(1)),
          hoursSaved: Number(hoursSaved.toFixed(1)),
          savingsPercentage: totalIndividualHours > 0 ? Number(((hoursSaved / totalIndividualHours) * 100).toFixed(1)) : 0,
          jointBlocksCount: blocks.filter((b) => b.isJointBlock).length,
          approvedCount: blocks.filter((b) => b.status === 'Approved').length,
          pendingCount: blocks.filter((b) => b.status === 'Pending Review').length
        }
      };
    }
  },

  // ---- DEFECTS (TMS / SMMS / TDMS) ---------------------------------------
  {
    method: 'post',
    pattern: '/defects/:department/:id/send',
    handler: async ({ params, body }) => {
      await simulateLatency(400, 900); // emulate GPU inference for the optimizer
      const dept = params.department.toUpperCase();
      const outcome = predictBlockOutcome({ id: params.id, durationHours: body?.durationHours || 4, gmt: body?.gmt });
      const defect = mockDb.markDefectSent(dept, params.id, { status: 'Sent to Block Planning' });
      const priority = classifySeverityAndPriority(defect || { id: params.id });

      const block = mockDb.addBlockRequest({
        _id: `BLK-${dept}-${params.id}-${Date.now()}`,
        blockId: `BLK-${dept}-${params.id}`,
        sourceDefectId: params.id,
        department: dept,
        deptLabel: dept === 'TMS' ? 'Engineering (Track)' : dept === 'SMMS' ? 'Signal & Telecom' : 'Traction (OHE)',
        defectType: defect?.defectType || defect?.category || `${dept} Maintenance Work`,
        location: defect?.location || defect?.section || 'Section Unspecified',
        section: defect?.section || defect?.location,
        zone: defect?.zone || 'NR',
        division: defect?.division || 'DLI',
        date: body?.startDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        startTime: body?.startTime || '01:30',
        endTime: body?.endTime || '04:00',
        durationHours: body?.durationHours || 3,
        priorityScore: priority.priorityScore,
        severityScore: priority.severityScore,
        urgencyScore: priority.urgencyScore,
        assetImpactScore: priority.assetImpactScore,
        trainImpactScore: priority.trainImpactScore,
        overdueDaysScore: priority.overdueDaysScore,
        status: 'Pending Review',
        isJointBlock: false,
        approvedBy: null,
        aiReasoning: `Priority Engine scored this ${dept} possession at ${priority.priorityScore}/100 (Urgency: ${priority.urgencyLevel}, Action Window: ${priority.actionWindow}).`,
        justification: outcome.recommendation,
        outcomePrediction: outcome,
        createdAt: new Date().toISOString()
      });

      return {
        success: true,
        message: `${dept} defect ${params.id} sent to AI Block Planning Engine.`,
        block,
        priority,
        outcome
      };
    }
  },
  {
    method: 'post',
    pattern: '/defects',
    handler: async ({ body }) => {
      await simulateLatency(400, 900); // emulate severity classifier + priority model inference
      const dept = (body?.department || 'TMS').toUpperCase();
      const priority = classifySeverityAndPriority(body || {});
      const severity =
        priority.priorityScore >= 85 ? 'Critical' : priority.priorityScore >= 65 ? 'High' : priority.priorityScore >= 40 ? 'Medium' : 'Low';
      const defect = mockDb.addDefect(dept, {
        ...body,
        severity: body?.severity || severity,
        ...priority,
        reportedAt: new Date().toISOString()
      });
      return { success: true, message: 'Defect submitted and classified successfully.', defect };
    }
  },
  {
    method: 'get',
    pattern: '/defects',
    handler: ({ query }) => mockDb.getDefects(query.department || 'ALL')
  },
  { method: 'get', pattern: '/tms/defects', handler: () => mockDb.getDefects('TMS') },
  { method: 'get', pattern: '/smms/defects', handler: () => mockDb.getDefects('SMMS') },
  { method: 'get', pattern: '/tdms/defects', handler: () => mockDb.getDefects('TDMS') },

  // ---- GIS ---------------------------------------------------------------
  {
    method: 'get',
    pattern: '/gis/tracks',
    handler: ({ query }) => {
      const division = query.division || 'DLI';
      const config = DIVISION_MAP_CONFIGS[division] || DIVISION_MAP_CONFIGS.DLI;
      const stations = new Set();
      (config?.corridors || []).forEach((c) => (c.path || []).forEach((p) => stations.add(p.name)));
      return {
        success: true,
        division,
        center: config?.center,
        zoom: config?.zoom,
        tracks: config?.corridors || [],
        stations: [...stations],
        trackDataVerified: true,
        trackDataAvailable: true
      };
    }
  },
  {
    method: 'get',
    pattern: '/gis/defects',
    handler: ({ query }) => {
      const division = query.division;
      const defects = division ? GIS_DEFECTS.filter((d) => d.division === division) : GIS_DEFECTS;
      return { success: true, defects };
    }
  },

  // ---- STATIONS ------------------------------------------------------------
  {
    method: 'get',
    pattern: '/stations',
    handler: ({ query }) => {
      const all = Object.values(STATION_BOARDS);
      const list = query.division ? all.filter((s) => s.division === query.division) : all;
      return list.map((s) => ({ code: s.stationCode, name: s.stationName, zone: s.zone, division: s.division }));
    }
  },
  {
    method: 'get',
    pattern: '/stations/division/display',
    handler: ({ query }) => {
      const division = query.division || 'DLI';
      const boards = Object.values(STATION_BOARDS).filter((s) => !query.division || s.division === division);
      const source = boards.length > 0 ? boards : Object.values(STATION_BOARDS);
      const trains = [];
      source.forEach((board) => {
        (board.arrivals || []).forEach((t) => trains.push({ ...t, stationCode: board.stationCode, type: 'arrival' }));
        (board.departures || []).forEach((t) => trains.push({ ...t, stationCode: board.stationCode, type: 'departure' }));
      });
      return {
        success: true,
        division,
        zone: query.zone,
        date: query.date,
        trains,
        arrivals: trains.filter((t) => t.type === 'arrival'),
        departures: trains.filter((t) => t.type === 'departure'),
        delayed: trains.filter((t) => t.status && t.status !== 'ON TIME')
      };
    }
  },
  {
    method: 'get',
    pattern: '/stations/:code/display',
    handler: ({ params, query }) => {
      const board = STATION_BOARDS[params.code.toUpperCase()];
      if (board) return { success: true, ...board, date: query.date };
      return {
        success: true,
        stationCode: params.code.toUpperCase(),
        stationName: `${params.code.toUpperCase()} Station`,
        arrivals: [],
        departures: [],
        date: query.date
      };
    }
  },
  {
    method: 'get',
    pattern: '/stations/nearest',
    handler: ({ query }) => {
      const lat = parseFloat(query.lat);
      const lon = parseFloat(query.lon);
      let best = null;
      let bestDist = Infinity;
      Object.values(DIVISION_MAP_CONFIGS).forEach((div) => {
        (div.corridors || []).forEach((c) =>
          (c.path || []).forEach((p) => {
            const dist = Math.hypot((p.lat || 0) - lat, (p.lng || 0) - lon);
            if (dist < bestDist) {
              bestDist = dist;
              best = { station: p.name, division: div.code, section: c.name };
            }
          })
        );
      });
      return {
        success: true,
        station: best?.station || 'Unknown Station',
        section: best?.section || 'Unclassified Section',
        division: best?.division || 'DLI',
        trafficDensity: Number((20 + Math.random() * 40).toFixed(1))
      };
    }
  },

  // ---- TRAINS --------------------------------------------------------------
  {
    method: 'get',
    pattern: '/trains/available',
    handler: ({ query }) => {
      const names = [
        'Rajdhani Express', 'Shatabdi Express', 'Vande Bharat Express', 'Duronto Express',
        'Garib Rath Express', 'Jan Shatabdi Express', 'Superfast Mail', 'Passenger Local',
        'EMU Local', 'Goods Freight Rake'
      ];
      const search = (query.search || '').toLowerCase();
      const limit = Number(query.limit) || 150;
      let list = names.map((n, i) => ({
        trainNumber: `${12000 + i * 37}`,
        trainName: `${n}`,
        type: n.includes('EMU') || n.includes('Local') ? 'Local' : n.includes('Goods') ? 'Freight' : 'Express',
        zone: query.zone || 'NR',
        division: query.division || 'DLI'
      }));
      if (search) list = list.filter((t) => t.trainName.toLowerCase().includes(search) || t.trainNumber.includes(search));
      return { success: true, data: list.slice(0, limit) };
    }
  },
  {
    method: 'get',
    pattern: '/trains/:num/live',
    handler: ({ params }) => {
      const delay = Math.floor(Math.random() * 25);
      return {
        success: true,
        data: {
          trainNumber: params.num,
          currentStation: 'GZB',
          nextStation: 'DER',
          delayMinutes: delay,
          status: delay === 0 ? 'ON TIME' : delay < 10 ? 'SLIGHT DELAY' : 'DELAYED',
          lastUpdated: new Date().toISOString(),
          speedKmph: Math.floor(50 + Math.random() * 80)
        }
      };
    }
  },
  {
    method: 'get',
    pattern: '/trains/:num/timetable',
    handler: ({ params }) => {
      const stops = ['NDLS', 'ANVT', 'GZB', 'DER', 'KRJ', 'ALJN', 'HRS', 'TDL', 'ETW', 'CNB'];
      return {
        success: true,
        data: stops.map((code, i) => ({
          stationCode: code,
          stationName: `${code} Station`,
          day: 1,
          distanceKm: i * 65,
          arrival: i === 0 ? '--' : `${String(6 + i).padStart(2, '0')}:${(i * 7) % 60}`.padEnd(5, '0'),
          departure: i === stops.length - 1 ? '--' : `${String(6 + i).padStart(2, '0')}:${((i * 7) % 60) + 2}`.padEnd(5, '0'),
          trainNumber: params.num
        }))
      };
    }
  }
];

// ---------------------------------------------------------------------------
// The actual Axios adapter
// ---------------------------------------------------------------------------
export function mockAdapter(config) {
  return new Promise((resolve, reject) => {
    const { path, query: urlQuery } = parseUrl(config.url || '');
    const method = (config.method || 'get').toLowerCase();
    const query = { ...urlQuery, ...(config.params || {}) };

    let body = config.data;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        /* leave as-is */
      }
    }

    const route = routes.find((r) => r.method === method && matchPattern(r.pattern, path));

    mockStatus.active += 1;
    notify({ path, method, phase: 'start' });

    const finish = (fn) => {
      mockStatus.active = Math.max(0, mockStatus.active - 1);
      notify({ path, method, phase: 'end' });
      fn();
    };

    if (!route) {
      // Unknown endpoint: respond with an empty-but-valid payload instead of a
      // hard network error, so the UI never shows a red console/network error.
      console.warn(`[MockAdapter] No mock route for ${method.toUpperCase()} ${path} — returning empty payload.`);
      simulateLatency(150, 350).then(() =>
        finish(() => resolve({ data: { success: true, data: [], message: 'No mock handler (empty response)' }, status: 200, statusText: 'OK', headers: {}, config }))
      );
      return;
    }

    const params = matchPattern(route.pattern, path) || {};
    const ctx = { params, query, body, headers: config.headers || {} };

    // Baseline network-ish latency for every mock call so the UI shows its
    // loading states briefly, on top of any longer ML-inference delay a
    // specific handler adds itself (e.g. defect submission, send-to-planning).
    simulateLatency(120, 320)
      .then(() => route.handler(ctx))
      .then((result) => {
        finish(() => resolve({ ...ok(result), headers: {}, config }));
      })
      .catch((err) => {
        finish(() => reject(err));
      });
  });
}

export { resetDemoData };
export default mockAdapter;
