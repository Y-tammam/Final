"use client";

import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
}

interface ProductFormData {
  title: string;
  price: number;
  stock: number;
  category: string;
  image: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  existingCategories: Category[];
  onAddCategory: (newCategoryName: string) => void;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  existingCategories,
  onAddCategory,
}: ProductFormModalProps) {
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  if (!isOpen) return null;

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى إدخال اسم القسم",
      });
      return;
    }
    onAddCategory(newCategoryName);
    setCategory(newCategoryName);
    setNewCategoryName('');
    setIsAddingCategory(false);
    toast({
      title: "نجاح",
      description: "تم إضافة القسم بنجاح",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !category) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
      });
      return;
    }

    onSubmit({
      title,
      price: Number(price),
      stock: Number(stock) || 0,
      category,
      image: image || 'https://via.placeholder.com/150',
    });

    toast({
      title: "تم الإجراء بنجاح",
      description: "تمت إضافة المنتج بنجاح!",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-arabic" dir="rtl">
      <div className="bg-background border border-border rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <h2 className="text-xl font-bold text-foreground">إضافة منتج جديد</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">اسم المنتج *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-ring text-sm"
              placeholder="مثال: قميص أبيض"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">القسم *</label>
            {!isAddingCategory ? (
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-ring text-sm"
                  required
                >
                  <option value="">اختر القسم...</option>
                  {existingCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-2 rounded-lg text-sm whitespace-nowrap"
                >
                  + قسم جديد
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-ring text-sm"
                  placeholder="اسم القسم الجديد..."
                />
                <button
                  type="button"
                  onClick={handleAddNewCategory}
                  className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm whitespace-nowrap"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="bg-secondary text-secondary-foreground px-3 py-2 rounded-lg text-sm"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">السعر (ج.م) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-ring text-sm"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المخزون</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-ring text-sm"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">رابط الصورة (URL)</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-ring text-sm"
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-secondary text-sm"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm font-medium"
            >
              إضافة المنتج
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
