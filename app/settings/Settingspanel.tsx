"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Upload, Trash2, Eye, EyeOff } from "lucide-react";
import socket from "../lib/socket";

export default function SettingsPage() {
  const BASE_URL = "https://vi-farm.onrender.com";

  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState("/profile.png");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    upiId: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // visibility state for each password input
  const [passwordVisible, setPasswordVisible] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [notifications, setNotifications] = useState({
    newVendorRegistration: false,
    newBuyerRegistration: false,
    newProductRegistration: false,
    newOrderPlaced: false,
  });

  const getToken = () => localStorage.getItem("token");

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("❌ Non-JSON response:", text);
      return { success: false, message: "Server returned non-JSON response" };
    }
  };

  /* ---------------------- FETCH PROFILE ---------------------- */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) return;
        const res = await fetch(`${BASE_URL}/api/admin/settings/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await safeJson(res);

        if (res.ok && data.success && data.data) {
          setFormData((prev) => ({
            ...prev,
            name: data.data.name || "",
            email: data.data.email || "",
            upiId: data.data.upiId || "",
          }));
          if (data.data.profilePicture) setProfilePic(data.data.profilePicture);
        }
      } catch (error) {
        console.error("❌ Fetch profile failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  /* ---------------------- FETCH NOTIFICATIONS ---------------------- */
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${BASE_URL}/api/admin/settings/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await safeJson(res);
        console.log("📥 Notification GET:", data);

        if (res.ok && data.success && data.notificationSettings) {
          setNotifications({
            newVendorRegistration: !!data.notificationSettings.newVendorRegistration,
            newBuyerRegistration: !!data.notificationSettings.newBuyerRegistration,
            newProductRegistration: !!data.notificationSettings.newProductRegistration,
            newOrderPlaced: !!data.notificationSettings.newOrderPlaced,
          });
        }
      } catch (error) {
        console.error("❌ Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
  }, []);

  /* ---------------------- INPUT CHANGE ---------------------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ---------------------- UPLOAD PREVIEW ---------------------- */
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) =>
      setProfilePic(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  /* ---------------------- DELETE PROFILE PIC ---------------------- */
  const handleDelete = async () => {
    if (!confirm("🗑️ Delete your profile picture?")) return;
    try {
      setLoading(true);
      const token = getToken();

      const res = await fetch(`${BASE_URL}/api/admin/settings/profile-picture`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await safeJson(res);

      if (res.ok && data.success) {
        setProfilePic("/profile.png");

        window.dispatchEvent(
          new CustomEvent("profile-updated", {
            detail: { profilePicture: "/profile.png" },
          })
        );

        try {
          if (socket?.connected)
            socket.emit("profileUpdated", { profilePicture: "/profile.png" });
        } catch {}

        alert("✅ Profile picture deleted!");
      } else {
        alert(`❌ Delete failed: ${data.message}`);
      }
    } catch (error) {
      alert("❌ Error deleting picture.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- SAVE PROFILE ---------------------- */
  const handleSave = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return alert("⚠️ No token found!");

      let res;

      if (uploadFile) {
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("email", formData.email);
        formDataToSend.append("upiId", formData.upiId);
        formDataToSend.append("profilePicture", uploadFile);

        res = await fetch(`${BASE_URL}/api/admin/settings/profile`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formDataToSend,
        });
      } else {
        res = await fetch(`${BASE_URL}/api/admin/settings/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            upiId: formData.upiId,
            profilePicture: profilePic,
          }),
        });
      }

      const data = await safeJson(res);

      if (res.ok && data.success) {
        const newPic = data.data?.profilePicture || profilePic;
        setProfilePic(newPic);

        window.dispatchEvent(
          new CustomEvent("profile-updated", {
            detail: { profilePicture: newPic, name: formData.name },
          })
        );

        alert("✅ Profile updated!");
        setUploadFile(null);
      } else {
        alert(`❌ Update failed: ${data.message}`);
      }
    } catch (error) {
      alert("❌ Network or server error.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- CHANGE PASSWORD ---------------------- */
  const handlePasswordUpdate = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword)
      return alert("⚠️ Fill all password fields!");

    if (formData.newPassword !== formData.confirmPassword)
      return alert("❌ Passwords do not match!");

    try {
      setLoading(true);
      const token = getToken();

      const res = await fetch(`${BASE_URL}/api/admin/settings/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await safeJson(res);

      if (res.ok && data.success) {
        alert("✅ Password updated!");
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        alert(`⚠️ Failed: ${data.message}`);
      }
    } catch (error) {
      alert("❌ Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- NOTIFICATION TOGGLE ---------------------- */
  const toggleNotification = async (key: string) => {
    const updated = {
      ...notifications,
      [key]: !notifications[key as keyof typeof notifications],
    };

    // instant UI update
    setNotifications(updated);

    try {
      const token = getToken();

      const res = await fetch(`${BASE_URL}/api/admin/settings/notifications`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });

      const data = await safeJson(res);
      console.log("📩 Notification PUT:", data);

      if (res.ok && data.success && data.notificationSettings) {
        setNotifications({
          newVendorRegistration:
            !!data.notificationSettings.newVendorRegistration,
          newBuyerRegistration:
            !!data.notificationSettings.newBuyerRegistration,
          newProductRegistration:
            !!data.notificationSettings.newProductRegistration,
          newOrderPlaced: !!data.notificationSettings.newOrderPlaced,
        });

        window.dispatchEvent(
          new CustomEvent("notification-updated", {
            detail: data.notificationSettings,
          })
        );
      } else {
        alert("⚠️ Failed to update notifications!");
      }
    } catch (err) {
      console.error("❌ Notification update failed:", err);
    }
  };

  /* ---------------------- TOGGLE VISIBILITY ---------------------- */
  const togglePasswordVisibility = (field: keyof typeof passwordVisible) => {
    setPasswordVisible((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  /* ---------------------- LOADING SCREEN ---------------------- */
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-lg font-medium">
        Loading...
      </div>
    );

  /* ---------------------- UI ---------------------- */
  return (
    <div className="flex bg-gray-100 h-screen fixed overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-64 bg-gray-200 border-r border-gray-300 p-6 flex-shrink h-full">
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setActiveTab("general")}
            className={`py-2 px-3 text-left rounded-md transition ${
              activeTab === "general"
                ? "bg-white shadow font-medium"
                : "hover:bg-gray-300"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`py-2 px-3 text-left rounded-md transition ${
              activeTab === "notifications"
                ? "bg-white shadow font-medium"
                : "hover:bg-gray-300"
            }`}
          >
            Notifications
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-scroll no-scrollbar w-[65vw] p-10">
        {/* GENERAL TAB */}
        {activeTab === "general" && (
          <div className="space-y-6 pb-16">
            {/* PROFILE */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-5">Profile Info</h3>

              <div className="flex items-center gap-10 mb-6">
                <Image
                  src={profilePic}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 shadow-sm"
                />

                <div className="flex gap-4">
                  <button
                    onClick={handleDelete}
                    className="border border-red-500 text-red-500 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>

                  <label className="border border-green-500 text-green-500 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-50 cursor-pointer">
                    <Upload size={16} /> Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label>Email Id *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label>UPI Id *</label>
                  <input
                    type="text"
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>

                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleSave}
                    className="bg-green-500 text-white rounded-lg px-10 py-2 hover:bg-green-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* PASSWORD */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-5">
                Change Password
              </h3>

              <div className="space-y-5">
                <div>
                  <label>Current Password *</label>
                  <div className="relative">
                    <input
                      type={passwordVisible.currentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("currentPassword")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                      aria-label={
                        passwordVisible.currentPassword ? "Hide password" : "Show password"
                      }
                    >
                      {passwordVisible.currentPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label>New Password *</label>
                  <div className="relative">
                    <input
                      type={passwordVisible.newPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("newPassword")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                      aria-label={
                        passwordVisible.newPassword ? "Hide password" : "Show password"
                      }
                    >
                      {passwordVisible.newPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label>Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={passwordVisible.confirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirmPassword")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                      aria-label={
                        passwordVisible.confirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {passwordVisible.confirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-center mt-6">
                  <button
                    onClick={handlePasswordUpdate}
                    className="bg-blue-600 text-white rounded-lg px-10 py-2 hover:bg-blue-700"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <div className="border rounded-xl p-8 bg-gray-50 shadow-sm space-y-6 pb-16">
            <h3 className="font-semibold mb-6 text-gray-800">
              Manage Your Notifications
            </h3>

            {Object.entries(notifications).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between w-full max-w-xl"
              >
                <span>{key.replace(/([A-Z])/g, " $1")}</span>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => toggleNotification(key)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
