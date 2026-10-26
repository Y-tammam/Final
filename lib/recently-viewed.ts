"use client";

import { useEffect, useState } from 'react';
import { toSnapshot, type ProductSnapshot, type SnapshotSource } from './wishlist-context';

// "شوهد مؤخراً": آخر 12 منتج الزبونة فتحتهم، الأحدث الأول ومن غير تكرار.
// متخزنين في localStorage بنفس الشكل المصغر بتاع المفضلة.
const STORAGE_KEY = 'soraia_recent';
const MAX_ITEMS = 12;

function readRecent(): ProductSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// بتتنده في صفحة المنتج: أول ما الصفحة تفتح بنحط المنتج في أول القائمة
export function useRecordRecentlyViewed(product: SnapshotSource | null | undefined) {
  const id = product?.id;
  useEffect(() => {
    if (!product || !id) return;
    try {
      const next = [toSnapshot(product), ...readRecent().filter((p) => p.id !== id)].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* empty */
    }
    // بنعتمد على id بس عشان مانكتبش في التخزين مع كل render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}

// بترجع القائمة بعد الـ hydration بس (أول render دايماً فاضي زي السيرفر)
export function useRecentlyViewed(): ProductSnapshot[] {
  const [items, setItems] = useState<ProductSnapshot[]>([]);
  useEffect(() => {
    setItems(readRecent());
  }, []);
  return items;
}
