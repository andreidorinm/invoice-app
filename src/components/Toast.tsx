import { useEffect } from 'react';

const Toast = ({ message, isVisible, onClose }: any) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed right-5 top-5 md:right-10 md:top-10 p-3 bg-green-500 text-white rounded-lg shadow-lg transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      role="alert"
    >
      <div className="flex justify-between items-start">
        <span className="text-sm sm:text-base">{message}</span>
        <button
          className="text-2xl leading-none p-1 text-white"
          onClick={onClose}
          style={{ transform: 'translate(90%, -80%)' }}
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default Toast;
