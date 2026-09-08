import { apiClient } from './apiClient';

export const stationService = {
  /**
   * Fetch stations list filtered by zone and division
   */
  async getStations(params = {}) {
    try {
      const response = await apiClient.get('/stations', { params });
      return response.data;
    } catch (error) {
      console.error('[StationService] Error fetching stations:', error);
      throw error;
    }
  },

  /**
   * Fetch live PIDS display board data for a specific station
   */
  async getStationDisplay(stationCode, date = '2026-09-03') {
    try {
      const response = await apiClient.get(`/stations/${stationCode}/display`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      console.error(`[StationService] Error fetching display for ${stationCode}:`, error);
      throw error;
    }
  },

  /**
   * Fetch live PIDS display board data for the entire division on a particular date
   */
  async getDivisionalDisplay(params = {}) {
    try {
      const response = await apiClient.get('/stations/division/display', { params });
      return response.data;
    } catch (error) {
      console.error('[StationService] Error fetching divisional display:', error);
      throw error;
    }
  },

  /**
   * Reverse geocode coordinates to nearest station, section, and traffic density
   */
  async getNearestStation(lat, lon) {
    try {
      const response = await apiClient.get('/stations/nearest', {
        params: { lat, lon }
      });
      return response.data;
    } catch (error) {
      console.error('[StationService] Error fetching nearest station:', error);
      throw error;
    }
  }
};
