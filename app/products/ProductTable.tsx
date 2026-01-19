/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MoreVertical,
  Search,
  X,
  Star,
  Pencil,
  Plus,
  PlusCircle,
  SlidersHorizontal,
} from "lucide-react";

/**
 * Professional refactor:
 * - useProducts hook to fetch + manage list
 * - safe access everywhere (prevent toLowerCase on null)
 * - components split: ProductTable, ViewProductModal, AddNutritionDrawer
 * - pagination + filters + categories
 */

/* ---------------- CONFIG ---------------- */
const BASE_URL = "https://vi-farm.onrender.com";
const API_LIST_URL = `${BASE_URL}/api/admin/products`;
const ITEMS_PER_PAGE = 12;

/* ---------------- TYPES (light) ---------------- */
type ProductRow = {
  id: string;
  name: string;
  vendor: string;
  date: string;
  category: string;
  rate: string;
  images: string[];
  // additional fields for modal
  price?: number;
  unit?: string;
  description?: string;
  rating?: number | null;
  nutritionalValue?: any | null;
  vendorObj?: any | null;
};

/* ---------------- HELPERS ---------------- */
const safeString = (v: any) => (v === null || v === undefined ? "" : String(v));
const mapProductData = (item: any): ProductRow => ({
  id: item._id,
  name: safeString(item.name),
  vendor: safeString(item.vendor?.name) || "Unknown Vendor",
  date: item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : "",
  category: safeString(item.category),
  rate: `₹ ${safeString(item.price)}/${safeString(item.unit)}`,
  images: Array.isArray(item.images) ? item.images : [],
});

/* ---------------- useProducts hook ---------------- */
function useProducts() {
  const [productList, setProductList] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authorization token found. Please log in.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_LIST_URL}?limit=1000`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status} - failed to fetch products`);

      const json = await res.json();
      const mapped = (json.data || []).map(mapProductData);
      setProductList(mapped);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { productList, setProductList, loading, error, refresh: fetchAll };
}

