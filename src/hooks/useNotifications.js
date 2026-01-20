import { useEffect, useRef } from 'react';

export const useNotifications = (todos, markAsNotified) => {
  const notificationPermission = useRef(Notification.permission);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        notificationPermission.current = permission;
      });
    }
  }, []);

  useEffect(() => {
    const checkNotifications = () => {
      if (Notification.permission !== 'granted') {
        return;
      }

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      todos.forEach(todo => {
        if (!todo.reminderTime || todo.notifiedAt || todo.status === 'done') {
          return;
        }

        const todoDate = new Date(todo.dueDate);
        const isToday =
          todoDate.getDate() === now.getDate() &&
          todoDate.getMonth() === now.getMonth() &&
          todoDate.getFullYear() === now.getFullYear();

        if (isToday && todo.reminderTime === currentTime) {
          const notification = new Notification('Todo リマインダー', {
            body: `${todo.title}\n期日: ${new Date(todo.dueDate).toLocaleDateString('ja-JP')}`,
            icon: '/vite.svg',
            tag: todo.id,
            requireInteraction: false,
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          markAsNotified(todo.id);
        }
      });
    };

    checkNotifications();

    const intervalId = setInterval(checkNotifications, 60000);

    return () => clearInterval(intervalId);
  }, [todos, markAsNotified]);

  const requestNotificationPermission = async () => {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      notificationPermission.current = permission;
      return permission;
    }
    return Notification.permission;
  };

  return {
    permission: notificationPermission.current,
    requestPermission: requestNotificationPermission,
  };
};
