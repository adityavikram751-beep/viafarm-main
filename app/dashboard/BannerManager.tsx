"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Trash2, Loader2, Plus, Link as LinkIcon } from "lucide-react";

const BASE_API = "https://vi-farm.onrender.com";
const POST_BANNERS_URL = `${BASE_API}/api/admin/manage-app/banners`;
const DELETE_BANNERS_BASE_URL = `${BASE_API}/api/admin/manage-app/banners`;

const PLACEMENT_CONFIG: Record<string, string> = {
  HomePageSlider: `${BASE_API}/api/admin/public/manage-app/banners/placement/HomePageSlider`,
  SearchPageAd: `${BASE_API}/api/admin/public/manage-app/banners/placement/SearchPageAd`,
  CheckoutPromo: `${BASE_API}/api/admin/public/manage-app/banners/placement/CheckoutPromo`,
  HomePageBottomPromo: `${BASE_API}/api/admin/public/manage-app/banners/placement/HomePageBottomPromo`,
};

const placementKeysInOrder = [
  "HomePageSlider",
  "SearchPageAd",
  "CheckoutPromo",
  "HomePageBottomPromo",
];

const getGroupName = (placement: string) => {
  switch (placement) {
    case "HomePageSlider":
      return "Home Page Slider Banners";
    case "SearchPageAd":
      return "Search Page Ad";
    case "CheckoutPromo":
      return "Checkout Promo";
    case "HomePageBottomPromo":
      return "Home Page Bottom Promo";
    default:
      return placement;
  }
};

// ---------------- FETCH HOOK ----------------
const useBannersFetcher = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllBanners = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token") || "";

      if (!token) throw new Error("No token found. Please login again.");

      const all = await Promise.all(
        Object.entries(PLACEMENT_CONFIG).map(async ([placement, url]) => {
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error(`${placement} fetch failed`);
          const data = await res.json();
          return data.data?.map((b: any) => ({
            id: b._id,
            src: b.imageUrl,
            title: b.title,
            link: b.link,
            placement,
          }));
        })
      );
      setBanners(all.flat());
    } catch (err) {
      console.error("❌ Fetch Error:", err);
      setError("Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllBanners();
  }, [fetchAllBanners]);

  return { banners, loading, error, refetch: fetchAllBanners, setBanners };
};

// ---------------- BANNER CARD ----------------
const BannerCard = ({ banner, handleDelete, isDeleting, isVerticalStyle }: any) => {
  const [connectedUrl, setConnectedUrl] = useState("");

  return (
    <div className="p-3 transition hover">
      <div
        className={`relative w-full overflow-hidden rounded-lg cursor-pointer ${
          isVerticalStyle ? "h-[180px]" : "h-[180px]"
        }`}
        onClick={() => setConnectedUrl(banner.link || banner.src)}
      >
        <img
          src={banner.src}
          alt={banner.title}
          className="w-full h-full object-cover border-2 border-green-500 hover:opacity-90 transition"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://placehold.co/400x150/16a34a/ffffff?text=Banner";
          }}
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(banner.id);
          }}
          disabled={isDeleting}
          className={`absolute bottom-2 right-2 bg-white/90 text-gray-800 px-3 py-1 rounded-md text-sm shadow flex items-center gap-1 ${
            isDeleting
              ? "bg-gray-300 cursor-not-allowed"
              : "hover:bg-red-500 hover:text-white"
          }`}
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          Delete
        </button>
      </div>

    
    </div>
  );
};

// ---------------- ADD IMAGE BUTTON ----------------
const AddImagesButton = ({ placement, setBanners }: any) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token") || "";

      if (!token) throw new Error("No token found. Please login again.");

      const formData = new FormData();
      formData.append("images", file);
      formData.append("title", `Banner for ${placement}`);
      
      formData.append("placement", placement);
      formData.append("status", "Active");

      const res = await fetch(POST_BANNERS_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message);

      const newBanner = result.banners[0];
      setBanners((prev: any) => [
        ...prev,
        {
          id: newBanner._id,
          src: newBanner.imageUrl,
          title: newBanner.title,
          link: newBanner.link,
          placement: newBanner.placement,
        },
      ]);
      alert(`✅ ${placement} banner added successfully!`);
    } catch (e) {
      console.error("❌ Error adding banner:", e);
      alert("❌ Error while adding banner");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center mt-3">
      <label className="cursor-pointer px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold shadow flex items-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Adding...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" /> Add Images
          </>
        )}
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleAdd}
          disabled={isLoading}
        />
      </label>
    </div>
  );
};

// ---------------- MAIN COMPONENT ----------------
export default function ManageBanners() {
  const { banners, loading, error, setBanners } = useBannersFetcher();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;

    setDeletingId(id);
    const prev = banners;
    setBanners((b) => b.filter((x: any) => x.id !== id));

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token") || "";

      if (!token) throw new Error("No token found. Please login again.");

      const res = await fetch(`${DELETE_BANNERS_BASE_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Server delete failed");
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert("Delete failed. Restoring banner.");
      setBanners(prev);
    } finally {
      setDeletingId(null);
    }
  };

  const grouped = useMemo(() => {
    return banners.reduce((acc: any, b: any) => {
      acc[b.placement] = acc[b.placement] || [];
      acc[b.placement].push(b);
      return acc;
    }, {});
  }, [banners]);

  const allGroups = placementKeysInOrder.map((key) => ({
    placementKey: key,
    groupName: getGroupName(key),
    banners: grouped[key] || [],
  }));

  const left = allGroups.slice(0, 1);
  const right = allGroups.slice(1);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <p className="ml-3 text-lg text-gray-600">Loading banners...</p>
      </div>
    );

  if (error)
    return (
      <div className="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-6xl mx-auto mt-8">
        <p className="font-semibold">API Fetch Error:</p>
        <p>{error}</p>
      </div>
    );

  return (
    <div className="bg-white rounded-2xl p-0 max-w-6xl mx-auto font-sans border border-gray-300 shadow-sm overflow-hidden">
      <div className="px-8 pt-6 pb-4 border-b border-gray-200">
        <h2 className="text-3xl font-semibold text-gray-800">Manage Banners</h2>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 items-start">
          <div className="space-y-4 p-4 border-2 border-green-400 rounded-xl shadow-sm">
            {left.map((group) => (
              <div key={group.placementKey} className="space-y-4">
                {group.banners.map((banner) => (
                  <BannerCard
                    key={banner.id}
                    banner={banner}
                    handleDelete={handleDelete}
                    isDeleting={deletingId === banner.id}
                    isVerticalStyle={true}
                  />
                ))}
                <AddImagesButton placement={group.placementKey} setBanners={setBanners} />
              </div>
            ))}
          </div>

          <div className="space-y-8">
            {right.map((group) => (
              <div
                key={group.placementKey}
                className="space-y-4 p-4 border-2 border-green-400 rounded-xl shadow-sm"
              >
                {group.banners.map((banner) => (
                  <BannerCard
                    key={banner.id}
                    banner={banner}
                    handleDelete={handleDelete}
                    isDeleting={deletingId === banner.id}
                    isVerticalStyle={false}
                  />
                ))}
                <AddImagesButton placement={group.placementKey} setBanners={setBanners} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
