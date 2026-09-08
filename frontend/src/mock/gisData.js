// GIS Spatial Mock Data for PRAGATI Digital Twin Map
// Prototype Railway Corridor Geometry for Indian Railways Divisions

export const DIVISION_MAP_CONFIGS = {
  DLI: {
    code: 'DLI',
    name: 'Delhi Division (NR)',
    center: { lat: 28.6139, lng: 77.2090 },
    zoom: 11,
    corridors: [
      {
        id: 'COR-NDLS-CNB',
        name: 'NDLS - CNB High Density Corridor',
        type: 'Primary Quad Line',
        color: '#0284c7',
        strokeWeight: 5,
        path: [
          { lat: 28.6139, lng: 77.2090, name: 'New Delhi (NDLS)' },
          { lat: 28.6472, lng: 77.3150, name: 'Anand Vihar (ANVT)' },
          { lat: 28.6692, lng: 77.4538, name: 'Ghaziabad Jn (GZB)' },
          { lat: 28.5520, lng: 77.5540, name: 'Dadri (DER)' },
          { lat: 28.3245, lng: 77.8340, name: 'Khurja Jn (KRJ)' },
          { lat: 27.8974, lng: 78.0880, name: 'Aligarh Jn (ALJN)' },
          { lat: 27.4200, lng: 78.1800, name: 'Hathras Jn (HRS)' },
          { lat: 27.2078, lng: 78.2415, name: 'Tundla Jn (TDL)' },
          { lat: 26.7855, lng: 79.0238, name: 'Etawah Jn (ETW)' },
          { lat: 26.4499, lng: 80.3319, name: 'Kanpur Central (CNB)' }
        ]
      },
      {
        id: 'COR-NDLS-UMB',
        name: 'NDLS - UMB Main Line',
        type: 'Primary Double Line',
        color: '#2563eb',
        strokeWeight: 4,
        path: [
          { lat: 28.6139, lng: 77.2090, name: 'New Delhi (NDLS)' },
          { lat: 28.6675, lng: 77.1950, name: 'Subzi Mandi (SZM)' },
          { lat: 28.9931, lng: 77.0151, name: 'Sonepat (SNP)' },
          { lat: 29.3909, lng: 76.9635, name: 'Panipat Jn (PNP)' },
          { lat: 29.6857, lng: 76.9905, name: 'Karnal (KUN)' },
          { lat: 29.9695, lng: 76.8783, name: 'Kurukshetra Jn (KKDE)' },
          { lat: 30.3340, lng: 76.8378, name: 'Ambala Cantt (UMB)' }
        ]
      },
      {
        id: 'COR-NDLS-RE',
        name: 'NDLS - RE Branch Line',
        type: 'Secondary Line',
        color: '#64748b',
        strokeWeight: 3,
        path: [
          { lat: 28.6139, lng: 77.2090, name: 'New Delhi (NDLS)' },
          { lat: 28.5888, lng: 77.1350, name: 'Delhi Cantt (DEC)' },
          { lat: 28.4682, lng: 77.0266, name: 'Gurgaon (GGN)' },
          { lat: 28.3240, lng: 76.7820, name: 'Pataudi Road (PTRD)' },
          { lat: 28.1920, lng: 76.6180, name: 'Rewari Jn (RE)' }
        ]
      }
    ]
  },
  UMB: {
    code: 'UMB',
    name: 'Ambala Division (NR)',
    center: { lat: 30.3340, lng: 76.8378 },
    zoom: 10,
    corridors: [
      {
        id: 'COR-UMB-LDH',
        name: 'UMB - LDH Main Line',
        type: 'Primary Double Line',
        color: '#0284c7',
        strokeWeight: 4,
        path: [
          { lat: 30.3340, lng: 76.8378, name: 'Ambala Cantt (UMB)' },
          { lat: 30.4840, lng: 76.5940, name: 'Rajpura Jn (RPJ)' },
          { lat: 30.6270, lng: 76.3810, name: 'Sirhind Jn (SIR)' },
          { lat: 30.7020, lng: 76.2210, name: 'Khanna (KNN)' },
          { lat: 30.9010, lng: 75.8570, name: 'Ludhiana Jn (LDH)' }
        ]
      },
      {
        id: 'COR-UMB-CDG-KLK',
        name: 'UMB - CDG - KLK Corridor',
        type: 'Suburban Line',
        color: '#3b82f6',
        strokeWeight: 3,
        path: [
          { lat: 30.3340, lng: 76.8378, name: 'Ambala Cantt (UMB)' },
          { lat: 30.7046, lng: 76.7869, name: 'Chandigarh Jn (CDG)' },
          { lat: 30.8350, lng: 76.9370, name: 'Kalka (KLK)' }
        ]
      }
    ]
  },
  LKO: {
    code: 'LKO',
    name: 'Lucknow Division (NR)',
    center: { lat: 26.8393, lng: 80.9231 },
    zoom: 10,
    corridors: [
      {
        id: 'COR-LKO-CNB',
        name: 'LKO - CNB Double Line',
        type: 'Primary Line',
        color: '#0284c7',
        strokeWeight: 5,
        path: [
          { lat: 26.8393, lng: 80.9231, name: 'Lucknow Jn (LKO)' },
          { lat: 26.7620, lng: 80.8810, name: 'Amausi (AMS)' },
          { lat: 26.7050, lng: 80.7510, name: 'Harauni (HRN)' },
          { lat: 26.6120, lng: 80.6200, name: 'Jaitipur (JTU)' },
          { lat: 26.5400, lng: 80.5200, name: 'Bachhrawan (BCN)' },
          { lat: 26.4630, lng: 80.3800, name: 'Unnao Jn (ON)' },
          { lat: 26.4499, lng: 80.3319, name: 'Kanpur Central (CNB)' }
        ]
      },
      {
        id: 'COR-LKO-BSB',
        name: 'LKO - BSB Main Line',
        type: 'Secondary Line',
        color: '#2563eb',
        strokeWeight: 4,
        path: [
          { lat: 26.8393, lng: 80.9231, name: 'Lucknow (LKO)' },
          { lat: 26.2280, lng: 81.2390, name: 'Rae Bareli Jn (RBL)' },
          { lat: 26.1580, lng: 81.8020, name: 'Amethi (AME)' },
          { lat: 25.9080, lng: 81.9960, name: 'Pratapgarh (PBH)' },
          { lat: 25.3176, lng: 82.9739, name: 'Varanasi Jn (BSB)' }
        ]
      }
    ]
  },
  MB: {
    code: 'MB',
    name: 'Moradabad Division (NR)',
    center: { lat: 28.8386, lng: 78.7733 },
    zoom: 10,
    corridors: [
      {
        id: 'COR-MB-GZB',
        name: 'MB - GZB Corridor',
        type: 'Primary Line',
        color: '#0284c7',
        strokeWeight: 4,
        path: [
          { lat: 28.8386, lng: 78.7733, name: 'Moradabad (MB)' },
          { lat: 28.7306, lng: 77.7759, name: 'Hapur Jn (HPU)' },
          { lat: 28.6692, lng: 77.4538, name: 'Ghaziabad (GZB)' }
        ]
      }
    ]
  },
  MAS: {
    code: 'MAS',
    name: 'Chennai Division (SR)',
    center: { lat: 13.0827, lng: 80.2707 },
    zoom: 11,
    corridors: [
      {
        id: 'COR-MAS-AJJ',
        name: 'MAS - AJJ Quad Line',
        type: 'Primary Line',
        color: '#0284c7',
        strokeWeight: 4,
        path: [
          { lat: 13.0827, lng: 80.2707, name: 'Chennai Central (MAS)' },
          { lat: 13.1090, lng: 80.2220, name: 'Perambur (PER)' },
          { lat: 13.1180, lng: 80.1030, name: 'Avadi (AVD)' },
          { lat: 13.1320, lng: 79.9120, name: 'Tiruvallur (TRL)' },
          { lat: 13.0780, lng: 79.6680, name: 'Arakkonam Jn (AJJ)' }
        ]
      }
    ]
  },
  MMCT: {
    code: 'MMCT',
    name: 'Mumbai Central Division (WR)',
    center: { lat: 18.9696, lng: 72.8193 },
    zoom: 11,
    corridors: [
      {
        id: 'COR-MMCT-ST',
        name: 'MMCT - ST Main Line',
        type: 'Primary Line',
        color: '#0284c7',
        strokeWeight: 4,
        path: [
          { lat: 18.9696, lng: 72.8193, name: 'Mumbai Central (MMCT)' },
          { lat: 19.0178, lng: 72.8478, name: 'Dadar (DDR)' },
          { lat: 19.2290, lng: 72.8570, name: 'Borivali (BVI)' },
          { lat: 19.6960, lng: 72.7640, name: 'Palghar (PLG)' },
          { lat: 21.2030, lng: 72.8400, name: 'Surat (ST)' }
        ]
      }
    ]
  },
  CSMT: {
    code: 'CSMT',
    name: 'Mumbai CSMT Division (CR)',
    center: { lat: 18.9400, lng: 72.8353 },
    zoom: 11,
    corridors: [
      {
        id: 'COR-CSMT-KYN',
        name: 'CSMT - KYN Main Line',
        type: 'Primary Line',
        color: '#0284c7',
        strokeWeight: 4,
        path: [
          { lat: 18.9400, lng: 72.8353, name: 'Mumbai CSMT' },
          { lat: 19.0650, lng: 72.8790, name: 'Kurla (CLA)' },
          { lat: 19.1860, lng: 72.9750, name: 'Thane (TNA)' },
          { lat: 19.2350, lng: 73.1300, name: 'Kalyan Jn (KYN)' }
        ]
      }
    ]
  },
  HWH: {
    code: 'HWH',
    name: 'Howrah Division (ER)',
    center: { lat: 22.5851, lng: 88.3414 },
    zoom: 11,
    corridors: [
      {
        id: 'COR-HWH-BWN',
        name: 'HWH - BWN Main Line',
        type: 'Primary Line',
        color: '#0284c7',
        strokeWeight: 4,
        path: [
          { lat: 22.5851, lng: 88.3414, name: 'Howrah (HWH)' },
          { lat: 22.7520, lng: 88.3430, name: 'Serampore (SRP)' },
          { lat: 22.9030, lng: 88.3970, name: 'Bandel Jn (BDC)' },
          { lat: 23.2320, lng: 87.8620, name: 'Barddhaman Jn (BWN)' }
        ]
      }
    ]
  }
};

