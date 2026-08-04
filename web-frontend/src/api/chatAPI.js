import axiosInstance from './axiosInstance';

const chatAPI = {
  sendMessage: async (message, history = []) => {
    let sessionId = localStorage.getItem('chat_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      localStorage.setItem('chat_session_id', sessionId);
    }
    const url = '/chat/';
    return axiosInstance.post(url, { message, session_id: sessionId, history });
  }
};

export default chatAPI;
