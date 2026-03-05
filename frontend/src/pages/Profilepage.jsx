import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selUser, fetchMe } from "../redux/slices/authSlice";
import { CSS } from "./ProfilePageComponent/ProfilePage.styles";
import PasswordSection from "./ProfilePageComponent/PasswordSection";
import ProfileInfoSection from "./ProfilePageComponent/ProfileInfoSection";
import EmailSection from "./ProfilePageComponent/EmailSection";

export default function ProfilePage() {
  const user     = useSelector(selUser);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <>
      <style>{CSS}</style>
      <div className="pf-wrap">
        <header style={{ marginBottom: 30 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Account Settings</h1>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Manage your profile and security preferences</p>
        </header>

        <ProfileInfoSection user={user} />
        <EmailSection user={user} />
        <PasswordSection />
      </div>
    </>
  );
}