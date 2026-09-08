import { apiClient } from './apiClient';

export const defectService = {
  /**
   * Submit raw defect to backend:
   *  - Backend validates user's authenticated department
   *  - Runs Department-Specific Severity Classifier
   *  - Runs LightGBM Priority Model
   *  - Persists to department-specific collection in MongoDB (tms_defects, smms_defects, tdms_defects)
   */
  async submitDefect(rawDefectData) {
    const response = await apiClient.post('/defects', rawDefectData);
    return response.data;
  },

  /**
   * Fetch defects for the authenticated user's department from DB
   */
  async getDefects(params = {}) {
    try {
      const response = await apiClient.get('/defects', { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('[DefectService] Error fetching live defects from DB:', error);
      return [];
    }
  },

  /**
   * Department specific database fetchers (Strictly MongoDB DB Only, No Mock Fallback)
   */
  async getTMSDefects(params = {}) {
    try {
      const response = await apiClient.get('/tms/defects', { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('[DefectService] Error fetching TMS defects from tms_defects collection:', error);
      return [];
    }
  },

  async getSMMSDefects(params = {}) {
    try {
      const response = await apiClient.get('/smms/defects', { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('[DefectService] Error fetching SMMS defects from smms_defects collection:', error);
      return [];
    }
  },

  async getTDMSDefects(params = {}) {
    try {
      const response = await apiClient.get('/tdms/defects', { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('[DefectService] Error fetching TDMS defects from tdms_defects collection:', error);
      return [];
    }
  }
};

