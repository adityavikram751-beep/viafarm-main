/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Edit,
  Trash2,
  Plus,
  X,
  PlusCircle,
  Search,
  Filter,
  Phone,
  Mail,
  Clock,
  ChevronLeft,
} from "lucide-react";

/* ---------------- CONFIG ---------------- */
const BASE_API = "https://vi-farm.onrender.com";
const CATEGORIES_BASE = `${BASE_API}/api/admin/manage-app/categories`;
const COUPONS_BASE = `${BASE_API}/api/admin/manage-app/coupons`;
const SUPPORT_BASE = `${BASE_API}/api/admin/manage-app/customer-support`;
const NOTIF_GET = `${BASE_API}/api/admin/settings/user-notifications`;
const NOTIF_PUT = `${BASE_API}/api/admin/settings/user-notifications`;
const NOTIF_POST = `${BASE_API}/api/admin/manage-app/notifications`;
const TERMS_BASE_BUYER = `${BASE_API}/api/admin/manage-app/term-and-condition`;
const TERMS_BASE_VENDOR = `${BASE_API}/api/admin/manage-app/privacy-policy`;
const ABOUT_BASE = `${BASE_API}/api/admin/manage-app/About-us`;

/* ---------------- VARIETIES ENDPOINT ---------------- */
const VARIETIES_BASE = `${BASE_API}/api/admin/variety`;

/* ---------------- SPECIAL CATEGORIES ENDPOINTS ---------------- */
const SPECIAL_CATEGORIES_GET = `${BASE_API}/api/admin/special-categories`;
const SPECIAL_CATEGORIES_POST = `${BASE_API}/api/admin/admin/special-categories`;
const SPECIAL_CATEGORIES_PUT = (id: string) =>
  `${BASE_API}/api/admin/admin/special-categories/${id}`;
const SPECIAL_CATEGORIES_DELETE = (id: string) =>
  `${BASE_API}/api/admin/admin/special-categories/${id}`;

/* ✅ NEW API FOR SPECIAL CATEGORY PRODUCTS */
const SPECIAL_CATEGORY_PRODUCTS_GET = (id: string) =>
  `${BASE_API}/api/admin/special-categories/${id}/products`;

/* ---------------- PRODUCTS ENDPOINT ---------------- */
const PRODUCTS_GET = `${BASE_API}/api/admin/products`;

/* ---------------- TYPES ---------------- */
interface CategoryImage {
  url?: string;
  public_id?: string;
}
interface Category {
  _id?: string;
  name: string;
  image?: CategoryImage | null;
  createdAt?: string;
  updatedAt?: string;
}
type ApiCoupon = {
  _id?: string;
  id?: string;
  code: string;
  discount: { value: number; type?: string } | number | string;
  appliesTo?: string[] | string;
  createdBy?: any;
  startDate?: string;
  expiryDate?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};
type Variety = {
  _id?: string;
  name: string;
  categoryId: string;
  categoryName?: string;
};

type Product = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  image?: any;
  images?: any[];
};

type SpecialCategory = {
  _id?: string;
  id?: string;
  name: string;
  image?: { url?: string; publicId?: string; public_id?: string } | string | null;
  products: any[];
  createdAt?: string;
  updatedAt?: string;
};

