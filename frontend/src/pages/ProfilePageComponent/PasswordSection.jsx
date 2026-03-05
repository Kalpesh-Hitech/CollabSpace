import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { THEME as T } from "../../config/theme.config";
import { changePassword, selLoading } from "../../redux/slices/authSlice";
import { PasswordField } from "../ProfilePageComponent/ProfileUIComponents";

export default function PasswordSection() {
  const dispatch = useDispatch();
  const loading = useSelector(selLoading);
  const [form, setForm] = useState({ old: "", new: "", confirm: "" });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [success, setSuccess] = useState(false);

  const handleSet = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleShow = (k) => setShow(s => ({ ...s, [k]: !s[k] }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.old || !form.new || !form.confirm) return;
    if (form.new !== form.confirm) { return; }
    const res = await dispatch(changePassword({ oldPassword: form.old, newPassword: form.new }));
    if (res.meta.requestStatus === 'fulfilled') {
      setSuccess(true);
      setForm({ old: "", new: "", confirm: "" });
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="pf-card">
      <div className="pf-card-header"><strong>Change Password</strong></div>
      <form className="pf-card-body" onSubmit={onSubmit}>
        {success && <div style={{ color: T.colors.success.text, marginBottom: 10 }}>Password Updated!</div>}
        <PasswordField id="old" label="Current Password" value={form.old} show={show.old} onChange={handleSet} onToggle={toggleShow} />
        <PasswordField id="new" label="New Password" value={form.new} show={show.new} onChange={handleSet} onToggle={toggleShow} />
        <PasswordField id="confirm" label="Confirm Password" value={form.confirm} show={show.confirm} onChange={handleSet} onToggle={toggleShow} />
        <button className="pf-btn pf-btn-primary" type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}