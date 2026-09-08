import React, { useState } from 'react';
import { Table, Input, Card, Space, Button } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';

export const DataTable = ({
  columns,
  dataSource,
  loading = false,
  rowKey = 'id',
  title,
  extraActions,
  searchPlaceholder = 'Search records...',
  pagination = { pageSize: 8 },
  onExport,
  expandable
}) => {
  const [searchText, setSearchText] = useState('');

  const filteredData = dataSource.filter(item => {
    if (!searchText) return true;
    const lower = searchText.toLowerCase();
    return Object.values(item).some(val => 
      val && String(val).toLowerCase().includes(lower)
    );
  });

  return (
    <Card 
      style={{ borderRadius: 10, border: '1px solid var(--ir-border)' }}
      bodyStyle={{ padding: '16px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          {title && <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{title}</h3>}
        </div>
        <Space size="middle" style={{ flexWrap: 'wrap' }}>
          <Input 
            placeholder={searchPlaceholder}
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 240, borderRadius: 6 }}
            allowClear
          />
          {onExport && (
            <Button icon={<DownloadOutlined />} onClick={onExport}>
              Export
            </Button>
          )}
          {extraActions}
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey={rowKey}
        pagination={pagination}
        expandable={expandable}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
    </Card>
  );
};
