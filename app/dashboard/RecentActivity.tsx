/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";

const BASE_URL = "https://vi-farm.onrender.com/api/admin/recent-activity";

interface ActivityItem {
  _id: string;
  createdAt: string;
  name: string;
  profilePicture?: string;
}

interface RecentActivityData {
  activities: ActivityItem[];
  page: number;
  pages: number;
  total: number;
}

interface ApiResponse {
  success: boolean;
  data: RecentActivityData;
}

const DEFAULT_AVATAR = "/images/default-user.png";

const formatTime = (isoDate: string): string => {
  try {
    return formatDistanceToNow(parseISO(isoDate), { addSuffix: true })
      .replace("about ", "")
      .replace("less than a minute ago", "just now");
  } catch {
    return "Unknown time";
  }
};

export default function RecentActivity() {
  const [allActivities, setAllActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const perPage = 4;
  const totalPages = Math.ceil(allActivities.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const currentActivities = allActivities.slice(startIndex, startIndex + perPage);

  useEffect(() => {
    const fetchActivityData = async () => {
      setLoading(true);
      setError(null);
      try {
        // ✅ Same logic as BuyerOrdersPanel
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token") || "";

        if (!token) throw new Error("No auth token found. Please login again.");

        const res = await fetch(BASE_URL, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const json: ApiResponse = await res.json();

        if (json.success && json.data) {
          setAllActivities(json.data.activities || []);
        } else throw new Error("Invalid response");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, []);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);

  const ActivitySkeleton = () => (
    <div className="flex items-center justify-between border-r-2 bg-gray-50 p-4 rounded-2xl shadow-sm animate-pulse">
      <div className="flex items-center gap-3 w-full">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div>
          <div className="h-4 bg-gray-200 w-40 mb-1 rounded"></div>
          <div className="h-3 bg-gray-200 w-24 rounded"></div>
        </div>
      </div>
      <div className="h-3 bg-gray-200 w-10 rounded"></div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-0 max-w-6xl mx-auto font-sans border border-gray-300 shadow-sm overflow-hidden">
      {/* Title + Full-width underline */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800">Recent Activity</h2>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {error && (
          <div className="p-3 text-red-700 bg-red-100 rounded-lg border-l-4 border-red-500 font-medium">
            Error loading: {error}
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <>
              <ActivitySkeleton />
              <ActivitySkeleton />
              <ActivitySkeleton />
            </>
          ) : currentActivities.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">
              No recent activity found.
            </div>
          ) : (
            currentActivities.map((activity) => (
              <div
                key={activity._id}
                className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={activity.profilePicture || DEFAULT_AVATAR}
                    alt={activity.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      New Buyer Registration
                    </p>
                    <p className="text-xs text-gray-500">{activity.name}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatTime(activity.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6 text-sm text-gray-500">
          <p>
            {currentActivities.length > 0
              ? `Page ${currentPage} of ${totalPages}`
              : "No pages"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1 || loading}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100 disabled:opacity-50"
            >
              {"<"}
            </button>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages || loading}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100 disabled:opacity-50"
            >
              {">"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
