"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, Trash2 } from "lucide-react";
import axios from "axios";
import socket from "../lib/socket";
import { useRouter } from "next/navigation";

/* ---------------- CONFIG ---------------- */
const BASE_URL = "https://viafarm-1.onrender.com";
const NOTIF_API = `${BASE_URL}/api/notifications`;
const DEL_ALL_API = `${NOTIF_API}/delete-all`;
const PROFILE_API = `${BASE_URL}/api/admin/settings/profile`;

/* ---------------- TYPES ---------------- */
interface Notification {
  _id: string;
  title?: string;
  message?: string;
  isRead?: boolean;
  createdAt?: string;
}

/* ---------------- COMPONENT ---------------- */
const Topbar: React.FC = () => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  /* FETCH PROFILE */
  const fetchProfile = async () => {
    try {
      const res = await axios.get(PROFILE_API, getAuthConfig());
      const data = res.data?.data || res.data?.user || res.data;
      if (data) setProfile(data);
    } catch (err) {
      console.error("❌ Profile fetch failed:", err);
    }
  };

  /* FETCH NOTIFICATIONS */
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(NOTIF_API, getAuthConfig());
      const raw = res.data?.notifications ?? res.data?.data ?? res.data;
      const items = Array.isArray(raw) ? raw : [];
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setNotifications(items);
    } catch (err) {
      console.error("❌ Notification fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  /* MARK AS READ */
  const markAsRead = async (_id: string) => {
    try {
      await axios.put(`${NOTIF_API}/${_id}/read`, {}, getAuthConfig());
      setNotifications((prev) => prev.map((n) => (n._id === _id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error("❌ Failed to mark as read:", err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchNotifications();

    socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
    socket.on("adminNotification", (data: any) => {
      if (!data || !data._id) return;
      setNotifications((prev) => {
        if (prev.find((n) => n._id === data._id)) return prev;
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
        return [data, ...prev];
      });
    });

    // ===== window event listeners for live update from SettingsPage =====
    const handleProfileUpdate = (e: any) => {
      if (e?.detail?.profilePicture || e?.detail?.name) {
        setProfile((prev: any) => ({
          ...prev,
          profilePicture: e.detail.profilePicture ?? prev?.profilePicture,
          name: e.detail.name ?? prev?.name,
        }));
      }
    };

    const handleNotifUpdate = (e: any) => {
      // reload notifications or merge
      fetchNotifications();
    };

    window.addEventListener("profile-updated", handleProfileUpdate as EventListener);
    window.addEventListener("notification-updated", handleNotifUpdate as EventListener);

    return () => {
      socket.off("adminNotification");
      socket.off("connect");
      window.removeEventListener("profile-updated", handleProfileUpdate as EventListener);
      window.removeEventListener("notification-updated", handleNotifUpdate as EventListener);
    };
  }, []);

  /* DELETE ONE */
  const deleteNotification = async (_id: string, e?: any) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n._id !== _id));
    try {
      await axios.delete(`${NOTIF_API}/${_id}`, getAuthConfig());
    } catch {
      fetchNotifications();
    }
  };

  /* DELETE ALL */
  const deleteAllNotifications = async () => {
    if (!window.confirm("Delete all notifications?")) return;
    try {
      await axios.delete(DEL_ALL_API, getAuthConfig());
      setNotifications([]);
    } catch {
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <audio ref={audioRef} src="/sounds/notification.mp4.wav" preload="auto" />

      <div className="fixed top-0 left-64 w-[calc(100%-16rem)] flex justify-between items-center px-6 py-4 bg-gray-100 border-b-2 z-50">
        <h1 className="text-2xl font-semibold text-gray-800">ManageApps</h1>

        <div className="flex items-center gap-5">
          <span className="text-gray-700 text-sm font-medium">{currentDate}</span>

          {/* Notification Bell */}
          <div className="relative flex items-center">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all"
            >
              <Image src="/images/vector.png" alt="Bell Icon" width={70} height={70} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 top-[115%] w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="text-base font-semibold text-gray-800">Notifications ({unreadCount} unread)</h3>
                  <button onClick={() => setIsNotifOpen(false)} className="text-gray-500 hover:text-gray-700">
                    <X size={18} />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {loading ? (
                    <p className="p-4 text-sm text-gray-500 text-center">Loading notifications...</p>
                  ) : notifications.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 text-center">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => {
                      const isRead = n.isRead;
                      const timeText = n.createdAt ? new Date(n.createdAt).toLocaleString() : "";
                      return (
                        <div
                          key={n._id}
                          onClick={() => markAsRead(n._id)}
                          className={`cursor-pointer p-3 border-b flex justify-between items-start transition-all ${isRead ? "bg-white" : "bg-blue-50 hover:bg-blue-100"}`}
                        >
                          <div>
                            <p className="text-sm font-medium">{n.message || n.title || "Notification"}</p>
                            <span className="text-xs text-gray-500 block">{timeText}</span>
                          </div>
                          <button onClick={(e) => deleteNotification(n._id, e)} className="text-gray-400 hover:text-red-500 p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-3 border-t text-center">
                    <button onClick={deleteAllNotifications} className="flex items-center justify-center gap-2 text-red-500 hover:text-red-600 text-sm font-medium w-full">
                      <Trash2 size={15} /> Delete All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <button onClick={() => router.push("/settings")} className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 shadow-sm cursor-pointer">
            <Image src={profile?.profilePicture || "/about/about.jpg"} alt="Profile" width={40} height={40} className="object-cover w-full h-full" />
          </button>
        </div>
      </div>
    </>
  );
};

export default Topbar;
