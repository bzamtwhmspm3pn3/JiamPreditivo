import { io } from 'socket.io-client';

export const connectSocket = (userId) => {
  if (!userId) return null;

  return io('http://localhost:5000', { 
    query: { userId } // 🔹 passa o id para o backend
  });
};
