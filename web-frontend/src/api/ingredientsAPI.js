import axiosInstance from './axiosInstance';

const ingredientsAPI = {
    /**
     * Get all master ingredients
     */
    getIngredients: () => {
        return axiosInstance.get('/ingredients');
    },

    /**
     * Create a new master ingredient
     * @param {Object} data - { name: '...' }
     */
    createIngredient: (data) => {
        return axiosInstance.post('/ingredients', data);
    },

    /**
     * Update a master ingredient name
     * @param {number} id 
     * @param {Object} data - { name: '...' }
     */
    updateIngredient: (id, data) => {
        return axiosInstance.put(`/ingredients/${id}`, data);
    },

    /**
     * Delete a master ingredient
     * @param {number} id 
     */
    deleteIngredient: (id) => {
        return axiosInstance.delete(`/ingredients/${id}`);
    }
};

export default ingredientsAPI;
