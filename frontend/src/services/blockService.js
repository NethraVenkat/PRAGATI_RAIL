import { apiClient } from './apiClient';

export const blockService = {
  /**
   * Fetch block requests
   */
  async getBlockRequests(params = {}) {
    try {
      const response = await apiClient.get('/block-requests', { params });
      return response.data;
    } catch (error) {
      console.error('[BlockService] Error fetching block requests:', error);
      throw error;
    }
  },

  /**
   * Send defect into XGBoost block planning workflow with custom date range
   */
  async sendDefectToBlockPlanning(department, defectId, payload = {}) {
    try {
      const response = await apiClient.post(`/defects/${department}/${defectId}/send`, payload);
      return response.data;
    } catch (error) {
      console.error(`[BlockService] Error sending ${department} defect ${defectId} to block planning:`, error);
      throw error;
    }
  },

  /**
   * COA Approves Block Request
   */
  async approveBlockRequest(id) {
    try {
      const response = await apiClient.put(`/block-requests/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error(`[BlockService] Error approving block request ${id}:`, error);
      throw error;
    }
  },

  /**
   * COA Edits Block Request
   */
  async editBlockRequest(id, payload) {
    try {
      const response = await apiClient.put(`/block-requests/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error(`[BlockService] Error editing block request ${id}:`, error);
      throw error;
    }
  },

  /**
   * Fetch 24-Hour Maintenance Block Schedule & Visualization
   */
  async getMaintenanceSchedule(params = {}) {
    try {
      const response = await apiClient.get('/bdms/maintenance-schedule', { params });
      return response.data;
    } catch (error) {
      console.error('[BlockService] Error fetching maintenance schedule:', error);
      throw error;
    }
  }
};