export const GIS_DEFECTS = [
  // DLI Division
  {
    id: 'TRK-2026-081',
    defectId: 'TRK-2026-081',
    division: 'DLI',
    section: 'NDLS - CNB',
    sectionId: 'NDLS-CNB-DN',
    station: 'New Delhi (NDLS)',
    chainage: '142.450 km',
    lat: 28.6139,
    lng: 77.2090,
    assetType: 'Track (Rail)',
    defectType: 'Rail Flaw (USFD IMR Defect)',
    severity: 'Critical', // Red
    department: 'TMS',
    status: 'Open'
  },
  {
    id: 'TRC-2026-031',
    defectId: 'TRC-2026-031',
    division: 'DLI',
    section: 'NDLS - CNB',
    sectionId: 'NDLS-CNB-DN',
    station: 'Ghaziabad (GZB)',
    chainage: '142.350 km',
    lat: 28.6692,
    lng: 77.4538,
    assetType: 'Traction OHE',
    defectType: 'OHE Cantilever Insulator Breakdown',
    severity: 'Critical', // Red
    department: 'TDMS',
    status: 'Open'
  },
  {
    id: 'SIG-2026-042',
    defectId: 'SIG-2026-042',
    division: 'DLI',
    section: 'NDLS - CNB',
    sectionId: 'NDLS-CNB-DN',
    station: 'Anand Vihar (ANVT)',
    chainage: '142.100 km',
    lat: 28.6472,
    lng: 77.3150,
    assetType: 'Signal Point Machine',
    defectType: 'Point Machine 102B Overhaul Fault',
    severity: 'High', // Orange
    department: 'SMMS',
    status: 'Merged Joint Block'
  },
  {
    id: 'TRK-2026-084',
    defectId: 'TRK-2026-084',
    division: 'DLI',
    section: 'NDLS - UMB',
    sectionId: 'NDLS-UMB-UP',
    station: 'Sonepat (SNP)',
    chainage: '48.120 km',
    lat: 28.9931,
    lng: 77.0151,
    assetType: 'Track (Ballast)',
    defectType: 'Ballast Fouling / Deep Screening Needed',
    severity: 'High', // Orange
    department: 'TMS',
    status: 'Merged Joint Block'
  },
  {
    id: 'SIG-2026-051',
    defectId: 'SIG-2026-051',
    division: 'DLI',
    section: 'NDLS - UMB',
    sectionId: 'NDLS-UMB-UP',
    station: 'Panipat (PNP)',
    chainage: '48.100 km',
    lat: 29.3909,
    lng: 76.9635,
    assetType: 'Signal Axle Counter',
    defectType: 'Axle Counter Sensor Calibration Drift',
    severity: 'Medium', // Yellow
    department: 'SMMS',
    status: 'Pending Block'
  },
  {
    id: 'TRC-2026-038',
    defectId: 'TRC-2026-038',
    division: 'DLI',
    section: 'NDLS - UMB',
    sectionId: 'NDLS-UMB-UP',
    station: 'Karnal (KUN)',
    chainage: '48.150 km',
    lat: 29.6857,
    lng: 76.9905,
    assetType: 'Traction Catenary',
    defectType: 'OHE Catenary Wire Dropper Slackness',
    severity: 'Low', // Blue
    department: 'TDMS',
    status: 'Pending Block'
  },
  
  // UMB Division
  {
    id: 'TRK-UMB-001',
    defectId: 'TRK-UMB-001',
    division: 'UMB',
    section: 'UMB - LDH',
    sectionId: 'UMB-LDH-UP',
    station: 'Rajpura (RPJ)',
    chainage: '24.500 km',
    lat: 30.4840,
    lng: 76.5940,
    assetType: 'Track (Rail)',
    defectType: 'Rail Head Squat',
    severity: 'High',
    department: 'TMS',
    status: 'Open'
  },

  // LKO Division
  {
    id: 'TRK-LKO-002',
    defectId: 'TRK-LKO-002',
    division: 'LKO',
    section: 'LKO - CNB',
    sectionId: 'LKO-CNB-DN',
    station: 'Bachhrawan (BCN)',
    chainage: '54.200 km',
    lat: 26.5400,
    lng: 80.5200,
    assetType: 'Signal Point',
    defectType: 'Point Lock Indication Failure',
    severity: 'Critical',
    department: 'SMMS',
    status: 'Open'
  }
];

