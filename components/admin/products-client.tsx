"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
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
        .update(payload)
        .eq("id", editingProduct.id)
        .select()
        .single();

      setSubmitting(false);

      if (error) {
        toast.error("حدث خطأ أثناء التعديل: " + error.message);
        return;
      }

      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? data : p)));
      toast.success("تم تعديل المنتج بنجاح");
    } else {
      // إضافة جديد
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();

      setSubmitting(false);

      if (error) {
        toast.error("حدث خطأ أثناء الإضافة: " + error.message);
        return;
      }

      setProducts((prev) => [data, ...prev]);
      toast.success("تم إضافة المنتج بنجاح");
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 font-arabic" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">إدارة المنتجات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            عرض وتعديل وإضافة منتجات المتجر
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-primary text-primary-foreground px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm font-medium w-fit"
        >
          <Plus className="w-4 h-4" />
          إضافة منتج جديد
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="البحث عن منتج..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-4 pr-10 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Products Table/List */}
      <div className="bg-background border border-border rounded-md overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            لا توجد منتجات مطابقة للبحث
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredProducts.map((product) => {
              const effectivePrice = product.sale_price_egp ?? product.price_egp;
              const totalStock = product.variants?.reduce((s, v) => s + v.stock_quantity, 0) ?? 0;
              return (
                <div
                  key={product.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-secondary/10 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title_ar}
                        className="w-12 h-12 object-cover rounded-md border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center shrink-0">
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{product.title_ar}</h3>
                      <p className="text-xs text-muted-foreground">
                        {priceEGP(effectivePrice)} ج.م
                        {totalStock === 0 && <span className="text-destructive mr-2">• نفد المخزون</span>}
                        {totalStock > 0 && totalStock <= 5 && <span className="text-warning mr-2">• مخزون منخفض</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground"
                      aria-label="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={deleting === product.id}
                      className="p-2 hover:bg-destructive/10 rounded-md text-destructive disabled:opacity-50"
                      aria-label="حذف"
                    >
                      {deleting === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🟢 MODAL: إضافة / تعديل منتج */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="text-lg font-bold">
                {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              {/* اسم المنتج */}
              <div>
                <label className="block text-xs font-semibold mb-1">عنوان المنتج (عربي) *</label>
                <input
                  type="text"
                  required
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="مثال: قميص أبيض كلاسيك"
                />
              </div>

              {/* اختيار / إضافة القسم */}
              <div>
                <label className="block text-xs font-semibold mb-1">القسم</label>
                {!isAddingCategory ? (
                  <div className="flex gap-2">
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">-- اختر القسم --</option>
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name_ar}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="px-3 py-2 bg-secondary text-secondary-foreground text-xs font-medium rounded-md hover:bg-secondary/80 shrink-0"
                    >
                      + قسم جديد
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="اسم القسم الجديد..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button
                      type="button"
                      disabled={addingCatLoading}
                      onClick={handleCreateCategory}
                      className="px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:opacity-90 shrink-0 flex items-center gap-1"
                    >
                      {addingCatLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "حفظ"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(false)}
                      className="px-3 py-2 bg-secondary text-secondary-foreground text-xs font-medium rounded-md shrink-0"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>

              {/* السعر وسعر الخصم */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">السعر (ج.م) *</label>
                  <input
                    type="number"
                    required
                    value={priceEgp}
                    onChange={(e) => setPriceEgp(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">سعر الخصم (اختياري)</label>
                  <input
                    type="number"
                    value={salePriceEgp}
                    onChange={(e) => setSalePriceEgp(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* رابط الصورة */}
              <div>
                <label className="block text-xs font-semibold mb-1">رابط الصورة (URL)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* الأزرار بالأسفل */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-md text-xs font-medium hover:bg-secondary"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingProduct ? "حفظ التعديلات" : "إضافة المنتج"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
