import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Alert,
  message,
  Row,
  Col,
  Divider,
  InputNumber,
  DatePicker,
  Tag,
  Spin
} from 'antd';
import {
  PlusOutlined,
  ToolOutlined,
  ThunderboltOutlined,
  BlockOutlined,
  EnvironmentOutlined,
  CompassOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import { defectService } from '../../services/defectService';
import { stationService } from '../../services/stationService';
import { DefectPredictionModal } from './DefectPredictionModal';

/**
 * Asset Type -> Defect Type Mapping per Department
 */
const ASSET_DEFECT_MAP = {
  TMS: {
    'Rail Section': [
      'Rail Fracture',
      'Weld Defect',
      'Internal Flaw (UFD)',
      'Rail Wear',
      'Corrugation',
      'Missing/Loose Fastener'
    ],
    'Sleeper Set': [
      'Cracked/Broken Sleeper',
      'Sleeper Displacement',
      'Sleeper Cracks'
    ],
    'Ballast Cushion': [
      'Ballast Degradation',
      'Insufficient Ballast Cushion',
      'Ballast Deficiency'
    ],
    'Point & Crossing Turnout': [
      'Worn Point Blade',
      'Crossing Wear',
      'Point Track Joint',
      'Loose/Cracked Fish Plate'
    ],
    'Railway Bridge / Girder': [
      'Deck Slab Crack',
      'Girder Corrosion',
      'Bridge Expansion Defect',
      'Bearing Wear'
    ],
    'Level Crossing Gate': [
      'Level Crossing Rail',
      'Missing/Loose Fastener'
    ]
  },
  SMMS: {
    'Track Circuit (TC)': [
      'Track Circuit Failure',
      'Track Circuit Glitch / Failure',
      'Low Voltage/Shunt Fault',
      'Wheel Sensor Fault',
      'Rail Bonding Fault'
    ],
    'Point Machine (102B / 143)': [
      'Point Machine Failure',
      'Point Machine 102B Overhaul Fault',
      'Switch Blade Misalignment',
      'Locking Fault'
    ],
    'Digital Axle Counter (DAC)': [
      'Axle Counter Malfunction',
      'Axle Counter Sensor Drift',
      'Approach Detection Fault',
      'Wheel Sensor Fault'
    ],
    'Electronic Interlocking (EI)': [
      'EI Card Failure',
      'Interlocking Logic Fault',
      'LC Gate Interlocking Fault',
      'Reset Failure',
      'Software/Data Fault'
    ],
    'Relay Interlocking (PI/RRI)': [
      'Relay Contact Failure',
      'Relay Interlocking Contact Corrosion',
      'Locking Fault'
    ],
    'Signals & LED Aspect': [
      'Signal Lamp Failure',
      'Signal LED Aspect Blanking'
    ],
    'Block Instrument': [
      'Block Instrument Failure',
      'Token Fault'
    ],
    'Power & Comm Link': [
      'Power Supply Fault',
      'Communication Loss',
      'Cable Fault',
      'Cable Insulation Fault',
      'Data Logger Fault',
      'Object Controller Fault'
    ]
  },
  TDMS: {
    'OHE Cantilever & Mast': [
      'OHE Cantilever Insulator Breakdown',
      'Voltage Fluctuation',
      'Line Breakage'
    ],
    'OHE Contact & Catenary Wire': [
      'Contact Wire Wear',
      'Sagging',
      'OHE Catenary Wire Dropper Slackness',
      'Pantograph Contact Wire Abrasion',
      'Insulation Fault'
    ],
    'Traction Substation Transformer (TSS)': [
      'Transformer Failure',
      'Overheating',
      'Substation Transformer Overheating',
      'Oil Leakage',
      'Substation Transformer Oil Leakage'
    ],
    'Switching Post & Neutral Section': [
      'Circuit Breaker Trip',
      'Neutral Section Flashover Defect',
      'Voltage Fluctuation'
    ]
  }
};

/**
 * Standard Detection Methods per Department
 */
const DETECTION_METHODS = {
  TMS: [
    { label: 'Track Recording Car (TRC Survey)', value: 'TRC Survey' },
    { label: 'Ultrasonic Flaw Detector (UFD)', value: 'UFD' },
    { label: 'Foot Patrol / Keyman Inspection', value: 'Manual Patrol' },
    { label: 'Oscillation Monitoring System (OMS)', value: 'OMS Inspection' }
  ],
  SMMS: [
    { label: 'Automatic Signal Failure Alarm', value: 'Signal Failure Alarm' },
    { label: 'Electronic Data Logger Analysis', value: 'Datalogger Analysis' },
    { label: 'Periodic Preventive Maintenance Test', value: 'Preventive Test' },
    { label: 'Visual Field Inspection', value: 'Visual Inspection' }
  ],
  TDMS: [
    { label: 'SCADA Telemetry Sensor Alert', value: 'Sensor Alert' },
    { label: 'Thermal Drone / IR Imaging', value: 'Thermal Drone' },
    { label: 'Loco Cab Visual Patrol', value: 'Visual Patrol' },
    { label: 'Tower Wagon Manual Inspection', value: 'Manual Inspection' }
  ]
};

export const AddDefectModal = ({ open, onClose, defaultAsset = null, onDefectAdded }) => {
  const { currentUser } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [selectedAssetType, setSelectedAssetType] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMatch, setGeoMatch] = useState(null);

  const [predictionModalOpen, setPredictionModalOpen] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);

  const dept = currentUser?.department || 'TMS';
  const deptAssetMap = ASSET_DEFECT_MAP[dept] || ASSET_DEFECT_MAP.TMS;
  const assetTypeOptions = Object.keys(deptAssetMap).map(k => ({ label: k, value: k }));

  const defectOptions = selectedAssetType && deptAssetMap[selectedAssetType]
    ? deptAssetMap[selectedAssetType].map(d => ({ label: d, value: d }))
    : [];

  // Reset all fields completely empty whenever the modal opens (No sample data, only placeholders)
  useEffect(() => {
    if (open) {
      form.resetFields();
      setSelectedAssetType(null);
      setGeoMatch(null);
    }
  }, [open, form, dept]);

  const handleReverseGeocode = async (lat, lon) => {
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;
    try {
      setGeoLoading(true);
      const res = await stationService.getNearestStation(lat, lon);
      setGeoMatch(res);
      // Auto-populate location fields based on GPS coordinates
      form.setFieldsValue({
        sectionId: res.sectionId,
        station1: res.station1,
        station2: res.station2,
        chainage: res.chainageKm,
        corridorCriticality: res.corridorCriticality,
        routeCriticality: res.routeCriticality,
        sectionTrafficDensity: res.trafficDensity,
        trafficTrainsPerDay: res.trafficDensity
      });
    } catch (err) {
      console.warn('Reverse geocode warning:', err);
    } finally {
      setGeoLoading(false);
    }
  };

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      message.warning('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(5));
        const lon = parseFloat(pos.coords.longitude.toFixed(5));
        form.setFieldsValue({ latitude: lat, longitude: lon });
        handleReverseGeocode(lat, lon);
        message.success(`GPS Location Acquired: ${lat}° N, ${lon}° E`);
      },
      (err) => {
        setGeoLoading(false);
        message.info('Please enter coordinates manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleAssetTypeChange = (val) => {
    setSelectedAssetType(val);
    form.setFieldsValue({ defectType: undefined });
  };

  const handleFinish = async (values) => {
    onClose();
    setPredictionModalOpen(true);
    setIsPredicting(true);
    setPredictionResult(null);

    try {
      const repDateStr = values.reportedDate ? values.reportedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
      const lastMaintStr = values.lastMaintenanceDate ? values.lastMaintenanceDate.format('YYYY-MM-DD') : undefined;

      // Extract Clean Status Strings
      let commStatusClean = values.communicationLinkStatus || 'Normal';
      if (commStatusClean.includes('Normal')) commStatusClean = 'Normal';
      else if (commStatusClean.includes('Degraded')) commStatusClean = 'Degraded';
      else if (commStatusClean.includes('Down')) commStatusClean = 'Down';

      let healthClean = values.componentHealth || values.smmsComponentHealth || 'Normal';
      if (healthClean.includes('Normal')) healthClean = 'Normal';
      else if (healthClean.includes('Overheated')) healthClean = 'Overheated';
      else if (healthClean.includes('Faulty') || healthClean.includes('Critical')) healthClean = 'Faulty';

      const payload = {
        // Location & Section
        latitude: values.latitude,
        longitude: values.longitude,
        sectionId: values.sectionId || geoMatch?.sectionId || 'GZB-CNB',
        station1: values.station1 || geoMatch?.station1 || 'GZB',
        station2: values.station2 || geoMatch?.station2 || 'CNB',
        chainageKm: values.chainage || geoMatch?.chainageKm || '142.100',

        // Asset & Defect Classification
        assetId: values.assetId,
        assetType: values.assetType,
        defectType: values.defectType,
        detectionMethod: values.detectionMethod,
        reportedDate: repDateStr,

        // Core Scoring Features
        assetAgeYears: Number(values.assetAgeYears),
        histFailures: Number(values.histFailures),
        overdueDays: Number(values.overdueDays || 0),
        workDurationHrs: Number(values.workDurationHrs || 3.0),

        // Department Specific Telemetry
        sectionTrafficDensity: Number(values.sectionTrafficDensity || values.trafficTrainsPerDay || 110),
        trafficTrainsPerDay: Number(values.trafficTrainsPerDay || values.sectionTrafficDensity || 110),
        corridorCriticality: values.corridorCriticality || 'Trunk',
        routeCriticality: values.routeCriticality || 'HIGH',
        communicationLinkStatus: commStatusClean,
        commLinkStatus: commStatusClean,
        powerSupplyType: values.powerSupplyType,
        interlockingType: values.interlockingType,
        trackStructure: values.trackStructure,
        componentHealth: healthClean,
        voltageV: Number(values.voltageV || 25000),
        currentA: Number(values.currentA || 350),
        powerLoadMW: Number(values.powerLoadMW || 12.5),
        windSpeedKmh: Number(values.windSpeedKmh || 20),
        weatherCondition: values.weatherCondition || 'Clear',

        // Maintenance & Observations
        lastMaintenanceDate: lastMaintStr,
        maintFreqDays: Number(values.maintFreqDays || 90),
        remarks: values.remarks,
        observations: values.remarks
      };

      const result = await defectService.submitDefect(payload);
      setPredictionResult(result);
      form.resetFields();

      setTimeout(() => {
        setIsPredicting(false);
      }, 900);
    } catch (error) {
      console.error('Failed to submit defect:', error);
      setPredictionModalOpen(false);
      message.error(error.response?.data?.message || error.message || 'Defect submission failed');
    }
  };

  const handleBackFromPrediction = () => {
    if (predictionResult?.defect && onDefectAdded) {
      onDefectAdded(predictionResult.defect);
    }
    setPredictionModalOpen(false);
    setPredictionResult(null);
  };

  return (
    <>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ir-text-main)' }}>
            {dept === 'TMS' ? (
              <ToolOutlined style={{ color: '#0284c7', fontSize: 20 }} />
            ) : dept === 'SMMS' ? (
              <ThunderboltOutlined style={{ color: '#d97706', fontSize: 20 }} />
            ) : (
              <BlockOutlined style={{ color: '#7c3aed', fontSize: 20 }} />
            )}
            <span style={{ fontWeight: 700, letterSpacing: '0.5px' }}>
              LOG DEFECT REPORT — {dept} ({dept === 'TMS' ? 'TRACK & PERMANENT WAY' : dept === 'SMMS' ? 'SIGNALLING & TELECOM' : 'TRACTION DISTRIBUTION OHE'})
            </span>
          </div>
        }
        open={open}
        closable={true}
        onCancel={onClose}
        footer={null}
        width={860}
        styles={{ body: { padding: '16px 24px', maxHeight: '82vh', overflowY: 'auto' } }}
      >
        {/* User Session Banner */}
        <Alert
          type="info"
          showIcon
          icon={<CheckCircleOutlined style={{ color: '#0284c7' }} />}
          message={
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13 }}>
              <span><strong>Logged Engineer:</strong> {currentUser?.name || 'Senior Section Engineer'}</span>
              <span><strong>Department:</strong> <Tag color="blue">{dept}</Tag></span>
              <span><strong>Zone:</strong> {currentUser?.zone || 'Northern Railway'}</span>
              <span><strong>Division:</strong> {currentUser?.division || 'Delhi / Lucknow'}</span>
            </div>
          }
          description="Enter the observed defect parameters. All fields are empty for manual entry. Machine Learning evaluates Severity & Priority upon submission."
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical" onFinish={handleFinish}>
          
          {/* SECTION 1: GEOGRAPHIC LOCATION & SECTION MAPPING */}
          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>
                <EnvironmentOutlined style={{ color: '#e11d48', marginRight: 6 }} />
                1. GEOGRAPHIC LOCATION &amp; SECTION MAPPING (REQUIRED)
              </span>
              <Button
                size="small"
                type="primary"
                icon={<CompassOutlined />}
                onClick={handleCaptureGPS}
                loading={geoLoading}
                style={{ background: '#0284c7', borderColor: '#0284c7' }}
              >
                Auto GPS Capture
              </Button>
            </div>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="Latitude (° Decimal Degrees)"
                  name="latitude"
                  rules={[{ required: true, message: 'Please enter Latitude' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    step={0.0001}
                    placeholder="e.g. 28.6430"
                    onChange={(val) => {
                      const lon = form.getFieldValue('longitude');
                      if (val && lon) handleReverseGeocode(val, lon);
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Longitude (° Decimal Degrees)"
                  name="longitude"
                  rules={[{ required: true, message: 'Please enter Longitude' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    step={0.0001}
                    placeholder="e.g. 77.2197"
                    onChange={(val) => {
                      const lat = form.getFieldValue('latitude');
                      if (lat && val) handleReverseGeocode(lat, val);
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Derived Section Confirmation Badge */}
            <div style={{ padding: '8px 12px', background: '#e0f2fe', borderRadius: 6, border: '1px solid #bae6fd', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              {geoLoading ? <Spin size="small" /> : <InfoCircleOutlined style={{ color: '#0369a1' }} />}
              <span style={{ fontSize: 12, color: '#0369a1', fontWeight: 600 }}>
                {geoMatch?.summaryText || 'Enter Latitude & Longitude or click "Auto GPS Capture" to auto-identify nearest railway station.'}
              </span>
            </div>

            <Row gutter={12}>
              <Col span={6}>
                <Form.Item label="Section ID" name="sectionId" rules={[{ required: true, message: 'Please enter Section ID' }]}>
                  <Input placeholder="e.g. GZB-CNB" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Station 1 (From)" name="station1" rules={[{ required: true, message: 'Please enter Station 1' }]}>
                  <Input placeholder="e.g. GZB" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Station 2 (To)" name="station2" rules={[{ required: true, message: 'Please enter Station 2' }]}>
                  <Input placeholder="e.g. CNB" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Chainage (KM)" name="chainage" rules={[{ required: true, message: 'Please enter Chainage' }]}>
                  <Input placeholder="e.g. 142.100" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* SECTION 2: ASSET & DEFECT CLASSIFICATION */}
          <Divider orientation="left" style={{ margin: '12px 0 14px', fontSize: 13, color: '#334155', fontWeight: 700 }}>
            2. ASSET &amp; DEFECT CLASSIFICATION (REQUIRED)
          </Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Asset ID / Tag" name="assetId" rules={[{ required: true, message: 'Please enter Asset ID' }]}>
                <Input placeholder="e.g. TRK-RAIL-142 / SIG-PT-102" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Asset Type"
                name="assetType"
                rules={[{ required: true, message: 'Please select Asset Type' }]}
                tooltip="Selecting Asset Type dynamically filters available Defect Types"
              >
                <Select placeholder="Select Asset Type first" options={assetTypeOptions} onChange={handleAssetTypeChange} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Observed Defect Type"
                name="defectType"
                rules={[{ required: true, message: 'Please select Defect Type' }]}
              >
                <Select
                  showSearch
                  placeholder={selectedAssetType ? 'Select Defect Type' : 'Select Asset Type first'}
                  disabled={!selectedAssetType}
                  options={defectOptions}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Detection Method" name="detectionMethod" rules={[{ required: true, message: 'Please select Detection Method' }]}>
                <Select placeholder="Select detection method" options={DETECTION_METHODS[dept] || DETECTION_METHODS.TMS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Reported Date"
                name="reportedDate"
                rules={[{ required: true, message: 'Please select Reported Date' }]}
                tooltip="Overdue Days is computed from today - Reported Date"
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Select Reported Date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Overdue Days"
                name="overdueDays"
                rules={[{ required: true, message: 'Please enter Overdue Days' }]}
                tooltip="Days unresolved beyond standard inspection window"
              >
                <InputNumber min={0} max={365} style={{ width: '100%' }} placeholder="e.g. 0" />
              </Form.Item>
            </Col>
          </Row>

          {/* SECTION 3: CORE ML SCORING PARAMETERS */}
          <Divider orientation="left" style={{ margin: '12px 0 14px', fontSize: 13, color: '#334155', fontWeight: 700 }}>
            3. PHYSICAL SCORING PARAMETERS (REQUIRED)
          </Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Asset Age (Years)"
                name="assetAgeYears"
                rules={[{ required: true, message: 'Please enter Asset Age' }]}
                tooltip="Operational service life in years"
              >
                <InputNumber min={0.1} max={50} step={0.5} style={{ width: '100%' }} placeholder="e.g. 4.5" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Past Historical Failures"
                name="histFailures"
                rules={[{ required: true, message: 'Please enter Historical Failures' }]}
                tooltip="Previous breakdown instances on this asset"
              >
                <InputNumber min={0} max={40} style={{ width: '100%' }} placeholder="e.g. 1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Required Block Duration (Hours)"
                name="workDurationHrs"
                rules={[{ required: true, message: 'Please enter Required Duration' }]}
                tooltip="Estimated possession block duration in hours"
              >
                <InputNumber min={0.5} max={16} step={0.5} style={{ width: '100%' }} placeholder="e.g. 3.5" />
              </Form.Item>
            </Col>
          </Row>

          {/* SECTION 4: DEPARTMENT-SPECIFIC TELEMETRY & PHYSICAL ATTRIBUTES */}
          <Divider orientation="left" style={{ margin: '12px 0 14px', fontSize: 13, color: '#334155', fontWeight: 700 }}>
            4. {dept} DEPARTMENT PHYSICAL TELEMETRY (REQUIRED)
          </Divider>

          {dept === 'TMS' && (
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Traffic Density (Trains/Day)"
                  name="sectionTrafficDensity"
                  rules={[{ required: true, message: 'Please enter Traffic Density' }]}
                >
                  <InputNumber min={10} max={300} style={{ width: '100%' }} placeholder="e.g. 110" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Corridor Criticality"
                  name="corridorCriticality"
                  rules={[{ required: true, message: 'Please select Corridor Criticality' }]}
                >
                  <Select placeholder="Select Corridor Criticality" options={[
                    { label: 'Trunk (High Density Corridor)', value: 'Trunk' },
                    { label: 'Branch (Feeder Line)', value: 'Branch' }
                  ]} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Track Structure / Ballast"
                  name="trackStructure"
                  rules={[{ required: true, message: 'Please select Track Structure' }]}
                >
                  <Select placeholder="Select Track Structure" options={[
                    { label: '60kg UIC Rail on PSC Sleeper', value: '60kg UIC Rail on PSC Sleeper' },
                    { label: '52kg Rail on PSC Sleeper', value: '52kg Rail on PSC Sleeper' },
                    { label: 'Turnout / Point Zone', value: 'Turnout / Point Zone' }
                  ]} />
                </Form.Item>
              </Col>
            </Row>
          )}

          {dept === 'SMMS' && (
            <>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Traffic Density (Trains/Day)"
                    name="sectionTrafficDensity"
                    rules={[{ required: true, message: 'Please enter Traffic Density' }]}
                  >
                    <InputNumber min={10} max={300} style={{ width: '100%' }} placeholder="e.g. 110" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Corridor Criticality"
                    name="corridorCriticality"
                    rules={[{ required: true, message: 'Please select Corridor Criticality' }]}
                  >
                    <Select placeholder="Select Corridor Criticality" options={[
                      { label: 'Trunk (High Density Corridor)', value: 'Trunk' },
                      { label: 'Branch (Feeder Line)', value: 'Branch' }
                    ]} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Communication Link Status"
                    name="communicationLinkStatus"
                    rules={[{ required: true, message: 'Please select Comm Link Status' }]}
                  >
                    <Select placeholder="Select Comm Link Status" options={[
                      { label: 'Normal (OFC Primary)', value: 'Normal (OFC Primary)' },
                      { label: 'Degraded (Copper Backup)', value: 'Degraded (Copper Backup)' },
                      { label: 'Down (No Signal Feed)', value: 'Down (No Signal Feed)' }
                    ]} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Power Supply Type"
                    name="powerSupplyType"
                    rules={[{ required: true, message: 'Please select Power Supply Type' }]}
                  >
                    <Select placeholder="Select Power Supply Type" options={[
                      { label: 'Dual-Fed 110V AC', value: 'Dual-Fed 110V AC' },
                      { label: 'Solar + Battery Bank', value: 'Solar + Battery Bank' },
                      { label: 'Grid Commercial Supply', value: 'Grid Commercial Supply' },
                      { label: 'DG Standby Power', value: 'DG Standby Power' }
                    ]} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Interlocking System"
                    name="interlockingType"
                    rules={[{ required: true, message: 'Please select Interlocking System' }]}
                  >
                    <Select placeholder="Select Interlocking System" options={[
                      { label: 'Electronic Interlocking (EI)', value: 'Electronic Interlocking (EI)' },
                      { label: 'Route Relay Interlocking (RRI)', value: 'Route Relay Interlocking (RRI)' },
                      { label: 'Panel Interlocking (PI)', value: 'Panel Interlocking (PI)' },
                      { label: 'Solid State Interlocking (SSI)', value: 'Solid State Interlocking (SSI)' }
                    ]} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Component Health"
                    name="smmsComponentHealth"
                    rules={[{ required: true, message: 'Please select Component Health' }]}
                  >
                    <Select placeholder="Select Component Health" options={[
                      { label: 'Normal (100% Health)', value: 'Normal (100%)' },
                      { label: 'Degraded (70% Health)', value: 'Degraded (70%)' },
                      { label: 'Critical Fault (30% Health)', value: 'Critical Fault (30%)' }
                    ]} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {dept === 'TDMS' && (
            <>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Component Health Status"
                    name="componentHealth"
                    rules={[{ required: true, message: 'Please select Component Health' }]}
                  >
                    <Select placeholder="Select Component Health" options={[
                      { label: 'Normal (Nominal Telemetry)', value: 'Normal (Nominal Telemetry)' },
                      { label: 'Overheated (Thermal Anomaly)', value: 'Overheated (Thermal Anomaly)' },
                      { label: 'Faulty (Tripping / Insulation Drop)', value: 'Faulty (Tripping / Insulation Drop)' }
                    ]} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Route Criticality"
                    name="routeCriticality"
                    rules={[{ required: true, message: 'Please select Route Criticality' }]}
                  >
                    <Select placeholder="Select Route Criticality" options={[
                      { label: 'HIGH (HD Route / Golden Quad)', value: 'HIGH' },
                      { label: 'MEDIUM (Main Feeder Route)', value: 'MEDIUM' },
                      { label: 'LOW (Branch Section)', value: 'LOW' }
                    ]} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Traffic Density (Trains/Day)"
                    name="trafficTrainsPerDay"
                    rules={[{ required: true, message: 'Please enter Traffic Density' }]}
                  >
                    <InputNumber min={10} max={300} style={{ width: '100%' }} placeholder="e.g. 120" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item
                    label="Traction Voltage (V)"
                    name="voltageV"
                    rules={[{ required: true, message: 'Please enter Voltage' }]}
                    tooltip="Standard 25,000V AC OHE Supply"
                  >
                    <InputNumber min={10000} max={35000} step={100} style={{ width: '100%' }} placeholder="e.g. 25000" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="Load Current (A)"
                    name="currentA"
                    rules={[{ required: true, message: 'Please enter Current' }]}
                    tooltip="Traction current in Amperes"
                  >
                    <InputNumber min={50} max={1200} style={{ width: '100%' }} placeholder="e.g. 350" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="Power Load (MW)"
                    name="powerLoadMW"
                    rules={[{ required: true, message: 'Please enter Power Load' }]}
                    tooltip="Active power draw in Megawatts"
                  >
                    <InputNumber min={0.5} max={40} step={0.5} style={{ width: '100%' }} placeholder="e.g. 12.5" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="Wind Speed (km/h)"
                    name="windSpeedKmh"
                    rules={[{ required: true, message: 'Please enter Wind Speed' }]}
                  >
                    <InputNumber min={0} max={150} style={{ width: '100%' }} placeholder="e.g. 20" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="Environmental Weather Condition"
                    name="weatherCondition"
                    rules={[{ required: true, message: 'Please select Weather Condition' }]}
                  >
                    <Select placeholder="Select Weather Condition" options={[
                      { label: 'Clear', value: 'Clear' },
                      { label: 'High Wind / Storm', value: 'High Wind' },
                      { label: 'Rainy / Moisture', value: 'Rainy' },
                      { label: 'Dense Fog', value: 'Dense Fog' }
                    ]} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* SECTION 5: MAINTENANCE AUDIT & FIELD OBSERVATIONS */}
          <Divider orientation="left" style={{ margin: '12px 0 14px', fontSize: 13, color: '#334155', fontWeight: 700 }}>
            5. MAINTENANCE AUDIT &amp; FIELD OBSERVATIONS (REQUIRED)
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Last Maintenance Date"
                name="lastMaintenanceDate"
                rules={[{ required: true, message: 'Please select Last Maintenance Date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Select Last Maintenance Date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Maintenance Frequency (Days)"
                name="maintFreqDays"
                rules={[{ required: true, message: 'Please enter Maintenance Frequency' }]}
              >
                <InputNumber min={7} max={365} style={{ width: '100%' }} placeholder="e.g. 90" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Field Engineer Observations &amp; Remarks"
            name="remarks"
            rules={[{ required: true, message: 'Please enter Observations and Remarks' }]}
          >
            <Input.TextArea rows={3} placeholder="Enter inspector observations, physical component anomalies, and field remarks..." />
          </Form.Item>

          <Divider style={{ margin: '16px 0 14px' }} />

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<PlusOutlined />}
              loading={loading}
              style={{
                background: dept === 'SMMS' ? '#d97706' : dept === 'TDMS' ? '#7c3aed' : '#0284c7',
                borderColor: dept === 'SMMS' ? '#d97706' : dept === 'TDMS' ? '#7c3aed' : '#0284c7',
                fontWeight: 700,
                padding: '0 28px'
              }}
            >
              Submit Defect to AI Engine
            </Button>
          </div>
        </Form>
      </Modal>

      {/* AI Assessment & Scoring Output Modal */}
      <DefectPredictionModal
        open={predictionModalOpen}
        isPredicting={isPredicting}
        defect={predictionResult?.defect}
        mlAssessment={predictionResult?.mlAssessment}
        department={dept}
        onBack={handleBackFromPrediction}
      />
    </>
  );
};
