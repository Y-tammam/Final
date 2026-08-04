"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name_ar?: string;
  name?: string;
  price: number;
  category?: string;
  images?: string[];
}

interface ProductsClientProps {
  initialProducts?: Product[];
  categories?: Category[];
}

export function ProductsClient({
  initialProducts = [],
  categories: initialCategories = [
    { id: "1", name: "ملابس رجالي" },
    { id: "2", name: "ملابس حريمي" },
  ],
}: ProductsClientProps) {
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categoriesList, setCategoriesList] = useState<Category[]>(initialCategories);
  const [search, setSearch] = useState("");

  // حالات المودال (Modal) والنموذج
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // حالات بيانات المدخلات (Form)
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // حالة إضافة قسم جديد
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // تصفية المنتجات بحسب البحث
  const filteredProducts = products.filter((p) =>
    (p.name_ar || p.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // فتح المودال للإضافة
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setProductName("");
    setPrice("");
    setCategory("");
    setImageUrl("");
    setIsAddingCategory(false);
    setIsModalOpen(true);
  };

  // فتح المودال للتعديل
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name_ar || product.name || "");
    setPrice(product.price);
    setCategory(product.category || "");
    setImageUrl(product.images?.[0] || "");
    setIsAddingCategory(false);
    setIsModalOpen(true);
  };

  // حذف منتج
  const handleDelete = (id: string, name: string) => {
    if (confirm(`هل أنت تأكد من حذف "${name}"؟`)) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: "تم الحذف",
        description: "تم حذف المنتج بنجاح",
      });
    }
  };

  // إضافة قسم جديد
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        variant: "destructive",
        title: "تنبيه",
        description: "يرجى كتابة اسم القسم",
      });
      return;
    }

    const newCat: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
    };

    setCategoriesList((prev) => [...prev, newCat]);
    setCategory(newCat.name);
    setNewCategoryName("");
    setIsAddingCategory(false);

    toast({
      title: "تمت إضافة القسم",
      description: `تم إضافة قسم "${newCat.name}" بنجاح`,
    });
  };

  // حفظ المنتج (إضافة / تعديل)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName || !price || !category) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة (الاسم، السعر، القسم)",
      });
      return;
    }

    if (editingProduct) {
      // تعديل منتج قائم
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name_ar: productName,
                name: productName,
                price: Number(price),
                category,
                images: imageUrl ? [imageUrl] : p.images,
              }
            : p
        )
      );
      toast({
        title: "تم التعديل",
        description: "تم تحديث بيانات المنتج بنجاح",
      });
    } else {
      // إضافة منتج جديد
      const newProduct: Product = {
        id: Date.now().toString(),
        name_ar: productName,
        name: productName,
        price: Number(price),
        category,
        images: imageUrl ? [imageUrl] : [],
      };
      setProducts((prev) => [newProduct, ...prev]);
      toast({
        title: "تمت الإضافة",
        description: "تم إضافة المنتج الجديد بنجاح",
      });
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

      {/* شريط البحث */}
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
              const displayName = product.name_ar || product.name || "منتج بدون اسم";
              return (
                <div
                  key={product.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-secondary/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={displayName}
                        className="w-12 h-12 object-cover rounded-md border border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-sm">{displayName}</h3>
                      <p className="text-xs text-muted-foreground">
                        {product.price} ج.م {product.category && `• ${product.category}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(product)}
                      className="p-2 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, displayName)}
                      className="p-2 hover:bg-destructive/10 rounded-md text-destructive transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🟢 المودال (نافذة إضافة / تعديل منتج) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            {/* عنوان المودال ورر الإغلاق */}
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
              {/* اسم المنتج */}
              <div>
                <label className="block text-xs font-semibold mb-1">اسم المنتج *</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="مثال: قميص أبيض كلاسيك"
                />
              </div>

              {/* اختيار القسم + إضافة قسم جديد */}
              <div>
                <label className="block text-xs font-semibold mb-1">القسم *</label>
                {!isAddingCategory ? (
                  <div className="flex gap-2">
                    <select
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">-- اختر القسم --</option>
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
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

              {/* السعر */}
              <div>
                <label className="block text-xs font-semibold mb-1">السعر (ج.م) *</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="0"
                />
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

              {/* أزرار الإجراءات */}
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
