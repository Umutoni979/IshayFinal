import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', user.id);
    });

    socket.on('notification', (notification) => {
      // Refresh notifications list
      queryClient.invalidateQueries(['notifications']);

      // Show a toast popup
      toast(notification.title + (notification.body ? `\n${notification.body}` : ''), {
        icon: '🔔',
        duration: 5000,
        style: { maxWidth: '360px', fontSize: '13px' },
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
