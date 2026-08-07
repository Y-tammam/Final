"use client";

import { useState } from 'react';
import { Plus, Trash2, Save, Loader2, Layers, Upload, X, Pencil } from 'lucide-react';
import type { Category } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { uploadImageToStorage } from '@/lib/image-upload';

// نفس منطق توليد الـ slug المستخدم في نموذج المنتجات: اسم عشوائي آمن
// (حروف إنجليزية وأرقام بس) عشان مايكسرش الروابط أو يتجاوز حد العمود
// لو اسم الفئة بالعربي، بدل ما نعتمد على encodeURIComponent.
function generateSlug(nameEn: string) {
  const cleaned = nameEn
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (cleaned) return cleaned;
  return `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const [list, setList] = useState<Category[]>(initialCategories);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState({ name_ar: '', name_en: '', image_url: '' as string | null });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name_ar: string; name_en: string; image_url: string | null }>({
    name_ar: '',
    name_en: '',
    image_url: null,
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingNewImage, setUploadingNewImage] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditValues({ name_ar: cat.name_ar, name_en: cat.name_en, image_url: cat.image_url });
  };

  const cancelEdit = () => setEditingId(null);

  // برضو بترفع كملف WebP حقيقي على Supabase Storage بدل base64 (نفس
  // منطق صور المنتجات) - شوفي lib/image-upload.ts.
  const handleNewImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingNewImage(true);
    try {
      const url = await uploadImageToStorage(file, 'categories');
      setNewCat((p) => ({ ...p, image_url: url }));
    } catch (err: any) {
      toast.error(err?.message || 'تعذر رفع الصورة');
    } finally {
      setUploadingNewImage(false);
    }
  };

  const handleEditImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingEditImage(true);
    try {
      const url = await uploadImageToStorage(file, 'categories');
      setEditValues((p) => ({ ...p, image_url: url }));
    } catch (err: any) {
      toast.error(err?.message || 'تعذر رفع الصورة');
    } finally {
      setUploadingEditImage(false);
    }
  };

  const handleAdd = async () => {
    if (!newCat.name_ar.trim() || !newCat.name_en.trim()) {
      toast.error('الرجاء إدخال اسم الفئة بالعربية والإنجليزية');
      return;
    }
    setAdding(true);
    const slug = generateSlug(newCat.name_en);
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name_ar: newCat.name_ar.trim(),
        name_en: newCat.name_en.trim(),
        slug,
        image_url: newCat.image_url || null,
      })
      .select()
      .single();
    setAdding(false);
    if (error) {
      toast.error(`تعذر إضافة الفئة: ${error.message}`);
      return;
    }
    setList((prev) => [...prev, data as Category]);
    setNewCat({ name_ar: '', name_en: '', image_url: null });
    setShowAdd(false);
    toast.success('تمت إضافة الفئة بنجاح');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editValues.name_ar.trim() || !editValues.name_en.trim()) {
      toast.error('الرجاء إدخال اسم الفئة بالعربية والإنجليزية');
      return;
    }
    setSavingId(id);
    const { data, error } = await supabase
      .from('categories')
      .update({
        name_ar: editValues.name_ar.trim(),
        name_en: editValues.name_en.trim(),
        image_url: editValues.image_url || null,
      })
      .eq('id', id)
      .select()
      .single();
    setSavingId(null);
    if (error) {
      toast.error('تعذر حفظ التعديلات');
      return;
    }
    setList((prev) => prev.map((c) => (c.id === id ? (data as Category) : c)));
    setEditingId(null);
    toast.success('تم حفظ التعديلات');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكدة من حذف فئة "${name}"؟ المنتجات المرتبطة بيها هتفضل موجودة بس من غير فئة.`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      toast.error('تعذر حذف الفئة');
      return;
    }
    setList((prev) => prev.filter((c) => c.id !== id));
    toast.success('تم حذف الفئة');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">إدارة الفئات</h1>
          <p className="font-arabic text-sm text-muted-foreground mt-1">{list.length} فئة في المتجر</p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="font-arabic bg-foreground text-primary-foreground px-5 py-2.5 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          إضافة فئة
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-background border border-border rounded-sm p-5 space-y-4">
          <h2 className="font-arabic text-sm font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" strokeWidth={1.5} />
            فئة جديدة
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-arabic text-xs text-foreground/80 block mb-1.5">الاسم بالعربية *</label>
              <input
                type="text"
                value={newCat.name_ar}
                onChange={(e) => setNewCat((p) => ({ ...p, name_ar: e.target.value }))}
                placeholder="مثال: عبايات"
                className="w-full bg-background border border-border rounded-sm px-3 py-2 font-arabic text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="font-arabic text-xs text-foreground/80 block mb-1.5">الاسم بالإنجليزية *</label>
              <input
                type="text"
                value={newCat.name_en}
                onChange={(e) => setNewCat((p) => ({ ...p, name_en: e.target.value }))}
                placeholder="e.g. Abayas"
                dir="ltr"
                className="w-full bg-background border border-border rounded-sm px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="font-arabic text-xs text-foreground/80 block mb-1.5">صورة الفئة</label>
            <div className="flex items-center gap-4">
              {newCat.image_url ? (
                <div className="relative w-20 h-20 shrink-0 rounded-sm overflow-hidden border border-border">
                  <img src={newCat.image_url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setNewCat((p) => ({ ...p, image_url: null }))}
                    className="absolute top-0.5 left-0.5 bg-foreground/70 text-primary-foreground rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className={cn(
                  "w-20 h-20 shrink-0 rounded-sm border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-accent/50 transition-colors",
                  uploadingNewImage && "opacity-60 pointer-events-none"
                )}>
                  {uploadingNewImage ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /> : <Upload className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />}
                  <input type="file" accept="image/*" onChange={handleNewImage} disabled={uploadingNewImage} className="hidden" />
                </label>
              )}
              <p className="font-arabic text-xs text-muted-foreground">ارفعي صورة من جهازك، هتظهر في صفحة "تسوقي حسب الفئة" بالرئيسية</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="font-arabic bg-foreground text-primary-foreground px-5 py-2 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              حفظ الفئة
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewCat({ name_ar: '', name_en: '', image_url: null }); }}
              className="font-arabic border border-border px-5 py-2 rounded-sm text-sm hover:bg-secondary transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Categories list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {list.map((cat) => {
          const isEditing = editingId === cat.id;
          return (
            <div key={cat.id} className="bg-background border border-border rounded-sm p-4 space-y-3">
              {isEditing ? (
                <>
                  <div className="flex items-center gap-3">
                    {editValues.image_url ? (
                      <div className="relative w-16 h-16 shrink-0 rounded-sm overflow-hidden border border-border">
                        <img src={editValues.image_url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditValues((p) => ({ ...p, image_url: null }))}
                          className="absolute top-0.5 left-0.5 bg-foreground/70 text-primary-foreground rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className={cn(
                        "w-16 h-16 shrink-0 rounded-sm border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-accent/50 transition-colors",
                        uploadingEditImage && "opacity-60 pointer-events-none"
                      )}>
                        {uploadingEditImage ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" /> : <Upload className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />}
                        <input type="file" accept="image/*" onChange={handleEditImage} disabled={uploadingEditImage} className="hidden" />
                      </label>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        value={editValues.name_ar}
                        onChange={(e) => setEditValues((p) => ({ ...p, name_ar: e.target.value }))}
                        placeholder="الاسم بالعربية"
                        className="w-full bg-background border border-border rounded-sm px-2 py-1.5 font-arabic text-sm"
                      />
                      <input
                        type="text"
                        value={editValues.name_en}
                        onChange={(e) => setEditValues((p) => ({ ...p, name_en: e.target.value }))}
                        placeholder="Name (EN)"
                        dir="ltr"
                        className="w-full bg-background border border-border rounded-sm px-2 py-1.5 font-body text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(cat.id)}
                      disabled={savingId === cat.id}
                      className="flex-1 font-arabic text-xs bg-foreground text-primary-foreground px-3 py-2 rounded-sm hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {savingId === cat.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      حفظ
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 font-arabic text-xs border border-border px-3 py-2 rounded-sm hover:bg-secondary transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 shrink-0 rounded-sm overflow-hidden bg-muted border border-border">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name_ar} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Layers className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-arabic text-sm font-medium truncate">{cat.name_ar}</p>
                      <p className="font-body text-xs text-muted-foreground truncate" dir="ltr">{cat.name_en}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(cat)}
                      className="flex-1 font-arabic text-xs border border-border px-3 py-2 rounded-sm hover:bg-secondary transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name_ar)}
                      className="px-3 py-2 rounded-sm border border-border hover:bg-destructive/10 transition-colors"
                      aria-label="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" strokeWidth={1.5} />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {list.length === 0 && (
        <div className="bg-background border border-border rounded-sm py-16 text-center">
          <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
          <p className="font-arabic text-muted-foreground">لا توجد فئات بعد. أضيفي فئة جديدة بالأعلى.</p>
        </div>
      )}
    </div>
  );
}
