// Shared demo account list — used by AuthContext (UI) and the mock adapter
// (fake /auth/* endpoints) without creating a circular import between them.
export const DEMO_ACCOUNTS = [
  {
    userId: 'user_tms',
    password: 'rail123',
    name: 'Rajesh Sharma',
    designation: 'Senior Section Engineer (Track / TMS)',
    department: 'TMS',
    zone: 'Northern Railway',
    division: 'Lucknow',
    defaultRoute: '/tms',
    allowedRoutes: ['/ai-responses', '/digital-twin', '/gis-map', '/tms', '/bdms-planner', '/alerts', '/reports']
  },
  {
    userId: 'user_smms',
    password: 'rail123',
    name: 'Priya Verma',
    designation: 'Senior Section Engineer (Signal / SMMS)',
    department: 'SMMS',
    zone: 'Northern Railway',
    division: 'Lucknow',
    defaultRoute: '/smms',
    allowedRoutes: ['/ai-responses', '/digital-twin', '/gis-map', '/smms', '/bdms-planner', '/alerts', '/reports']
  },
  {
    userId: 'user_tdms',
    password: 'rail123',
    name: 'Amitabh Sen',
    designation: 'Senior Section Engineer (Traction OHE / TDMS)',
    department: 'TDMS',
    zone: 'Northern Railway',
    division: 'Lucknow',
    defaultRoute: '/tdms',
    allowedRoutes: ['/ai-responses', '/digital-twin', '/gis-map', '/tdms', '/bdms-planner', '/alerts', '/reports']
  },
  {
    userId: 'user_coa',
    password: 'rail123',
    name: 'Vikramaditya Rao',
    designation: 'Chief Controller (Control Office Application)',
    department: 'COA',
    zone: 'Northern Railway',
    division: 'Lucknow',
    defaultRoute: '/command-center',
    allowedRoutes: ['/command-center', '/overview', '/ai-responses', '/digital-twin', '/gis-map', '/tms', '/smms', '/tdms', '/bdms-planner', '/coa-database', '/station-board', '/alerts', '/reports', '/settings']
  }
];

export default DEMO_ACCOUNTS;