/* ---------------- COMPONENT ---------------- */
export default function ManageApp() {
  const tabs: { id: string; label: string }[] = [
    { id: "products", label: "Products" },
    { id: "coupons", label: "Coupons" },
    { id: "notifications", label: "Notifications" },
    { id: "customersupport", label: "Customer Support" },
    { id: "terms", label: "Terms & Conditions" },
    { id: "about", label: "About Us" },
  ];
  const [activeTab, setActiveTab] = useState<string>("products");

  const productInnerTabs = [
    { id: "categories", label: "Product Categories" },
    { id: "varieties", label: "Product Varieties" },
    { id: "special", label: "Special Categories" },
  ];
  const [productInnerActive, setProductInnerActive] = useState<
    "categories" | "varieties" | "special"
  >("categories");

  /* CATEGORIES */
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Add modal - multiple blocks */
  type AddBlock = {
    id: string;
    name: string;
    file: File | null;
    preview: string | null;
  };
  const emptyBlock = (): AddBlock => ({
    id: String(Math.random()).slice(2),
    name: "",
    file: null,
    preview: null,
  });
  const [addBlocks, setAddBlocks] = useState<AddBlock[]>([emptyBlock()]);

  /* Edit modal - single */
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);

  /* VARIETIES */
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [varLoading, setVarLoading] = useState(false);
  const [varSearch, setVarSearch] = useState("");
  const [showVarModal, setShowVarModal] = useState(false);
  const [varModalCategoryId, setVarModalCategoryId] = useState<string | null>(
    null
  );
  const [varModalCategoryName, setVarModalCategoryName] = useState<string | null>(
    null
  );
  const [varModalName, setVarModalName] = useState("");
  const [isVarEdit, setIsVarEdit] = useState(false);
  const [editingVarId, setEditingVarId] = useState<string | null>(null);

  const [varModalPending, setVarModalPending] = useState<Variety[]>([]);

  /* separate search for categories */
  const [categorySearch, setCategorySearch] = useState("");

  /* ---------------- SPECIAL CATEGORIES STATES ---------------- */
  const [specialLoading, setSpecialLoading] = useState(false);
  const [specialSaving, setSpecialSaving] = useState(false);
  const [specialCategories, setSpecialCategories] = useState<SpecialCategory[]>([]);

  const [productsLoading, setProductsLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const [specialSearch, setSpecialSearch] = useState("");
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [isSpecialEdit, setIsSpecialEdit] = useState(false);

  const [specialEditId, setSpecialEditId] = useState<string | null>(null);
  const [specialName, setSpecialName] = useState("");
  const [specialImageFile, setSpecialImageFile] = useState<File | null>(null);
  const [specialImagePreview, setSpecialImagePreview] = useState<string | null>(
    null
  );

  // selected products ids
  const [specialSelectedProducts, setSpecialSelectedProducts] = useState<string[]>(
    []
  );

  const [selectedSpecial, setSelectedSpecial] = useState<SpecialCategory | null>(
    null
  );

  /* ✅ NEW STATE: selected category products from new API */
  const [selectedSpecialProducts, setSelectedSpecialProducts] = useState<Product[]>(
    []
  );
  const [selectedSpecialProductsLoading, setSelectedSpecialProductsLoading] =
    useState(false);

  /* ✅ NEW: products count map (for cards) */
  const [specialProductsCountMap, setSpecialProductsCountMap] = useState<
    Record<string, number>
  >({});

  /* COUPONS */
  const [couponsRaw, setCouponsRaw] = useState<ApiCoupon[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [couponFilter, setCouponFilter] = useState<"all" | "active" | "expired">(
    "all"
  );
  const couponsPerPage = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null);
  const [openDeleteCode, setOpenDeleteCode] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  /* NOTIFICATIONS */
  const [notifSettings, setNotifSettings] = useState({
    orderPlaced: false,
    orderCancelled: false,
    orderPickedUpDelivered: false,
    priceDrop: false,
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifImageFile, setNotifImageFile] = useState<File | null>(null);
  const [notifImagePreview, setNotifImagePreview] = useState<string | null>(
    null
  );
  const [sendingNotif, setSendingNotif] = useState(false);

  /* COUPON FORM */
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [formCode, setFormCode] = useState("");
  const [formDiscount, setFormDiscount] = useState<number | "">("");
  const [formDiscountType, setFormDiscountType] = useState<"Percentage" | "Fixed">(
    "Percentage"
  );
  const [formMinOrder, setFormMinOrder] = useState<number | "">("");
  const [formUsageLimit, setFormUsageLimit] = useState<number | "">("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formAppliesTo, setFormAppliesTo] = useState<string>("All Products");
  const [creatingCoupon, setCreatingCoupon] = useState(false);
  const [formTotalUsage, setFormTotalUsage] = useState("");

  /* TERMS & ABOUT */
  const [termsType, setTermsType] = useState<"buyer" | "vendor">("buyer");
  const [termsContent, setTermsContent] = useState<string>("");
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsEditOpen, setTermsEditOpen] = useState(false);
  const [termsEditValue, setTermsEditValue] = useState<string>("");
  const [termsSaving, setTermsSaving] = useState(false);

  const [aboutContent, setAboutContent] = useState<string>("");
  const [aboutLoading, setAboutLoading] = useState(false);
  const [aboutEditOpen, setAboutEditOpen] = useState(false);
  const [aboutEditValue, setAboutEditValue] = useState<string>("");
  const [aboutSaving, setAboutSaving] = useState(false);

  /* CUSTOMER SUPPORT */
  const [supportData, setSupportData] = useState<{
    phone?: string;
    email?: string;
    operatingHours?: string;
  } | null>(null);
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [supportEditField, setSupportEditField] = useState<string | null>(null);
  const [supportTempValue, setSupportTempValue] = useState<string>("");

  /* helper auth */
  const extractToken = (raw: string | null) => {
    if (!raw) return "";
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.token)
        return String(parsed.token);
    } catch {}
    return raw ?? "";
  };
  const getAuthConfig = () => {
    let token = "";
    if (typeof window !== "undefined") {
      const ls = localStorage.getItem("token");
      const ss = sessionStorage.getItem("token");
      token = extractToken(ls) || extractToken(ss) || "";
    }
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  /* ---------------- FETCH & API ---------------- */
  const normalizeCategoryItem = (c: any): Category => {
    let img: CategoryImage | null = null;
    if (c?.image) {
      if (typeof c.image === "string") img = { url: c.image };
      else if (typeof c.image === "object")
        img = {
          url: c.image.url ?? c.image.secure_url ?? undefined,
          public_id: c.image.public_id,
        };
    }
    return {
      _id: c._id ?? c.id ?? String(Math.random()).slice(2),
      name: c.name ?? "Unnamed",
      image: img,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  };

  const normalizeProduct = (p: any): Product => {
    const id = p?._id ?? p?.id ?? "";
    const name = p?.name ?? p?.title ?? "Unnamed Product";
    let imgUrl: string | undefined = undefined;

    if (p?.image) {
      if (typeof p.image === "string") imgUrl = p.image;
      else if (typeof p.image === "object")
        imgUrl = p.image.url ?? p.image.secure_url;
    }
    if (!imgUrl && Array.isArray(p?.images) && p.images.length > 0) {
      const first = p.images[0];
      if (typeof first === "string") imgUrl = first;
      else if (typeof first === "object") imgUrl = first.url ?? first.secure_url;
    }

    return {
      _id: id,
      name,
      image: imgUrl ? { url: imgUrl } : p?.image ?? null,
      images: p?.images ?? [],
    };
  };

  const normalizeSpecialCategory = (s: any): SpecialCategory => {
    const id = s?._id ?? s?.id ?? String(Math.random()).slice(2);
    const name = s?.name ?? "Unnamed";
    const image = s?.image ?? null;
    const products = s?.products ?? s?.productIds ?? s?.items ?? [];
    return {
      _id: id,
      name,
      image,
      products,
      createdAt: s?.createdAt,
      updatedAt: s?.updatedAt,
    };
  };

  const getSpecialImageUrl = (sc: SpecialCategory) => {
    const img = sc?.image;
    if (!img) return "";
    if (typeof img === "string") return img;
    if (typeof img === "object") return img.url ?? "";
    return "";
  };

  const getProductId = (p: any) => String(p?._id ?? p?.id ?? "");
  const getProductName = (p: any) =>
    String(p?.name ?? p?.title ?? "Unnamed Product");
  const getProductImage = (p: any) => {
    if (p?.image) {
      if (typeof p.image === "string") return p.image;
      if (typeof p.image === "object")
        return p.image.url ?? p.image.secure_url ?? "";
    }
    if (Array.isArray(p?.images) && p.images.length > 0) {
      const first = p.images[0];
      if (typeof first === "string") return first;
      if (typeof first === "object") return first.url ?? first.secure_url ?? "";
    }
    return "";
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(CATEGORIES_BASE, getAuthConfig());
      const data = Array.isArray(res.data?.categories)
        ? res.data.categories
        : res.data?.data ?? res.data ?? [];
      const normalized: Category[] = (data || []).map((c: any) =>
        normalizeCategoryItem(c)
      );
      setCategories(normalized);
    } catch (err) {
      console.error("fetchCategories", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVarieties = async () => {
    try {
      setVarLoading(true);
      const res = await axios.get(VARIETIES_BASE, getAuthConfig()).catch(() => null);
      const raw = res?.data ?? null;
      let arr: any[] = [];
      if (!raw) arr = [];
      else if (Array.isArray(raw)) arr = raw;
      else if (Array.isArray(raw.varieties)) arr = raw.varieties;
      else if (Array.isArray(raw.data)) arr = raw.data;
      else arr = [];

      const items: Variety[] = arr.map((v: any) => {
        const categoryObj =
          v.category && typeof v.category === "object" ? v.category : null;
        const categoryId = categoryObj
          ? categoryObj._id ?? categoryObj.id ?? String(categoryObj)
          : v.category ?? v.categoryId ?? "";
        const categoryName = categoryObj
          ? categoryObj.name ?? ""
          : v.categoryName ?? "";
        return {
          _id: v._id ?? v.id ?? String(Math.random()).slice(2),
          name: v.name ?? "Unnamed",
          categoryId: String(categoryId ?? ""),
          categoryName: categoryName ?? "",
        };
      });
      setVarieties(items);
    } catch (err) {
      console.error("fetchVarieties", err);
      setVarieties([]);
    } finally {
      setVarLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await axios.get(PRODUCTS_GET, getAuthConfig()).catch(() => null);
      const raw = res?.data ?? null;

      let arr: any[] = [];
      if (!raw) arr = [];
      else if (Array.isArray(raw)) arr = raw;
      else if (Array.isArray(raw.products)) arr = raw.products;
      else if (Array.isArray(raw.data)) arr = raw.data;
      else arr = [];

      const normalized = arr.map(normalizeProduct).filter((p) => getProductId(p));
      setAllProducts(normalized);
    } catch (err) {
      console.error("fetchProducts", err);
      setAllProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  /* ✅ fetch special categories + count of products using new API */
  const fetchSpecialCategories = async () => {
    try {
      setSpecialLoading(true);
      const res = await axios
        .get(SPECIAL_CATEGORIES_GET, getAuthConfig())
        .catch(() => null);
      const raw = res?.data ?? null;

      let arr: any[] = [];
      if (!raw) arr = [];
      else if (Array.isArray(raw)) arr = raw;
      else if (Array.isArray(raw.data)) arr = raw.data;
      else if (Array.isArray(raw.specialCategories)) arr = raw.specialCategories;
      else if (Array.isArray(raw.categories)) arr = raw.categories;
      else arr = [];

      const normalized = arr.map(normalizeSpecialCategory);
      setSpecialCategories(normalized);

      // ✅ load counts for each category (from NEW API)
      const conf = getAuthConfig();
      const countPairs = await Promise.all(
        normalized.map(async (sc: SpecialCategory) => {
          const id = sc._id ?? sc.id ?? "";
          if (!id) return [id, 0] as [string, number];

          try {
            const pr = await axios
              .get(SPECIAL_CATEGORY_PRODUCTS_GET(id), conf)
              .catch(() => null);
            const list = pr?.data?.products ?? [];
            return [id, Array.isArray(list) ? list.length : 0] as [string, number];
          } catch {
            return [id, 0] as [string, number];
          }
        })
      );

      const map: Record<string, number> = {};
      countPairs.forEach(([id, count]) => {
        if (id) map[id] = count;
      });
      setSpecialProductsCountMap(map);
    } catch (err) {
      console.error("fetchSpecialCategories", err);
      setSpecialCategories([]);
      setSpecialProductsCountMap({});
    } finally {
      setSpecialLoading(false);
    }
  };

  /* ---------------- SPECIAL CATEGORY HANDLERS ---------------- */
  const openAddSpecialModal = async () => {
    setIsSpecialEdit(false);
    setSpecialEditId(null);
    setSpecialName("");
    setSpecialImageFile(null);
    setSpecialImagePreview(null);
    setSpecialSelectedProducts([]);
    setShowSpecialModal(true);
    setSelectedSpecial(null);

    await fetchProducts();
  };

  /* ✅ Edit open => fetch products of that category from NEW API and tick them */
  const openEditSpecialModal = async (sc: SpecialCategory) => {
    setIsSpecialEdit(true);
    const sid = sc._id ?? sc.id ?? null;
    setSpecialEditId(sid);
    setSpecialName(sc.name ?? "");

    // image edit off (only preview show)
    setSpecialImageFile(null);
    setSpecialImagePreview(getSpecialImageUrl(sc) || null);

    setShowSpecialModal(true);
    setSelectedSpecial(null);

    // ensure all products loaded
    await fetchProducts();

    // ✅ fetch selected products from new API
    if (sid) {
      try {
        const res = await axios.get(SPECIAL_CATEGORY_PRODUCTS_GET(sid), getAuthConfig());
        const rawProducts = res.data?.products ?? [];
        const ids = (rawProducts || [])
          .map((p: any) => getProductId(p))
          .filter(Boolean);

        setSpecialSelectedProducts(ids);
      } catch (err) {
        console.error("edit fetch selected products", err);

        // fallback (old sc.products)
        const fallbackIds = (sc.products ?? [])
          .map((p: any) => (typeof p === "string" ? p : getProductId(p)))
          .filter(Boolean);
        setSpecialSelectedProducts(fallbackIds);
      }
    }
  };

  const closeSpecialModal = () => {
    setShowSpecialModal(false);
    setIsSpecialEdit(false);
    setSpecialEditId(null);
    setSpecialName("");
    setSpecialImageFile(null);
    setSpecialImagePreview(null);
    setSpecialSelectedProducts([]);
  };

  const handleSpecialImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setSpecialImageFile(f);
    setSpecialImagePreview(f ? URL.createObjectURL(f) : null);
  };

  const handleSaveSpecialCategory = async () => {
    if (!specialName.trim()) return alert("Special category name required.");
    if (specialSelectedProducts.length === 0)
      return alert("Select at least 1 product.");

    try {
      setSpecialSaving(true);
      const conf = getAuthConfig();

      // ✅ EDIT => JSON body (as you said)
      if (isSpecialEdit && specialEditId) {
        const payload = {
          name: specialName.trim(),
          products: specialSelectedProducts,
        };

        await axios.put(SPECIAL_CATEGORIES_PUT(specialEditId), payload, {
          ...conf,
          headers: { ...(conf.headers ?? {}), "Content-Type": "application/json" },
        });

        alert("Special category updated.");
        closeSpecialModal();
        await fetchSpecialCategories();
        return;
      }

      // ✅ CREATE => FormData (image upload required)
      const form = new FormData();
      form.append("name", specialName.trim());

      if (specialImageFile) {
        form.append("image", specialImageFile);
      }

      // send product ids
      specialSelectedProducts.forEach((id) => form.append("products[]", id));
      specialSelectedProducts.forEach((id) => form.append("productIds[]", id));

      await axios.post(SPECIAL_CATEGORIES_POST, form, {
        ...conf,
        headers: { ...(conf.headers ?? {}), "Content-Type": "multipart/form-data" },
      });

      alert("Special category created.");
      closeSpecialModal();
      await fetchSpecialCategories();
    } catch (err) {
      console.error("save special category", err);
      alert("Failed to save special category.");
    } finally {
      setSpecialSaving(false);
    }
  };

  const handleDeleteSpecialCategory = async (id: string, name: string) => {
    if (!confirm(`Delete special category "${name}"?`)) return;
    try {
      await axios.delete(SPECIAL_CATEGORIES_DELETE(id), getAuthConfig());
      setSpecialCategories((prev) => prev.filter((s) => (s._id ?? s.id) !== id));
      setSpecialProductsCountMap((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });

      if (selectedSpecial && (selectedSpecial._id ?? selectedSpecial.id) === id) {
        setSelectedSpecial(null);
      }
      alert("Special category deleted.");
    } catch (err) {
      console.error("delete special category", err);
      alert("Failed to delete special category.");
    }
  };

  /* ✅ CLICK SPECIAL CATEGORY => FETCH PRODUCTS FROM NEW API */
  const handleOpenSpecialProducts = async (sc: SpecialCategory) => {
    setSelectedSpecial(sc);
    setSelectedSpecialProducts([]);
    try {
      setSelectedSpecialProductsLoading(true);

      const res = await axios.get(
        SPECIAL_CATEGORY_PRODUCTS_GET(sc._id ?? sc.id ?? ""),
        getAuthConfig()
      );

      const rawProducts = res.data?.products ?? [];
      const normalized = rawProducts.map(normalizeProduct);

      setSelectedSpecialProducts(normalized);
    } catch (err) {
      console.error("fetch special category products", err);
      setSelectedSpecialProducts([]);
    } finally {
      setSelectedSpecialProductsLoading(false);
    }
  };

  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    if (activeTab === "products") {
      fetchCategories();
      fetchVarieties();
    }
    if (activeTab === "coupons") fetchCoupons();
    if (activeTab === "notifications") fetchNotifSettings();
    if (activeTab === "customersupport") fetchSupport();
    if (activeTab === "terms") fetchTerms();
    if (activeTab === "about") fetchAbout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, termsType]);

  useEffect(() => {
    if (activeTab === "products" && productInnerActive === "special") {
      fetchSpecialCategories();
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, productInnerActive]);

  /* ---------------- MODAL / UI HANDLERS (CATEGORIES) ---------------- */
  const addNewBlock = () => setAddBlocks((s) => [...s, emptyBlock()]);
  const removeBlock = (id: string) =>
    setAddBlocks((s) => s.filter((b) => b.id !== id));
  const updateBlockName = (id: string, v: string) =>
    setAddBlocks((s) => s.map((b) => (b.id === id ? { ...b, name: v } : b)));
  const updateBlockFile = (id: string, f: File | null) =>
    setAddBlocks((s) =>
      s.map((b) =>
        b.id === id
          ? { ...b, file: f, preview: f ? URL.createObjectURL(f) : null }
          : b
      )
    );
  const openAddModal = () => {
    setIsEditMode(false);
    setAddBlocks([emptyBlock()]);
    setShowCategoryModal(true);
    setProductInnerActive("categories");
  };
  const openEditModal = (cat: Category) => {
    setIsEditMode(true);
    setEditId(cat._id ?? cat.name ?? null);
    setEditName(cat.name);
    setEditFile(null);
    setEditPreview(cat.image?.url ?? null);
    setShowCategoryModal(true);
    setProductInnerActive("categories");
  };
  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setIsEditMode(false);
    setEditId(null);
    setEditName("");
    setEditFile(null);
    setEditPreview(null);
    setAddBlocks([emptyBlock()]);
    fetchCategories();
  };
  const handleAddFileChange = (e: ChangeEvent<HTMLInputElement>, id: string) => {
    const f = e.target.files?.[0] ?? null;
    updateBlockFile(id, f);
  };
  const handleEditFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setEditFile(f);
    setEditPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleSaveAdds = async () => {
    const nonEmpty = addBlocks.filter((b) => b.name.trim() !== "" || b.file);
    if (nonEmpty.length === 0)
      return alert("Please add at least one category (name or image).");
    for (const b of nonEmpty) {
      if (!b.name.trim()) return alert("Each category needs a name.");
    }
    try {
      setSaving(true);
      const conf = getAuthConfig();
      const created: Category[] = [];
      for (const b of nonEmpty) {
        const form = new FormData();
        form.append("name", b.name.trim());
        if (b.file) form.append("image", b.file);
        const res = await axios
          .post(CATEGORIES_BASE, form, {
            ...conf,
            headers: {
              ...(conf.headers ?? {}),
              "Content-Type": "multipart/form-data",
            },
          })
          .catch(() => null);
        const item =
          res?.data?.data ??
          res?.data ?? {
            _id: String(Math.random()).slice(2),
            name: b.name.trim(),
            image: b.file ? { url: b.preview } : null,
          };
        created.push(normalizeCategoryItem(item));
      }
      setCategories((prev) => [...created, ...prev]);
      alert("Categories added successfully.");
      setAddBlocks([emptyBlock()]);
      fetchCategories();
    } catch (err) {
      console.error("save adds error", err);
      alert("Failed to add categories.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    if (!editName.trim()) return alert("Please enter category name.");
    try {
      setSaving(true);
      const form = new FormData();
      form.append("name", editName.trim());
      if (editFile) form.append("image", editFile);
      const conf = getAuthConfig();
      const res = await axios
        .put(`${CATEGORIES_BASE}/${editId}`, form, {
          ...conf,
          headers: {
            ...(conf.headers ?? {}),
            "Content-Type": "multipart/form-data",
          },
        })
        .catch(() => null);
      if (res?.data?.success && res?.data?.data) {
        const updated = normalizeCategoryItem(res.data.data);
        setCategories((prev) =>
          prev.map((p) => (p._id === updated._id ? updated : p))
        );
      } else {
        fetchCategories();
      }
      alert("Category updated.");
      closeCategoryModal();
    } catch (err) {
      console.error("save edit error", err);
      alert("Failed to update category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const name = categories.find((c) => (c._id ?? c.name) === id)?.name ?? "";
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    try {
      setCategories((prev) => prev.filter((c) => (c._id ?? c.name) !== id));
      await axios.delete(`${CATEGORIES_BASE}/${id}`, getAuthConfig()).catch(() => null);
      alert("Category deleted successfully.");
      fetchCategories();
      setVarieties((prev) => prev.filter((v) => v.categoryId !== id));
    } catch (err) {
      console.error("delete category", err);
      alert("Failed to delete category.");
      fetchCategories();
    }
  };

  /* ---------------- VARIETY HANDLERS ---------------- */
  const openAddVarietyModal = (categoryId?: string, categoryName?: string) => {
    setIsVarEdit(false);
    setEditingVarId(null);
    setVarModalName("");
    setVarModalCategoryId(categoryId ?? null);
    setVarModalCategoryName(categoryName ?? null);
    setVarModalPending([]);
    setShowVarModal(true);
    setProductInnerActive("varieties");
  };

  const openEditVarietyModal = (v: Variety) => {
    setIsVarEdit(true);
    setEditingVarId(v._id ?? null);
    setVarModalName(v.name);
    setVarModalCategoryId(v.categoryId);
    setVarModalCategoryName(
      v.categoryName ??
        categories.find((c) => (c._id ?? c.name) === v.categoryId)?.name ??
        ""
    );
    setVarModalPending([]);
    setShowVarModal(true);
    setProductInnerActive("varieties");
  };

  const closeVarModal = () => {
    setShowVarModal(false);
    setVarModalCategoryId(null);
    setVarModalCategoryName(null);
    setVarModalName("");
    setIsVarEdit(false);
    setEditingVarId(null);
    setVarModalPending([]);
    fetchVarieties();
  };

  const handleLocalAddVariety = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const trimmedName = varModalName.trim();
    if (!varModalCategoryId) return alert("Select category.");
    if (!trimmedName) return alert("Enter variety name first to add.");
    const duplicateInPending = varModalPending.some(
      (p) =>
        p.name.toLowerCase() === trimmedName.toLowerCase() &&
        p.categoryId === varModalCategoryId
    );
    const duplicateInExisting = varieties.some(
      (v) =>
        v.name.toLowerCase() === trimmedName.toLowerCase() &&
        v.categoryId === varModalCategoryId
    );
    if (duplicateInPending || duplicateInExisting) {
      return alert("This variety already exists (or is pending) for this category.");
    }

    const created: Variety = {
      _id: `pending-${String(Math.random()).slice(2, 10)}`,
      name: trimmedName,
      categoryId: varModalCategoryId,
      categoryName:
        varModalCategoryName ??
        categories.find((c) => (c._id ?? c.name) === varModalCategoryId)?.name ??
        "",
    };
    setVarModalPending((prev) => [...prev, created]);
    setVarModalName("");
  };

  const handleRemovePending = (id: string) => {
    setVarModalPending((prev) => prev.filter((p) => p._id !== id));
  };

  const handleSaveVariety = async () => {
    if (!varModalCategoryId) return alert("Select category.");
    if (isVarEdit && editingVarId) {
      if (!varModalName.trim()) return alert("Enter variety name.");
      try {
        setVarLoading(true);
        const categoryNameToSend =
          varModalCategoryName ??
          categories.find((c) => (c._id ?? c.name) === varModalCategoryId)?.name ??
          "";
        const payload = { name: varModalName.trim(), category: categoryNameToSend };
        await axios
          .put(`${VARIETIES_BASE}/${editingVarId}`, payload, getAuthConfig())
          .catch(() => null);

        alert("Variety updated.");
        closeVarModal();
      } catch (err) {
        console.error("save variety (edit)", err);
        alert("Failed to update variety.");
      } finally {
        setVarLoading(false);
      }
      return;
    }

    try {
      setVarLoading(true);
      const conf = getAuthConfig();

      if (varModalPending.length > 0) {
        for (const p of varModalPending) {
          const payload = {
            name: p.name,
            category:
              p.categoryName ??
              categories.find((c) => (c._id ?? c.name) === p.categoryId)?.name ??
              "",
          };
          await axios
            .post(VARIETIES_BASE, payload, {
              ...conf,
              headers: {
                ...(conf.headers ?? {}),
                "Content-Type": "application/json",
              },
            })
            .catch(() => null);
        }
        alert("Varieties added.");
        setVarModalPending([]);
        closeVarModal();
        return;
      }

      if (varModalName.trim()) {
        const payload = {
          name: varModalName.trim(),
          category:
            varModalCategoryName ??
            categories.find((c) => (c._id ?? c.name) === varModalCategoryId)?.name ??
            "",
        };
        await axios
          .post(VARIETIES_BASE, payload, {
            ...conf,
            headers: {
              ...(conf.headers ?? {}),
              "Content-Type": "application/json",
            },
          })
          .catch(() => null);

        alert("Variety added.");
        setVarModalName("");
        closeVarModal();
        return;
      }

      return alert("Add a variety first (type a name or use the Add button).");
    } catch (err) {
      console.error("save variety", err);
      alert("Failed to save variety.");
    } finally {
      setVarLoading(false);
    }
  };

  const handleDeleteVariety = async (id: string, name: string) => {
    if (!confirm(`Delete variety "${name}"?`)) return;
    try {
      setVarieties((prev) => prev.filter((v) => (v._id ?? v.name) !== id));
      await axios.delete(`${VARIETIES_BASE}/${id}`, getAuthConfig()).catch(() => null);
      alert("Variety deleted.");
    } catch (err) {
      console.error("delete variety", err);
      alert("Failed to delete variety.");
      fetchVarieties();
    }
  };

  /* COUPONS */
  const fetchCoupons = async () => {
    try {
      setCouponLoading(true);
      const res = await axios.get(COUPONS_BASE, getAuthConfig());
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data ?? res.data?.coupons ?? [];
      setCouponsRaw(data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error("fetchCoupons", err);
    } finally {
      setCouponLoading(false);
    }
  };

  /* NOTIFICATIONS */
  const fetchNotifSettings = async () => {
    try {
      setNotifLoading(true);
      const res = await axios.get(NOTIF_GET, getAuthConfig());
      const data = res.data?.data ?? {};
      setNotifSettings({
        orderPlaced: !!data.orderPlaced,
        orderCancelled: !!data.orderCancelled,
        orderPickedUpDelivered: !!data.orderPickedUpDelivered,
        priceDrop: !!data.priceDrop,
      });
    } catch (err) {
      console.error("fetchNotifSettings", err);
    } finally {
      setNotifLoading(false);
    }
  };

  const updateNotifSetting = async (key: keyof typeof notifSettings) => {
    const updated = { ...notifSettings, [key]: !notifSettings[key] };
    setNotifSettings(updated);
    try {
      const payload = {
        orderPlaced: updated.orderPlaced,
        orderCancelled: updated.orderCancelled,
        orderPickedUpDelivered: updated.orderPickedUpDelivered,
        priceDrop: updated.priceDrop,
      };
      const conf = getAuthConfig();
      const res = await axios.put(NOTIF_PUT, payload, conf);
      if (res.data?.success && res.data.data) {
        setNotifSettings({
          orderPlaced: !!res.data.data.orderPlaced,
          orderCancelled: !!res.data.data.orderCancelled,
          orderPickedUpDelivered: !!res.data.data.orderPickedUpDelivered,
          priceDrop: !!res.data.data.priceDrop,
        });
      }
    } catch (err) {
      console.error("updateNotifSetting", err);
      setNotifSettings((s) => ({ ...s, [key]: !updated[key] }));
      alert("Failed to update notification setting.");
    }
  };

  const sendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim())
      return alert("Title and message are required.");
    try {
      setSendingNotif(true);
      const form = new FormData();
      form.append("title", notifTitle.trim());
      form.append("message", notifMessage.trim());
      if (notifImageFile) form.append("image", notifImageFile);
      const conf = getAuthConfig();
      await axios.post(NOTIF_POST, form, {
        ...conf,
        headers: { ...(conf.headers ?? {}), "Content-Type": "multipart/form-data" },
      });
      alert("Notification sent.");
      setNotifTitle("");
      setNotifMessage("");
      setNotifImageFile(null);
      setNotifImagePreview(null);
    } catch (err) {
      console.error("sendNotification", err);
      alert("Failed to send notification.");
    } finally {
      setSendingNotif(false);
    }
  };

  const handleNotifImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setNotifImageFile(f);
    setNotifImagePreview(f ? URL.createObjectURL(f) : null);
  };

  /* TERMS */
  const fetchTerms = async () => {
    try {
      setTermsLoading(true);
      const endpoint = termsType === "buyer" ? TERMS_BASE_BUYER : TERMS_BASE_VENDOR;
      const res = await axios.get(endpoint, getAuthConfig());
      const data = res.data?.data ?? res.data ?? {};
      setTermsContent(data.content ?? "");
    } catch (err) {
      console.error("fetchTerms", err);
      setTermsContent("");
    } finally {
      setTermsLoading(false);
    }
  };

  const openTermsEditor = () => {
    setTermsEditValue(termsContent ?? "");
    setTermsEditOpen(true);
  };

  const saveTerms = async () => {
    try {
      setTermsSaving(true);
      const endpoint = termsType === "buyer" ? TERMS_BASE_BUYER : TERMS_BASE_VENDOR;
      const payload = { content: termsEditValue ?? "" };
      const res = await axios.put(endpoint, payload, getAuthConfig());
      if (res.data?.success) {
        const updated = res.data?.data ?? {};
        setTermsContent(updated.content ?? termsEditValue);
        setTermsEditOpen(false);
        alert(
          `${
            termsType === "buyer" ? "Terms & Conditions" : "Privacy Policy"
          } updated successfully.`
        );
      } else {
        setTermsContent(termsEditValue);
        setTermsEditOpen(false);
        alert("Saved locally (server did not return success).");
      }
    } catch (err) {
      console.error("saveTerms", err);
      alert("Failed to save Terms & Conditions.");
    } finally {
      setTermsSaving(false);
    }
  };

  /* ABOUT */
  const fetchAbout = async () => {
    try {
      setAboutLoading(true);
      const res = await axios.get(ABOUT_BASE, getAuthConfig());
      const data = res.data?.data ?? res.data ?? {};
      setAboutContent(data.content ?? data?.content ?? "");
    } catch (err) {
      console.error("fetchAbout", err);
      setAboutContent("");
    } finally {
      setAboutLoading(false);
    }
  };

  const openAboutEditor = () => {
    setAboutEditValue(aboutContent ?? "");
    setAboutEditOpen(true);
  };

  const saveAbout = async () => {
    try {
      setAboutSaving(true);
      const payload = { content: aboutEditValue ?? "" };
      const res = await axios.put(ABOUT_BASE, payload, getAuthConfig());
      if (res.data?.success) {
        const updated = res.data?.data ?? {};
        setAboutContent(updated.content ?? aboutEditValue);
        setAboutEditOpen(false);
        alert("About Us updated successfully.");
      } else {
        setAboutContent(aboutEditValue);
        setAboutEditOpen(false);
        alert("Saved locally (server did not return success).");
      }
    } catch (err) {
      console.error("saveAbout", err);
      alert("Failed to save About Us.");
    } finally {
      setAboutSaving(false);
    }
  };

  /* SUPPORT */
  const fetchSupport = async () => {
    try {
      setLoadingSupport(true);
      const res = await axios.get(SUPPORT_BASE, getAuthConfig());
      const data = res.data?.data ?? null;
      setSupportData(data);
    } catch (err) {
      console.error("fetchSupport", err);
    } finally {
      setLoadingSupport(false);
    }
  };

  const handleSupportEdit = (field: string, currentValue: string) => {
    setSupportEditField(field);
    setSupportTempValue(currentValue || "");
  };
  const handleSupportSave = async () => {
    if (!supportEditField) return;
    try {
      const payload = { ...supportData, [supportEditField]: supportTempValue };
      const res = await axios.put(SUPPORT_BASE, payload, getAuthConfig());
      const updated = res.data?.data ?? payload;
      setSupportData(updated);
      setSupportEditField(null);
      setSupportTempValue("");
      alert("Customer support updated.");
    } catch (err) {
      console.error("handleSupportSave", err);
      alert("Failed to update customer support.");
    }
  };
  const handleSupportDelete = async (field: string) => {
    if (!confirm(`Are you sure you want to clear ${field}?`)) return;
    try {
      const payload = { ...supportData, [field]: "" };
      const res = await axios.put(SUPPORT_BASE, payload, getAuthConfig());
      setSupportData(res.data?.data ?? payload);
      alert("Field cleared.");
    } catch (err) {
      console.error("handleSupportDelete", err);
      alert("Failed to clear field.");
    }
  };
  const handleSupportCancel = () => {
    setSupportEditField(null);
    setSupportTempValue("");
  };

  /* COUPONS helpers */
  const normalizeDiscount = (discount: any) => {
    try {
      if (discount === null || discount === undefined)
        return { value: 0, type: "Percentage" };
      if (typeof discount === "number")
        return { value: discount, type: "Percentage" };
      if (typeof discount === "string") {
        const raw = discount.trim();
        const num = parseFloat(raw.replace(/[^\d.-]/g, ""));
        if (!isNaN(num)) {
          if (raw.includes("%")) return { value: num, type: "Percentage" };
          if (
            raw.includes("₹") ||
            raw.toLowerCase().includes("rs") ||
            raw.toLowerCase().includes("inr")
          )
            return { value: num, type: "Fixed" };
          return { value: num, type: "Percentage" };
        }
        return { value: 0, type: "Percentage" };
      }
      if (typeof discount === "object") {
        const value = Number(discount.value ?? discount.val ?? 0) || 0;
        let type = (discount.type ?? discount.unit ?? "Percentage").toString();
        type = type.trim();
        const tl = type.toLowerCase();
        if (["%", "percent", "percentage"].includes(tl)) type = "Percentage";
        else if (["₹", "rs", "inr", "fixed", "amount"].includes(tl))
          type = "Fixed";
        else if (tl === "") type = "Percentage";
        else {
          if (tl.includes("%")) type = "Percentage";
          else if (
            tl.includes("fixed") ||
            tl.includes("rupee") ||
            tl.includes("₹")
          )
            type = "Fixed";
          else type = type[0].toUpperCase() + type.slice(1);
        }
        return { value, type };
      }
    } catch (err) {
      return { value: 0, type: "Percentage" };
    }
    return { value: 0, type: "Percentage" };
  };

  const mapToRow = (c: ApiCoupon) => {
    const d = normalizeDiscount(c.discount);
    const discountValue = Number(d.value) || 0;
    const discountType = d.type ?? "Percentage";
    const expiryISO = c.expiryDate ?? c.updatedAt ?? c.createdAt ?? "";
    const validityLabel = expiryISO ? new Date(expiryISO).toLocaleDateString() : "-";
    const appliesTo = Array.isArray(c.appliesTo)
      ? c.appliesTo.join(", ")
      : (c.appliesTo as any) ?? "All Products";
    const createdByLabel =
      c.createdBy && typeof c.createdBy === "object"
        ? c.createdBy.name ??
          c.createdBy._id ??
          c.createdBy.id ??
          String(c.createdBy)
        : String(c.createdBy ?? "-");
    let status = (c.status ?? "").toString();
    if (!status) {
      if (!expiryISO) status = "Active";
      else status = new Date(expiryISO) > new Date() ? "Active" : "Expired";
    }
    const id = c._id ?? c.id ?? String(Math.random()).slice(2);
    return {
      _id: id,
      code: c.code,
      discountValue,
      discountType,
      appliesTo,
      createdByLabel,
      validityLabel,
      expiryISO,
      status,
    };
  };

  const couponRows = couponsRaw.map(mapToRow);
  const filtered = couponRows.filter((r) => {
    const matchesFilter =
      couponFilter === "all"
        ? true
        : couponFilter === "active"
        ? r.status.toLowerCase() === "active"
        : r.status.toLowerCase() === "expired";
    const matchesSearch = r.code
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / couponsPerPage));
  const indexOfLast = currentPage * couponsPerPage;
  const indexOfFirst = indexOfLast - couponsPerPage;
  const currentCoupons = filtered.slice(indexOfFirst, indexOfLast);
  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const openAddCoupon = () => {
    setShowAddCoupon(true);
    setFormCode("");
    setFormDiscount("");
    setFormDiscountType("Percentage");
    setFormMinOrder("");
    setFormUsageLimit("");
    setFormStartDate("");
    setFormExpiryDate("");
    setFormAppliesTo("All Products");
  };
  const closeAddCoupon = () => setShowAddCoupon(false);

  const handleCreateCoupon = async () => {
    if (!formCode.trim()) return alert("Coupon Code required");
    if (!formDiscount && formDiscount !== 0) return alert("Discount required");
    if (!formExpiryDate) return alert("Expiry Date required");
    try {
      setCreatingCoupon(true);
      const discountPayload = { value: Number(formDiscount), type: formDiscountType };
      const appliesToValue = [String(formAppliesTo || "All Products")];

      const payload = {
        code: formCode.trim(),
        discount: discountPayload,
        minimumOrder: formMinOrder ? Number(formMinOrder) : 0,
        usageLimitPerUser: formUsageLimit ? Number(formUsageLimit) : 1,
        totalUsageLimit: formTotalUsage ? Number(formTotalUsage) : 50,
        startDate: formStartDate
          ? new Date(formStartDate).toISOString()
          : new Date().toISOString(),
        expiryDate: new Date(formExpiryDate).toISOString(),
        appliesTo: appliesToValue,
        applicableProducts: [],
      };
      const conf = getAuthConfig();
      await axios.post(COUPONS_BASE, payload, {
        ...conf,
        headers: { ...(conf.headers ?? {}), "Content-Type": "application/json" },
      });
      alert("Coupon created successfully.");
      closeAddCoupon();
      await fetchCoupons();
    } catch (err) {
      console.error("create coupon error", err);
      alert("Failed to create coupon.");
    } finally {
      setCreatingCoupon(false);
    }
  };

  const openDeleteModal = (id: string, code: string) => {
    setOpenDeleteId(id);
    setOpenDeleteCode(code);
    setDeleteReason("");
  };
  const closeDeleteModal = () => {
    setOpenDeleteId(null);
    setOpenDeleteCode(null);
    setDeleteReason("");
  };

  const confirmDeleteCoupon = async () => {
    if (!openDeleteId) return;
    try {
      await axios.delete(`${COUPONS_BASE}/${openDeleteId}`, getAuthConfig());
      setCouponsRaw((prev) =>
        prev.filter((c) => {
          const cid = c._id ?? c.id ?? "";
          return cid !== openDeleteId;
        })
      );
      closeDeleteModal();
      alert("Coupon deleted successfully.");
    } catch (err) {
      console.error("delete coupon error", err);
      alert("Failed to delete coupon.");
    }
  };

  const handleFilterSelect = (filterKey: "all" | "active" | "expired") => {
    setCouponFilter(filterKey);
    setCurrentPage(1);
    setShowFilterDropdown(false);
  };

  /* UI helpers for Varieties grouping */
  const groupedVarietiesInternal = categories.map((cat) => {
    const catId = cat._id ?? cat.name;
    const allItems = varieties
      .filter((v) => v.categoryId === String(catId))
      .sort((a, b) => a.name.localeCompare(b.name));
    const filteredByVarName = allItems.filter((v) =>
      v.name.toLowerCase().includes(varSearch.trim().toLowerCase())
    );
    return {
      category: cat,
      allItems,
      filteredItems: filteredByVarName,
    };
  });

  const categoriesFilteredForDisplay = groupedVarietiesInternal
    .map((g) => {
      const lowerVar = varSearch.trim().toLowerCase();

      if (productInnerActive === "categories") {
        return { category: g.category, items: g.allItems };
      }

      if (!lowerVar) {
        return { category: g.category, items: g.allItems };
      }

      const catMatch = g.category.name.toLowerCase().includes(lowerVar);
      if (catMatch) {
        return { category: g.category, items: g.allItems };
      }

      return { category: g.category, items: g.filteredItems };
    })
    .filter((g) => {
      if (productInnerActive === "categories") {
        const lowerCat = categorySearch.trim().toLowerCase();
        if (!lowerCat) return true;
        return g.category.name.toLowerCase().includes(lowerCat);
      }
      return (g.items || []).length > 0;
    });

  /* ---------------- MULTI SELECT PRODUCTS (SPECIAL CATEGORY) ---------------- */
  const ProductMultiSelect: React.FC<{
    options: Product[];
    value: string[];
    onChange: (v: string[]) => void;
  }> = ({ options, value, onChange }) => {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");

    const filtered = options.filter((p) =>
      getProductName(p).toLowerCase().includes(q.trim().toLowerCase())
    );

    const toggle = (id: string) => {
      if (!id) return;
      const updated = value.includes(id)
        ? value.filter((x) => x !== id)
        : [...value, id];
      onChange(updated);
    };

    const selectedLabels = value
      .map((id) => options.find((p) => getProductId(p) === id))
      .filter(Boolean)
      .map((p) => getProductName(p as any));

    return (
      <div className="relative w-full">
        <div
          className="border rounded-lg p-2.5 bg-white w-full cursor-pointer flex justify-between items-center"
          onClick={() => setOpen(!open)}
        >
          <span className="text-gray-700 text-sm truncate">
            {selectedLabels.length > 0
              ? selectedLabels.join(", ")
              : "-- Select products --"}
          </span>

          <svg
            className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {open && (
          <div className="absolute left-0 top-full mt-1 w-full bg-white border rounded-lg shadow-lg max-h-72 overflow-y-auto z-50">
            <div className="p-2 border-b">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search product..."
                className="w-full border rounded-md px-3 py-2 text-sm outline-none"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-500">No products found.</div>
            ) : (
              filtered.map((p) => {
                const id = getProductId(p);
                const checked = value.includes(id);
                return (
                  <div
                    key={id}
                    onClick={() => toggle(id)}
                    className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-gray-100 ${
                      checked ? "bg-green-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={checked} readOnly />
                      <span className="text-gray-700">{getProductName(p)}</span>
                    </div>
                    {checked && <span className="text-green-600 font-bold">✔</span>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div className="flex bg-gray-100 h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-200 border-r border-gray-200 p-8 fixed h-full">
        <nav className="flex flex-col gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-left px-3 py-2 rounded-md text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-white shadow-sm text-gray-900"
                  : "hover:bg-gray-200 text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 px-10 py-6 overflow-y-auto">
        {/* PRODUCTS */}
        {activeTab === "products" && (
          <div className="w-full max-w-6xl">
            {/* Inner tabs */}
            <div className="flex items-center gap-6 mb-5">
              {productInnerTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setProductInnerActive(t.id as any);
                    setSelectedSpecial(null);
                    setSelectedSpecialProducts([]);
                  }}
                  className={`text-sm font-medium pb-2 ${
                    productInnerActive === t.id
                      ? "text-green-600 border-b-2 border-green-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Card wrapper */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-gray-800 text-base font-medium">
                  {productInnerActive === "categories"
                    ? "Manage Product Categories"
                    : productInnerActive === "varieties"
                    ? "Manage Product Varieties"
                    : "Manage Special Categories"}
                </h2>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg px-3 py-2 w-72">
                    <Search className="text-gray-500 w-5 h-5 mr-2" />

                    {productInnerActive === "categories" ? (
                      <input
                        type="text"
                        placeholder="Search categories"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full outline-none text-gray-700"
                      />
                    ) : productInnerActive === "varieties" ? (
                      <input
                        type="text"
                        placeholder="Search categories / varieties"
                        value={varSearch}
                        onChange={(e) => setVarSearch(e.target.value)}
                        className="w-full outline-none text-gray-700"
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="Search special categories"
                        value={specialSearch}
                        onChange={(e) => setSpecialSearch(e.target.value)}
                        className="w-full outline-none text-gray-700"
                      />
                    )}
                  </div>

                  {productInnerActive === "special" && (
                    <button
                      onClick={openAddSpecialModal}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm flex items-center gap-2"
                    >
                      <Plus size={14} /> Add Special Category
                    </button>
                  )}
                </div>
              </div>

              {/* Categories view */}
              {productInnerActive === "categories" && (
                <>
                  <div className="space-y-3 mb-6">
                    {loading ? (
                      <div className="text-sm text-gray-500">Loading categories...</div>
                    ) : categories.filter(c => c.name.toLowerCase().includes(categorySearch.trim().toLowerCase())).length === 0 ? (
                      <div className="text-sm text-gray-500">No categories yet.</div>
                    ) : (
                      categories
                        .filter(c => c.name.toLowerCase().includes(categorySearch.trim().toLowerCase()))
                        .map((cat, idx) => (
                          <div key={cat._id ?? cat.name ?? idx} className="flex justify-between items-center border-b border-gray-200 pb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-800 text-sm">{idx + 1}. {cat.name}</span>
                            </div>
                            <div className="flex gap-3 items-center">
                              <button
                                onClick={() => handleDeleteCategory(cat._id ?? cat.name ?? "")}
                                className="flex items-center justify-center w-9 h-9 rounded-md border border-red-200 bg-white hover:bg-red-50"
                                title="Delete"
                              >
                                <span className="inline-flex items-center justify-center w-6 h-6 text-red-600"><Trash2 size={16} /></span>
                              </button>
                              <button
                                onClick={() => openEditModal(cat)}
                                className="flex items-center justify-center w-9 h-9 rounded-md border border-sky-100 bg-white hover:bg-sky-50"
                                title="Edit"
                              >
                                <span className="inline-flex items-center justify-center w-6 h-6 text-sky-500"><Edit size={16} /></span>
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>

                  {/* Add category button - placed below the list (as requested) */}
                  <div className="mt-4">
                    <button onClick={openAddModal} className="flex items-center gap-2 text-sky-600 hover:text-sky-700 text-[15px] font-medium">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full border border-sky-500"><Plus size={12} /></span>
                      Add a category
                    </button>
                  </div>
                </>
              )}

              {/* Varieties view */}
              {productInnerActive === "varieties" && (
                <div className="space-y-5">
                  {loading || varLoading ? (
                    <div className="text-sm text-gray-500">Loading...</div>
                  ) : (
                    <>
                      {categoriesFilteredForDisplay.length === 0 ? (
                        <div className="text-sm text-gray-500">No categories or varieties found.</div>
                      ) : (
                        <>
                          {categoriesFilteredForDisplay.map(({ category, items }) => (
                            <div key={category._id ?? category.name} className="rounded-lg border border-gray-200 p-4 bg-white">
                              <div className="mb-3">
                                <div className="text-sm font-medium text-gray-800">{category.name}</div>
                              </div>

                              <div className="bg-white rounded-md border border-gray-100">
                                {items.length === 0 ? (
                                  <div className="text-sm text-gray-500 py-3 px-4">No varieties yet.</div>
                                ) : (
                                  items.map((v, i) => (
                                    <div key={v._id ?? v.name ?? i} className={`flex items-center justify-between py-3 px-4 ${i !== items.length - 1 ? "border-b border-gray-200" : ""}`}>
                                      <div className="flex items-center gap-4">
                                        <div className="text-gray-500 text-sm w-6">{i + 1}.</div>
                                        <div className="text-sm text-gray-700">{v.name}</div>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={() => handleDeleteVariety(v._id ?? v.name ?? "", v.name)}
                                          title="Delete"
                                          className="flex items-center justify-center w-9 h-9 rounded-md border border-red-200 bg-white hover:bg-red-50"
                                        >
                                          <span className="inline-flex items-center justify-center w-5 h-5 text-red-600"><Trash2 size={14} /></span>
                                        </button>

                                        <button
                                          onClick={() => openEditVarietyModal(v)}
                                          title="Edit"
                                          className="flex items-center justify-center w-9 h-9 rounded-md border border-sky-100 bg-white hover:bg-sky-50"
                                        >
                                          <span className="inline-flex items-center justify-center w-5 h-5 text-sky-500"><Edit size={14} /></span>
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>

                              <div className="mt-3">
                                {/* Keep per-category Add button (optional), but smaller icon */}
                                <button
                                  onClick={() => openAddVarietyModal(category._id ?? category.name, category.name)}
                                  className="flex items-center gap-2 text-sky-600 hover:text-sky-700 text-[14px] font-medium"
                                >
                                  <span className="flex items-center justify-center w-5 h-5 rounded-full border border-sky-500"><Plus size={12} /></span>
                                  Add a Variety
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Global Add Variety button placed below the whole table/card as requested */}
                          <div className="mt-4 flex items-center">
                            <button onClick={() => openAddVarietyModal()} className="flex items-center gap-2 text-sky-600 hover:text-sky-700 text-[15px] font-medium">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full border border-sky-500"><Plus size={12} /></span>
                              Add Variety
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  )} 
                </div>
              )}

              {/* SPECIAL CATEGORIES VIEW */}
              {productInnerActive === "special" && (
                <div>
                  {/* if clicked special category -> show products */}
                  {selectedSpecial ? (
                    <div className="space-y-4">
                      <button
                        onClick={() => {
                          setSelectedSpecial(null);
                          setSelectedSpecialProducts([]);
                        }}
                        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 text-sm"
                      >
                        <ChevronLeft size={18} /> Back to Special Categories
                      </button>

                      <div className="flex items-center gap-3">
                        <img
                          src={
                            getSpecialImageUrl(selectedSpecial) ||
                            "https://via.placeholder.com/60"
                          }
                          alt="special"
                          className="w-14 h-14 rounded-xl object-cover border"
                        />
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {selectedSpecial.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Products: {selectedSpecialProducts.length}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedSpecialProductsLoading ? (
                          <div className="text-sm text-gray-500">Loading products...</div>
                        ) : selectedSpecialProducts.length === 0 ? (
                          <div className="text-sm text-gray-500">
                            No products found in this special category.
                          </div>
                        ) : (
                          selectedSpecialProducts.map((p) => (
                            <div
                              key={getProductId(p)}
                              className="border rounded-xl p-3 bg-white flex items-center gap-3"
                            >
                              <img
                                src={
                                  getProductImage(p) || "https://via.placeholder.com/60"
                                }
                                alt={getProductName(p)}
                                className="w-12 h-12 rounded-lg object-cover border"
                              />
                              <div className="text-sm font-medium text-gray-800">
                                {getProductName(p)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {specialLoading ? (
                        <div className="text-sm text-gray-500">
                          Loading special categories...
                        </div>
                      ) : specialCategories
                          .filter((s) =>
                            s.name.toLowerCase().includes(specialSearch.trim().toLowerCase())
                          )
                          .length === 0 ? (
                        <div className="text-sm text-gray-500">
                          No special categories yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {specialCategories
                            .filter((s) =>
                              s.name.toLowerCase().includes(specialSearch.trim().toLowerCase())
                            )
                            .map((sc) => {
                              const sid = sc._id ?? sc.id ?? "";
                              const count = specialProductsCountMap[sid] ?? 0;

                              return (
                                <div
                                  key={sid}
                                  className="border border-gray-200 rounded-2xl bg-white shadow-sm p-4 relative cursor-pointer hover:shadow-md transition"
                                  onClick={() => handleOpenSpecialProducts(sc)}
                                >
                                  {/* top actions */}
                                  <div className="absolute top-3 right-3 flex gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditSpecialModal(sc);
                                      }}
                                      className="w-9 h-9 rounded-md border border-sky-100 bg-white hover:bg-sky-50 flex items-center justify-center"
                                      title="Edit"
                                    >
                                      <Edit size={16} className="text-sky-500" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSpecialCategory(
                                          sc._id ?? sc.id ?? "",
                                          sc.name
                                        );
                                      }}
                                      className="w-9 h-9 rounded-md border border-red-200 bg-white hover:bg-red-50 flex items-center justify-center"
                                      title="Delete"
                                    >
                                      <Trash2 size={16} className="text-red-600" />
                                    </button>
                                  </div>

                                  <img
                                    src={
                                      getSpecialImageUrl(sc) ||
                                      "https://via.placeholder.com/400x200"
                                    }
                                    alt={sc.name}
                                    className="w-full h-36 rounded-xl object-cover border"
                                  />
                                  <div className="mt-3">
                                    <div className="text-sm font-semibold text-gray-900">
                                      {sc.name}
                                    </div>

                                    {/* ✅ REAL COUNT SHOW */}
                                    <div className="text-xs text-gray-500 mt-1">
                                      Products selected: {count}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}

                      <div className="mt-5">
                        <button
                          onClick={openAddSpecialModal}
                          className="flex items-center gap-2 text-sky-600 hover:text-sky-700 text-[15px] font-medium"
                        >
                          <span className="flex items-center justify-center w-6 h-6 rounded-full border border-sky-500">
                            <Plus size={12} />
                          </span>
                          Add Special Category
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* COUPONS */}
        {activeTab === "coupons" && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 w-full max-w-6xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-lg px-3 py-2 w-72">
                  <Search className="text-gray-500 w-5 h-5 mr-2" />
                  <input type="text" placeholder="Search by code" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full outline-none text-gray-700" />
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm bg-white hover:bg-gray-50 transition"
                  >
                    <Filter size={16} />
                    Filter
                  </button>
                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                      {[{ key: 'all', label: 'All' }, { key: 'active', label: 'Active' }, { key: 'expired', label: 'Expired' }].map((option) => (
                        <button
                          key={option.key}
                          onClick={() => handleFilterSelect(option.key as any)}
                          className={`block w-full text-left px-4 py-2 text-sm ${couponFilter === option.key ? 'bg-sky-100 text-sky-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                          {option.label}
                          {couponFilter === option.key && <span className="ml-2">({option.label})</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <button onClick={openAddCoupon} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm flex items-center gap-2">
                  <Plus size={14} /> Add Coupon
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border rounded-xl overflow-hidden">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-700 font-semibold">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Applies to</th>
                    <th className="py-3 px-4">Created by</th>
                    <th className="py-3 px-4">Validity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {couponLoading ? (
                    <tr><td colSpan={7} className="p-4 text-sm text-gray-500">Loading coupons...</td></tr>
                  ) : currentCoupons.length === 0 ? (
                    <tr><td colSpan={7} className="p-4 text-sm text-gray-500">No coupons found.</td></tr>
                  ) : (
                    currentCoupons.map((c) => (
                      <tr key={c._id ?? c.code} className="border-t hover:bg-gray-50">
                        <td className="py-3 px-4">{c.code}</td>
                        <td className="py-3 px-4">{c.discountValue} {c.discountType ? `(${c.discountType})` : ""}</td>
                        <td className="py-3 px-4">{c.appliesTo}</td>
                        <td className="py-3 px-4">{c.createdByLabel}</td>
                        <td className="py-3 px-4">{c.validityLabel}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${c.status.toLowerCase() === "active" ? "bg-green-100 text-green-700" : "bg-gray-300 text-gray-700"}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => openDeleteModal(c._id ?? c.code, c.code)} className="text-red-500 border p-1.5 rounded-md">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4 text-gray-600 text-sm">
              <span>Results per page - {couponsPerPage}</span>
              <span>{currentPage} of {totalPages} pages</span>
              <div className="flex items-center space-x-2">
                <button onClick={handlePrev} disabled={currentPage === 1} className={`p-1 rounded-full border ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}><svg width="20" height="20" fill="none" stroke="currentColor"><path d="M12 5l-5 5 5 5" /></svg></button>
                <button onClick={handleNext} disabled={currentPage === totalPages} className={`p-1 rounded-full border ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}><svg width="20" height="20" fill="none" stroke="currentColor"><path d="M8 5l5 5-5 5" /></svg></button>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 w-full max-w-6xl">
            <h2 className="text-gray-800 text-xl font-semibold mb-6">Manage User Notifications</h2>

            <div className="mb-8">
              {notifLoading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : (
                <div className="space-y-4 max-w-lg">
                  <div className="flex items-center justify-between py-2  last:border-b-0">
                    <div className="text-base font-medium text-gray-800">Order Placed</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifSettings.orderPlaced}
                        onChange={() => updateNotifSetting("orderPlaced")}
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-2  last:border-b-0">
                    <div className="text-base font-medium text-gray-800">Order Cancelled</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifSettings.orderCancelled}
                        onChange={() => updateNotifSetting("orderCancelled")}
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-2  last:border-b-0">
                    <div className="text-base font-medium text-gray-800">Order Picked up/Delivered</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifSettings.orderPickedUpDelivered}
                        onChange={() => updateNotifSetting("orderPickedUpDelivered")}
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="text-base font-medium text-gray-800">Price Drop</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifSettings.priceDrop}
                        onChange={() => updateNotifSetting("priceDrop")}
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                </div>
              </div>
              <div className="mt-3">

              </div>
            </div>
          </div>
        )}

        {/* CUSTOMER SUPPORT */}
        {activeTab === "customersupport" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 w-full max-w-10xl">
            <h2 className="text-gray-900 text-lg font-semibold mb-5">Customer Support</h2>

            {loadingSupport ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-3">
                    <Phone className="text-gray-600" size={18} />
                    <span className="text-gray-900 text-[15px]">{supportData?.phone ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleSupportDelete("phone")} className="p-1.5 rounded-md border border-red-300 text-red-500 hover:bg-red-50 transition"><Trash2 size={16} /></button>
                    <button onClick={() => handleSupportEdit("phone", supportData?.phone ?? "")} className="p-1.5 rounded-md border border-sky-300 text-sky-500 hover:bg-sky-50 transition"><Edit size={16} /></button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-3">
                    <Mail className="text-gray-600" size={18} />
                    <span className="text-gray-900 text-[15px]">{supportData?.email ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleSupportDelete("email")} className="p-1.5 rounded-md border border-red-300 text-red-500 hover:bg-red-50 transition"><Trash2 size={16} /></button>
                    <button onClick={() => handleSupportEdit("email", supportData?.email ?? "")} className="p-1.5 rounded-md border border-sky-300 text-sky-500 hover:bg-sky-50 transition"><Edit size={16} /></button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-3">
                    <Clock className="text-gray-600" size={18} />
                    <span className="text-gray-900 text-[15px]">{supportData?.operatingHours ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleSupportDelete("operatingHours")} className="p-1.5 rounded-md border border-red-300 text-red-500 hover:bg-red-50 transition"><Trash2 size={16} /></button>
                    <button onClick={() => handleSupportEdit("operatingHours", supportData?.operatingHours ?? "")} className="p-1.5 rounded-md border border-sky-300 text-sky-500 hover:bg-sky-50 transition"><Edit size={16} /></button>
                  </div>
                </div>
              </div>
            )}

            {supportEditField && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-[#f9f9f9] rounded-2xl shadow-xl w-full max-w-md relative p-6 border border-gray-200">
                  <button onClick={handleSupportCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"><X size={22} /></button>
                  <h3 className="text-lg font-semibold text-gray-900 mb-5">Edit</h3>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {supportEditField === "phone" ? "Phone Number" : supportEditField === "email" ? "Email" : "Operating Hours"}
                  </label>
                  <input type={supportEditField === "email" ? "email" : "text"} value={supportTempValue} onChange={(e) => setSupportTempValue(e.target.value)} placeholder="--" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-[15px] bg-white focus:ring-1 focus:ring-green-500 focus:outline-none" />
                  <div className="flex justify-center mt-8">
                    <button onClick={handleSupportSave} className="bg-green-500 hover:bg-green-600 text-white text-[15px] px-10 py-2.5 rounded-md font-medium transition">Save</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TERMS */}
        {activeTab === "terms" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 w-full max-w-6xl relative">
            <h3 className="text-2xl font-medium text-gray-800 mb-6">Terms & Conditions</h3>

            <div className="flex gap-8 mb-6 border-b border-gray-200 pb-3">
              <button
                onClick={() => setTermsType("buyer")}
                className={`text-base font-medium pb-1 ${termsType === "buyer" ? "text-green-600 border-b-2 border-green-600" : "text-gray-600 hover:text-gray-800"}`}
              >
                Buyer
              </button>
              <button
                onClick={() => setTermsType("vendor")}
                className={`text-base font-medium pb-1 ${termsType === "vendor" ? "text-green-600 border-b-2 border-green-600" : "text-gray-600 hover:text-gray-800"}`}
              >
                Vendor
              </button>
            </div>

            <button onClick={openTermsEditor} title="Edit terms" className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-md  bg-white hover:bg-sky-50">
              <Edit className="text-sky-500" size={18} />
            </button>

            <div className=" rounded-xl p-8 text-gray-700 text-base leading-7 max-w-full">
              <div className="whitespace-pre-line">
                {termsLoading ? "Loading..." : (termsContent && termsContent.trim() ? termsContent : "No content yet. Click the edit icon to add Terms & Conditions.")}
              </div>
            </div>

            {termsEditOpen && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold border-b- text-gray-900">Update {termsType === "buyer" ? "Terms & Conditions (Buyer)" : "Privacy Policy (Vendor)"}</h3>
                    <button onClick={() => setTermsEditOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                  </div>

                  <div className="bg-white   rounded-lg p-6 mb-6">
                    <textarea value={termsEditValue} onChange={(e) => setTermsEditValue(e.target.value)} rows={10} className="w-full h-48 border rounded-md p-4 text-gray-800 focus:outline-none resize-y" placeholder="Write or paste terms & conditions here..." />
                  </div>

                  <div className="flex justify-center">
                    <button onClick={saveTerms} disabled={termsSaving} className="bg-green-500 hover:bg-green-600 text-white px-10 py-3 rounded-xl text-lg font-medium shadow">
                      {termsSaving ? "Saving..." : "Update"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABOUT */}
        {activeTab === "about" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 w-full max-w-6xl relative">
            <h3 className="text-2xl font-medium text-gray-800 mb-6">About Us</h3>

            <button onClick={openAboutEditor} title="Edit about" className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-md  bg-white hover:bg-sky-50">
              <Edit className="text-sky-500" size={18} />
            </button>

            <div className=" rounded-xl p-8 text-gray-700 text-base leading-7 max-w-full">
              <div className="whitespace-pre-line">
                {aboutLoading ? "Loading..." : (aboutContent && aboutContent.trim() ? aboutContent : "No content yet. Click the edit icon to add About Us content.")}
              </div>
            </div>

            {aboutEditOpen && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Update About Us</h3>
                    <button onClick={() => setAboutEditOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                  </div>

                  <div className="bg-white  rounded-lg p-6 mb-6">
                    <textarea value={aboutEditValue} onChange={(e) => setAboutEditValue(e.target.value)} rows={10} className="w-full h-48 border rounded-md p-4 text-gray-800 focus:outline-none resize-y" placeholder="Write or paste About Us content here..." />
                  </div>

                  <div className="flex justify-center">
                    <button onClick={saveAbout} disabled={aboutSaving} className="bg-green-500 hover:bg-green-600 text-white px-10 py-3 rounded-xl text-lg font-medium shadow">
                      {aboutSaving ? "Saving..." : "Update"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ---------------- MODALS ---------------- */}

      {/* CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-[720px] p-6 relative max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-5">
              <h3 className="text-gray-800 font-medium text-[18px]">{isEditMode ? "Edit a category" : "Add a category"}</h3>
              <button onClick={closeCategoryModal} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            {isEditMode ? (
              <>
                <div className="mb-5">
                  <label className="block text-gray-700 text-[15px] mb-2">Name of the category *</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="--" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                </div>
                <div className="mb-5">
                  <label className="block text-gray-700 text-[15px] mb-2">Category Image *</label>
                  <div className="border border-gray-300 rounded-lg h-36 flex flex-col justify-center items-center text-center cursor-pointer" onClick={() => document.getElementById("editCategoryImageInput")?.click()}>
                    {editPreview ? <img src={editPreview} alt="preview" className="h-24 object-cover rounded-md" /> : <>
                      <div className="text-gray-400 mb-2"><PlusCircle size={32} /></div>
                      <p className="text-sm text-gray-500">Add a clear photo of the category</p>
                    </>}
                  </div>
                  <input id="editCategoryImageInput" type="file" accept="image/*" className="hidden" onChange={handleEditFileChange} />
                </div>
                <div className="flex justify-center">
                  <button onClick={handleSaveEdit} disabled={saving} className="bg-green-600 text-white px-12 py-2 rounded-md hover:bg-green-700 text-sm font-medium">
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4 mb-4">
                  {addBlocks.map((b) => (
                    <div key={b.id} className="p-3 border rounded-md">
                      <div className="mb-3">
                        <label className="block text-gray-700 text-[15px] mb-2">Name of the category *</label>
                        <input type="text" value={b.name} onChange={(e) => updateBlockName(b.id, e.target.value)} placeholder="--" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                      </div>
                      <div className="mb-2">
                        <label className="block text-gray-700 text-[15px] mb-2">Category Image *</label>
                        <div className="border border-gray-300 rounded-lg h-36 flex flex-col justify-center items-center text-center cursor-pointer" onClick={() => document.getElementById(`addImageInput-${b.id}`)?.click()}>
                          {b.preview ? <img src={b.preview} alt="preview" className="h-24 object-cover rounded-md" /> : <>
                            <div className="text-gray-400 mb-2"><PlusCircle size={32} /></div>
                            <p className="text-sm text-gray-500">Add a clear photo of the category</p>
                          </>}
                        </div>
                        <input id={`addImageInput-${b.id}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleAddFileChange(e, b.id)} />
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div></div>
                        <div>
                          {addBlocks.length > 1 && (
                            <button onClick={() => removeBlock(b.id)} className="text-sm text-red-500 px-3 py-1 border rounded-md">Remove</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mb-5">
                  <button onClick={addNewBlock} className="text-sky-600 flex items-center gap-2 text-sm font-medium hover:text-sky-700">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full border border-sky-500"><Plus size={12} /></span>
                    Add
                  </button>
                </div>
                <div className="flex justify-center">
                  <button onClick={handleSaveAdds} disabled={saving} className="bg-green-600 text-white px-12 py-2 rounded-md hover:bg-green-700 text-sm font-medium">
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
{/* VARIETY MODAL */}
{showVarModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-800 font-medium">
          {isVarEdit ? "Edit a variety" : "Add a variety"}
        </h3>
        <button onClick={closeVarModal} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>

      {/* Category Dropdown */}
      <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-2">Category *</label>

        <div className="relative w-full">
          <select
            value={varModalCategoryId ?? ""}
            onChange={(e) => {
              const id = e.target.value || null;
              setVarModalCategoryId(id);
              const name =
                categories.find((c) => (c._id ?? c.name) === id)?.name ?? null;
              setVarModalCategoryName(name);
            }}
            className="
              w-full
              border border-gray-300 
              rounded-lg 
              px-3 
              py-2.5 
              text-sm 
              bg-white 
              appearance-none
              focus:ring-2 
              focus:ring-green-500 
              focus:outline-none
            "
          >
            <option value="">-- Select category --</option>
            {categories.map((c) => (
              <option key={c._id ?? c.name} value={c._id ?? c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Dropdown arrow */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">
            ▼
          </span>
        </div>
      </div>

      {/* Variety Name */}
      <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-2">
          Name of the variety *
        </label>
        <input
          type="text"
          value={varModalName}
          onChange={(e) => setVarModalName(e.target.value)}
          placeholder="--"
          className="
            w-full 
            border border-gray-300 
            rounded-lg 
            p-3 
            text-sm 
            focus:outline-none 
            focus:ring-2 
            focus:ring-green-500
          "
        />
      </div>

      {/* Add Pending Varieties (Only in Add Mode) */}
      {!isVarEdit && (
        <>
          <div className="mb-3">
            <button
              type="button"
              onClick={handleLocalAddVariety}
              className="text-sky-600 flex items-center gap-2 text-sm font-medium hover:text-sky-700"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full border border-sky-500">
                <Plus size={12} />
              </span>
              Add
            </button>
          </div>

          {varModalPending.length > 0 && (
            <div className="mb-3 border rounded-md p-3 bg-gray-50">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Pending varieties
              </div>

              <div className="space-y-2">
                {varModalPending.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between bg-white border rounded-md px-3 py-2"
                  >
                    <div className="text-sm text-gray-700">{p.name}</div>

                    <button
                      type="button"
                      onClick={() => handleRemovePending(p._id ?? "")}
                      className="text-red-500 px-2 py-1 rounded-md border border-red-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Save button */}
      <div className="flex justify-center mt-4">
        <button
          type="button"
          onClick={handleSaveVariety}
          disabled={varLoading}
          className="
            bg-green-600 
            text-white 
            px-12 
            py-3 
            rounded-xl 
            hover:bg-green-700 
            text-sm 
            font-medium
          "
        >
          {varLoading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  </div>
)}
      {/* SPECIAL CATEGORY MODAL */}
      {showSpecialModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[720px] p-6 relative">
            <div className="flex justify-between items-center border-b pb-3 mb-5">
              <h3 className="text-gray-800 font-medium text-[18px]">
                {isSpecialEdit ? "Edit Special Category" : "Add Special Category"}
              </h3>
              <button
                onClick={closeSpecialModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-[15px] mb-2">Name *</label>
              <input
                value={specialName}
                onChange={(e) => setSpecialName(e.target.value)}
                placeholder="--"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-[15px] mb-2">
                Select Products *
              </label>

              {productsLoading ? (
                <div className="text-sm text-gray-500">Loading products...</div>
              ) : (
                <ProductMultiSelect
                  options={allProducts}
                  value={specialSelectedProducts}
                  onChange={setSpecialSelectedProducts}
                />
              )}
            </div>

            {/* ✅ only show image upload when creating new */}
            {!isSpecialEdit && (
              <div className="mb-5">
                <label className="block text-gray-700 text-[15px] mb-2">Image *</label>
                <div
                  className="border border-gray-300 rounded-lg h-40 flex flex-col justify-center items-center text-center cursor-pointer"
                  onClick={() => document.getElementById("specialImageInput")?.click()}
                >
                  {specialImagePreview ? (
                    <img
                      src={specialImagePreview}
                      alt="preview"
                      className="h-28 object-cover rounded-md"
                    />
                  ) : (
                    <>
                      <div className="text-gray-400 mb-2">
                        <PlusCircle size={32} />
                      </div>
                      <p className="text-sm text-gray-500">
                        Upload special category image
                      </p>
                    </>
                  )}
                </div>
                <input
                  id="specialImageInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSpecialImageChange}
                />
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleSaveSpecialCategory}
                disabled={specialSaving}
                className="bg-green-600 text-white px-12 py-3 rounded-xl hover:bg-green-700 text-sm font-medium w-full max-w-sm"
              >
                {specialSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD COUPON MODAL */}
      {showAddCoupon && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-start pt-20 z-50">
          <div className="bg-white rounded-2xl shadow-lg w-[780px] p-7 relative">
            <div className="flex justify-between items-center border-b pb-3 mb-5">
              <h3 className="text-gray-800 font-semibold text-[17px]">Create a Coupon</h3>
              <button onClick={closeAddCoupon} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-5 text-sm text-gray-700">
              <div>
                <label className="block mb-1 font-medium">Coupon Code <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type="text" value={formCode} onChange={(e) => setFormCode(e.target.value.toUpperCase())} placeholder="-- " className="w-full border rounded-lg p-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700">✨</span>
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Discount <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input type="number" value={formDiscount as any} onChange={(e) => setFormDiscount(e.target.value === "" ? "" : Number(e.target.value))} placeholder="-- " className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
                  <div className="relative">
                    <select value={formDiscountType} onChange={(e) => setFormDiscountType(e.target.value as any)} className="border rounded-lg p-2.5 focus:outline-none appearance-none pr-6 bg-white">
                      <option value="Percentage">%</option>
                      <option value="Fixed">₹</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Minimum Order</label>
                <input type="number" value={formMinOrder as any} onChange={(e) => setFormMinOrder(e.target.value === "" ? "" : Number(e.target.value))} placeholder="-- " className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Usage Limit / per person</label>
                <input type="number" value={formUsageLimit as any} onChange={(e) => setFormUsageLimit(e.target.value === "" ? "" : Number(e.target.value))} placeholder="-- " className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Start Date <span className="text-red-500">*</span></label>
                <input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Expiry Date <span className="text-red-500">*</span></label>
                <input type="date" value={formExpiryDate} onChange={(e) => setFormExpiryDate(e.target.value)} className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Applicable on <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select value={formAppliesTo} onChange={(e) => setFormAppliesTo(e.target.value)} className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white">
                    <option value="All Products">--</option>
                    {categories.map((cat) => (
                      <option key={cat._id ?? cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <button onClick={handleCreateCoupon} disabled={creatingCoupon} className="bg-green-600 text-white px-12 py-3 rounded-xl hover:bg-green-700 text-[15px] font-medium transition disabled:bg-green-300 w-full max-w-sm">
                {creatingCoupon ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* DELETE COUPON MODAL */}
      {openDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-xl font-medium text-gray-800">Delete a coupon</h3>
              <button onClick={closeDeleteModal} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="mb-4 mt-5">
              <p className="text-sm text-gray-700 mb-3">Are you sure you want to delete coupon <strong>{openDeleteCode}</strong> ?</p>
              <label htmlFor="deleteReason" className="block text-gray-700 text-sm font-medium mb-2">Reason (optional)</label>
              <textarea id="deleteReason" value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Optional reason for audit"></textarea>
            </div>
            <div className="flex justify-center">
              <button onClick={confirmDeleteCoupon} className="bg-red-600 text-white px-10 py-3 rounded-xl hover:bg-red-700 text-[15px] font-medium transition w-full max-w-xs">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}