import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8113/api/v1/analytics';

const getAuthHeader = () => {
  const token = localStorage.getItem('authToken');
  const tenantSlug = localStorage.getItem('tenantSlug') || 'system_shared';
  
  return {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-Slug': tenantSlug,
  };
};

const AnalyticsService = {
  // Get dashboard data
  getDashboard: async (startDate, endDate) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard`, {
        params: {
          startDate: startDate?.toISOString().split('T')[0],
          endDate: endDate?.toISOString().split('T')[0],
        },
        headers: getAuthHeader(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Get monthly analytics
  getMonthlyAnalytics: async (month, year) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/monthly`, {
        params: { month, year },
        headers: getAuthHeader(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching monthly analytics:', error);
      throw error;
    }
  },

  // Get yearly analytics
  getYearlyAnalytics: async (year) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/yearly`, {
        params: { year },
        headers: getAuthHeader(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching yearly analytics:', error);
      throw error;
    }
  },

  // Get comprehensive report
  getComprehensiveReport: async (startDate, endDate, format = 'json') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/report`, {
        params: {
          startDate: startDate?.toISOString().split('T')[0],
          endDate: endDate?.toISOString().split('T')[0],
          format,
        },
        headers: getAuthHeader(),
        responseType: format === 'json' ? 'json' : 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching comprehensive report:', error);
      throw error;
    }
  },

  // Export to PDF
  exportPDF: async (startDate, endDate, title = 'Analytics Report') => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/export/pdf`,
        {
          startDate: startDate?.toISOString().split('T')[0],
          endDate: endDate?.toISOString().split('T')[0],
          title,
        },
        {
          headers: getAuthHeader(),
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  },

  // Export to Excel
  exportExcel: async (startDate, endDate, title = 'Analytics Report') => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/export/excel`,
        {
          startDate: startDate?.toISOString().split('T')[0],
          endDate: endDate?.toISOString().split('T')[0],
          title,
        },
        {
          headers: getAuthHeader(),
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      throw error;
    }
  },

  // Export to CSV
  exportCSV: async (startDate, endDate, title = 'Analytics Report') => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/export/csv`,
        {
          startDate: startDate?.toISOString().split('T')[0],
          endDate: endDate?.toISOString().split('T')[0],
          title,
        },
        {
          headers: getAuthHeader(),
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    }
  },

  // Save report
  saveReport: async (title, type, startDate, endDate) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/report/save`,
        {
          title,
          type,
          startDate: startDate?.toISOString().split('T')[0],
          endDate: endDate?.toISOString().split('T')[0],
        },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  },

  // Get saved reports
  getSavedReports: async (limit = 10, offset = 0) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reports`, {
        params: { limit, offset },
        headers: getAuthHeader(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching saved reports:', error);
      throw error;
    }
  },
};

export default AnalyticsService;
