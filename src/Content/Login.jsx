import { useState } from "react";
import "./StaffLogin.css";
import Notification from "./Notification";
import Home from "./Home";
import axios from "axios";

const API_BASE = "http://localhost:3001";

const StaffLogin = () => {
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showMessage, setMessage] = useState(false);
  const [message, setmsg] = useState("");
  const [type, setType] = useState(null);
  const [showHome, setShowHome] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    setShowHome(false);
    setCurrentUser(null);
    setPassword("");
  };

  const handleLogin = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!staffId.trim() || !password.trim()) {
      setmsg("Please enter both Staff ID and Password.");
      setType("error");
      setMessage(true);
      return;
    }

    setIsLoading(true);
    const loginData = { staffId: staffId.trim(), password: password.trim() };

    axios
      .post(`${API_BASE}/api/data`, loginData)
      .then((response) => {
        console.log("Login response:", response.data);

        if (response.data.message === "user exist") {
          setCurrentUser(response.data);
          setShowHome(true);
        } else {
          setmsg(response.data.message || "Invalid credentials");
          setType("error");
          setMessage(true);
        }
      })
      .catch((error) => {
        console.error("Login Error:", error);
        const errorMsg =
          error.response?.data?.message ||
          "Cannot connect to backend server. Make sure backend is running on port 3001.";
        setmsg(errorMsg);
        setType("error");
        setMessage(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <>
      {showHome && currentUser ? (
        <Home user={currentUser} onLogout={handleLogout} />
      ) : (
        <div className="staff-login-page">
          {showMessage ? (
            <Notification
              message={message}
              duration={3500}
              type={type}
              onClose={() => setMessage(false)}
            />
          ) : null}

          <div className="staff-login-card">
            <div className="staff-login-header">
              <div className="staff-login-icon">
                <span>✓</span>
              </div>
              <h1>Staff Login</h1>
              <p>Sign in to record your office attendance</p>
            </div>

            <form onSubmit={handleLogin} className="staff-login-form">
              <div className="staff-input-group">
                <label htmlFor="staffId">Staff ID</label>
                <div className="staff-input-wrapper">
                  <span className="staff-input-icon">ID</span>
                  <input
                    id="staffId"
                    type="text"
                    placeholder="Enter your Staff ID"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="staff-input-group">
                <label htmlFor="password">Password</label>
                <div className="staff-input-wrapper">
                  <span className="staff-input-icon">••</span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="staff-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="staff-login-button"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Login to Portal"}
              </button>
            </form>

            <div className="staff-login-footer">
              <p>Authorized staff attendance system</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffLogin;