import { apiClient } from './apiClient';
import { defectService } from './defectService';

export const tmsService = {
  // GET /api/tms/defects — Fetch all track defects from MongoDB
  async getDefects(zone = 'ALL', division = 'ALL') {
    return defectService.getTMSDefects({ zone, division });
  },

  // POST /api/defects — Submit raw defect to 2-stage ML pipeline & MongoDB
  async createDefect(manualInputData) {
    const response = await defectService.submitDefect(manualInputData);
    return response.defect;
  }
};
