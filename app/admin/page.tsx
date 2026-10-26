import { redirect } from 'next/navigation';

// soraia.store/admin مكانتش صفحة موجودة (لوحة التحكم على /admin/dashboard)،
// فكتابة /admin في المتصفح كانت بتطلع صفحة فاضية. دلوقتي بتحوّل للوحة
// التحكم (والموظف بيتحول للطلبات من middleware.ts، واللي مش مسجل دخول
// بيتحول لصفحة الدخول).
export default function AdminIndex() {
  redirect('/admin/dashboard');
}
