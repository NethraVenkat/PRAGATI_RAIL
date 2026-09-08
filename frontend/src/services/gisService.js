import { apiClient } from './apiClient';

export const gisService = {
  /**
   * Fetch division-specific railway track geometry and station nodes
   * Restricted strictly to the authenticated user's Division on the backend.
   */
  async getDivisionTracks() {
    try {
      const response = await apiClient.get('/gis/tracks');
      return response.data;
    } catch (error) {
      console.error('[GISService] Error fetching division tracks:', error);
      throw error;
    }
  },

  /**
   * Fetch role-filtered department defects
   * Enforced strictly by user role on the backend (TMS, SMMS, TDMS, COA).
   */
  async getRoleDefects() {
    try {
      const response = await apiClient.get('/gis/defects');
      return response.data;
    } catch (error) {
      console.error('[GISService] Error fetching role defects:', error);
      throw error;
    }
  }
};
