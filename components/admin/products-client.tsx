"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { priceEGP } from "@/lib/format";
import type { Product } from "@/lib/types";

interface Category {
  id: string;
  name_ar: string;
  slug: string;
}

interface ProductsClientProps {
  initialProducts?: Product[];
  categories?: Category[];
}

export function ProductsClient({
  initialProducts = [],
  categories: initialCategories = [],
}: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categoriesList, setCategoriesList] = useState<Category[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // حالات التحكم في المودال (إضافة / تعديل)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // بيانات الفورم
  const [titleAr, setTitleAr] = useState("");
  const [priceEgp, setPriceEgp] = useState<number | "">("");
  const [salePriceEgp, setSalePriceEgp] = useState<number | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // حالات إضافة قسم جديد داخل الفورم
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCatLoading, setAddingCatLoading] = useState(false);

  const filteredProducts = products.filter((p) =>
    (p.title_ar || "").toLowerCase().includes(search.toLowerCase())
  );

  // فتح مودال للإضافة
  const openAddModal = () => {
    setEditingProduct(null);
    setTitleAr("");
    setPriceEgp("");
    setSalePriceEgp("");
    setCategoryId("");
    setImageUrl("");
    setIsModalOpen(true);
  };

  // فتح مودال للتعديل
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setTitleAr(product.title_ar || "");
    setPriceEgp(product.price_egp || "");
    setSalePriceEgp(product.sale_price_egp || "");
    setCategoryId((product as any).category_id || "");
    setImageUrl(product.images?.[0] || "");
    setIsModalOpen(true);
  };

  // حذف منتج
  const handleDelete = async (product: Product) => {
    if (!confirm(`حذف "${product.title_ar}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    setDeleting(product.id);
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    setDeleting(null);
    if (error) {
      toast.error("تعذر حذف المنتج");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    toast.success("تم حذف المنتج");
  };

  // إضافة قسم جديد سريعة بداخل قاعدة البيانات
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("يرجى إدخال اسم القسم");
      return;
    }
    setAddingCatLoading(true);

    const slug = newCategoryName.trim().toLowerCase().replace(/\s+/g, "-");
    const { data, error } = await supabase
      .from("categories")
      .insert({ name_ar: newCategoryName.trim(), slug })
      .select()
      .single();

    setAddingCatLoading(false);

    if (error) {
      toast.error("فشل إدخال القسم الجديد: " + error.message);
      return;
    }

    setCategoriesList((prev) => [...prev, data]);
    setCategoryId(data.id);
    setNewCategoryName("");
    setIsAddingCategory(false);
    toast.success("تمت إضافة القسم بنجاح");
  };

  // حفظ المنتج (إضافة أو تعديل)
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr || !priceEgp) {
      toast.error("يرجى إكمال البيانات الأساسية (الاسم والسعر)");
      return;
    }

    setSubmitting(true);
    const payload = {
      title_ar: titleAr,
      price_egp: Number(priceEgp),
      sale_price_egp: salePriceEgp ? Number(salePriceEgp) : null,
      category_id: categoryId || null,
      images: imageUrl ? [imageUrl] : [],
    };

    if (editingProduct) {
      // تعديل
      const { data, error } = await supabase
        .from("products")
        .update(
