"use client";

import { supabase } from './supabase';

/*
لماذا الملف ده موجود؟
====================
قبل كده كل صورة بترفع من لوحة التحكم (صور المنتجات، صور الفئات) كانت
بتتحول لـ base64 (نص ضخم جداً) وتتخزن كدة كامل جوه عمود في قاعدة
البيانات. ده كان السبب الرئيسي في تدهور الأداء (PageSpeed 55-60 وLCP
بيوصل لـ 23 ثانية على الموبايل): كل صفحة فيها منتجات كانت بتجيب كل
البيانات دي (JSON ضخم فيه صور base64) قبل ما تعرض أي حاجة، من غير أي
استفادة من كاش المتصفح أو CDN.

الحل هنا:
1. نحول الصورة في المتصفح لصيغة WebP (أخف بكتير من JPEG/PNG) وبنقلل
   حجمها (أقصى بعد 1600px) قبل الرفع - fileToWebP().
2. برفعها كملف حقيقي في Supabase Storage (bucket اسمه store-images)
   ونرجع رابط عام (public URL) قصير بدل النص الضخم - uploadImageToStorage().
   الرابط ده بيتخزن في قاعدة البيانات بدل الـ base64، والمتصفح بيقدر
   يكاش الصورة عادي زي أي صورة على الإنترنت.
3. عشان الكود ده يشتغل، لازم تشغّلي ملف الهجرة (migration)
   supabase/migrations/20260807000000_storage_and_rls_hardening.sql
   في Supabase SQL Editor - هو اللي بيعمل الـ bucket ويدي صلاحية
   الرفع للأدمن بس (باستخدام نفس دالة is_admin() الموجودة).
*/

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.82;

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('تعذرت قراءة ملف الصورة'));
    };
    img.src = url;
  });
}

/** يحول أي صورة (jpg/png/heic..) لـ WebP مضغوط، مع تصغير الأبعاد لو كانت كبيرة جداً. */
export async function fileToWebP(
  file: File,
  maxDimension: number = DEFAULT_MAX_DIMENSION,
  quality: number = DEFAULT_QUALITY
): Promise<Blob> {
  const img = await loadImageElement(file);
  let width = img.naturalWidth;
  let height = img.naturalHeight;

  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(img.src);
    throw new Error('تعذر تجهيز الصورة (Canvas غير مدعوم)');
  }
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(img.src);

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (!blob) throw new Error('تعذر تحويل الصورة لصيغة WebP');
  return blob;
}

/**
 * يحول الصورة لـ WebP ويرفعها في bucket "store-images" على Supabase Storage،
 * ويرجع الرابط العام (public URL) الجاهز للتخزين في قاعدة البيانات.
 * folder: مجلد منطقي داخل الـ bucket (products أو categories) للتنظيم بس.
 */
export async function uploadImageToStorage(
  file: File,
  folder: 'products' | 'categories'
): Promise<string> {
  const webp = await fileToWebP(file);
  const path = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.webp`;

  const { error } = await supabase.storage.from('store-images').upload(path, webp, {
    contentType: 'image/webp',
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) {
    // أشهر سبب للخطأ هنا: bucket "store-images" مش موجود لسه (لازم تشغّلي
    // ملف الهجرة)، أو حسابك مش مضاف في جدول admin_users.
    throw new Error(`تعذر رفع الصورة: ${error.message}`);
  }

  const { data } = supabase.storage.from('store-images').getPublicUrl(path);
  return data.publicUrl;
}

/** بيحول Blob لنص base64 (بنستخدمها بس لإيصال فودافون كاش، مش لصور المتجر). */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('تعذرت قراءة الصورة'));
    };
    reader.onerror = () => reject(new Error('تعذرت قراءة الصورة'));
    reader.readAsDataURL(blob);
  });
}

/** نسخة مضغوطة (WebP) من إيصال التحويل كنص base64 - بيقلل حجم الإيصال جداً قبل التخزين. */
export async function receiptFileToCompressedDataURL(file: File): Promise<string> {
  const webp = await fileToWebP(file, 1200, 0.75);
  return blobToDataURL(webp);
}
