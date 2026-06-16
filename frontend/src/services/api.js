import axios from 'axios';
import { API_URL } from '../config';

const api = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },

  updateCell: async (id, row, col, value) => {
    const response = await axios.put(`${API_URL}/cell`, {
      id,
      row,
      col,
      value
    });
    
    return response.data;
  },

  downloadFile: async (id) => {
    const response = await axios.get(`${API_URL}/download/${id}`, {
      responseType: 'blob'
    });
    
    return response.data;
  },

  getFile: async (id) => {
    const response = await axios.get(`${API_URL}/file/${id}`);
    return response.data;
  }
};

export default api;
