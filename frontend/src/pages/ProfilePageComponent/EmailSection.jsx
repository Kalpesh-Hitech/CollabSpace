import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { THEME as T } from "../../config/theme.config";
import {
  requestEmailOtp,
  changeEmail,
  selLoading,
} from "../../redux/slices/authSlice";
import { MailIco, OtpInput, CheckIco } from "./ProfileUIComponents";

export default function EmailSection({ user }) {
  const dispatch = useDispatch();
  const loading = useSelector(selLoading);

  const [step, setStep] = useState(1); // 1: Request, 2: Verify
  const [newEmail, setNewEmail] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [success, setSuccess] = useState(false);
  const [resendCD, setResendCD] = useState(0);

  useEffect(() => {
    if (resendCD <= 0) return;
    const timer = setInterval(() => setResendCD((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCD]);

  const handleRequestOtp = async () => {
    // Redux thunks return a promise that resolves to the action
    const res = await dispatch(requestEmailOtp());
    if (res?.meta?.requestStatus === "fulfilled") {
      setStep(2);
      setResendCD(60);
    }
  };

  const handleVerifyChange = async (e) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < 6 || !newEmail) return;

    const res = await dispatch(changeEmail({ newEmail, otp }));
    if (res?.meta?.requestStatus === "fulfilled") {
      setSuccess(true);
      setStep(1);
      setNewEmail("");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  return (
    <div className="pf-card">
      <div className="pf-card-header">
        <span style={{ color: T.colors.teal.DEFAULT, display: "flex" }}>
          <MailIco />
        </span>
        <h3 style={{ fontWeight: 700, color: T.colors.text.primary, margin: 0, fontSize: "inherit" }}>
          Security Email
        </h3>
      </div>

      <div className="pf-card-body">
        {success && (
          <div
            role="alert"
            style={{
              background: T.colors.success.bg,
              color: T.colors.success.text,
              padding: 12,
              borderRadius: 8,
              marginBottom: 15,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <CheckIco />
            <span>Email updated successfully!</span>
          </div>
        )}

        <div className="pf-field">
          <label className="pf-label" htmlFor="current-email">
            Current Email
          </label>
          <div className="pf-input-wrap">
            <span className="pf-input-ico">
              <MailIco />
            </span>
            <input
              id="current-email"
              className="pf-input"
              value={user?.email || ""}
              readOnly
              style={{ opacity: 0.7 }}
            />
          </div>
        </div>

        {step === 1 ? (
          <div style={{ marginTop: 20 }}>
            <p
              style={{
                fontSize: 13,
                color: T.colors.text.muted,
                marginBottom: 12,
              }}
            >
              To change your email, we need to send a verification code to your
              current address.
            </p>
            <button
              type="button"
              className="pf-btn pf-btn-primary"
              onClick={handleRequestOtp}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Verification OTP"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerifyChange} style={{ marginTop: 20 }}>
            <div className="pf-field">
              <label className="pf-label" htmlFor="new-email">
                New Email Address
              </label>
              <input
                id="new-email"
                className="pf-input"
                style={{ paddingLeft: 14 }}
                type="email"
                placeholder="Enter new email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>

            <div className="pf-field">
              <span className="pf-label">Verification Code</span>
              <OtpInput digits={digits} setDigits={setDigits} />
              <p
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: T.colors.text.muted,
                }}
              >
                {"Didn't get the code?"}
                {" "}
                {resendCD > 0 ? (
                  <span>Wait {resendCD}s</span>
                ) : (
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: T.colors.primary.DEFAULT,
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontSize: "inherit"
                    }}
                    onClick={handleRequestOtp}
                  >
                    Resend
                  </button>
                )}
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button
                className="pf-btn pf-btn-primary"
                type="submit"
                disabled={loading || digits.join("").length < 6}
              >
                {loading ? "Verifying..." : "Verify & Change"}
              </button>
              <button
                className="pf-btn pf-btn-outline"
                type="button"
                onClick={() => setStep(1)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

EmailSection.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string,
  }),
};

// Also ensure OtpInput has validation if defined in this scope
OtpInput.propTypes = {
  digits: PropTypes.arrayOf(PropTypes.string).isRequired,
  setDigits: PropTypes.func.isRequired,
};