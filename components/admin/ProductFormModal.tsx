import React, { useState } from 'react';
import { toast } from 'react-hot-toast'; // أو المكتبة اللي بتستخدمها

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

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingCategories,
  onAddCategory,
}) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');
  
  // حالة إضافة قسم جديد
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  if (!isOpen) return null;

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('يرجى إدخال اسم القسم');
      return;
    }
    onAddCategory(newCategoryName);
    setCategory(newCategoryName);
    setNewCategoryName('');
    setIsAddingCategory(false);
    toast.success('تم إضافة القسم بنجاح');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !category) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    onSubmit({
      title,
      price: Number(price),
      stock: Number(stock) || 0,
      category,
      image: image || 'https://via.placeholder.com/150', // صورة افتراضية
    });

    toast.success('تمت إضافة المنتج بنجاح!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 dir-rtl">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-gray-800">إضافة منتج جديد</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* اسم المنتج */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg p-2.5 outline-none focus:border-black"
              placeholder="مثال: حشيشه ملوكي"
              required
            />
          </div>

          {/* القسم */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القسم *</label>
            {!isAddingCategory ? (
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border rounded-lg p-2.5 outline-none focus:border-black"
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
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm whitespace-nowrap"
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
                  className="w-full border rounded-lg p-2.5 outline-none focus:border-black"
                  placeholder="اسم القسم الجديد..."
                />
                <button
                  type="button"
                  onClick={handleAddNewCategory}
                  className="bg-black text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>

          {/* السعر والمخزون */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر (ج.م) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full border rounded-lg p-2.5 outline-none focus:border-black"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المخزون</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full border rounded-lg p-2.5 outline-none focus:border-black"
                placeholder="0"
              />
            </div>
          </div>

          {/* رابط الصورة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رابط الصورة (URL)</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full border rounded-lg p-2.5 outline-none focus:border-black"
              placeholder="https://..."
            />
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              إضافة المنتج
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
