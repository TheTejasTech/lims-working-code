import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { connectSocket, disconnectSocket } from '../utils/socket';
import { addNotification } from '../app/slices/notificationSlice';

const SOCKET_EVENTS = [
  'new:sample',
  'sample:status:change',
  'urgent:sample',
  'workshop:scan',
  'approval:ready',
  'invoice:ready',
];

export const useSocket = (enabled = true) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!enabled) return undefined;

    const socket = connectSocket();

    SOCKET_EVENTS.forEach((event) => {
      socket.on(event, (data) => {
        dispatch(
          addNotification({
            type: event,
            title: event.replace(/:/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
            message: typeof data === 'object' ? JSON.stringify(data) : String(data),
          })
        );
      });
    });

    return () => disconnectSocket();
  }, [enabled, dispatch]);
};
