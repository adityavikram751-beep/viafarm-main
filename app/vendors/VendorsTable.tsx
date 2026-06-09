"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Search,
  List,
  AlertTriangle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
} from "lucide-react";
import Image from "next/image";

interface Vendor {
  _id: string;
  name: string;
  mobileNumber: string;
  status: string;
  profilePicture?: string;
  address?:
    | {
        city?: string;
        district?: string;
        houseNumber?: string;
        locality?: string;
        pinCode?: string;
      }
    | string;
  vendorDetails?: {
    about?: string;
  };
  isApproved?: boolean;
  rejectionReason?: string;
}

interface Product {
  _id: string;
  name: string;
  category: string;
  variety: string;
  price: number;
  quantity: number;
  unit?: string;
  weightPerPiece?: string | null;
  status: string;
  images: string[];
  createdAt: string;
}

export default function Vendors() {
  const [mode, setMode] = useState<"list" | "alert">("list");
  const [openMenu, setOpenMenu] = useState<string | null>(null); // vendor._id or "filter"
  const [currentPage, setCurrentPage] = useState(1);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showRejectedView, setShowRejectedView] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [productFilter, setProductFilter] = useState<string>("All");
  const [modalCategory, setModalCategory] = useState<string>("All Categories");

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [showCompactView, setShowCompactView] = useState(false);

  const filterRef = useRef<HTMLDivElement | null>(null);

  const rowsPerPage = 12;

  const getLocation = (address?: Vendor["address"] | Record<string, any> | string) => {
    if (!address) return "—";
    if (typeof address === "string") return address.trim() || "—";

    const order = ["houseNumber", "locality", "city", "district", "pinCode"];
    const parts = order
      .map((key) => {
        const value = (address as Record<string, any>)[key];
        if (typeof value === "string") return value.trim();
        if (typeof value === "number") return String(value);
        return "";
      })
      .filter((part) => part && part.trim() !== "");

    if (parts.length > 0) return parts.join(", ");

    const flatten = (value: any): string[] => {
      if (value == null) return [];
      if (typeof value === "string") return [value.trim()].filter(Boolean);
      if (typeof value === "number" || typeof value === "boolean") return [String(value)];
      if (Array.isArray(value)) return value.flatMap(flatten);
      if (typeof value === "object") return Object.values(value).flatMap(flatten);
      return [];
    };

    const fallbackParts = flatten(address).filter((part) => part.trim() !== "");
    return fallbackParts.join(", ") || "—";
  };

  const formatVendorAddress = (address?: Vendor["address"] | Record<string, any> | string) => {
    const location = getLocation(address);
    return location === "—" ? "N/A" : location;
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.mobileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getLocation(vendor.address).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedCategory === "All" || vendor.status === selectedCategory;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredVendors.length / rowsPerPage);
  const paginatedVendors = filteredVendors.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "https://vi-farm-backend.onrender.com/api/admin/vendors",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setVendors(res.data.data || []);
      } catch (err) {
        setError("Failed to fetch vendors.");
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleViewVendor = async (vendor: Vendor) => {
    try {
      if (vendor.status === "Rejected") {
        setSelectedVendor(vendor);
        setShowRejectedView(true);
        return;
      }

      setSelectedVendor(vendor);
      setShowModal(true);
      setProductFilter("All");
      setModalCategory("All Categories");
      setVendorProducts([]);
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `https://vi-farm-backend.onrender.com/api/admin/vendor/${vendor._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const vendorPayload =
        res.data?.data?.vendor || res.data?.data || res.data?.vendor || res.data || {};
      const productsPayload =
        res.data?.data?.listedProducts || res.data?.listedProducts || [];

      const isNonEmptyAddress = (value: any) => {
        if (!value) return false;
        if (typeof value === "string") return value.trim() !== "";
        if (typeof value === "object") {
          return ["houseNumber", "locality", "city", "district", "pinCode"].some((key) => {
            const part = value[key];
            return typeof part === "string" ? part.trim() !== "" : part != null;
          });
        }
        return false;
      };

      const selectedAddress = isNonEmptyAddress(vendorPayload.address)
        ? vendorPayload.address
        : isNonEmptyAddress(vendorPayload.location)
        ? vendorPayload.location
        : vendor.address;

      const mergedVendor = { ...vendor, ...vendorPayload, address: selectedAddress };
      setSelectedVendor(mergedVendor);
      setVendorProducts(productsPayload);
    } catch (err) {
      console.error("Error fetching vendor details:", err);
    }
  };

  const handleCompactView = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowCompactView(true);
  };

  const handleToggleBlock = async (vendor: Vendor) => {
    try {
      const token = localStorage.getItem("token");
      const newStatus = vendor.status === "Blocked" ? "Active" : "Blocked";
      const res = await axios.put(
        `https://vi-farm-backend.onrender.com/api/admin/vendors/${vendor._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setVendors((prev) =>
          prev.map((v) => (v._id === vendor._id ? { ...v, status: newStatus } : v))
        );
        alert(`Vendor status updated to ${newStatus}`);
      }
    } catch (error) {
      alert("Failed to update vendor status.");
    }
  };

  const handleApproveVendor = async (vendor: Vendor) => {
    if (!confirm(`Approve vendor ${vendor.name}?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `https://vi-farm-backend.onrender.com/api/admin/vendors/${vendor._id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        const returnedStatus = res.data?.data?.status || "Active";
        setVendors((prev) =>
          prev.map((v) =>
            v._id === vendor._id
              ? { ...v, status: returnedStatus, isApproved: res.data.data.isApproved }
              : v
          )
        );
        alert(res.data?.message || "Vendor approved successfully ✅");
      } else {
        alert(res.data?.message || "Failed to approve vendor ❌");
      }
    } catch (err: any) {
      alert("Network or API error while approving vendor ❌");
    }
  };

  const handleRejectVendor = async (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowRejectModal(true);
  };

  const submitReject = async () => {
    if (!selectedVendor) return;
    if (!rejectReason.trim()) {
      alert("Please write a reason for rejection.");
      return;
    }
    if (!confirm(`Reject vendor ${selectedVendor.name}?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `https://vi-farm-backend.onrender.com/api/admin/vendors/${selectedVendor._id}/reject`,
        { rejectionReason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        const data = res.data.data;
        setVendors((prev) =>
          prev.map((v) =>
            v._id === data.vendorId
              ? { ...v, status: data.status, isApproved: data.isApproved, rejectionReason: data.rejectionReason }
              : v
          )
        );
        alert(res.data?.message || "❌ Vendor rejected successfully");
        setShowRejectModal(false);
        setRejectReason("");
        setSelectedVendor(null);
      } else {
        alert(res.data?.message || "Failed to reject vendor ❌");
      }
    } catch (err: any) {
      alert("Network or API error while rejecting vendor ❌");
    }
  };

  const handleDeleteVendor = async (vendor: Vendor) => {
    if (!confirm(`Are you sure you want to delete ${vendor.name}?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(
        `https://vi-farm-backend.onrender.com/api/admin/vendors/${vendor._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        alert(res.data.message || "Vendor deleted successfully.");
        setVendors((prev) => prev.filter((v) => v._id !== vendor._id));
      }
    } catch (error) {
      alert("Failed to delete vendor.");
    }
  };

  if (loading)
    return <div className="p-6 text-center text-gray-500">Loading vendors...</div>;
  if (error)
    return <div className="p-6 text-center text-red-500 font-medium">{error}</div>;

  const displayedProducts = vendorProducts
    .filter((p) => {
      if (!modalCategory || modalCategory === "All Categories") return true;
      if (modalCategory === "Others") {
        const main = ["fruits", "vegetables", "dry fruits", "dryfruits", "seeds", "plants", "handicrafts"];
        const cat = (p.category || "").toString().trim();
        return !main.some((m) => new RegExp(m, "i").test(cat));
      }
      return new RegExp(modalCategory, "i").test((p.category || "").toString());
    })
    .filter((p) => {
      if (!productFilter || productFilter === "All") return true;
      if (productFilter === "Others") {
        const main = ["fruits", "vegetables", "dry fruits", "dryfruits", "seeds", "plants", "handicrafts"];
        const cat = (p.category || "").toString().trim();
        return !main.some((m) => new RegExp(m, "i").test(cat));
      }
      if (productFilter === "Dry Fruits") {
        return /dry\s*fruits?/i.test(p.category || "") || /dryfruits?/i.test(p.category || "");
      }
      return new RegExp(productFilter, "i").test(p.category || "");
    });

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString() : "N/A";

  return (
    <>
      <div className="bg-white p-4 rounded-xl shadow-md relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 px-4 py-2 w-72 border border-gray-300 bg-white rounded-xl shadow-sm">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent outline-none text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="text-gray-500 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
              <button
                onClick={() => { setMode("list"); setCurrentPage(1); }}
                className={`flex items-center justify-center w-9 h-9 transition-colors ${
                  mode === "list" ? "bg-[#6B3D1C] text-white" : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setMode("alert"); setCurrentPage(1); }}
                className={`flex items-center justify-center w-9 h-9 transition-colors ${
                  mode === "alert" ? "bg-[#6B3D1C] text-white" : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            </div>

            {/* Filter dropdown */}
            <div className="relative" ref={filterRef} data-dropdown>
              <button
                onClick={() => setOpenMenu(openMenu === "filter" ? null : "filter")}
                className="flex items-center gap-3 border border-gray-300 bg-white px-5 py-2 rounded-2xl text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                <span>Filters</span>
              </button>

              {openMenu === "filter" && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 shadow-lg rounded-lg z-50">
                  {["All", "Active", "Inactive", "Blocked", "Rejected"].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setSelectedCategory(status);
                        setCurrentPage(1);
                        setOpenMenu(null);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        selectedCategory === status ? "bg-gray-100 font-semibold" : ""
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ✅ Table — overflow visible taaki dropdown clip na ho */}
        <div className="w-full">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="text-left p-3">Vendor's Name</th>
                <th className="text-left p-3">Location</th>
                <th className="text-left p-3">Contact No.</th>
                {mode === "list" && <th className="text-left p-3">Status</th>}
                <th className="text-center p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVendors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500 font-medium">
                    No vendors found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedVendors.map((vendor) => (
                  <tr key={vendor._id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3">{vendor.name}</td>
                    <td className="p-3">{getLocation(vendor.address)}</td>
                    <td className="p-3">{vendor.mobileNumber}</td>

                    {mode === "list" && (
                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            vendor.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {vendor.status}
                        </span>
                      </td>
                    )}

                    <td className="text-center p-3">
                      {/* ✅ inline-block wrapper with data-dropdown */}
                      <div className="relative inline-block" data-dropdown>
                        <button
                          onClick={() =>
                            setOpenMenu(openMenu === vendor._id ? null : vendor._id)
                          }
                          className="p-2 hover:bg-gray-200 rounded-full"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>

                        {openMenu === vendor._id && (
                          <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg text-sm w-44 py-2 z-[9999] border">
                            {mode === "alert" ? (
                              <>
                                <button
                                  onClick={() => { handleCompactView(vendor); setOpenMenu(null); }}
                                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => { handleApproveVendor(vendor); setOpenMenu(null); }}
                                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                >
                                  Approve Vendor
                                </button>
                                <button
                                  onClick={() => { handleRejectVendor(vendor); setOpenMenu(null); }}
                                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                                >
                                  Reject Vendor
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => { handleViewVendor(vendor); setOpenMenu(null); }}
                                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => { handleToggleBlock(vendor); setOpenMenu(null); }}
                                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                >
                                  {vendor.status === "Blocked" ? "Unblock User" : "Block User"}
                                </button>
                                <button
                                  onClick={() => { handleDeleteVendor(vendor); setOpenMenu(null); }}
                                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                                >
                                  Delete Vendor
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
          <span>Results per page - {rowsPerPage}</span>
          <span>{currentPage} of {totalPages || 1} pages</span>
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
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Vendor Detail Modal */}
      {showModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-[720px] max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-gray-500 hover:text-gray-800 transition"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-8 border-b pb-2">
              {selectedVendor.name}
            </h2>

            <div className="flex items-center gap-6 mb-6">
              <Image
                src={selectedVendor.profilePicture || "/castomer/castomer.png"}
                alt={selectedVendor.name}
                width={140}
                height={140}
                className="w-[140px] h-[140px] rounded-xl object-cover border"
              />
              <div className="flex-1">
                <h3 className="text-[20px] font-semibold text-gray-800 mb-1">
                  {selectedVendor.name}
                </h3>
                <p className="text-[16px] text-gray-800 mb-1">
                  <span className="font-medium inline-block w-[80px]">Location</span> -{" "}
                  {formatVendorAddress(selectedVendor.address)}
                </p>
                <p className="text-[16px] text-gray-800 mb-1">
                  <span className="font-medium inline-block w-[100px]">Contact No.</span> -{" "}
                  {selectedVendor.mobileNumber}
                </p>
                <span
                  className={`mt-3 inline-block px-4 py-1 text-[16px] rounded-full font-medium ${
                    selectedVendor.status === "Active"
                      ? "bg-green-200 text-green-700"
                      : "bg-red-200 text-red-700"
                  }`}
                >
                  {selectedVendor.status || "Inactive"}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-gray-800 font-semibold mb-1">About the Vendor</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {selectedVendor.vendorDetails?.about ||
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
              </p>
            </div>

            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-gray-800">Listed Products</h4>
              <select
                value={modalCategory}
                onChange={(e) => setModalCategory(e.target.value)}
                className="border border-gray-300 rounded-full px-3 py-1.5 text-gray-800 text-sm bg-white focus:outline-none"
              >
                <option value="All Categories">All Categories</option>
                <option value="Fruits">Fruits</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Seeds">Seeds</option>
                <option value="Plants">Plants</option>
                <option value="Handicrafts">Handicrafts</option>
              </select>
            </div>

            {displayedProducts.length === 0 ? (
              <p className="text-sm text-gray-500">No products found.</p>
            ) : (
              displayedProducts.map((product) => (
                <div
                  key={product._id}
                  className="border border-yellow-400 rounded-2xl bg-white shadow-sm mb-4 overflow-hidden transition hover:shadow-md"
                >
                  <div className="flex">
                    <div className="w-[35%] h-[160px]">
                      <Image
                        src={product.images?.[0] || "/products/sample.png"}
                        alt={product.name}
                        width={300}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-base font-semibold text-gray-800">
                            {product.name}
                          </h3>
                          <span
                            className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                              /^in\s*stock$/i.test(product.status)
                                ? "border-gray-400 text-green-700"
                                : "border-gray-400 text-red-700"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                /^in\s*stock$/i.test(product.status) ? "bg-green-500" : "bg-red-500"
                              }`}
                            ></span>
                            {product.status}
                          </span>
                        </div>
                        <p className="text-[16px] text-gray-800">
                          by <span>{selectedVendor.name}</span>
                        </p>
                        <p className="text-gray-800 mt-1">
                          Price:{" "}
                          <span className="text-gray-800">
                            ₹ {product.price}
                            {product.unit ? `/${product.unit}` : ""}
                          </span>
                        </p>
                      </div>
                      <div className="text-[16px] text-gray-500 mt-1 border-t border-gray-100 pt-2">
                        Uploaded on {formatDate(product.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Compact Alert View */}
      {showCompactView && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#f8f8f8] rounded-xl shadow-lg w-[685px] max-h-[90vh] overflow-y-auto p-5 relative">
            <div className="flex justify-between items-center mb-4 border-b-2 border-gray-200">
              <h2 className="text-gray-800 font-semibold text-lg">{selectedVendor.name}</h2>
              <button
                onClick={() => { setShowCompactView(false); setSelectedVendor(null); }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-8 mb-8">
              <div className="w-[200px] h-[120px] rounded-xl overflow-hidden shadow-sm">
                <Image
                  src={selectedVendor.profilePicture || "/castomer/castomer.png"}
                  alt="Vendor"
                  width={200}
                  height={120}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-[18px] font-semibold text-gray-800">{selectedVendor.name}</h3>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Location</span> – {formatVendorAddress(selectedVendor.address)}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Contact No.</span> – {selectedVendor.mobileNumber}
                </p>
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-gray-800 font-semibold mb-1">About the Vendor</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {selectedVendor.vendorDetails?.about ||
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejected View Modal */}
      {showRejectedView && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#f8f8f8] rounded-xl shadow-lg w-[685px] h-[817px] max-h-[90vh] overflow-y-auto p-5 relative">
            <div className="flex justify-between items-center mb-4 border-b-2 border-gray-200">
              <h2 className="text-gray-800 font-semibold text-lg">{selectedVendor.name}</h2>
              <button
                onClick={() => { setShowRejectedView(false); setSelectedVendor(null); }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-8 mb-8">
              <Image
                src={selectedVendor.profilePicture || "/castomer/castomer.png"}
                alt="Vendor"
                width={160}
                height={120}
                className="rounded-xl object-cover border w-[160px] h-[120px]"
              />
              <div className="flex flex-col gap-2">
                <h3 className="text-[18px] font-semibold text-gray-800">{selectedVendor.name}</h3>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Location</span> – {formatVendorAddress(selectedVendor.address)}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Contact No.</span> – {selectedVendor.mobileNumber}
                </p>
                <span className="mt-1 px-3 py-1 w-fit text-xs rounded-full font-medium bg-red-100 text-red-700">
                  Rejected
                </span>
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-gray-800 font-semibold mb-1">About the Vendor</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {selectedVendor.vendorDetails?.about ||
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
              </p>
            </div>
            <div className="mb-4">
              <h3 className="text-gray-800 font-semibold mb-1">Reason for Rejection</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {selectedVendor.rejectionReason || "No rejection reason provided."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-[450px] p-6 relative">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h3 className="text-lg font-semibold text-gray-800">Reason for Rejection</h3>
              <button
                onClick={() => { setShowRejectModal(false); setSelectedVendor(null); setRejectReason(""); }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-700 mt-4 mb-3">Write your reason to reject the vendor</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 h-28 mb-5 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-800 shadow-sm"
            />
            <div className="flex justify-center">
              <button
                onClick={submitReject}
                className="px-14 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium shadow-md transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}