/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// 🧩 BuyersPanel.tsx — FINAL STABLE VERSION
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpDown,
} from "lucide-react";
import Image from "next/image";

interface Address {
  city?: string;
  district?: string;
  locality?: string;
}

interface Buyer {
  _id: string;
  name: string;
  mobileNumber: string;
  totalOrdersAsBuyer: number;
  addresses: Address[];
}

interface Product {
  _id: number;
  name: string;
  category: string;
  variety: string;
  price: number;
  rating?: string;
  sellerName?: string;
  vendorName?: string;
  quantity?: number;
  unit?: string;
  images: string[];
}

interface BuyerDetail {
  buyer: {
    profilePicture: string;
    name: string;
    contactNo: string;
    totalOrders: number;
    location: Record<string, string>;
  };
  orders: {
    vendor: any;
    vendorDetails: any;
    _id: string;
    orderId: string;
    products: {
      vendorName: string | undefined;
      product: Product;
    }[];
  }[];
}

const BASE_URL = "https://vi-farm.onrender.com";

export default function BuyersPanel() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [filteredBuyers, setFilteredBuyers] = useState<Buyer[]>([]);
  const [buyerDetail, setBuyerDetail] = useState<BuyerDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);
  const rowsPerPage = 12;

  // 🟢 Fetch Buyers
  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        setLoading(true);

        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token") || "";

        if (!token) throw new Error("No authorization token found.");

        const res = await fetch(`${BASE_URL}/api/admin/buyers`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401)
          throw new Error("Unauthorized! Token invalid or expired.");

        if (!res.ok) throw new Error(`HTTP error! ${res.status}`);

        const data = await res.json();
        const buyersList = data.data || data;

        setBuyers(buyersList);
        setFilteredBuyers(buyersList);
      } catch (err: any) {
        console.error("❌ Error fetching buyers:", err);
        setError(err.message || "Error fetching buyers");
      } finally {
        setLoading(false);
      }
    };

    fetchBuyers();
  }, []);

  // 🔍 Search Filter
  useEffect(() => {
    const q = searchQuery.toLowerCase();

    const result = buyers.filter((b) => {
      const name = b.name?.toLowerCase() || "";
      const mobile = b.mobileNumber?.toString().toLowerCase() || "";
      const location = getLocation(b.addresses)?.toLowerCase() || "";

      return name.includes(q) || mobile.includes(q) || location.includes(q);
    });

    setFilteredBuyers(result);
    setCurrentPage(1);
  }, [searchQuery, buyers]);

  // 🔁 Sort by Name
  const handleSort = () => {
    const sorted = [...filteredBuyers].sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
    setFilteredBuyers(sorted);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // ❌ Delete Buyer
  const handleDelete = async (buyerId: string) => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token") || "";

      if (!token) throw new Error("No authorization token found.");

      const res = await fetch(`${BASE_URL}/api/admin/users/${buyerId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      if (!res.ok || !result.success)
        throw new Error(result.message || "Failed to delete buyer");

      setBuyers((prev) => prev.filter((b) => b._id !== buyerId));
      setFilteredBuyers((prev) => prev.filter((b) => b._id !== buyerId));

      alert("✅ Buyer deleted successfully!");
    } catch (err: any) {
      alert(`❌ Error deleting buyer: ${err.message}`);
    }
  };

  // 👁️ View Buyer Detail
  const handleView = async (buyerId: string) => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token") || "";

      if (!token) throw new Error("No authorization token found.");

      const res = await fetch(`${BASE_URL}/api/admin/buyer/${buyerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        setBuyerDetail(data.data);
        setOpenMenu(null);
        setSelectedCategory("All");
      } else {
        throw new Error("Failed to fetch buyer details.");
      }
    } catch (err: any) {
      console.error("Error fetching buyer detail:", err);
      alert(`❌ Error loading buyer details: ${err.message}`);
    }
  };

  // 🧭 Close Modal Outside Click
  const handleOutsideClick = (e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setBuyerDetail(null);
    }
  };

  useEffect(() => {
    if (buyerDetail) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [buyerDetail]);

  const getLocation = (addresses: Address[]) => {
    if (!addresses?.length) return "—";
    const addr = addresses.find((a) => a.city || a.district || a.locality);
    return `${addr?.locality || ""}, ${addr?.city || addr?.district || ""}`.replace(
      /, $/,
      ""
    );
  };

  const totalPages = Math.ceil(filteredBuyers.length / rowsPerPage);
  const paginatedBuyers = filteredBuyers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // ✅ MAIN FIX: Category Normalizer (same names keep, but API category match properly)
  const normalizeCategory = (cat: string) => {
    const c = (cat || "").toLowerCase().trim();

    // handle variations from API
    if (c.includes("fruit")) return "fruits";
    if (c.includes("vegetable")) return "vegetables";
    if (c.includes("plant")) return "plants";
    if (c.includes("seed")) return "seeds";
    if (c.includes("handicraft") || c.includes("hand craft")) return "handicrafts";

    return c;
  };

  // ✅ Filter Orders by Selected Category (WORKING)
  const filteredOrders =
    selectedCategory === "All"
      ? buyerDetail?.orders || []
      : buyerDetail?.orders?.filter((order) =>
          order.products.some((item) => {
            const apiCat = normalizeCategory(item?.product?.category || "");
            const selected = normalizeCategory(selectedCategory);

            return apiCat === selected;
          })
        ) || [];

  if (loading)
    return (
      <div className="flex justify-center items-center py-10 text-gray-600">
        Loading buyers...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center py-10 text-red-600">
        {error}
      </div>
    );

  return (
    <div className="bg-white p-4 rounded-xl shadow-md relative">
      {/* 🔍 Search + Sort */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 px-4 py-2 w-72 border border-gray-300 bg-white rounded-xl shadow-sm">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search "
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>

        <button
          onClick={handleSort}
          className="flex items-center gap-2 border border-gray-300 bg-white px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          <ArrowUpDown className="w-4 h-4" /> Sort by
        </button>
      </div>

      {/* 🧾 Buyers Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Location</th>
              <th className="text-left p-3">Contact No.</th>
              <th className="text-left p-3">Total Orders</th>
              <th className="text-center p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {paginatedBuyers.map((buyer, i) => (
              <tr
                key={buyer._id}
                className="border-b hover:bg-gray-50 transition-colors relative"
              >
                <td className="p-3">{buyer.name}</td>
                <td className="p-3">{getLocation(buyer.addresses)}</td>
                <td className="p-3">{buyer.mobileNumber}</td>
                <td className="p-3">{buyer.totalOrdersAsBuyer}</td>

                <td className="text-center relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === i ? null : i)}
                    className="p-2 hover:bg-gray-200 rounded-full"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>

                  {openMenu === i && (
                    <div className="absolute right-8 top-8 bg-white shadow-lg rounded-lg text-sm w-40 py-2 z-50 border">
                      <button
                        onClick={() => handleView(buyer._id)}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(buyer._id)}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Delete Buyer
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔢 Pagination */}
      <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
        <span>Results per page - {rowsPerPage}</span>
        <span>
          {currentPage} of {totalPages} pages
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 🟡 Buyer Detail Modal */}
      {buyerDetail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl w-[740px] max-h-[90vh] overflow-y-auto p-6 relative"
          >
            <button
              onClick={() => setBuyerDetail(null)}
              className="absolute top-5 right-5 text-gray-500 hover:text-gray-800 transition"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="border-b pb-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {buyerDetail.buyer.name}
              </h2>
            </div>

            {/* Buyer Info */}
            <div className="flex items-center gap-6 mb-8 p-4 rounded-2xl">
              <Image
                src={
                  buyerDetail.buyer.profilePicture ||
                  "/buyer user/buyeruser.png"
                }
                alt={buyerDetail.buyer.name}
                width={300}
                height={300}
                className="rounded-xl object-cover border"
              />

              <div className="flex flex-col justify-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {buyerDetail.buyer.name}
                </h2>

                <p className="text-[15px] text-gray-700 mb-1">
                  <span className="font-medium text-gray-800">Location</span> –{" "}
                  {Object.values(buyerDetail.buyer.location || {}).join(", ") ||
                    "—"}
                </p>

                <p className="text-[15px] text-gray-700 mb-1">
                  <span className="font-medium text-gray-800">
                    Contact No.
                  </span>{" "}
                  – {buyerDetail.buyer.contactNo || "—"}
                </p>

                <p className="text-[15px] text-gray-700 mb-1">
                  <span className="font-medium text-gray-800">
                    Total Orders
                  </span>{" "}
                  – {buyerDetail.buyer.totalOrders || 0}
                </p>
              </div>
            </div>

            {/* Orders Section */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-800 font-semibold text-[15px]">
                Orders ({filteredOrders.length})
              </h3>

            
            </div>

            {/* Orders */}
            {filteredOrders.length === 0 ? (
              <p className="text-gray-500 text-sm">No orders found.</p>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) =>
                  order.products.map((item, idx) => {
                    const p = item?.product || ({} as any);
                    const unit = p?.unit || "kg";
                    const quantity = p?.quantity || 10;

                    const vendorName =
                      p?.sellerName ||
                      p?.vendorName ||
                      item?.vendorName ||
                      order?.vendorDetails?.name ||
                      order?.vendor?.name ||
                      "—";

                    return (
                      <div
                        key={p?._id || idx}
                        className="relative flex items-center border border-yellow-300 rounded-2xl bg-white overflow-hidden shadow-sm"
                      >
                        <Image
                          src={p?.images?.[0] || "/mango.jpg"}
                          alt={p?.name || "Product"}
                          width={160}
                          height={120}
                          className="object-cover h-[130px] w-[160px]"
                        />

                        <div className="absolute top-2 right-3 bg-white border border-gray-300 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <span className="text-yellow-500">⭐</span>
                          {p?.rating || "9.2"}
                        </div>

                        <div className="p-6 flex flex-col justify-center">
                          <h4 className="text-lg font-semibold text-gray-800">
                            {p?.name || "Unnamed Product"}
                          </h4>

                          <p className="text-gray-800 text-[15px] mt-1">
                            by {vendorName}
                          </p>

                          <p className="text-gray-800 text-[14px] mt-2">
                            Price:{" "}
                            <span className="font-medium">
                              ₹{p?.price || "—"}/{quantity}
                              {unit}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
