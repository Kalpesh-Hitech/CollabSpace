import React, { useRef } from "react";
import { Ic } from "../ProfilePageComponent/ProfilePage.styles";
import PropTypes from "prop-types";
export const UserIco = () => <Ic><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Ic>;
export const MailIco = () => <Ic><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></Ic>;
export const LockIco = () => <Ic><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Ic>;
export const EyeIco = () => <Ic size={16}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Ic>;
export const EyeOffIco = () => <Ic size={16}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></Ic>;
export const CheckIco = () => <Ic size={16}><polyline points="20 6 9 17 4 12" /></Ic>;

export const PasswordField = ({ id, label, value, error, show, onToggle, onChange, placeholder }) => (
  <div className="pf-field">
    <label className="pf-label">{label}</label>
    <div className="pf-input-wrap">
      <span className="pf-input-ico"><LockIco /></span>
      <input
        className={`pf-input${error ? " error" : ""}`}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(id, e.target.value)}
        style={{ paddingRight: 44 }}
      />
      <button type="button" className="pf-eye" onClick={() => onToggle(id)}>
        {show ? <EyeOffIco /> : <EyeIco />}
      </button>
    </div>
    {error && <p className="pf-err">{error}</p>}
  </div>
);

PasswordField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  error: PropTypes.string,
  show: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

export function OtpInput({ digits, setDigits, errored }) {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const handleKey = (idx, e) => {
    const val = e.target.value.replaceAll(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < 5) refs[idx + 1].current?.focus();
  };
  const handleBs = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      const next = [...digits];
      next[idx - 1] = "";
      setDigits(next);
      refs[idx - 1].current?.focus();
    }
  };
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {digits.map((d, i) => (
        <input
          key={i} ref={refs[i]}
          className={`pf-otp-digit${d ? " filled" : ""}${errored ? " error" : ""}`}
          type="text" maxLength={1} value={d}
          onChange={(e) => handleKey(i, e)} onKeyDown={(e) => handleBs(i, e)}
        />
      ))}
    </div>
  );
}
OtpInput.propTypes = {
  digits: PropTypes.arrayOf(PropTypes.string).isRequired,
  setDigits: PropTypes.func.isRequired,
  errored: PropTypes.bool,
};

OtpInput.defaultProps = {
  errored: false,
};