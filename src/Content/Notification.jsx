import { useEffect, useState } from "react";
import "./Notification.css";

const Notification = ({
  message,
  type,
  duration = 3000,
  onClose,
}) => {
  const [showMessage, setShowMessage] = useState(true);

  const handleClose = () => {
    setShowMessage(false);

    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <>
      {showMessage && (
        <div className={`notification notification-${type}`}>
          <div className="notification-content">

            <div className="notification-icon">
              {type === "success" && "✓"}
              {type === "error" && "!"}
              {type === "warning" && "!"}
              {type === "info" && "i"}
            </div>

            <div className="notification-message">
              {message}
            </div>

            <button
              type="button"
              className="notification-close"
              onClick={handleClose}
              aria-label="Close notification"
            >
              ×
            </button>

          </div>
        </div>
      )}
    </>
  );
};
export default Notification;