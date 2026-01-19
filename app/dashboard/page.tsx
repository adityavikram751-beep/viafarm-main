"use client"
import ManageBanners from "./BannerManager";
import DonationsReceived from "../dashboard/Donation"; 
import RecentActivity from "./RecentActivity";
import StatsCards from "./CardStat";
import Topbar from "./Topbar";
// import ActivitySlider from "./components/ActivitySlider";
import socket from '../lib/socket'
import { useEffect } from "react";
export default function DashboardPage() {
 
 useEffect(() => {
   
    socket.connect();
    socket.on("connect", () => {
      console.log("✅ Connected to socket server:", socket.id);
    });

    
    socket.on("adminNotification", (data) => {
      console.log("📩 Notification from server:", data);
    });

    
    return () => {
      socket.off("connect");
      socket.off("adminNotification");
      socket.disconnect();
    };
  }, []);
  return (
    <div className="p-4 space-y-8">
      

      <Topbar/>
      {/* Stats Section */}
      <StatsCards />

      {/* Recent Activity */}
      {/* <ActivitySlider /> */}

      {/* Manage Banners (Placeholder) */}
      <RecentActivity/>
      <DonationsReceived/>
      <ManageBanners/>
      {/* <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Manage Banners</h2>
        <div className="h-32 bg-gray-100 flex items-center justify-center rounded-lg">
         
        </div>
      </div> */}
    </div>
  );
}
