"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, Loader2, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { priceEGP } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useRouter } from "next/navigation"; // تأكد من استيراد useRouter في الأعلى

export function ProductsClient({ initialProducts = [], categories = [] }: ProductsClientProps) {
  const router = useRouter(); // 👈 إضافة الـ router
  const [products, setProducts] = useState<Product[]>(initialProducts);
  // ... باقي الكود كالمعتاد

interface ProductsClientProps {
  initialProducts?: Product[];
  categories?: { id: string; name_ar: string; slug: string }[];
}

  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // --- الإضافة 1: إضافة قسم جديد ---
  const [categoriesList, setCategoriesList] = useState(categories);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // --- الإضافة 2: رفع الصور ---
  const [showImageModal, setShowImageModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const filteredProducts = products.filter((p) =>
    (p.title_ar || "").toLowerCase().includes(search.toLowerCase())
  );

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

  // دالة إضافة قسم جديد
  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      toast.error("يرجى إدخال اسم القسم");
      return;
    }
    const createdCat = {
      id: `cat-${Date.now()}`,
      name_ar: newCatName.trim(),
      slug: newCatName.trim().toLowerCase().replace(/\s+/g, "-"),
    };
    setCategoriesList((prev) => [...prev, createdCat]);
    toast.success(`تمت إضافة قسم "${createdCat.name_ar}" بنجاح`);
    setNewCatName("");
    setShowCategoryModal(false);
  };

  // دالة اختيار صورة من الجهاز
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setUploadedImage(reader.result);
        toast.success("تم تحميل الصورة بنجاح");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 font-arabic" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">إدارة المنتجات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            عرض وتعديل وإضافة منتجات المتجر
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* زر إضافة قسم جديد */}
          <button
            onClick={() => setShowCategoryModal(true)}
            className="bg-secondary text-secondary-foreground px-3 py-2.5 rounded-md hover:bg-secondary/80 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            إضافة قسم
          </button>

          {/* زر رفع صورة */}
          <button
            onClick={() => setShowImageModal(true)}
            className="bg-secondary text-secondary-foreground px-3 py-2.5 rounded-md hover:bg-secondary/80 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            رفع صورة
          </button>

          <button
            onClick={() => toast.info("استخدم زر الإضافة لمتابعة العمل")}
            className="bg-primary text-primary-foreground px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm font-medium w-fit"
          >
            <Plus className="w-4 h-4" />
            إضافة منتج جديد
          </button>
        </div>
      </div>

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
                      onClick={() => toast.info("تعديل المنتج قريباً")}
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

      {/* 🔴 مودال إضافة قسم جديد */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg max-w-sm w-full p-5 space-y-4 relative">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-bold">إضافة قسم / صنف جديد</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">اسم القسم (عربي)</label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="مثال: عبايات استقبال"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-3 py-1.5 border border-border rounded-md text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddCategory}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium"
              >
                إضافة القسم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 مودال رفع الصور */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg max-w-sm w-full p-5 space-y-4 relative">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-bold">رفع صورة جديدة</h3>
              <button onClick={() => setShowImageModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="cursor-pointer border-2 border-dashed border-border hover:border-primary rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors block">
                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground">اضغط لاختيار صورة من جهازك</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              {uploadedImage && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">معاينة الصورة:</p>
                  <img src={uploadedImage} alt="Uploaded" className="w-20 h-20 object-cover rounded border border-border mx-auto" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setUploadedImage(null);
                }}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