/* ---------------- Main Component ---------------- */
export default function ProductTable() {
  const { productList, setProductList, loading, error, refresh } = useProducts();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openFilter, setOpenFilter] = useState<boolean>(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [viewProduct, setViewProduct] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState<boolean>(false);
  const [viewError, setViewError] = useState<string | null>(null);

  const [openNutritionDrawer, setOpenNutritionDrawer] = useState(false);
  const [drawerProductData, setDrawerProductData] = useState<any | null>(null);
  const [productIdForDrawer, setProductIdForDrawer] = useState<string | null>(null);

  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);

  /* categories derived safely */
  const categories = useMemo(() => {
    const setCats = new Set<string>();
    productList.forEach((p) => {
      const c = safeString(p.category).trim();
      if (c) setCats.add(c);
    });
    return ["All", ...Array.from(setCats)];
  }, [productList]);

  /* ---------- outside click for action menu & filter ---------- */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // action menu
      if (actionMenuRef.current && !actionMenuRef.current.contains(target)) {
        const isButton = (e.target as HTMLElement).closest('[data-action-button="true"]');
        if (!isButton) setOpenActionMenu(null);
      }
      // filter (if open)
      if (openFilter && filterRef.current && !filterRef.current.contains(target)) {
        setOpenFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openFilter]);

  /* ---------- Filtering + Pagination ---------- */
  const filteredProducts = useMemo(() => {
    const q = safeString(searchQuery).toLowerCase().trim();
    let temp = productList.slice();

    if (q) {
      temp = temp.filter((p) => {
        return (
          safeString(p.name).toLowerCase().includes(q) ||
          safeString(p.vendor).toLowerCase().includes(q) ||
          safeString(p.category).toLowerCase().includes(q)
        );
      });
    }

    if (selectedCategory && selectedCategory !== "All") {
      temp = temp.filter((p) => (p.category || "") === selectedCategory);
    }

    return temp;
  }, [productList, searchQuery, selectedCategory]);

  const total = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  useEffect(() => {
    // if filters change, reset to page 1 or clamp page
    setCurrentPage((cp) => {
      const newTotalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
      return Math.min(cp, newTotalPages);
    });
  }, [filteredProducts.length]);

  const current = filteredProducts.slice(start, start + ITEMS_PER_PAGE);

  /* ---------- Handlers ---------- */
  const handleView = useCallback(
    async (id: string) => {
      try {
        setViewError(null);
        setViewLoading(true);
        setOpenActionMenu(null);
        setProductIdForDrawer(id);

        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authorization token found.");

        const res = await fetch(`${BASE_URL}/api/admin/products/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status} - Failed to fetch product details`);

        const json = await res.json();
        const p = json.data?.product || {};

        const mappedProduct = {
          id: p._id,
          name: safeString(p.name),
          price: p.price,
          unit: p.unit,
          category: safeString(p.category),
          description: p.description || "No description provided.",
          rating: p.rating ?? null,
          images: Array.isArray(p.images) ? p.images : [],
          nutritionalValue:
            p.nutritionalValue?.nutrients?.length && Array.isArray(p.nutritionalValue.nutrients)
              ? p.nutritionalValue
              : null,
          vendor: {
            name: p.vendor?.name || "Unknown Vendor",
            profilePicture: p.vendor?.profilePicture || "/vendor.jpg",
            address: p.vendor?.address || null,
          },
        };

        setViewProduct(mappedProduct);
      } catch (err: any) {
        setViewError(err?.message || "Failed to load product details.");
      } finally {
        setViewLoading(false);
      }
    },
    []
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const confirmed = window.confirm("⚠️ Are you sure you want to delete this product?");
        if (!confirmed) return;

        const token = localStorage.getItem("token");
        if (!token) {
          alert("No authorization token found. Please log in again.");
          return;
        }

        const res = await fetch(`${BASE_URL}/api/admin/products/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Failed to delete product (HTTP ${res.status})`);
        }

        const json = await res.json();
        alert(json.message || "✅ Product deleted successfully.");
        setProductList((prev) => prev.filter((p) => p.id !== id));
        setOpenActionMenu(null);
        // refresh categories maybe
      } catch (err: any) {
        alert(err?.message || "Failed to delete product. Please try again.");
      }
    },
    [setProductList]
  );

  const handleAddNutritionClick = useCallback(() => {
    setDrawerProductData(viewProduct);
    setViewProduct(null);
    setOpenNutritionDrawer(true);
  }, [viewProduct]);

  const handleEditNutritionClick = useCallback(() => {
    setDrawerProductData(viewProduct);
    setViewProduct(null);
    setOpenNutritionDrawer(true);
  }, [viewProduct]);

  const handleDrawerClose = useCallback(
    (id: string | null) => {
      setOpenNutritionDrawer(false);
      setDrawerProductData(null);
      if (id) setTimeout(() => handleView(id), 50);
    },
    [handleView]
  );

  const handleDrawerSaved = useCallback(
    (id: string | null) => {
      setOpenNutritionDrawer(false);
      setDrawerProductData(null);
      if (id) setTimeout(() => handleView(id), 50);
      // optional: refresh list
      refresh();
    },
    [handleView, refresh]
  );

  /* ---------- render ---------- */
  return (
    <div className="bg-white shadow rounded-lg m-6 p-4">
      {/* SEARCH & FILTER */}
      <div className="flex justify-between items-center p-4 border-b relative">
        <div className="flex items-center gap-2 px-4 py-2 w-72 border border-gray-300 bg-white rounded-xl shadow-sm">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            className="ml-2 w-full bg-transparent outline-none text-sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setOpenFilter((p) => !p)}
            className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-gray-600" />
            <span>Filters</span>
          </button>
          {openFilter && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setOpenFilter(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    selectedCategory === cat ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* LOADING/ERROR */}
      {loading && <p className="text-center py-10 text-gray-500">Fetching products...</p>}
      {error && <p className="text-center py-10 text-red-500">❌ {error}</p>}

      {/* TABLE */}
      {!loading && !error && (
        <>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 font-medium">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Date Posted</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {current.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                current.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50 relative">
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3">{p.vendor}</td>
                    <td className="px-4 py-3">{p.date}</td>
                    <td className="px-4 py-3">{p.category}</td>
                    <td className="px-4 py-3">{p.rate}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="p-2 rounded-full hover:bg-gray-100"
                        onClick={() => setOpenActionMenu(openActionMenu === p.id ? null : p.id)}
                        data-action-button="true"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                      {openActionMenu === p.id && (
                        <div
                          ref={actionMenuRef}
                          className="absolute right-4 top-10 bg-white border rounded-lg shadow-md w-32 z-10"
                        >
                          <button
                            onClick={() => handleView(p.id)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete Product
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div className="flex justify-between items-center px-4 py-3 text-sm text-gray-600">
            <span>Results per page: {ITEMS_PER_PAGE}</span>
            <span>
              Page {total === 0 ? 0 : currentPage} of {totalPages}
            </span>
            <div className="flex gap-3">
              <button
                className="w-8 h-8 border rounded-full hover:bg-gray-100 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                &lt;
              </button>
              <button
                className="w-8 h-8 border rounded-full hover:bg-gray-100 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                &gt;
              </button>
            </div>
          </div>
        </>
      )}

      {viewProduct && (
        <ViewProductModal
          product={viewProduct}
          onClose={() => setViewProduct(null)}
          onAddNutrition={handleAddNutritionClick}
          onEditNutrition={handleEditNutritionClick}
          loading={viewLoading}
          error={viewError}
        />
      )}

      {openNutritionDrawer && (
        <AddNutritionDrawer
          product={drawerProductData || { id: productIdForDrawer, nutritionalValue: null }}
          onClose={handleDrawerClose}
          onSaved={handleDrawerSaved}
        />
      )}
    </div>
  );
}

/* ---------------- ViewProductModal Component ---------------- */
function ViewProductModal({
  product,
  onClose,
  onAddNutrition,
  onEditNutrition,
  loading,
  error,
}: any) {
  return (
    <div className="fixed inset-0 flex items-start justify-center bg-black/50 z-50 pt-12 pb-12 overflow-auto">
      <div className="bg-white rounded-2xl border shadow-lg w-full max-w-3xl p-6 relative">
        <div className="flex items-center justify-between pb-3 border-b-2 border-gray-200">
          <h2 className="text-xl font-medium text-gray-800">
            {product?.category || "Product Details"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading && <p className="text-center py-10 text-gray-500">Loading product...</p>}
        {error && <p className="text-center py-10 text-red-500">❌ {error}</p>}

        {!loading && !error && (
          <>
            <div className="flex items-start gap-8 mt-5">
              <img
                src={product?.images?.[0] || "/no-image.jpg"}
                alt={product?.name || "product"}
                className="w-48 h-48 object-cover rounded-xl"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-800">{product?.name}</h3>
                  {product?.rating && (
                    <div className="flex items-center gap-1 border border-gray-300 px-2 py-0.5 rounded-full text-xs font-medium text-gray-700">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span>{Number(product.rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <p className="font-semibold text-gray-500 mt-2">
                  by {product?.vendor?.name || product?.vendor || "Unknown Vendor"}
                </p>
                <p className="mt-2 text-xl font-semibold text-gray-900">
                  ₹ {product?.price}
                  <span className="text-gray-700 font-normal">/{product?.unit}</span>
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-bold mb-2">About the product</h3>
              <p className="text-gray-600 text-sm">{product?.description}</p>
            </div>

            <div className="mt-6">
              <h3 className="font-bold mb-3">About the vendor</h3>
              <div className="flex items-center gap-4">
                <img
                  src={product?.vendor?.profilePicture || "/vendor.jpg"}
                  alt={product?.vendor?.name || "Vendor"}
                  className="w-20 h-20 rounded-lg"
                />
                <div>
                  <p className="font-semibold text-gray-800 text-base">
                    {product?.vendor?.name || product?.vendor || "Unknown Vendor"}
                  </p>
                  <p className="text-sm font-semibold text-gray-600">
                    {product?.vendor?.address
                      ? `Location - ${[
                          product.vendor.address.houseNumber,
                          product.vendor.address.locality,
                          product.vendor.address.city,
                        ]
                          .filter(Boolean)
                          .join(", ")}`
                      : "Location not available."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {product?.nutritionalValue ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-lg">
                      Nutritional Value
                      <span className="text-gray-500 text-sm font-normal ml-1">
                        ({product.nutritionalValue?.servingSize || "per serving"})
                      </span>
                    </h4>
                    <button
                      onClick={onEditNutrition}
                      className="p-1 rounded-md text-blue-500 hover:text-blue-700 -mt-1 -mr-1"
                      title="Edit Nutrition"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-2 text-sm text-gray-700 grid grid-cols-1 gap-y-1">
                    {Array.isArray(product.nutritionalValue?.nutrients) &&
                      product.nutritionalValue.nutrients.map((n: any, i: number) => (
                        <div key={i} className="flex justify-start gap-3">
                          <span className="font-medium w-1/4 capitalize">{n.name}</span>
                          <span className="font-medium">:</span>
                          <span className="flex-1">{n.amount}</span>
                        </div>
                      ))}
                    {product.nutritionalValue?.additionalNote && (
                      <p className="mt-3 text-gray-600 text-sm">
                        {product.nutritionalValue.additionalNote}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={onAddNutrition}
                  className="mt-4 w-full flex items-center gap-2 justify-start border rounded-lg p-3 bg-white hover:bg-gray-50"
                >
                  <Plus className="w-5 h-5 text-blue-600 border border-blue-600 rounded-full" />
                  <span className="text-blue-600 font-medium">Add Nutritional Value</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- AddNutritionDrawer Component ---------------- */
function AddNutritionDrawer({ product, onClose, onSaved }: any) {
  const productId = product?.id;
  const API_UPDATE_URL = `${BASE_URL}/api/admin/products/${productId}/nutritional-value`;
  const initialNutrition = product?.nutritionalValue;

  const [servingLabel, setServingLabel] = useState<string>(initialNutrition?.servingSize || "");
  const [nutrients, setNutrients] = useState<{ name: string; amount: string }[]>(
    initialNutrition?.nutrients?.length
      ? initialNutrition.nutrients.map((n: any) => ({ name: safeString(n.name), amount: safeString(n.amount) }))
      : [{ name: "", amount: "" }]
  );
  const [additionalNote, setAdditionalNote] = useState<string>(initialNutrition?.additionalNote || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // when product changes, reset local state
    setServingLabel(initialNutrition?.servingSize || "");
    setNutrients(
      initialNutrition?.nutrients?.length
        ? initialNutrition.nutrients.map((n: any) => ({ name: safeString(n.name), amount: safeString(n.amount) }))
        : [{ name: "", amount: "" }]
    );
    setAdditionalNote(initialNutrition?.additionalNote || "");
  }, [productId]); // eslint-disable-line

  const addRow = () => setNutrients((prev) => [...prev, { name: "", amount: "" }]);

  const removeRow = (idx: number) =>
    setNutrients((prev) => {
      const newArr = prev.filter((_, i) => i !== idx);
      return newArr.length ? newArr : [{ name: "", amount: "" }];
    });

  const updateRow = (idx: number, field: "name" | "amount", value: string) =>
    setNutrients((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));

  const handleSave = async () => {
    try {
      if (!productId) throw new Error("Product ID missing");
      setSaving(true);

      const payload = {
        servingSize: servingLabel.trim() || undefined,
        nutrients: nutrients.filter((n) => n.name.trim() && n.amount.trim()),
        additionalNote: additionalNote || undefined,
      };

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const res = await fetch(API_UPDATE_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status} - Failed to save nutrition`);

      const json = await res.json();
      // call onSaved with id and data (matches previous contract)
      onSaved(productId, json.data);
      alert(json.message || "✅ Nutritional value updated successfully.");
    } catch (err: any) {
      alert(err?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-60">
      <div className="absolute inset-0 bg-black/40" onClick={() => onClose(productId)} />
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-6 relative z-10">
        <div className="flex items-center justify-between pb-4 border-b">
          <h3 className="text-xl font-semibold">Nutritional Value</h3>
          <button onClick={() => onClose(productId)} className="text-gray-500 hover:text-black">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Serving */}
        <div className="mt-4 flex items-center gap-4">
          <label className="text-base font-medium whitespace-nowrap">Serving</label>
          <div className="flex-1">
            <input
              type="text"
              value={servingLabel}
              onChange={(e) => setServingLabel(e.target.value)}
              placeholder="650 gms / 1 cup"
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
        </div>

        {/* Nutrients */}
        <div className="mt-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 bg-gray-100 text-gray-600 font-medium text-sm">
              <div className="px-4 py-3">Nutrient</div>
              <div className="px-4 py-3">Amount</div>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {nutrients.map((n, idx) => (
                <div key={idx} className="grid grid-cols-2 items-center border-t text-sm">
                  <div className="px-2 py-1">
                    <input
                      type="text"
                      value={n.name}
                      onChange={(e) => updateRow(idx, "name", e.target.value)}
                      placeholder="Calories"
                      className="w-full bg-transparent outline-none px-2 py-1"
                    />
                  </div>
                  <div className="px-2 py-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={n.amount}
                      onChange={(e) => updateRow(idx, "amount", e.target.value)}
                      placeholder="60 kcal"
                      className="w-full outline-none px-2 py-1"
                    />
                    {(nutrients.length > 1 || n.name || n.amount) && (
                      <button onClick={() => removeRow(idx)} className="text-red-500 hover:text-red-700 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t">
              <button onClick={addRow} className="text-blue-600 text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Add More
              </button>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="mt-4">
          <label className="block text-sm font-medium">Additional Note</label>
          <textarea
            rows={2}
            value={additionalNote}
            onChange={(e) => setAdditionalNote(e.target.value)}
            className="w-full border rounded-md px-3 py-2 mt-1 text-sm outline-none"
            placeholder="--"
          />
        </div>

        {/* Save */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-500 hover:bg-green-600 text-white px-14 py-2.5 rounded-xl font-semibold"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
