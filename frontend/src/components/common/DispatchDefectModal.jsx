import React, { useState, useEffect } from 'react';
import { Modal, DatePicker, TimePicker, Button, Tag, Alert, Descriptions, Space, message, Row, Col } from 'antd';
import {
  SendOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker: DateRangePicker } = DatePicker;
const { RangePicker: TimeRangePicker } = TimePicker;

// Default daily time duration window: 01:30 to 05:30 (4.0 hrs)
const DEFAULT_START_TIME = dayjs('01:30', 'HH:mm');
const DEFAULT_END_TIME = dayjs('05:30', 'HH:mm');

export const DispatchDefectModal = ({
  open,
  onClose,
  defectRecord,
  department = 'TMS',
  onDispatched
}) => {
  const [dates, setDates] = useState([dayjs().add(1, 'day'), dayjs().add(3, 'day')]);
  const [times, setTimes] = useState([DEFAULT_START_TIME, DEFAULT_END_TIME]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setDates([dayjs().add(1, 'day'), dayjs().add(3, 'day')]);
      setTimes([DEFAULT_START_TIME, DEFAULT_END_TIME]);
    }
  }, [open]);

  if (!defectRecord) return null;

  const defectId = defectRecord.defectId || defectRecord.Defect_ID || defectRecord.id;
  const defectType = defectRecord.defectType || defectRecord.Defect_Type || 'Maintenance Required';
  const severity = defectRecord.severityLevel || defectRecord.Severity_Level || 'High';
  const totalWorkHours = Number(
    defectRecord.workDurationHrs ||
    defectRecord.Work_Overall_Duration ||
    defectRecord.predictedResolutionTimeHours ||
    defectRecord.Predicted_Resolution_Time_Hours ||
    4.0
  );

  // Disable past dates
  const disabledDate = (current) => {
    if (!current) return false;
    return current.isBefore(dayjs().startOf('day'), 'day');
  };

  // 1. Calculate number of days in selected date range
  const selectedDays = dates && dates[0] && dates[1]
    ? Math.max(1, dates[1].diff(dates[0], 'day') + 1)
    : 1;

  // 2. Divide total work duration by number of days
  const avgDailyWorkHours = Number((totalWorkHours / selectedDays).toFixed(2));
  const dailyWorkHours = avgDailyWorkHours;

  // 3. Calculate time duration (EndTime - StartTime)
  let timeWindowHours = 0;
  if (times && times[0] && times[1]) {
    const startMins = times[0].hour() * 60 + times[0].minute();
    const endMins = times[1].hour() * 60 + times[1].minute();
    let diffMins = endMins - startMins;
    if (diffMins < 0) diffMins += 1440; // Overnight window wrapping
    timeWindowHours = Number((diffMins / 60).toFixed(2));
  }

  // 4. Verification condition: Window is valid if time window > 0
  const isValidWindow = timeWindowHours > 0;

  const handleConfirmSend = async () => {
    if (!dates || !dates[0] || !dates[1]) {
      message.warning('Please select a valid execution start and end date range.');
      return;
    }

    if (!times || !times[0] || !times[1]) {
      message.warning('Please select a valid daily time duration (Start Time and End Time).');
      return;
    }

    if (!isValidWindow) {
      message.error({
        content: `insufficient inputs: Daily required work (${dailyWorkHours} hrs) exceeds available time window (${timeWindowHours} hrs). Please extend date range or increase time window.`,
        duration: 5
      });
      return;
    }

    const startDateStr = dates[0].format('YYYY-MM-DD');
    const endDateStr = dates[1].format('YYYY-MM-DD');
    const startTimeStr = times[0].format('HH:mm');
    const endTimeStr = times[1].format('HH:mm');

    setLoading(true);
    try {
      if (onDispatched) {
        await onDispatched(defectRecord, {
          startDate: startDateStr,
          endDate: endDateStr,
          startTime: startTimeStr,
          endTime: endTimeStr,
          selectedDays,
          dailyWorkHours,
          timeWindowHours
        });
      }
      onClose();
    } catch (err) {
      console.error('Error dispatching defect:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1e3a8a' }}>
          <CalendarOutlined style={{ color: '#0284c7' }} />
          <span>Dispatch {department} Defect to BDMS Joint Block Optimizer</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SendOutlined />}
          loading={loading}
          disabled={!isValidWindow}
          style={{
            background: isValidWindow ? '#059669' : '#94a3b8',
            borderColor: isValidWindow ? '#059669' : '#94a3b8'
          }}
          onClick={handleConfirmSend}
        >
          Submit to BDMS Planner
        </Button>
      ]}
      width={680}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Alert
          type="info"
          showIcon
          message="DYNAMIC MULTI-DAY CORRIDOR & TIME-WINDOW OPTIMIZER"
          description={
            <div>
              The AI Block Optimizer evaluates train timetable density across your requested dates (<strong>{selectedDays} Days</strong>) and automatically splits the <strong>{totalWorkHours} hrs</strong> total maintenance duration to minimize train conflicts and maximize throughput.
            </div>
          }
        />

        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="Defect ID">
            <strong style={{ fontFamily: 'monospace' }}>{defectId}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Department">
            <Tag color="blue">{department}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Fault / Defect">{defectType}</Descriptions.Item>
          <Descriptions.Item label="Severity Level">
            <Tag color={severity.toUpperCase().includes('CRITICAL') ? 'red' : 'orange'}>{severity}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Total Stored DB Work Duration" span={2}>
            <strong style={{ color: '#059669', fontSize: 14 }}>{totalWorkHours} Hours</strong>
          </Descriptions.Item>
        </Descriptions>

        {/* Date Range and Time Duration Selection */}
        <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Row gutter={12}>
            <Col span={12}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                <CalendarOutlined style={{ marginRight: 4, color: '#0284c7' }} />
                1. Select Execution Date Range:
              </div>
              <DateRangePicker
                value={dates}
                onChange={(val) => setDates(val)}
                disabledDate={disabledDate}
                format="YYYY-MM-DD"
                allowClear={false}
                style={{ width: '100%' }}
              />
            </Col>

            <Col span={12}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                <ClockCircleOutlined style={{ marginRight: 4, color: '#7c3aed' }} />
                2. Preferred Daily Time Window:
              </div>
              <TimeRangePicker
                value={times}
                onChange={(val) => setTimes(val)}
                format="HH:mm"
                minuteStep={15}
                needConfirm={false}
                allowClear={false}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>

          {/* Real-Time Formula Breakdown Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 4 }}>
            <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: 10, color: '#64748b' }}>1. Total DB Work</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                {totalWorkHours} hrs
              </div>
              <div style={{ fontSize: 9, color: '#94a3b8' }}>Stored in DB</div>
            </div>

            <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: 10, color: '#64748b' }}>2. Selected Days</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1e3a8a' }}>
                {selectedDays} {selectedDays === 1 ? 'Day' : 'Days'}
              </div>
              <div style={{ fontSize: 9, color: '#94a3b8' }}>
                {dates?.[0]?.format('DD/MM')} – {dates?.[1]?.format('DD/MM')}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: 10, color: '#64748b' }}>3. Avg Daily Split</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>
                ~{avgDailyWorkHours} hrs/day
              </div>
              <div style={{ fontSize: 9, color: '#94a3b8' }}>
                Dynamic Split by Busyness
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: 10, color: '#64748b' }}>4. Target Window</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#7c3aed' }}>
                {timeWindowHours} hrs
              </div>
              <div style={{ fontSize: 9, color: '#94a3b8' }}>
                {times?.[0]?.format('HH:mm')} → {times?.[1]?.format('HH:mm')}
              </div>
            </div>
          </div>

          <Alert
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            message="AI Multi-Day Optimization Active"
            description={
              <div>
                XGBoost Optimizer will automatically distribute <strong>{totalWorkHours} hours</strong> across <strong>{selectedDays} days</strong> based on live corridor train busyness.
              </div>
            }
          />
        </div>
      </div>
    </Modal>
  );
};
