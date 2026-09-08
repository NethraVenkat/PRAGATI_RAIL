import { theme } from 'antd';

export const lightTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1e3a8a',
    colorSuccess: '#059669',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorInfo: '#0284c7',
    colorBgBase: '#f8fafc',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorTextBase: '#0f172a',
    colorTextSecondary: '#475569',
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSizeHeading1: 28,
    fontSizeHeading2: 22,
    fontSizeHeading3: 18,
    boxShadowCard: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)',
  },
  components: {
    Table: {
      headerBg: '#f1f5f9',
      headerColor: '#1e293b',
      rowHoverBg: '#f8fafc',
      borderColor: '#e2e8f0',
      borderRadius: 8,
    },
    Card: {
      colorBgContainer: '#ffffff',
      headerBg: '#ffffff',
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: '#475569',
      itemSelectedColor: '#1e3a8a',
      itemSelectedBg: '#eff6ff',
      itemHoverBg: '#f1f5f9',
    },
    Button: {
      fontWeight: 500,
    },
    Tag: {
      borderRadius: 4,
    }
  }
};

export const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#3b82f6',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#38bdf8',
    colorBgBase: '#0b0f19',
    colorBgContainer: '#131b2e',
    colorBgElevated: '#1a243b',
    colorTextBase: '#f1f5f9',
    colorTextSecondary: '#94a3b8',
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSizeHeading1: 28,
    fontSizeHeading2: 22,
    fontSizeHeading3: 18,
  },
  components: {
    Table: {
      headerBg: '#1e293b',
      headerColor: '#f8fafc',
      rowHoverBg: '#1a243b',
      borderColor: '#334155',
    },
    Card: {
      colorBgContainer: '#131b2e',
      headerBg: '#131b2e',
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: '#94a3b8',
      itemSelectedColor: '#60a5fa',
      itemSelectedBg: '#1e293b',
      itemHoverBg: '#1e293b',
    }
  }
};
