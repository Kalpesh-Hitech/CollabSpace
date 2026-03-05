import React, { useState } from "react";
import PropTypes from "prop-types"; // Added for validation
import { useDispatch } from "react-redux";
import { THEME as T } from "../../config/theme.config";
import { updateUserName } from "../../redux/slices/authSlice";
import { UserIco, CheckIco } from "./ProfileUIComponents";

export default function ProfileInfoSection({ user }) {
  const dispatch = useDispatch();
  const [name, setName] = useState(user?.name || "");
  const [editing, setEditing] = useState(false);

  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSave = () => {
    if (name.trim().length < 2) return;
    dispatch(updateUserName(name.trim()));
    setEditing(false);
  };

  return (
    <div className="pf-card">
      <div className="pf-card-header">
        <span style={{ color: T.colors.primary[400], display: "flex" }}>
          <UserIco />
        </span>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: T.colors.text.primary, margin: 0 }}>
            Profile Information
          </h3>
          <p style={{ fontSize: 12, color: T.colors.text.muted, margin: 0 }}>
            Manage your public identity
          </p>
        </div>
      </div>
      
      <div className="pf-card-body">
        {/* Avatar Section */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}>
          <div 
            aria-label="User Initials"
            style={{ 
              width: 72, height: 72, borderRadius: "50%", background: T.gradients.brand, 
              display: "flex", alignItems: "center", justifyContent: "center", 
              fontWeight: 800, fontSize: 24, color: "#fff", boxShadow: T.shadows.glow 
            }}
          >
            {initials}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 18, color: T.colors.text.primary, margin: 0 }}>
              {user?.name || "User"}
            </p>
            <span 
              className="pf-tag" 
              style={{ 
                background: T.colors.success.bg, 
                color: T.colors.success.text, 
                border: `1px solid ${T.colors.success.border}`, 
                marginTop: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px' 
              }}
            >
              <CheckIco /> Account Verified
            </span>
          </div>
        </div>

        {/* Name Field - Fixed for S6853 */}
        <div className="pf-field">
          <label className="pf-label" htmlFor="display-name-input">
            Display Name
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="pf-input-wrap">
              <span className="pf-input-ico">
                <UserIco />
              </span>
              <input 
                id="display-name-input" // Associated with label htmlFor
                className="pf-input" 
                value={editing ? name : (user?.name || "")} 
                onChange={(e) => setName(e.target.value)}
                readOnly={!editing}
                placeholder="Enter your name"
                aria-readonly={!editing}
              />
            </div>
            {editing ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button 
                  type="button" 
                  className="pf-btn pf-btn-primary" 
                  onClick={handleSave}
                >
                  Save
                </button>
                <button 
                  type="button" 
                  className="pf-btn pf-btn-outline" 
                  onClick={() => { setEditing(false); setName(user?.name || ""); }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                type="button" 
                className="pf-btn pf-btn-outline" 
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Props Validation (S6774)
ProfileInfoSection.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
  }),
};

// Default props if user is not provided
ProfileInfoSection.defaultProps = {
  user: {
    name: "",
    email: ""
  }
};