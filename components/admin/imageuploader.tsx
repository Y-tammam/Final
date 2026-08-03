'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
}

export default function ImageUploader({ onImageUploaded }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const files = event.target.files;
      if (!files || files.length === 0) return;

      // رفع كل الملفات المختارة (سواء صورة واحدة أو عدة صور)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        // إرسال الرابط مباشرة لـ State الرئيسية في صفحة المنتج
        onImageUploaded(data.publicUrl);
      }
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء رفع الصور');
    } finally {
      setUploading(false);
      // تصفير الـ input لتستطيع الرفع مرة أخرى فوراً
      event.target.value = '';
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer my-2">
      <label className="cursor-pointer flex flex-col items-center justify-center gap-1 w-full h-full">
        <span className="text-xl">📸</span>
        <span className="text-sm font-medium text-gray-700">
          {uploading ? '⏳ جاري رفع الصورة...' : 'اضغط هنا لرفع صور للمنتج'}
        </span>
        <span className="text-xs text-gray-400">يمكنك رفع صورة واحدة أو عدة صور وراء بعضها</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  );
}
