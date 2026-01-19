"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

const BASE_URL = "https://vi-farm.onrender.com";

export default function LoginPage() {
  const router = useRouter();

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<
    "email" | "otp" | "setPassword"
  >("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  /* ================= BACK HANDLER ================= */
  const handleBack = () => {
    if (forgotStep === "setPassword") {
      setForgotStep("otp");
    } else if (forgotStep === "otp") {
      setForgotStep("email");
    } else {
      setIsForgotOpen(false);
      setForgotStep("email");
    }
  };

  /* ================= LOGIN ================= */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/admin-login`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data?.success && res.data?.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("isLoggedIn", "true");
        router.push("/dashboard");
      } else {
        alert(res.data?.message || "Invalid login credentials");
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Login failed");
    }
  };

  /* ================= STEP 1: REQUEST OTP ================= */
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/request-password-otp`,
        { email: forgotEmail },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data?.success) {
        alert("✅ " + res.data.message);
        setForgotStep("otp");
      } else {
        alert(res.data?.message || "OTP send failed");
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= STEP 2: VERIFY OTP ================= */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/verify-otp-admin`,
        { otp },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data?.success) {
        alert("✅ OTP verified");
        setForgotStep("setPassword");
      } else {
        alert(res.data?.message || "Invalid OTP");
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= STEP 3: SET PASSWORD ================= */
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/set-password-admin`,
        { newPassword, confirmPassword },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data?.success) {
        alert("✅ Password reset successfully");
        resetForgotFlow();
      } else {
        alert(res.data?.message || "Password reset failed");
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Error setting password");
    } finally {
      setLoading(false);
    }
  };

  const resetForgotFlow = () => {
    setForgotEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotStep("email");
    setIsForgotOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* LEFT IMAGE */}
      <div className="md:w-1/2 w-full h-1/3 md:h-full">
        <img
          src="/images/farmers.png"
          alt="Farmers"
          className="w-full h-full object-cover"
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="md:w-1/2 w-full flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-md flex flex-col justify-center">
          <div className="flex justify-center mb-6">
            <img src="/images/logo.png" alt="Logo" className="h-60" />
          </div>

          {!isForgotOpen ? (
            <>
              <h2 className="text-2xl font-semibold text-center mb-6">
                Welcome Back!
              </h2>

              <form onSubmit={handleLogin} className="space-y-5">
                <input
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border rounded-full px-4 py-3"
                />

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border rounded-full px-4 py-3 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="text-green-600 text-sm"
                  >
                    Forgot password?
                  </button>
                </div>

                <button className="w-full bg-green-600 text-white py-3 rounded-full">
                  Login
                </button>
              </form>
            </>
          ) : (
            <>
              {forgotStep === "email" && (
                <form onSubmit={handleRequestOtp} className="space-y-5">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-sm text-gray-500"
                  >
                    ← Back to Login
                  </button>

                  <h2 className="text-xl text-center font-semibold">
                    Forgot Password
                  </h2>

                  <input
                    type="email"
                    placeholder="Enter Email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full border rounded-full px-4 py-3"
                  />

                  <button className="w-full bg-green-600 text-white py-3 rounded-full">
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </form>
              )}

              {forgotStep === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-sm text-gray-500"
                  >
                    ← Back
                  </button>

                  <h2 className="text-xl text-center font-semibold">
                    Verify OTP
                  </h2>

                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="w-full border rounded-full px-4 py-3"
                  />

                  <button className="w-full bg-green-600 text-white py-3 rounded-full">
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                </form>
              )}

              {forgotStep === "setPassword" && (
                <form onSubmit={handleSetPassword} className="space-y-5">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-sm text-gray-500"
                  >
                    ← Back
                  </button>

                  <h2 className="text-xl text-center font-semibold">
                    Set New Password
                  </h2>

                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full border rounded-full px-4 py-3"
                  />

                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full border rounded-full px-4 py-3"
                  />

                  <button className="w-full bg-green-600 text-white py-3 rounded-full">
                    {loading ? "Saving..." : "Reset Password"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
