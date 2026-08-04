"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// مهم: بنستخدم createBrowserClient من @supabase/ssr (بيحفظ الجلسة في
// cookies) مش createClient العادي (بيحفظ الجلسة في localStorage).
// السبب: middleware.ts بيشتغل على السيرفر ومينفعش يقرا localStorage
// خالص، بيقدر يقرا cookies بس. لو استخدمنا عميلين مختلفين (واحد بيحفظ
// في cookies والتاني في localStorage) هيبقوا "مش شايفين" جلسة الدخول
// بتاعة بعض، وده اللي كان بيسبب مشكلة "معنديش صلاحيات" بعد تسجيل الدخول
// بنجاح. دلوقتي العميل ده هو المستخدم في كل المشروع (login, auth-context,
// admin-guard, إلخ) فالجلسة بقت متسقة في كل مكان.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
