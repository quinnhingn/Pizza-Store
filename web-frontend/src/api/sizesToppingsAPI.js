import axiosInstance from './axiosInstance';

const sizesToppingsAPI = {
    // ==================== MASTER SIZES ====================
    getSizes: () => {
        return axiosInstance.get('/sizes');
    },
    createSize: (data) => {
        return axiosInstance.post('/sizes', data);
    },
    updateSize: (id, data) => {
        return axiosInstance.put(`/sizes/${id}`, data);
    },
    deleteSize: (id) => {
        return axiosInstance.delete(`/sizes/${id}`);
    },

    // ==================== MASTER TOPPINGS ====================
    getToppings: () => {
        return axiosInstance.get('/toppings');
    },
    createTopping: (data) => {
        return axiosInstance.post('/toppings', data);
    },
    updateTopping: (id, data) => {
        return axiosInstance.put(`/toppings/${id}`, data);
    },
    deleteTopping: (id) => {
        return axiosInstance.delete(`/toppings/${id}`);
    }
};

export default sizesToppingsAPI;