export const GIS_MAINTENANCE_BLOCKS = [
  {
    id: 'BLK-JB-01',
    division: 'DLI',
    title: 'INTEGRATED BLOCK',
    section: 'NDLS - GZB',
    window: '02:30 – 05:30',
    durationHours: 3.0,
    departments: ['TMS', 'SMMS', 'TDMS'],
    status: 'AI-Assisted Recommendation',
    path: [
      { lat: 28.6139, lng: 77.2090 },
      { lat: 28.6472, lng: 77.3150 },
      { lat: 28.6692, lng: 77.4538 }
    ],
    center: { lat: 28.6472, lng: 77.3150 }
  },
  {
    id: 'BLK-JB-02',
    division: 'DLI',
    title: 'INTEGRATED BLOCK',
    section: 'SZM - SNP',
    window: '15:50 – 16:20',
    durationHours: 0.5,
    departments: ['TMS', 'TDMS'],
    status: 'AI-Assisted Recommendation',
    path: [
      { lat: 28.6675, lng: 77.1950 },
      { lat: 28.8000, lng: 77.1000 },
      { lat: 28.9931, lng: 77.0151 }
    ],
    center: { lat: 28.8000, lng: 77.1000 }
  },
  {
    id: 'BLK-JB-03',
    division: 'LKO',
    title: 'INTEGRATED BLOCK',
    section: 'JTU - BCN',
    window: '16:08 – 16:20',
    durationHours: 0.2,
    departments: ['TMS', 'SMMS'],
    status: 'AI-Assisted Recommendation',
    path: [
      { lat: 26.6120, lng: 80.6200 },
      { lat: 26.5400, lng: 80.5200 }
    ],
    center: { lat: 26.5760, lng: 80.5700 }
  }
];

