import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { SITE_URL } from '@/lib/site';

/*
 * Meta Conversions API - بيبعت حدث الشراء (Purchase) من السيرفر لميتا.
 * ليه؟ مانعات الإعلانات و iOS بيوقفوا جزء كبير من أحداث الـ Pixel في
 * المتصفح، فالإعلانات بتتعلم من بيانات ناقصة. الحدث هنا بيتبعت بنفس
 * event_id بتاع المتصفح، فميتا بتعدّه مرة واحدة بس (deduplication).
 *
 * التفعيل على Vercel (Settings > Environment Variables):
 *   NEXT_PUBLIC_META_PIXEL_ID   رقم الـ Pixel
 *   META_CAPI_TOKEN             من Events Manager > Settings > Conversions API
 *   SUPABASE_SERVICE_ROLE_KEY   (المفتاح الجديد بعد التغيير - سري، سيرفر بس)
 * لو أي واحد ناقص، الـ route ده مبيعملش حاجة.
 *
 * الأمان: الطلب بيتقري من قاعدة البيانات بالـ order_id + event_id (مش
 * بيانات من المتصفح)، وبيتبعت مرة واحدة بس (capi_sent_at)، وخلال ساعة من
 * إنشاء الطلب - فمحدش يقدر يبعت مشتريات وهمية لميتا من هنا.
 */

const sha256 = (v: string) => createHash('sha256').update(v.trim().toLowerCase()).digest('hex');

function normalizePhone(phone: string) {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('20')) return digits;
  return '20' + digits.replace(/^0/, '');
}

export async function POST(req: Request) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!pixelId || !token || !serviceKey || !/^\d{5,20}$/.test(pixelId)) {
    return new Response(null, { status: 204 });
  }

  let body: { order_id?: string; event_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!body.order_id || !body.event_id || !uuid.test(body.order_id) || !uuid.test(body.event_id)) {
    return new Response(null, { status: 400 });
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // بنعلّم الطلب إنه اتبعت الأول (ذرّياً) عشان نفس الطلب ميتبعتش مرتين
  const { data: order } = await db
    .from('orders')
    .update({ capi_sent_at: new Date().toISOString() })
    .eq('id', body.order_id)
    .eq('event_id', body.event_id)
    .is('capi_sent_at', null)
    .gt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .select('id, event_id, customer_name, customer_phone, governorate, total_amount_egp, client_ip, user_agent, attribution, created_at, order_items(product_id, quantity)')
    .maybeSingle();
  if (!order) return new Response(null, { status: 204 });

  const attribution = (order.attribution ?? {}) as Record<string, string>;
  const items = (order.order_items ?? []) as { product_id: string | null; quantity: number }[];
  const firstName = order.customer_name.split(/\s+/)[0] ?? '';

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(new Date(order.created_at).getTime() / 1000),
        event_id: order.event_id,
        action_source: 'website',
        event_source_url: `${SITE_URL}/checkout`,
        user_data: {
          ph: [sha256(normalizePhone(order.customer_phone))],
          fn: firstName ? [sha256(firstName)] : undefined,
          st: order.governorate ? [sha256(order.governorate)] : undefined,
          country: [sha256('eg')],
          client_ip_address: order.client_ip ?? undefined,
          client_user_agent: order.user_agent ?? undefined,
          fbp: attribution.fbp,
          fbc: attribution.fbc,
        },
        custom_data: {
          currency: 'EGP',
          value: Number(order.total_amount_egp),
          content_type: 'product',
          content_ids: items.map((i) => i.product_id).filter(Boolean),
          num_items: items.reduce((n, i) => n + i.quantity, 0),
        },
      },
    ],
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      // نرجّع العلامة عشان ممكن نحاول تاني
      await db.from('orders').update({ capi_sent_at: null }).eq('id', order.id);
      console.error('Meta CAPI error', res.status, await res.text());
    }
  } catch (err) {
    await db.from('orders').update({ capi_sent_at: null }).eq('id', order.id);
    console.error('Meta CAPI request failed', err);
  }
  return new Response(null, { status: 204 });
}
