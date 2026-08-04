"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { priceEGP } from "@/lib/format";
import type { Product } from "@/lib/types";

interface CategoryItem {
  id: string;
  name_ar: string;
  slug?: string;
}

interface ProductsClientProps {
  initialProducts?: Product[];
  categories?: CategoryItem[];
}

export function ProductsClient({ initialProducts = [], categories: initialCategories = [] }: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // حالات نافذة الإضافة والتعديل
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // حقول نموذج المنتج
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [slug, setSlug] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [fabricDetails, setFabricDetails] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priceEgp, setPriceEgp] = useState("");
  const [salePriceEgp, setSalePriceEgp] = useState("");
  const [images, setImages] = useState<string[]>([""]);
  const [isFeatured, setIsFeatured] = useState(false);

  // حالة إضافة قسم جديد داخل المودال
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // تصفية المنتجات حسب البحث
  const filteredProducts = products.filter((p) =>
    (p.title_ar || "").toLowerCase().includes(search.toLowerCase())
  );

  // فتح مودال الإضافة
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setTitleAr("");
    setTitleEn("");
    setSlug("");
    setDescriptionAr("");
    setFabricDetails("");
    setCategoryId("");
    setPriceEgp("");
    setSalePriceEgp("");
    setImages([""]);
    setIsFeatured(false);
    setIsAddingCategory(false);
    setIsModalOpen(true);
  };

  // فتح مودال التعديل
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setTitleAr(product.title_ar || "");
    setTitleEn(product.title_en || "");
    setSlug(product.slug || "");
    setDescriptionAr(product.description_ar || "");
    setFabricDetails(product.fabric_details_ar || "");
    setCategoryId(product.category_id || "");
    setPriceEgp(product.price_egp?.toString() || "");
    setSalePriceEgp(product.sale_price_egp?.toString() || "");
    setImages(product.images && product.images.length > 0 ? product.images : [""]);
    setIsFeatured(!!product.is_featured);
    setIsAddingCategory(false);
    setIsModalOpen(true);
  };

  // حذف المنتج
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

  // إضافة قسم جديد فوري
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error("يرجى إدخال اسم القسم");
      return;
    }
    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      name_ar: newCategoryName.trim(),
    };
    setCategoriesList((prev) => [...prev, newCat]);
    setCategoryId(newCat.id);
    setNewCategoryName("");
    setIsAddingCategory(false);
    toast.success(`تم إضافة قسم "${newCat.name_ar}"`);
  };

  // رفع صورة من الجهاز
  const handleFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        const newImages = [...images];
        newImages[index] = reader.result;
        setImages(newImages);
      }
    };
    reader.readAsDataURL(file);
  };

  // حفظ المنتج (إضافة / تعديل)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleAr || !priceEgp) {
      toast.error("يرجى ملء الحقول المطلوبة (اسم المنتج والسعر)");
      return;
    }

    const cleanedImages = images.filter((img) => img.trim() !== "");

    const payload = {
      title_ar: titleAr,
      title_en: titleEn || titleAr,
      slug: slug || titleAr.toLowerCase().replace(/\s+/g, "-"),
      description_ar: descriptionAr || null,
      price_egp: parseFloat(priceEgp),
      sale_price_egp: salePriceEgp ? parseFloat(salePriceEgp) : null,
      fabric_details_ar: fabricDetails || null,
      category_id: categoryId || null,
      images: cleanedImages,
      is_featured: isFeatured,
    };

    if (editingProduct) {
      const updatedProduct = {
        ...editingProduct,
        ...payload,
      } as unknown as Product;

      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? updatedProduct : p))
      );
      toast.success("تم تحديث المنتج بنجاح");
    } else {
      const newProduct = {
        id: Date.now().toString(),
        ...payload,
      } as unknown as Product;

      setProducts((prev) => [newProduct, ...prev]);
      toast.success("تمت إضافة المنتج بنجاح");
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 font-arabic" dir="rtl">
      {/* الهيدر وزر الإضافة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">إدارة المنتجات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            عرض وتعديل وإضافة منتجات المتجر
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-primary text-primary-foreground px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm font-medium w-fit"
        >
          <Plus className="w-4 h-4" />
          إضافة منتج جديد
        </button>
      </div>

      {/* البحث */}
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

      {/* قائمة المنتجات */}
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
                      onClick={() => handleOpenEdit(product)}
                      className="p-2 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={deleting === product.id}
                      className="p-2 hover:bg-destructive/10 rounded-md text-destructive disabled:opacity-50 transition-colors"
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

      {/* نافذة الإضافة والتعديل الشاملة (Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg max-w-lg w-full p-6 shadow-lg space-y-4 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="text-base font-bold">
                {editingProduct ? "تعديل بيانات المنتج" : "إضافة منتج جديد"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* اسم المنتج بالعربي والإنجليزي */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">اسم المنتج (عربي) *</label>
                  <input
                    type="text"
                    required
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="عباية حرير"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">اسم المنتج (English)</label>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring text-left"
                    dir="ltr"
                    placeholder="Silk Abaya"
                  />
                </div>
              </div>

              {/* الرابط slug */}
              <div>
                <label className="block text-xs font-semibold mb-1">الرابط (Slug)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring text-left"
                  dir="ltr"
                  placeholder="silk-abaya-1"
                />
              </div>

              {/* القسم واختيار قسم جديد */}
              <div>
                <label className="block text-xs font-semibold mb-1">القسم / الصنف</label>
                {!isAddingCategory ? (
                  <div className="flex gap-2">
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">-- اختر القسم --</option>
                      {categoriesList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name_ar}
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
                      onClick={handleAddCategory}
                      className="px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:opacity-90 shrink-0"
                    >
                      حفظ
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

              {/* السعر وتخفيض السعر */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">السعر (ج.م) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={priceEgp}
                    onChange={(e) => setPriceEgp(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">سعر التخفيض (اختياري)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={salePriceEgp}
                    onChange={(e) => setSalePriceEgp(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* الخامة والوصف */}
              <div>
                <label className="block text-xs font-semibold mb-1">الخامة</label>
                <input
                  type="text"
                  value={fabricDetails}
                  onChange={(e) => setFabricDetails(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="حرير تركي 100%"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">الوصف</label>
                <textarea
                  rows={2}
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  placeholder="وصف التفاصيل والخامة..."
                />
              </div>

              {/* الصور: إمكانية الرفع المباشر أو كتابة URL */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold">صور المنتج</label>
                {images.map((img, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={img}
                        onChange={(e) => {
                          const newImgs = [...images];
                          newImgs[i] = e.target.value;
                          setImages(newImgs);
                        }}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-ring text-left"
                        dir="ltr"
                        placeholder="رابط الصورة أو اختر ملف..."
                      />
                      <label className="cursor-pointer bg-secondary text-secondary-foreground text-xs px-3 py-2 rounded-md hover:bg-secondary/80 shrink-0 flex items-center gap-1 font-medium">
                        📁 رفع صورة
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(i, e)}
                        />
                      </label>
                      {images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                          className="text-destructive text-xs px-2 shrink-0"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                    {img && (
                      <div className="w-12 h-12 rounded border border-border overflow-hidden bg-muted mt-1">
                        <img src={img} alt="preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setImages([...images, ""])}
                  className="text-xs text-primary hover:underline font-medium block pt-1"
                >
                  + إضافة صورة أخرى
                </button>
              </div>

              {/* خيار منتج مميز */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-border w-4 h-4 text-primary focus:ring-primary"
                  />
                  منتج مميز (يظهر في الصفحة الرئيسية) ⭐
                </label>
              </div>

              {/* أزرار الحفظ والإلغاء */}
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-md text-xs font-medium hover:bg-secondary"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90"
                >
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
