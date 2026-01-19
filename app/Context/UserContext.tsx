"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface UserData {
  name: string;
  email: string;
  picture: string;
  upiId?: string;
}

const UserContext = createContext<{
  user: UserData;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
}>({
  user: { name: "", email: "", picture: "/about/about.jpg", upiId: "" },
  setUser: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData>({
    name: "Admin",
    email: "admin@example.com",
    picture: "/about/about.jpg",
    upiId: "",
  });

  // Optional: Load saved user data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("userProfile");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // Auto-save to localStorage when user changes
  useEffect(() => {
    localStorage.setItem("userProfile", JSON.stringify(user));
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
