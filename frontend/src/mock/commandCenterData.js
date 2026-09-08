// Synthetic Railway Data Model for PRAGATI Network Command Center
// Label: "Simulation Mode — Synthetic Railway Data"

export const COMMAND_CENTER_ZONES = {
  "Northern Railway": {
    code: "NR",
    headquarters: "New Delhi",
    divisions: {
      "Lucknow": {
        code: "LKO",
        controlAreas: {
          "Lucknow–Kanpur": {
            id: "NR-LKO-CNB",
            sectionName: "Lucknow Junction (LKO) — Kanpur Central (CNB) Double Line",
            lengthKm: 72.5,
            lineType: "Double Line Electrified",
            electrification: "25 kV AC 50 Hz",
            blockSystem: "Absolute / Automatic Block Signalling",
            trafficDensity: "HIGH (44 Trains / Day)",
            avgTrainsPerHour: 3.8,
            maintenanceDebtHours: 14.5,
            
            // Schematic Nodes (x, y coordinates for schematic map canvas 0-1000 x 0-400)
            stations: [
              { id: 'ST-LKO', code: 'LKO', name: 'Lucknow Junction', x: 80, y: 150, type: 'terminal', tracksCount: 6 },
              { id: 'ST-AMS', code: 'AMS', name: 'Amausi', x: 220, y: 150, type: 'station', tracksCount: 3 },
              { id: 'ST-HRN', code: 'HRN', name: 'Harauni', x: 360, y: 150, type: 'station', tracksCount: 3 },
              { id: 'ST-JTU', code: 'JTU', name: 'Jaitipur', x: 500, y: 150, type: 'station', tracksCount: 2 },
              { id: 'ST-BCN', code: 'BCN', name: 'Bachhrawan', x: 640, y: 150, type: 'junction', tracksCount: 4 },
              { id: 'ST-ON',  code: 'ON',  name: 'Unnao Junction', x: 780, y: 150, type: 'junction', tracksCount: 5 },
              { id: 'ST-CNB', code: 'CNB', name: 'Kanpur Central', x: 920, y: 150, type: 'terminal', tracksCount: 10 }
            ],
            
            yards: [
              { id: 'YRD-LKO', code: 'LKO-YARD', name: 'Lucknow Freight Yard', x: 100, y: 260, linkedStation: 'LKO' },
              { id: 'YRD-CNB', code: 'CNB-YARD', name: 'Kanpur Goods Shed & Loco Trip Shed', x: 900, y: 260, linkedStation: 'CNB' }
            ],

            // Tracks (UP Main line y=130, DN Main line y=170, Branch line split y=260)
            tracks: [
              { id: 'TRK-UP-MAIN', name: 'UP Main Line', type: 'MAIN', y: 130, status: 'CLEAR' },
              { id: 'TRK-DN-MAIN', name: 'DN Main Line', type: 'MAIN', y: 170, status: 'CLEAR' },
              { id: 'TRK-BRANCH-ON', name: 'Unnao-Balamau Branch', type: 'BRANCH', startX: 780, startY: 150, endX: 860, endY: 260, status: 'CLEAR' }
            ],

            // Points / Switches
            points: [
              { id: 'P-101', station: 'LKO', location: 'LKO West Crossover', type: 'Turnout', state: 'NORMAL', lock: 'LOCKED', health: 'Healthy', activeRoute: 'LKO UP Main -> Platform 1' },
              { id: 'P-104', station: 'BCN', location: 'Bachhrawan Loop Switch', type: 'Crossover', state: 'NORMAL', lock: 'LOCKED', health: 'Attention Needed', activeRoute: 'BCN DN Loop -> Main' },
              { id: 'P-112', station: 'ON', location: 'Unnao Branch Junction Switch', type: 'Double Slip', state: 'REVERSE', lock: 'LOCKED', health: 'Healthy', activeRoute: 'ON -> Balamau Branch' }
            ],

            // Signals
            signals: [
              { id: 'S-LKO-01', station: 'LKO', positionX: 120, trackY: 130, aspect: 'CLEAR', route: 'LKO -> AMS UP', lastChanged: '15:40:12', failureStatus: 'NONE' },
              { id: 'S-AMS-02', station: 'AMS', positionX: 250, trackY: 130, aspect: 'CLEAR', route: 'AMS -> HRN UP', lastChanged: '15:38:00', failureStatus: 'NONE' },
              { id: 'S-HRN-03', station: 'HRN', positionX: 390, trackY: 130, aspect: 'CAUTION', route: 'HRN -> JTU UP', lastChanged: '15:42:05', failureStatus: 'NONE' },
              { id: 'S-BCN-04', station: 'BCN', positionX: 670, trackY: 130, aspect: 'STOP', route: 'BCN -> ON UP', lastChanged: '15:44:10', failureStatus: 'NONE' },
              { id: 'S-ON-05',  station: 'ON',  positionX: 810, trackY: 130, aspect: 'CLEAR', route: 'ON -> CNB UP', lastChanged: '15:35:50', failureStatus: 'NONE' },
              { id: 'S-BCN-DN', station: 'BCN', positionX: 610, trackY: 170, aspect: 'FAILURE', route: 'BCN -> JTU DN', lastChanged: '15:10:00', failureStatus: 'Track Circuit Glitch' }
            ],

            // Block Sections
            blocks: [
              { id: 'BLK-LKO-AMS', code: 'B-101', section: 'LKO -> AMS', startX: 80, endX: 220, trackY: 130, status: 'OCCUPIED', trainId: '15014', direction: 'UP', releaseTime: '15:48', maintenanceAvailable: false },
              { id: 'BLK-AMS-HRN', code: 'B-102', section: 'AMS -> HRN', startX: 220, endX: 360, trackY: 130, status: 'CLEAR', trainId: null, direction: 'UP', releaseTime: 'NOW', maintenanceAvailable: true },
              { id: 'BLK-HRN-JTU', code: 'B-103', section: 'HRN -> JTU', startX: 360, endX: 500, trackY: 130, status: 'OCCUPIED', trainId: '22977', direction: 'UP', releaseTime: '15:56', maintenanceAvailable: false },
              { id: 'BLK-JTU-BCN', code: 'B-104', section: 'JTU -> BCN', startX: 500, endX: 640, trackY: 130, status: 'CLEAR', trainId: null, direction: 'UP', releaseTime: 'NOW', maintenanceAvailable: true },
              { id: 'BLK-BCN-ON',  code: 'B-105', section: 'BCN -> ON',  startX: 640, endX: 780, trackY: 130, status: 'OCCUPIED', trainId: '12419', direction: 'UP', releaseTime: '16:08', maintenanceAvailable: false },
              { id: 'BLK-ON-CNB',  code: 'B-106', section: 'ON -> CNB',  startX: 780, endX: 920, trackY: 130, status: 'CLEAR', trainId: null, direction: 'UP', releaseTime: 'NOW', maintenanceAvailable: true }
            ],

            // Trains
            trains: [
              { id: '15014', number: '15014', name: 'LKO-CNB Express', type: 'Express', direction: 'UP', speed: 65, delayMins: 18, status: 'DELAYED', currentBlock: 'B-101', positionX: 150, trackY: 130, from: 'Lucknow', to: 'Kanpur', nextStation: 'Amausi', etaNext: '15:48', line: 'UP Main' },
              { id: '22977', number: '22977', name: 'BDTS-LKO SF Exp', type: 'Superfast', direction: 'UP', speed: 78, delayMins: 7, status: 'RUNNING', currentBlock: 'B-103', positionX: 420, trackY: 130, from: 'Bandra', to: 'Lucknow', nextStation: 'Bachhrawan', etaNext: '15:56', line: 'UP Main' },
              { id: '12419', number: '12419', name: 'Gomti Express', type: 'Superfast', direction: 'UP', speed: 45, delayMins: 0, status: 'ON TIME', currentBlock: 'B-105', positionX: 710, trackY: 130, from: 'Lucknow', to: 'New Delhi', nextStation: 'Unnao', etaNext: '16:05', line: 'UP Main' },
              { id: 'G-402',  number: 'G-402',  name: 'Container Freight BCN', type: 'Goods', direction: 'DN', speed: 40, delayMins: 25, status: 'HELD', currentBlock: 'B-104', positionX: 580, trackY: 170, from: 'Kanpur Yard', to: 'Lucknow Yard', nextStation: 'Harauni', etaNext: '16:20', line: 'DN Main' }
            ],

            // Active Alerts
            alerts: [
              { id: 'ALT-C1', severity: 'CRITICAL', title: 'S&T Signal Failure S-BCN-DN', section: 'BCN–JTU Down Line', time: '15:10:00', asset: 'Track Circuit TC-402', impact: 'Subsequent Down freight train held at BCN.' },
              { id: 'ALT-W1', severity: 'WARNING', title: 'Track Maintenance Overdue: T-104 Rail Head Wear', section: 'JTU–BCN Block B-104', time: '14:30:00', asset: 'Rail T-104', impact: 'Requires 12-minute tamping block before 17:00.' },
              { id: 'ALT-I1', severity: 'INFO', title: 'Train 15014 entering section LKO–AMS', section: 'LKO–AMS', time: '15:40:12', asset: 'Signal S-LKO-01', impact: 'Normal traffic movement.' }
            ],

            // RAILWISE AI Block Opportunities
            aiOpportunities: [
              {
                id: 'AI-OPP-01',
                sectionCode: 'JTU–BCN (Block B-104)',
                startStation: 'Jaitipur (JTU)',
                endStation: 'Bachhrawan (BCN)',
                startX: 500,
                endX: 640,
                trackY: 130,
                opportunityWindow: '16:08 – 16:20',
                durationMins: 12,
                confidence: 94,
                assetAvailabilityGain: '+4.8%',
                predictedDelayImpact: '0–2 min',
                riskTier: 'LOW',
                reasoning: 'Train 15014 clears block B-104 at 16:08. Next scheduled train 22977 enters at 16:21. 13-minute gap allows immediate 12-minute track tamping block.',
                requiredCrew: 6,
                requiredMachine: 'Tamping Machine #CS-04',
                beforeState: { deferredMaintenance: true, predictedFutureDelay: '+18 min', assetAvailability: '88.2%' },
                afterState: { completedMaintenance: true, predictedFutureDelay: '+1 min', assetAvailability: '93.0%' }
              }
            ]
          }
        }
      },
      "Delhi": {
        code: "DLI",
        controlAreas: {
          "Delhi–Ambala": {
            id: "NR-DLI-UMB",
            sectionName: "New Delhi (NDLS) — Ambala Cantt (UMB) Quad/Double Corridor",
            lengthKm: 198.0,
            lineType: "Double Track High-Density Corridor",
            electrification: "25 kV AC 50 Hz",
            blockSystem: "Automatic Block Signalling (ABS)",
            trafficDensity: "CRITICAL (96 Trains / Day)",
            avgTrainsPerHour: 6.2,
            maintenanceDebtHours: 22.0,
            
            stations: [
              { id: 'ST-NDLS', code: 'NDLS', name: 'New Delhi', x: 80, y: 150, type: 'terminal', tracksCount: 16 },
              { id: 'ST-SZM',  code: 'SZM',  name: 'Subzi Mandi', x: 220, y: 150, type: 'station', tracksCount: 4 },
              { id: 'ST-SNP',  code: 'SNP',  name: 'Sonepat', x: 380, y: 150, type: 'station', tracksCount: 4 },
              { id: 'ST-PNP',  code: 'PNP',  name: 'Panipat Junction', x: 540, y: 150, type: 'junction', tracksCount: 6 },
              { id: 'ST-KUN',  code: 'KUN',  name: 'Karnal', x: 700, y: 150, type: 'station', tracksCount: 3 },
              { id: 'ST-UMB',  code: 'UMB',  name: 'Ambala Cantt', x: 920, y: 150, type: 'terminal', tracksCount: 8 }
            ],
            yards: [
              { id: 'YRD-PNP', code: 'PNP-YARD', name: 'Panipat IOCL Refinery Yard', x: 560, y: 260, linkedStation: 'PNP' }
            ],
            tracks: [
              { id: 'TRK-UP-FAST', name: 'UP Fast Line', type: 'MAIN', y: 130, status: 'CLEAR' },
              { id: 'TRK-DN-FAST', name: 'DN Fast Line', type: 'MAIN', y: 170, status: 'CLEAR' }
            ],
            points: [
              { id: 'P-201', station: 'NDLS', location: 'NDLS North Throat', type: 'Double Slip', state: 'NORMAL', lock: 'LOCKED', health: 'Healthy', activeRoute: 'NDLS -> SZM UP Fast' },
              { id: 'P-208', station: 'PNP', location: 'Panipat Yard Switch', type: 'Turnout', state: 'REVERSE', lock: 'LOCKED', health: 'Healthy', activeRoute: 'PNP -> IOCL Siding' }
            ],
            signals: [
              { id: 'S-NDLS-01', station: 'NDLS', positionX: 120, trackY: 130, aspect: 'CLEAR', route: 'NDLS -> SZM UP', lastChanged: '15:41:00', failureStatus: 'NONE' },
              { id: 'S-SNP-04',  station: 'SNP',  positionX: 410, trackY: 130, aspect: 'CAUTION', route: 'SNP -> PNP UP', lastChanged: '15:39:12', failureStatus: 'NONE' },
              { id: 'S-PNP-06',  station: 'PNP',  positionX: 580, trackY: 130, aspect: 'STOP', route: 'PNP -> KUN UP', lastChanged: '15:43:00', failureStatus: 'NONE' }
            ],
            blocks: [
              { id: 'BLK-NDLS-SZM', code: 'B-201', section: 'NDLS -> SZM', startX: 80, endX: 220, trackY: 130, status: 'OCCUPIED', trainId: '12004', direction: 'UP', releaseTime: '15:47', maintenanceAvailable: false },
              { id: 'BLK-SZM-SNP',  code: 'B-202', section: 'SZM -> SNP',  startX: 220, endX: 380, trackY: 130, status: 'CLEAR', trainId: null, direction: 'UP', releaseTime: 'NOW', maintenanceAvailable: true },
              { id: 'BLK-SNP-PNP',  code: 'B-203', section: 'SNP -> PNP',  startX: 380, endX: 540, trackY: 130, status: 'OCCUPIED', trainId: '12425', direction: 'UP', releaseTime: '15:54', maintenanceAvailable: false }
            ],
            trains: [
              { id: '12004', number: '12004', name: 'Kalka Shatabdi', type: 'Shatabdi', direction: 'UP', speed: 110, delayMins: 0, status: 'ON TIME', currentBlock: 'B-201', positionX: 140, trackY: 130, from: 'New Delhi', to: 'Kalka', nextStation: 'Subzi Mandi', etaNext: '15:47', line: 'UP Fast' },
              { id: '12425', number: '12425', name: 'Jammu Rajdhani', type: 'Rajdhani', direction: 'UP', speed: 120, delayMins: 3, status: 'RUNNING', currentBlock: 'B-203', positionX: 460, trackY: 130, from: 'New Delhi', to: 'Jammu Tawi', nextStation: 'Panipat', etaNext: '15:54', line: 'UP Fast' }
            ],
            alerts: [
              { id: 'ALT-W2', severity: 'WARNING', title: 'OHE Voltage Dip at Panipat Junction', section: 'PNP–KUN', time: '15:30:00', asset: 'OHE Substation PNP-2', impact: 'Speed capped to 90 km/h.' }
            ],
            aiOpportunities: [
              {
                id: 'AI-OPP-02',
                sectionCode: 'SZM–SNP (Block B-202)',
                startStation: 'Subzi Mandi (SZM)',
                endStation: 'Sonepat (SNP)',
                startX: 220,
                endX: 380,
                trackY: 130,
                opportunityWindow: '15:50 – 16:08',
                durationMins: 18,
                confidence: 96,
                assetAvailabilityGain: '+6.2%',
                predictedDelayImpact: '0 min',
                riskTier: 'LOW',
                reasoning: '18-minute headway gap between Shatabdi (12004) and Rajdhani (12425) on UP Fast line allows OHE insulator replacement.',
                requiredCrew: 8,
                requiredMachine: 'OHE Tower Wagon OHE-14',
                beforeState: { deferredMaintenance: true, predictedFutureDelay: '+25 min', assetAvailability: '84.0%' },
                afterState: { completedMaintenance: true, predictedFutureDelay: '0 min', assetAvailability: '95.5%' }
              }
            ]
          }
        }
      }
    }
  },
  "North Eastern Railway": {
    code: "NER",
    headquarters: "Gorakhpur",
    divisions: {
      "Lucknow": {
        code: "LKO-NER",
        controlAreas: {
          "Lucknow–Varanasi": {
            id: "NER-LKO-BSB",
            sectionName: "Lucknow City (LC) — Varanasi Junction (BSB) Line",
            lengthKm: 285.0,
            lineType: "Single/Double Electrified Line",
            electrification: "25 kV AC 50 Hz",
            blockSystem: "Absolute Block System",
            trafficDensity: "MEDIUM (32 Trains / Day)",
            avgTrainsPerHour: 2.2,
            maintenanceDebtHours: 18.0,

            stations: [
              { id: 'ST-LC',  code: 'LC',  name: 'Lucknow City', x: 80, y: 150, type: 'terminal', tracksCount: 4 },
              { id: 'ST-BNZ', code: 'BNZ', name: 'Badshahnagar', x: 240, y: 150, type: 'station', tracksCount: 3 },
              { id: 'ST-BBK', code: 'BBK', name: 'Barabanki Junction', x: 420, y: 150, type: 'junction', tracksCount: 6 },
              { id: 'ST-AY',  code: 'AY',  name: 'Ayodhya Dham', x: 680, y: 150, type: 'junction', tracksCount: 5 },
              { id: 'ST-BSB', code: 'BSB', name: 'Varanasi Junction', x: 920, y: 150, type: 'terminal', tracksCount: 9 }
            ],
            yards: [
              { id: 'YRD-BSB', code: 'BSB-YARD', name: 'Varanasi Marshalling Yard', x: 900, y: 260, linkedStation: 'BSB' }
            ],
            tracks: [
              { id: 'TRK-MAIN-NER', name: 'Main Line NER', type: 'MAIN', y: 150, status: 'CLEAR' }
            ],
            points: [
              { id: 'P-301', station: 'BBK', location: 'Barabanki NER Junction Switch', type: 'Crossover', state: 'NORMAL', lock: 'LOCKED', health: 'Healthy', activeRoute: 'BBK Main -> Ayodhya Line' }
            ],
            signals: [
              { id: 'S-LC-01',  station: 'LC',  positionX: 120, trackY: 150, aspect: 'CLEAR', route: 'LC -> BNZ', lastChanged: '15:20:00', failureStatus: 'NONE' },
              { id: 'S-BBK-02', station: 'BBK', positionX: 450, trackY: 150, aspect: 'CAUTION', route: 'BBK -> AY', lastChanged: '15:35:00', failureStatus: 'NONE' }
            ],
            blocks: [
              { id: 'BLK-LC-BNZ', code: 'B-301', section: 'LC -> BNZ', startX: 80, endX: 240, trackY: 150, status: 'OCCUPIED', trainId: '14206', direction: 'UP', releaseTime: '15:52', maintenanceAvailable: false },
              { id: 'BLK-BNZ-BBK', code: 'B-302', section: 'BNZ -> BBK', startX: 240, endX: 420, trackY: 150, status: 'CLEAR', trainId: null, direction: 'UP', releaseTime: 'NOW', maintenanceAvailable: true }
            ],
            trains: [
              { id: '14206', number: '14206', name: 'Ayodhya Express', type: 'Express', direction: 'UP', speed: 55, delayMins: 12, status: 'RUNNING', currentBlock: 'B-301', positionX: 160, trackY: 150, from: 'Delhi', to: 'Ayodhya', nextStation: 'Badshahnagar', etaNext: '15:52', line: 'Main Line' }
            ],
            alerts: [
              { id: 'ALT-I2', severity: 'INFO', title: 'Barabanki Yard Maintenance Complete', section: 'BBK', time: '14:00:00', asset: 'Point P-301', impact: 'Cleared for high speed.' }
            ],
            aiOpportunities: [
              {
                id: 'AI-OPP-03',
                sectionCode: 'BNZ–BBK (Block B-302)',
                startStation: 'Badshahnagar (BNZ)',
                endStation: 'Barabanki (BBK)',
                startX: 240,
                endX: 420,
                trackY: 150,
                opportunityWindow: '15:55 – 16:20',
                durationMins: 25,
                confidence: 91,
                assetAvailabilityGain: '+5.5%',
                predictedDelayImpact: '0 min',
                riskTier: 'LOW',
                reasoning: '25-minute single-line train clearance gap between Ayodhya Express and upcoming intercity.',
                requiredCrew: 5,
                requiredMachine: 'Manual Gang #12',
                beforeState: { deferredMaintenance: true, predictedFutureDelay: '+15 min', assetAvailability: '86.5%' },
                afterState: { completedMaintenance: true, predictedFutureDelay: '0 min', assetAvailability: '92.0%' }
              }
            ]
          }
        }
      }
    }
  },
  "North Central Railway": {
    code: "NCR",
    headquarters: "Prayagraj",
    divisions: {
      "Prayagraj": {
        code: "PRYJ",
        controlAreas: {
          "Kanpur–Prayagraj": {
            id: "NCR-CNB-PRYJ",
            sectionName: "Kanpur Central (CNB) — Prayagraj Junction (PRYJ) High-Speed Corridor",
            lengthKm: 194.0,
            lineType: "Triple Track Electrified Corridor",
            electrification: "25 kV AC 50 Hz",
            blockSystem: "Automatic Block Signalling (ABS)",
            trafficDensity: "CRITICAL (110 Trains / Day)",
            avgTrainsPerHour: 7.1,
            maintenanceDebtHours: 26.0,

            stations: [
              { id: 'ST-CNB2', code: 'CNB',  name: 'Kanpur Central', x: 80, y: 150, type: 'terminal', tracksCount: 10 },
              { id: 'ST-FTP',  code: 'FTP',  name: 'Fatehpur', x: 340, y: 150, type: 'station', tracksCount: 4 },
              { id: 'ST-SRO',  code: 'SRO',  name: 'Sirathu', x: 600, y: 150, type: 'station', tracksCount: 3 },
              { id: 'ST-PRYJ', code: 'PRYJ', name: 'Prayagraj Junction', x: 920, y: 150, type: 'terminal', tracksCount: 12 }
            ],
            yards: [
              { id: 'YRD-PRYJ', code: 'PRYJ-YARD', name: 'Subedarganj Goods Yard', x: 880, y: 260, linkedStation: 'PRYJ' }
            ],
            tracks: [
              { id: 'TRK-NCR-UP', name: 'NCR UP Trunk', type: 'MAIN', y: 130, status: 'CLEAR' },
              { id: 'TRK-NCR-DN', name: 'NCR DN Trunk', type: 'MAIN', y: 170, status: 'CLEAR' }
            ],
            points: [
              { id: 'P-401', station: 'CNB', location: 'CNB East Crossover', type: 'High Speed Point', state: 'NORMAL', lock: 'LOCKED', health: 'Healthy', activeRoute: 'CNB -> FTP UP Trunk' }
            ],
            signals: [
              { id: 'S-CNB-01', station: 'CNB', positionX: 120, trackY: 130, aspect: 'CLEAR', route: 'CNB -> FTP', lastChanged: '15:44:00', failureStatus: 'NONE' }
            ],
            blocks: [
              { id: 'BLK-CNB-FTP', code: 'B-401', section: 'CNB -> FTP', startX: 80, endX: 340, trackY: 130, status: 'OCCUPIED', trainId: '12302', direction: 'UP', releaseTime: '15:50', maintenanceAvailable: false }
            ],
            trains: [
              { id: '12302', number: '12302', name: 'HWH Rajdhani', type: 'Rajdhani', direction: 'UP', speed: 130, delayMins: 0, status: 'ON TIME', currentBlock: 'B-401', positionX: 200, trackY: 130, from: 'New Delhi', to: 'Howrah', nextStation: 'Fatehpur', etaNext: '15:50', line: 'UP Trunk' }
            ],
            alerts: [
              { id: 'ALT-C2', severity: 'CRITICAL', title: 'S1 Emergency Defect: AT Weld Failure Risk', section: 'FTP–SRO KM 210', time: '15:15:00', asset: 'Rail Weld W-210', impact: 'Speed restriction 20 km/h.' }
            ],
            aiOpportunities: [
              {
                id: 'AI-OPP-04',
                sectionCode: 'FTP–SRO (Block B-402)',
                startStation: 'Fatehpur (FTP)',
                endStation: 'Sirathu (SRO)',
                startX: 340,
                endX: 600,
                trackY: 130,
                opportunityWindow: '16:00 – 16:15',
                durationMins: 15,
                confidence: 95,
                assetAvailabilityGain: '+7.1%',
                predictedDelayImpact: '0 min',
                riskTier: 'LOW',
                reasoning: 'Crucial 15-minute gap between Rajdhani 12302 and Vande Bharat 22436. Allows emergency weld repair team to execute S1 defect fix under block protection.',
                requiredCrew: 10,
                requiredMachine: 'Thermit Weld Plant',
                beforeState: { deferredMaintenance: true, predictedFutureDelay: '+45 min (Speed Cap)', assetAvailability: '80.0%' },
                afterState: { completedMaintenance: true, predictedFutureDelay: '0 min', assetAvailability: '96.8%' }
              }
            ]
          }
        }
      }
    }
  }
};
