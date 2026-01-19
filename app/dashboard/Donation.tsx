"use client";

import { ArrowUpDown, Loader2, Info } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const BASE_API_URL = "https://vi-farm.onrender.com";
const DONATION_ENDPOINT = "/api/buyer/donation";
const ITEMS_PER_PAGE = 12;

interface Donation {
  donorName: string;
  amount: number;
  transactionRef: string | null;
  date: string;
}

const sortFields = ["date", "amount", "donorName", "transactionRef"] as const;

export default function DonationsReceived() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [sortedDonations, setSortedDonations] = useState<Donation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortFieldIndex, setSortFieldIndex] = useState(0);

  const fetchDonations = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    const apiUrl = `${BASE_API_URL}${DONATION_ENDPOINT}?page=${page}&limit=${ITEMS_PER_PAGE}`;
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const result = await res.json();

      const items =
        result.donations ?? result.data?.donations ?? result.data ?? result ?? [];
      const total = result.totalCount ?? result.data?.totalCount ?? items.length;

      const normalized = (items ?? []).map((item: any) => ({
        donorName: item.donorName ?? item.name ?? "Unknown",
        amount: item.amount ?? 0,
        transactionRef:
          item.transactionRef ?? item.transactionId ?? item._id ?? null,
        date:
          item.date ??
          item.createdAt ??
          item.created_at ??
          item.paymentDate ??
          "",
      }));

      setDonations(normalized);
      setTotalCount(total);
      setTotalPages(Math.ceil(total / (result.resultsPerPage || ITEMS_PER_PAGE)));
      setCurrentPage(result.currentPage || page);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonations(currentPage);
  }, [currentPage, fetchDonations]);

  useEffect(() => {
    const field = sortFields[sortFieldIndex];
    const sorted = [...donations].sort((a, b) => {
      const valA = a[field] ?? "";
      const valB = b[field] ?? "";

      if (field === "date") {
        const da = new Date(valA).getTime();
        const db = new Date(valB).getTime();
        return sortOrder === "asc" ? da - db : db - da;
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }

      return sortOrder === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    setSortedDonations(sorted);
  }, [donations, sortOrder, sortFieldIndex]);

  const handlePrev = () => {
    if (currentPage > 1 && !loading) setCurrentPage((p) => p - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages && !loading) setCurrentPage((p) => p + 1);
  };

  const handleSortClick = () => {
    if (sortOrder === "asc") {
      setSortOrder("desc");
    } else {
      setSortOrder("asc");
      setSortFieldIndex((prev) => (prev + 1) % sortFields.length);
    }
  };

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
        <h2 className="text-[24px] font-semibold text-gray-800">
          Donations Received <span>({totalCount})</span>
        </h2>

        {/* Sort Button (just like your screenshot) */}
        <button
          onClick={handleSortClick}
          className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2 text-gray-700 hover:bg-gray-50 transition font-medium"
        >
          <ArrowUpDown className="w-4 h-4" />
          <span>Sort by</span>
        </button>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex justify-center items-center py-12 text-blue-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Fetching Donations...
        </div>
      )}

      {error && (
        <div className="flex items-center p-4 bg-red-50 text-red-700 border-l-4 border-red-500 m-4 rounded">
          <Info className="w-5 h-5 mr-2" />
          <span>Error: {error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-t">
            <thead className="bg-[#fafafa]">
              <tr>
                <th className="px-6 py-4 text-[18px] font-semibold text-gray-800">
                  Name
                </th>
                <th className="px-6 py-4 text-[18px] font-semibold text-gray-800">
                  Amount
                </th>
                <th className="px-6 py-4 text-[18px] font-semibold text-gray-800">
                  Transaction ID
                </th>
                <th className="px-6 py-4 text-[18px] font-semibold text-gray-800">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDonations.length > 0 ? (
                sortedDonations.map((donation, index) => (
                  <tr
                    key={donation.transactionRef || index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-3 text-gray-700 text-[17px] font-medium">
                      {donation.donorName}
                    </td>
                    <td className="px-6 py-3 text-gray-700 text-[17px] font-medium">
                      ₹ {donation.amount}
                    </td>
                    <td className="px-6 py-3 text-gray-700 text-[17px] font-medium">
                      {donation.transactionRef || "N/A"}
                    </td>
                    <td className="px-6 py-3 text-gray-700 text-[17px] font-medium">
                      {donation.date || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-8 text-gray-500 font-medium"
                  >
                    No donations received yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Pagination */}
      <div className="px-6 py-4 border-t border-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <p>Results per page - {ITEMS_PER_PAGE}</p>
          <p className="flex-grow text-center">
            {totalCount > 0
              ? `Page ${currentPage} of ${totalPages}`
              : `No pages to display`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1 || loading || totalPages <= 1}
              className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-full hover:bg-gray-100 transition disabled:opacity-50"
            >
              {"<"}
            </button>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages || loading || totalPages <= 1}
              className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-full hover:bg-gray-100 transition disabled:opacity-50"
            >
              {">"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
