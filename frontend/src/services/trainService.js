import { apiClient } from './apiClient';

export const trainService = {
  /**
   * Fetch available trains for user's zone and division
   */
  async getAvailableTrains({ zone, division, search, limit = 150, source = 'command-center' } = {}) {
    try {
      const params = {};
      if (zone) params.zone = zone;
      if (division) params.division = division;
      if (search) params.search = search;
      if (limit) params.limit = limit;
      if (source) params.source = source;

      const response = await apiClient.get('/trains/available', {
        params,
        headers: { 'x-api-source': source }
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching available trains:', error);
      throw error;
    }
  },

  /**
   * Fetch real-time live train tracking status from RailRadar backend proxy
   */
  async getLiveTrainStatus(trainNumber, source = 'command-center') {
    try {
      if (!trainNumber) throw new Error('Train number is required');
      const response = await apiClient.get(`/trains/${encodeURIComponent(trainNumber)}/live`, {
        params: { source },
        headers: { 'x-api-source': source }
      });
      return response.data?.data || null;
    } catch (error) {
      console.error(`Error fetching live status for train ${trainNumber}:`, error);
      throw error;
    }
  },

  /**
   * Fetch train timetable stops from backend
   */
  async getTrainTimetable(trainNumber) {
    try {
      if (!trainNumber) throw new Error('Train number is required');
      const response = await apiClient.get(`/trains/${encodeURIComponent(trainNumber)}/timetable`);
      return response.data?.data || [];
    } catch (error) {
      console.error(`Error fetching timetable for train ${trainNumber}:`, error);
      throw error;
    }
  }
};
