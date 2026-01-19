"use client";

import { useEffect, useState, useRef } from "react";
import { Search, SlidersHorizontal, Eye, X, Check } from "lucide-react";

interface Order {
  _id: string;
  orderId: string;
  buyer: string;
  vendor: string;
  status: string;
  totalPrice: number;
  createdAt: string;
}

interface OrderDetails {
  orderId: string;
  buyer: string;
  items: { name: string; quantity: number; unit: string; price: number }[];
  totalPrice: number;
  status: string;
  type: string;
}

export default function BuyerOrdersPanel() {
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);

  const baseURL ="https://vi-farm.onrender.com";
  const filterRef = useRef<HTMLDivElement>(null);

  // ✅ Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Fetch all orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token") || "";

        const res = await fetch(`${baseURL}/api/admin/orders`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          setOrdersData(json.data);
        } else {
          throw new Error("Unexpected API format");
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("❌ Error fetching orders:", err);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // ✅ Fetch single order details when modal opens
  useEffect(() => {
    if (!selectedOrderId) return;

    const fetchOrderDetails = async () => {
      try {
        setDetailsLoading(true);
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token") || "";

        const res = await fetch(`${baseURL}/api/admin/orders/${selectedOrderId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (json.success && json.data) {
          setSelectedOrder(json.data);
        } else {
          throw new Error("Invalid detail response");
        }
      } catch (err) {
        console.error("❌ Error fetching order details:", err);
        setError("Failed to fetch order details");
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [selectedOrderId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Process":
        return "bg-yellow-400";
      case "Completed":
        return "bg-green-500";
      case "Cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const filteredOrders = ordersData.filter((order) => {
    const matchesSearch = order.buyer
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesFilter = filter === "All" ? true : order.status === filter;
    return matchesSearch && matchesFilter;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.ceil(filteredOrders.length / perPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  if (loading) return <p className="p-4">Loading orders...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm w-full relative">
      {/* 🔍 Search & Filter Row */}
      <div className="flex justify-between items-center mb-5">
        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-2 w-72 border border-gray-300 bg-white rounded-xl shadow-sm">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-gray-700 text-sm w-full placeholder-gray-500"
          />
        </div>

        {/* Filter */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-800 font-medium hover:bg-gray-50"
          >
            <SlidersHorizontal className="w-5 h-5 text-gray-700" />
            <span>Filters</span>
          </button>

          {filterOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-md z-50 overflow-hidden">
              {["All", "Completed", "In Process", "Cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilter(status);
                    setFilterOpen(false);
                  }}
                  className={`w-full flex justify-between items-center px-4 py-2 text-sm transition-colors hover:bg-gray-100 ${
                    filter === status ? "bg-gray-50 font-semibold" : ""
                  }`}
                >
                  {status}
                  {filter === status && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div> 
      </div>

      {/* 🧾 Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="text-left p-3">Order Id</th>
              <th className="text-left p-3">Buyer</th>
              <th className="text-left p-3">Vendor</th>
              <th className="text-left p-3">Status</th>
              <th className="text-center p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order, i) => (
              <tr
                key={i}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="p-3">{order.orderId}</td>
                <td className="p-3">{order.buyer}</td>
                <td className="p-3">{order.vendor}</td>
                <td className="p-3 flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  ></span>
                  {order.status}
                </td>
                <td className="text-center">
                  <button
                    onClick={() => setSelectedOrderId(order._id)}
                    className="p-2 hover:bg-gray-200 rounded-full"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📄 Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
        <p>Results per page - {perPage}</p>
        <p>
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-gray-100 disabled:opacity-50"
          >
            {"<"}
          </button>
          <button
            onClick={() =>
              currentPage < totalPages && setCurrentPage(currentPage + 1)
            }
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-gray-100 disabled:opacity-50"
          >
            {">"}
          </button>
        </div>
      </div>

    {/* 🪟 Order Details Modal (Screenshot Style with Buyer-line Delivery) */}
{selectedOrder && (
  <div className="fixed inset-0 flex justify-center items-center bg-black/40 z-[9999]">
    <div className="bg-white rounded-2xl w-[460px] shadow-lg relative overflow-hidden">
      {/* ❌ Close Button */}
      <button
        onClick={() => {
          setSelectedOrder(null);
          setSelectedOrderId(null);
        }}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
      >
        <X className="w-6 h-6" />
      </button>

      {detailsLoading ? (
        <p className="text-center py-6 text-gray-500">Loading...</p>
      ) : (
        <>
          {/* Header */}
          <div className="px-6 pt-6 pb-3">
            <h2 className="text-[20px] font-semibold text-gray-800">
              Order#{selectedOrder.orderId}
            </h2>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

   {/* Details Section */}
<div className="p-4 space-y-2 text-[15px] text-gray-700">
  {/* 🧍 Buyer + Delivery */}
  <div className="flex justify-between items-start flex-wrap">
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-gray-800 w-[70px] flex-shrink-0">Buyer</span>
      <span>:</span>
      <div className="flex items-center gap-3 flex-nowrap max-w-[260px]">
        <span className="font-semibold text-gray-800 truncate">
          {selectedOrder.buyer}
        </span>
      </div>
    </div>

    <span
      className={`px-4 py-[2px] rounded-md text-white text-sm shadow-sm font-medium mt-1 sm:mt-0 ${
        selectedOrder.type === "Delivery"
          ? "bg-green-600"
          : "bg-blue-600"
      }`}
    >
      {selectedOrder.type}
    </span>
  </div>

  {/* 🥭 Item */}
  {selectedOrder.items.length > 0 && (
    <>
      <div className="flex gap-2 items-center">
        <span className="text-gray-800 w-[70px]">Item</span>
        <span>:</span>
        <span className="font-semibold text-gray-800 break-words">
          {selectedOrder.items[0].name}
        </span>
      </div>

      <div className="flex gap-2 items-center">
        <span className="text-gray-800 w-[70px]">Quantity</span>
        <span>:</span>
        <span className="font-semibold text-gray-800">
          {selectedOrder.items[0].quantity}
          {selectedOrder.items[0].unit}
        </span>
      </div>
    </>
  )}

  {/* 💰 Price */}
  <div className="flex gap-2 items-center">
    <span className="text-gray-800 w-[70px]">Price</span>
    <span>:</span>
    <span className="font-semibold text-gray-800">
      ₹{selectedOrder.totalPrice.toLocaleString()}
    </span>
  </div>

  {/* 📦 Status */}
  <div className="flex gap-2 items-center">
    <span className="text-gray-800 w-[70px]">Status</span>
    <span>:</span>
    <span className="font-semibold text-gray-800">
      {selectedOrder.status}
    </span>
  </div>
</div>

        </>
      )}
    </div>
  </div>
)}

    </div>
  );
}



