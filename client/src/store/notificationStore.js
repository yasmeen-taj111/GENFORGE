import { create } from 'zustand';

let nextId = 1;

const useNotificationStore = create((set) => ({
  notifications: [],
  notify: (message, type = 'success') => {
    const id = nextId++;
    set((state) => ({ notifications: [...state.notifications, { id, message, type }] }));
    window.setTimeout(() => {
      set((state) => ({ notifications: state.notifications.filter((notice) => notice.id !== id) }));
    }, 4500);
  },
  dismiss: (id) => set((state) => ({ notifications: state.notifications.filter((notice) => notice.id !== id) }))
}));

export default useNotificationStore;
