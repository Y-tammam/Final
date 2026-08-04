"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Search, Pencil, Trash2, X, Package, Loader2, Eye, EyeOff, Upload } from 'lucide-react';
import type { Product, Category } from '@/lib/types';
import { priceEGP } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ProductsClient({ initialProducts, categories: initialCategories }: { initialProducts: Product[]; categories: Category[] }) {
  const [list, setList] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const filtered = list.filter((p) => p.title_ar.includes(search) || p.title_en.toLowerCase().includes(search.toLowerCase()));

  const handleSave = (product: Product) => {
    setList((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = product;
        return copy;
      }
      return [product, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    setLoading(true);
    const { error } = await supabase.from('products').delete().eq('id', id);
    setLoading(false);
    if (error) {
      toast.error('تعذر حذف المنتج');
      return;
    }
    setList((prev) => prev.filter((p) => p.id !== id));
    toast.success('تم حذف المنتج');
  };

  const toggleStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'archived' : 'active';
    const { error } = await supabase.from('products').update({ status: newStatus }).eq('id', product.id);
    if (error) {
      toast.error('تعذر تحديث الحالة');
      return;
    }
    setList((prev) => prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p)));
    toast.success(newStatus === 'active' ? 'تم تفعيل المنتج' : 'تم إخفاء المنتج');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">إدارة المنتجات</h1>
          <p className="font-arabic text-sm text-muted-foreground mt-1">{list.length} منتج في المتجر</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="font-arabic bg-foreground text-primary-foreground px-5 py-2.5 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          إضافة منتج
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث عن منتج..."
          className="w-full bg-background border border-border rounded-sm pr-10 pl-4 py-2.5 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Products table */}
      <div className="bg-background border border-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr className="text-right border-b border-border">
                <th className="font-arabic font-medium text-muted-foreground py-3 px-3">المنتج</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-3 hidden md:table-cell">الفئة</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-3">السعر</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-3 hidden lg:table-cell">المخزون</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-3">الحالة</th>
                <th className="font-arabic font-medium text-muted-foreground py-3 px-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const totalStock = product.variants?.reduce((s, v) => s + v.stock_quantity, 0) ?? 0;
                return (
                  <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 shrink-0 overflow-hidden rounded-sm bg-muted">
                          {product.images[0] && (
                            <Image src={product.images[0]} alt={product.title_ar} fill sizes="48px" className="object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-arabic text-foreground truncate max-w-40">{product.title_ar}</p>
                          <p className="font-body text-xs text-muted-foreground truncate max-w-40">{product.title_en}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-arabic py-3 px-3 hidden md:table-cell text-muted-foreground">{product.category?.name_ar ?? '—'}</td>
                    <td className="py-3 px-3">
                      <span className="font-body num-rtl font-medium">{priceEGP(product.sale_price_egp ?? product.price_egp)}</span>
                      {product.sale_price_egp && (
                        <span className="font-body num-rtl text-xs text-muted-foreground line-through block">{priceEGP(product.price_egp)}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 hidden lg:table-cell">
                      <span className={cn('font-body num-rtl text-sm', totalStock <= 5 ? 'text-destructive font-bold' : totalStock <= 15 ? 'text-warning' : 'text-foreground/70')}>
                        {totalStock}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => toggleStatus(product)}
                        className={cn(
                          'font-arabic text-[11px] px-2.5 py-1 rounded-full transition-colors flex items-center gap-1',
                          product.status === 'active' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {product.status === 'active' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {product.status === 'active' ? 'نشط' : 'مخفي'}
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditing(product); setShowForm(true); }} className="p-2 hover:bg-secondary rounded-sm transition-colors" aria-label="تعديل">
                          <Pencil className="w-4 h-4 text-foreground/70" strokeWidth={1.5} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} disabled={loading} className="p-2 hover:bg-destructive/10 rounded-sm transition-colors" aria-label="حذف">
                          <Trash2 className="w-4 h-4 text-destructive" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
            <p className="font-arabic text-muted-foreground">لا توجد منتجات</p>
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editing}
          categories={categories}
          setCategories={setCategories}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ---- Product form modal ----
function ProductForm({
  product,
  categories,
  setCategories,
  onClose,
  onSave,
}: {
  product: Product | null;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  onClose: () => void;
  onSave: (p: Product) => void;
}) {
  const [form, setForm] = useState({
    title_ar: product?.title_ar ?? '',
    title_en: product?.title_en ?? '',
    slug: product?.slug ?? '',
    description_ar: product?.description_ar ?? '',
    description_en: product?.description_en ?? '',
    price_egp: product?.price_egp?.toString() ?? '',
    sale_price_egp: product?.sale_price_egp?.toString() ?? '',
    fabric_details_ar: product?.fabric_details_ar ?? '',
    category_id: product?.category_id ?? categories[0]?.id ?? '',
    is_turkish_import: product?.is_turkish_import ?? true,
    is_featured: product?.is_featured ?? false,
    status: product?.status ?? 'active',
  });
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [variants, setVariants] = useState(
    product?.variants ?? [
      { id: '', product_id: '', size: '38', color_ar: 'أسود', color_hex: '#1A1A1A', stock_quantity: 0, sku: null as string | null },
    ]
  );
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAddCategory = () => {
  if (!newCategoryName.trim()) return;
  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name_ar: newCategoryName.trim(),
    name_en: newCategoryName.trim(),
    slug: newCategoryName.trim().toLowerCase().replace(/\s+/g, '-'),
    created_at: new Date().toISOString(),
  };
  setCategories((prev) => [...prev, newCat]);
  setForm((f) => ({ ...f, category_id: newCat.id }));
  setNewCategoryName('');
  setShowAddCategoryInput(false);
  toast.success('تم إضافة الفئة');
};


  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const addVariant = () => setVariants((prev) => [...prev, { id: '', product_id: '', size: '40', color_ar: 'بيج', color_hex: '#D9C5A0', stock_quantity: 0, sku: null }]);
  const updateVariant = (idx: number, key: string, value: string | number) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [key]: value } : v)));
  };
  const removeVariant = (idx: number) => setVariants((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title_ar.trim() || !form.title_en.trim()) {
      toast.error('الرجاء إدخال اسم المنتج بالعربية والإنجليزية');
      return;
    }
    if (images.length === 0) {
      toast.error('الرجاء إضافة صورة واحدة على الأقل');
      return;
    }
    setLoading(true);

    const slug = form.slug.trim() || form.title_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const payload = {
      title_ar: form.title_ar.trim(),
      title_en: form.title_en.trim(),
      slug,
      description_ar: form.description_ar.trim() || null,
      description_en: form.description_en.trim() || null,
      price_egp: parseFloat(form.price_egp) || 0,
      sale_price_egp: form.sale_price_egp ? parseFloat(form.sale_price_egp) : null,
      fabric_details_ar: form.fabric_details_ar.trim() || null,
      category_id: form.category_id || null,
      is_turkish_import: form.is_turkish_import,
      is_featured: form.is_featured,
      status: form.status,
      images,
    };

    try {
      if (product) {
        const { data, error } = await supabase.from('products').update(payload).eq('id', product.id).select('*, category:categories(*), variants:product_variants(*)').single();
        if (error) throw error;

        // Update variants: delete old, insert new
        await supabase.from('product_variants').delete().eq('product_id', product.id);
        const variantsToInsert = variants.map((v) => ({
          product_id: product.id,
          size: v.size,
          color_ar: v.color_ar,
          color_hex: v.color_hex || null,
          stock_quantity: v.stock_quantity,
          sku: v.sku || null,
        }));
        if (variantsToInsert.length > 0) {
          const { data: newVariants } = await supabase.from('product_variants').insert(variantsToInsert).select('*');
          if (newVariants) data.variants = newVariants;
        }
        onSave(data as Product);
        toast.success('تم تحديث المنتج');
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select('*, category:categories(*)').single();
        if (error) throw data;

        const variantsToInsert = variants.map((v) => ({
          product_id: data.id,
          size: v.size,
          color_ar: v.color_ar,
          color_hex: v.color_hex || null,
          stock_quantity: v.stock_quantity,
          sku: v.sku || null,
        }));
        let newVariants = [];
        if (variantsToInsert.length > 0) {
          const vRes = await supabase.from('product_variants').insert(variantsToInsert).select('*');
          newVariants = vRes.data ?? [];
        }
        onSave({ ...data, variants: newVariants } as Product);
        toast.success('تمت إضافة المنتج');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm fade-in" onClick={onClose} />
      <div className="relative bg-background rounded-sm shadow-2xl max-w-3xl w-full p-6 sm:p-8 my-8 scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold">{product ? 'تعديل منتج' : 'إضافة منتج جديد'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-sm" aria-label="إغلاق">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-arabic text-sm text-foreground/80 block mb-1.5">الاسم بالعربية *</label>
              <input type="text" value={form.title_ar} onChange={(e) => update('title_ar', e.target.value)} className="w-full bg-background border border-border rounded-sm px-3 py-2 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="font-arabic text-sm text-foreground/80 block mb-1.5">الاسم بالإنجليزية *</label>
              <input type="text" value={form.title_en} onChange={(e) => update('title_en', e.target.value)} className="w-full bg-background border border-border rounded-sm px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-ring" dir="ltr" />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-arabic text-sm text-foreground/80 block mb-1.5">الوصف بالعربية</label>
              <textarea value={form.description_ar} onChange={(e) => update('description_ar', e.target.value)} rows={3} className="w-full bg-background border border-border rounded-sm px-3 py-2 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            </div>
            <div>
              <label className="font-arabic text-sm text-foreground/80 block mb-1.5">الوصف بالإنجليزية</label>
              <textarea value={form.description_en} onChange={(e) => update('description_en', e.target.value)} rows={3} className="w-full bg-background border border-border rounded-sm px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" dir="ltr" />
            </div>
          </div>

          {/* Price + fabric + category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-arabic text-sm text-foreground/80 block mb-1.5">السعر (ج.م) *</label>
              <input type="number" step="0.01" value={form.price_egp} onChange={(e) => update('price_egp', e.target.value)} className="w-full bg-background border border-border rounded-sm px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-ring num-rtl" dir="ltr" />
            </div>
            <div>
              <label className="font-arabic text-sm text-foreground/80 block mb-1.5">سعر العرض</label>
              <input type="number" step="0.01" value={form.sale_price_egp} onChange={(e) => update('sale_price_egp', e.target.value)} className="w-full bg-background border border-border rounded-sm px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-ring num-rtl" dir="ltr" />
            </div>
            <div>
              <label className="font-arabic text-sm text-foreground/80 block mb-1.5">الفئة</label>
              {!showAddCategoryInput ? (
                <div className="flex gap-1.5">
                  <select value={form.category_id} onChange={(e) => update('category_id', e.target.value)} className="w-full bg-background border border-border rounded-sm px-3 py-2 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name_ar}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowAddCategoryInput(true)} className="bg-secondary p-2 rounded-sm text-sm hover:bg-accent/20 transition-colors shrink-0" title="إضافة فئة">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="اسم الفئة الجديدة" className="w-full bg-background border border-border rounded-sm px-2 py-1 font-arabic text-xs" />
                  <button type="button" onClick={handleAddCategory} className="bg-foreground text-primary-foreground px-2 py-1 rounded-sm text-xs font-arabic">حفظ</button>
                  <button type="button" onClick={() => setShowAddCategoryInput(false)} className="bg-secondary px-2 py-1 rounded-sm text-xs font-arabic">إلغاء</button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-arabic text-sm text-foreground/80 block mb-1.5">تفاصيل الخامة</label>
              <input type="text" value={form.fabric_details_ar} onChange={(e) => update('fabric_details_ar', e.target.value)} className="w-full bg-background border border-border rounded-sm px-3 py-2 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="مثال: كريب تركي 100%" />
            </div>
            <div className="flex items-end gap-4 pb-1">
              <label className="flex items-center gap-2 font-arabic text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_turkish_import} onChange={(e) => update('is_turkish_import', e.target.checked)} className="accent-accent" />
                تركي 100%
              </label>
              <label className="flex items-center gap-2 font-arabic text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => update('is_featured', e.target.checked)} className="accent-accent" />
                مميز
              </label>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="font-arabic text-sm text-foreground/80 block mb-2">صور المنتج</label>
            <div className="flex gap-2 mb-3">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="رابط الصورة (URL)..."
                className="flex-1 bg-background border border-border rounded-sm px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                dir="ltr"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }}
              />
              <button type="button" onClick={addImage} className="font-arabic bg-secondary px-3 py-2 rounded-sm text-sm hover:bg-accent/20 transition-colors">إضافة URL</button>
              
              <label className="font-arabic bg-foreground text-primary-foreground px-3 py-2 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground transition-all flex items-center gap-1.5 cursor-pointer shrink-0">
                <Upload className="w-4 h-4" />
                رفع صورة
                <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-sm overflow-hidden bg-muted group">
                  <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 left-1 w-5 h-5 bg-foreground/70 text-primary-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Variants matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-arabic text-sm text-foreground/80">المقاسات والألوان والمخزون</label>
              <button type="button" onClick={addVariant} className="font-arabic text-xs text-accent hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                إضافة خيار
              </button>
            </div>
            <div className="space-y-2">
              {variants.map((v, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-secondary/30 p-2 rounded-sm">
                  <input type="text" value={v.size} onChange={(e) => updateVariant(idx, 'size', e.target.value)} placeholder="مقاس" className="col-span-2 bg-background border border-border rounded-sm px-2 py-1.5 font-body text-sm text-center" />
                  <input type="text" value={v.color_ar} onChange={(e) => updateVariant(idx, 'color_ar', e.target.value)} placeholder="لون" className="col-span-3 bg-background border border-border rounded-sm px-2 py-1.5 font-arabic text-sm" />
                  <input type="color" value={v.color_hex ?? '#000000'} onChange={(e) => updateVariant(idx, 'color_hex', e.target.value)} className="col-span-2 h-8 w-full rounded-sm border border-border bg-background cursor-pointer" />
                  <input type="number" value={v.stock_quantity} onChange={(e) => updateVariant(idx, 'stock_quantity', parseInt(e.target.value) || 0)} placeholder="مخزون" className="col-span-3 bg-background border border-border rounded-sm px-2 py-1.5 font-body text-sm text-center num-rtl" dir="ltr" />
                  <button type="button" onClick={() => removeVariant(idx)} className="col-span-2 p-1.5 hover:bg-destructive/10 rounded-sm flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-destructive" strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2 sticky bottom-0 bg-background py-3">
            <button type="submit" disabled={loading} className="flex-1 bg-foreground text-primary-foreground font-arabic py-3 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : product ? 'حفظ التعديلات' : 'إضافة المنتج'}
            </button>
            <button type="button" onClick={onClose} className="font-arabic border border-border px-6 py-3 rounded-sm hover:bg-secondary transition-all">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
