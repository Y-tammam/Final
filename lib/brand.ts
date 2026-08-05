export const BRAND_CONFIG = {
  id: "brand_id_placeholder",
  name: "soraia",
  nameArabic: "ثُريا",
  tagline: "أحدث صيحات الموضة والملابس التركية الفاخرة في مصر",
  taglineEn: "Finest Turkish Women's Fashion, Delivered Across Egypt",
  currency: "EGP",
  currencyArabic: "ج.م",
  country: "Egypt",
  shipping: {
    allowInspectionOnDelivery: true,
    defaultDeliveryDays: "2-4 أيام عمل",
  },
  contact: {
    whatsapp: "+201000000000",
    instagram: "@brand_placeholder",
    supportEmail: "support@brandplaceholder.com",
  },
  adminEmail: "ttghnghylla@gmail.com",
  freeShippingThreshold: 3000,
} as const;

export const EGYPT_GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الغربية", "المنوفية",
  "الدقهلية", "الشرقية", "البحيرة", "الفيوم", "بني سويف", "المنيا",
  "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر",
  "الوادي الجديد", "مطروح", "شمال سيناء", "جنوب سيناء", "بورسعيد",
  "الإسماعيلية", "السويس", "دمياط", "كفر الشيخ",
] as const;

export type Governorate = (typeof EGYPT_GOVERNORATES)[number];

export const ORDER_STATUS = {
  pending: { label: "قيد الانتظار", labelEn: "Pending", color: "warning" },
  confirmed: { label: "تم التأكيد", labelEn: "Confirmed", color: "blue" },
  processing: { label: "قيد التجهيز", labelEn: "Processing", color: "blue" },
  shipped: { label: "جاري الشحن", labelEn: "Shipped", color: "blue" },
  delivered: { label: "تم التسليم", labelEn: "Delivered", color: "success" },
  cancelled: { label: "ملغي", labelEn: "Cancelled", color: "destructive" },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS;

export const PAYMENT_METHODS = {
  COD: "الدفع عند الاستلام",
  "Vodafone Cash": "فودافون كاش",
  Card: "بطاقة بنكية",
} as const;

export const TURKISH_SIZE_GUIDE = [
  { turkish: "38", eu: "XS", chest: "84", waist: "64", hips: "90" },
  { turkish: "40", eu: "S", chest: "88", waist: "68", hips: "94" },
  { turkish: "42", eu: "M", chest: "92", waist: "72", hips: "98" },
  { turkish: "44", eu: "L", chest: "96", waist: "76", hips: "102" },
  { turkish: "46", eu: "XL", chest: "100", waist: "80", hips: "106" },
  { turkish: "48", eu: "XXL", chest: "104", waist: "84", hips: "110" },
] as const;
