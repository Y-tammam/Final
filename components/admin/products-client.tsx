"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { priceEGP } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductFormModal } from "./ProductFormModal";

interface Category {
  id: string;
  name: string;
}

interface ProductsClientProps {
  initialProducts?: Product[];
  categories?: { id: string; name_ar: string; slug: string }[];
}

export function ProductsClient({ initialProducts = [], categories = [] }: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // حالة التحكم في النافذة (Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [existingCategories, setExistingCategories] = useState<Category[]>(
    categories.map((c) => ({ id: c.id, name: c.name_ar }))
  );

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

  // إضافة قسم جديد من المودال
  const handleAddCategory = (newCategoryName: string) => {
    const newCat = {
      id: `cat-${Date.now()}`,
      name: newCategoryName,
    };
    setExistingCategories((prev) => [...prev, newCat]);
  };

  // عند تقديم النموذج وإضافة منتج
  const handleAddProductSubmit = (data: {
    title: string;
    price: number;
    stock: number;
    category: string;
    image: string;
  }) => {
    const newProduct = {
      id: Date.now().toString(),
      title_ar: data.title,
      price_egp: data.price,
      images: [data.image],
    } as unknown as Product;

    setProducts((prev) => [newProduct, ...prev]);
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

        {/* زر الفتح الشغال ✅ */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm font-medium w-fit cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          إضافة منتج جديد
        </button>
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
                      onClick={() => setIsModalOpen(true)}
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

      {/* النافذة الشغالة ✅ */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddProductSubmit}
        existingCategories={existingCategories}
        onAddCategory={handleAddCategory}
      />
    </div>
  );
}
