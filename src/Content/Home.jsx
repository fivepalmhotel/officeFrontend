import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./Home.css";

const API_BASE = "http://localhost:3001";

const Home = ({ user, onLogout }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Tab: 'attendance' or 'leave'
  const [activeTab, setActiveTab] = useState("attendance");

  const staffId = user?.userId || user?.staffId || "Staff";
  const [totalAttendance, setTotalAttendance] = useState(
    user?.totalAttendance ?? (user?.attendances ? user.attendances.length : 0)
  );
  const [attendances, setAttendances] = useState(user?.attendances || []);

  // Leave State (User Side Feature)
  const [totalLeaves, setTotalLeaves] = useState(user?.leaveCount ?? 2);
  const [leaveBalance, setLeaveBalance] = useState(10);
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  // Leave Form Fields (UI ready for future backend integration)
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: "lv-1",
      type: "Casual Leave",
      fromDate: "2026-02-10",
      toDate: "2026-02-11",
      days: 2,
      reason: "Family event",
      status: "Approved",
    },
    {
      id: "lv-2",
      type: "Sick Leave",
      fromDate: "2026-03-05",
      toDate: "2026-03-05",
      days: 1,
      reason: "Viral fever",
      status: "Approved",
    },
  ]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Sync latest user data from DB on load
  useEffect(() => {
    if (staffId && staffId !== "Staff") {
      axios
        .get(`${API_BASE}/api/user/${encodeURIComponent(staffId)}`)
        .then((res) => {
          if (res.data) {
            setTotalAttendance(res.data.totalAttendance || 0);
            if (Array.isArray(res.data.attendances)) {
              setAttendances(res.data.attendances);
            }
          }
        })
        .catch((err) => {
          console.warn("Could not sync latest user data:", err.message);
        });
    }
  }, [staffId]);

  // Open camera
  const openCamera = async () => {
    setCameraError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      setShowCamera(true);
    } catch (error) {
      console.error("Camera Error:", error);

      if (error.name === "NotAllowedError") {
        setCameraError(
          "Camera permission was denied. Please allow camera access in your browser."
        );
      } else if (error.name === "NotFoundError") {
        setCameraError("No camera was found on this device.");
      } else {
        setCameraError("Unable to access the camera: " + error.message);
      }
    }
  };

  // Attach camera stream to video
  useEffect(() => {
    if (showCamera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [showCamera]);

  // Stop camera
  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  // Capture photo & send to Server
  const captureAttendance = async () => {
    if (!videoRef.current) return;
    setIsSubmitting(true);

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;

    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const imageBase64 = canvas.toDataURL("image/jpeg", 0.85);

    try {
      const response = await axios.post(`${API_BASE}/api/attendance`, {
        staffId: staffId,
        image: imageBase64,
      });

      if (typeof response.data.totalAttendance === "number") {
        setTotalAttendance(response.data.totalAttendance);
      } else {
        setTotalAttendance((prev) => prev + 1);
      }

      if (response.data.attendance) {
        setAttendances((prev) => [response.data.attendance, ...prev]);
      }

      alert(response.data.message || "Attendance saved in database successfully!");
      closeCamera();
    } catch (error) {
      console.error("Attendance submission error:", error);
      alert(
        error.response?.data?.message ||
          "Failed to save attendance in DB. Make sure backend is running."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Leave Request (UI Handled for now)
  const handleApplyLeave = (e) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      alert("Please select both From and To dates.");
      return;
    }

    const newLeave = {
      id: `lv-${Date.now()}`,
      type: leaveType,
      fromDate,
      toDate,
      days: 1,
      reason: leaveReason || "Personal reason",
      status: "Pending Approval",
    };

    setLeaveRequests((prev) => [newLeave, ...prev]);
    setTotalLeaves((prev) => prev + 1);
    setLeaveBalance((prev) => Math.max(0, prev - 1));
    setShowLeaveForm(false);
    setLeaveReason("");
    setFromDate("");
    setToDate("");
    alert("Leave application submitted successfully (Pending review)!");
  };

  // Stop camera when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div>
          <p className="home-welcome">Welcome back</p>
          <h1>Staff Portal</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div className="staff-profile">
            <span className="profile-circle">
              {String(staffId).charAt(0).toUpperCase()}
            </span>
            <span>{staffId}</span>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="staff-logout-btn"
            >
              Log Out
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="home-content">
        {/* Navigation Tabs */}
        <div className="portal-tabs">
          <button
            type="button"
            className={`portal-tab ${activeTab === "attendance" ? "active" : ""}`}
            onClick={() => setActiveTab("attendance")}
          >
            📋 Attendance Dashboard
          </button>
          <button
            type="button"
            className={`portal-tab ${activeTab === "leave" ? "active" : ""}`}
            onClick={() => setActiveTab("leave")}
          >
            🏖️ Leave Management & Requests
          </button>
        </div>

        {/* Staff Attendance & Leave Overview Card */}
        <section className="attendance-card">
          <div className="attendance-card-top">
            <div>
              <p className="card-label">Staff Overview</p>
              <h2>{staffId}</h2>
            </div>
            <div className="staff-id-badge">Verified Staff</div>
          </div>

          <div className="attendance-divider"></div>

          {/* 4-Stat Grid: Attendance, Total Leave, Balance, Status */}
          <div className="staff-stats-grid">
            <div className="stat-box stat-attendance">
              <div className="stat-icon">📅</div>
              <div>
                <span className="stat-label">Total Attendance</span>
                <strong>{totalAttendance}</strong>
                <span className="stat-small">Days Present</span>
              </div>
            </div>

            <div className="stat-box stat-leave">
              <div className="stat-icon">🏖️</div>
              <div>
                <span className="stat-label">Total Leave</span>
                <strong className="leave-count-text">{totalLeaves}</strong>
                <span className="stat-small">Days Taken</span>
              </div>
            </div>

            <div className="stat-box stat-balance">
              <div className="stat-icon">⏳</div>
              <div>
                <span className="stat-label">Leave Balance</span>
                <strong className="balance-count-text">{leaveBalance}</strong>
                <span className="stat-small">Days Remaining</span>
              </div>
            </div>

            <div className="stat-box stat-status">
              <div className="stat-icon">●</div>
              <div>
                <span className="stat-label">Account Status</span>
                <strong className="status-present">Active</strong>
                <span className="stat-small">Database Verified</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tab 1: Attendance Section */}
        {activeTab === "attendance" && (
          <>
            {/* Make Attendance Button */}
            <section className="make-attendance-section">
              <div className="attendance-action-icon">✓</div>
              <div className="attendance-action-content">
                <h3>Make Attendance</h3>
                <p>
                  Verify your identity using your device camera. Your attendance
                  and photo will be saved directly into your account in the database.
                </p>
              </div>

              <button
                type="button"
                className="make-attendance-button"
                onClick={openCamera}
              >
                Mark Attendance Now
              </button>
            </section>

            {/* Camera Error Message */}
            {cameraError && (
              <div className="camera-error">
                <strong>Camera Access Error</strong>
                <p>{cameraError}</p>
              </div>
            )}

            {/* User's Own Attendance Logs (from their document) */}
            {attendances.length > 0 && (
              <section className="history-section">
                <div className="history-header">
                  <h3>Your Attendance History ({attendances.length})</h3>
                  <span className="history-badge">Live DB Records</span>
                </div>
                <div className="history-grid">
                  {attendances.slice(0, 8).map((item, idx) => (
                    <div
                      key={item._id || item.id || idx}
                      className="history-card"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt="Attendance Capture"
                          className="history-image"
                        />
                      ) : (
                        <div className="history-placeholder">
                          Check-in Record
                        </div>
                      )}
                      <p className="history-date-label">Logged At:</p>
                      <strong className="history-timestamp">
                        {item.timestamp || "Recent"}
                      </strong>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Tab 2: Leave Management Section (New Feature UI) */}
        {activeTab === "leave" && (
          <section className="leave-section">
            <div className="leave-header-card">
              <div>
                <h3>Apply for Leave</h3>
                <p>Submit a leave request for admin approval</p>
              </div>
              <button
                type="button"
                className="apply-leave-toggle-btn"
                onClick={() => setShowLeaveForm(!showLeaveForm)}
              >
                {showLeaveForm ? "✕ Cancel" : "+ New Leave Request"}
              </button>
            </div>

            {/* Leave Application Form */}
            {showLeaveForm && (
              <form onSubmit={handleApplyLeave} className="leave-form-card">
                <h4>Leave Application Form</h4>
                <div className="leave-form-grid">
                  <div className="form-group">
                    <label>Leave Type</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                    >
                      <option value="Casual Leave">Casual Leave (CL)</option>
                      <option value="Sick Leave">Sick Leave (SL)</option>
                      <option value="Privilege Leave">Privilege Leave (PL)</option>
                      <option value="Emergency Leave">Emergency Leave</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>From Date</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>To Date</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: "15px" }}>
                  <label>Reason for Leave</label>
                  <textarea
                    rows="3"
                    placeholder="Briefly state your reason for leave..."
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                  />
                </div>

                <div className="leave-form-actions">
                  <button
                    type="button"
                    className="leave-cancel-btn"
                    onClick={() => setShowLeaveForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="leave-submit-btn">
                    Submit Leave Request
                  </button>
                </div>
              </form>
            )}

            {/* Leave History Table / Cards */}
            <div className="leave-history-wrapper">
              <h4>Your Leave Records ({leaveRequests.length})</h4>
              <div className="leave-table-container">
                <table className="leave-table">
                  <thead>
                    <tr>
                      <th>LEAVE TYPE</th>
                      <th>DURATION</th>
                      <th>DATES</th>
                      <th>REASON</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map((lv) => (
                      <tr key={lv.id}>
                        <td>
                          <strong>{lv.type}</strong>
                        </td>
                        <td>{lv.days} day(s)</td>
                        <td>
                          {lv.fromDate} to {lv.toDate}
                        </td>
                        <td>{lv.reason}</td>
                        <td>
                          <span
                            className={`leave-badge ${
                              lv.status === "Approved"
                                ? "approved"
                                : "pending"
                            }`}
                          >
                            ● {lv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Camera Modal */}
      {showCamera && (
        <div className="camera-overlay">
          <div className="camera-modal">
            <div className="camera-header">
              <div>
                <h2>Verify Attendance</h2>
                <p>Position your face inside the frame</p>
              </div>

              <button
                type="button"
                className="camera-close"
                onClick={closeCamera}
              >
                ×
              </button>
            </div>

            <div className="camera-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
              <div className="face-frame"></div>
            </div>

            <div className="camera-actions">
              <button
                type="button"
                className="camera-cancel-button"
                onClick={closeCamera}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="capture-button"
                onClick={captureAttendance}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving to DB..." : "Capture & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;