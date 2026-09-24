import { api } from '@/lib/api';

export interface PropertyFilters {
  tipo?: string;
  estado?: string;
}

export const propertyService = {
  list: async (filters?: PropertyFilters) => {
    const params = new URLSearchParams();
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.estado) params.append('estado', filters.estado);
    const res = await api.get('/properties?' + params.toString());
    return res.data; // { data: [...], total }
  },
  
  getById: async (id: string) => {
    const res = await api.get(`/properties/${id}`);
    return res.data;
  },

  create: async (data: any) => {
    const res = await api.post('/properties', data);
    return res.data;
  },

  update: async (id: string, data: any) => {
    const res = await api.patch(`/properties/${id}`, data);
    return res.data;
  },

  assignResident: async (id: string, userId: string, tipoResidencia: string) => {
    const res = await api.post(`/properties/${id}/residents`, {
      userId,
      tipo_residencia: tipoResidencia
    });
    return res.data;
  },

  listVehicles: async (id: string) => {
    const res = await api.get(`/properties/${id}/vehicles`);
    return res.data;
  },

  registerVehicle: async (id: string, data: any) => {
    const res = await api.post(`/properties/${id}/vehicles`, data);
    return res.data;
  },

  listMarbetes: async (id: string) => {
    const res = await api.get(`/properties/${id}/marbetes`);
    return res.data;
  },

  issueMarbete: async (vehicleId: string, periodo: string) => {
    const res = await api.post(`/vehicles/${vehicleId}/marbetes`, { periodo });
    return res.data;
  },

  cancelMarbete: async (id: string) => {
    const res = await api.patch(`/marbetes/${id}/cancel`);
    return res.data;
  }
};
