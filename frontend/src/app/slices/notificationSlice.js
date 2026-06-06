import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
  },
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift({
        id: Date.now(),
        read: false,
        timestamp: new Date().toISOString(),
        ...action.payload,
      });
      state.unreadCount += 1;
    },
    markAllRead: (state) => {
      state.items.forEach((n) => {
        n.read = true;
      });
      state.unreadCount = 0;
    },
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
});

export const { addNotification, markAllRead, clearNotifications } =
  notificationSlice.actions;
export default notificationSlice.reducer;