export const GIS_SIMULATED_TRAINS = [
  {
    id: 'TRAIN-12004',
    trainNumber: '12004',
    trainName: 'Kalka Shatabdi',
    division: 'DLI',
    type: 'Passenger Express',
    direction: 'UP Main',
    currentSection: 'NDLS - UMB',
    speedKm: 110,
    status: 'ON TIME',
    lat: 28.6675,
    lng: 77.1950
  },
  {
    id: 'TRAIN-12425',
    trainNumber: '12425',
    trainName: 'Jammu Rajdhani',
    division: 'DLI',
    type: 'Passenger Express',
    direction: 'UP Main',
    currentSection: 'NDLS - UMB',
    speedKm: 120,
    status: 'RUNNING (+3 min)',
    lat: 28.9931,
    lng: 77.0151
  },
  {
    id: 'TRAIN-15014',
    trainNumber: '15014',
    trainName: 'LKO-CNB Express',
    division: 'DLI',
    type: 'Passenger Express',
    direction: 'DN Main',
    currentSection: 'NDLS - CNB',
    speedKm: 65,
    status: 'DELAYED (+18 min)',
    lat: 28.6472,
    lng: 77.3150
  },
  {
    id: 'TRAIN-G402',
    trainNumber: 'G-402',
    trainName: 'Container Freight BCN',
    division: 'DLI',
    type: 'Freight',
    direction: 'DN Main',
    currentSection: 'NDLS - CNB',
    speedKm: 40,
    status: 'HELD AT LOOP',
    lat: 27.8974,
    lng: 78.0880
  },
  {
    id: 'TRAIN-22977',
    trainNumber: '22977',
    trainName: 'BDTS-LKO SF Exp',
    division: 'LKO',
    type: 'Passenger Express',
    direction: 'UP Main',
    currentSection: 'LKO - CNB',
    speedKm: 78,
    status: 'RUNNING (+7 min)',
    lat: 26.6120,
    lng: 80.6200
  }
];