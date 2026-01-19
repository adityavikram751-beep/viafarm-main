"use client"

import Topbar from "./Topbar";

import socket from '../lib/socket'
import { useEffect } from "react";
import ManageApp from "./ManageApp"; 
export default function Notifications() {
 
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
    <div className="p-2 space-y-8">
      

      <Topbar/>
     
      <ManageApp/>

      {/* Recent Activity */}
      {/* <ActivitySlider /> */}

      {/* Manage Banners (Placeholder) */}
      
    </div>
  );
}