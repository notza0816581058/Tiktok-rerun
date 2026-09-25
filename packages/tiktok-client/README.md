# TikTok Client skeleton (P0-6)

โครงเชื่อมต่อของน็อตสำหรับ backend/worker เท่านั้น ปัจจุบันเป็น **mock ภายในเครื่อง** และไม่ติดต่อ TikTok, ไม่มี URL endpoint, cookie หรือข้อมูลรับรองจากระบบต้นทาง

## ส่วนที่พร้อมใช้

- `createTikTokClient(transport)` รวมโมดูล `auth.status`, `stats.live`, `products.search/add/pin`, `comments.list`, `chat.send`
- `createMockTransport()` คืนข้อมูลตัวอย่างและ error แบบกำหนดแน่นอน ใช้พัฒนา API/UI และทดสอบ flow
- ทุกผลลัพธ์จาก mock มี `source: "mock"` และ `verification.status: "pending_verification"`
- คำสั่ง add/pin/chat จาก mock มี `execution: "simulated"` ไม่มีผลกับไลฟ์จริง

```ts
import { createMockTransport, createTikTokClient } from "@live-hub/tiktok-client";

const client = createTikTokClient(createMockTransport());
const result = await client.stats.live({
  accountId: "demo-account-1",
  liveSessionId: "demo-live-1",
});
```

## จุดส่งต่องาน

- **ซี:** ตรวจ endpoint/response ของ Live Stats และ Product จริงก่อน แล้วสร้าง transport adapter ที่ทำตาม `TikTokTransport` ใน `src/types.ts` ฟิลด์ Stats ที่เตรียมไว้รวม `enters`, `gmvPerHour`, `impressionsPerHour`
- **ภูมิ:** ตรวจ Comment/Chat contract และตัวอย่าง event ก่อนสร้าง adapter และ mapping ไป shared event package
- **โอ๊ต:** ให้ backend แปลง normalized response เป็น DB record และ shared event ตาม schema ที่อนุมัติ ห้ามใช้ fixture เป็นข้อมูล Production
- **น็อต:** เพิ่ม adapter, unit tests สำหรับการแปลง response, health/error mapping และหลักฐานการทดสอบ หลังได้บัญชีทดสอบที่อนุมัติแล้ว

ชื่อ operation และ shape ในแพ็กเกจนี้เป็น **สัญญาภายในสำหรับทดลอง** ยังไม่ใช่หลักฐานว่า TikTok API มี endpoint ตามนี้ การเชื่อมจริงต้องทบทวนจากเอกสาร Integration ของซี/ภูมิ และเปลี่ยนสถานะเป็น `verified` เฉพาะรายการที่มีหลักฐานทดสอบ

## ทดสอบ

จากโฟลเดอร์นี้รัน `npm test` (ต้องติดตั้ง dependencies ของ workspace แล้ว) หรือจาก root `npm run test --workspace @live-hub/tiktok-client`
