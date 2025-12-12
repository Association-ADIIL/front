import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotification, type Notification } from '../context/NotificationContext';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const bgColors = {
  success: 'bg-green-50',
  error: 'bg-red-50',
  warning: 'bg-yellow-50',
  info: 'bg-blue-50',
};

const borderColors = {
  success: 'border-green-200',
  error: 'border-red-200',
  warning: 'border-yellow-200',
  info: 'border-blue-200',
};

interface ToastProps {
  notification: Notification;
}

const Toast: React.FC<ToastProps> = ({ notification }) => {
  const { removeNotification } = useNotification();

  return (
    <div
      className={`flex items-start p-4 mb-3 rounded-lg border shadow-sm ${bgColors[notification.type]} ${borderColors[notification.type]} transition-all duration-300 animate-in slide-in-from-right`}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3 mt-0.5">
        {icons[notification.type]}
      </div>
      <div className="flex-1 mr-2">
        <p className={`text-sm font-medium text-gray-800`}>
          {notification.message}
        </p>
      </div>
      <button
        onClick={() => removeNotification(notification.id)}
        className="flex-shrink-0 ml-auto -mx-1.5 -my-1.5 p-1.5 text-gray-500 hover:text-gray-900 focus:outline-none rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { notifications } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end max-w-sm w-full">
      {notifications.map((notification) => (
        <Toast key={notification.id} notification={notification} />
      ))}
    </div>
  );
};
