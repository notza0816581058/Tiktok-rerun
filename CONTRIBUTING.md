# Contributing to Live Hub

โปรเจกต์นี้เป็นฐานกลางให้ทีมพัฒนาร่วมกัน ใช้ข้อมูลจำลองจนกว่า contract และ endpoint จริงจะผ่านการตรวจสอบ

## เริ่มต้น

1. ติดตั้ง Node.js 22 และ Docker Desktop
2. รัน `npm ci`
3. รัน `docker compose up -d postgres redis`
4. รัน `npm run dev`
5. ก่อนเปิด Pull Request รัน `npm test`, `npm run lint`, `npm run format:check` และ `npm run build`

ถ้าต้องการรันทุกบริการใน Docker ให้ใช้ `docker compose up --build -d` จากโฟลเดอร์ราก ตรวจ `/health/ready` ของ API และ `/api/system/health` ของเว็บ

## จุดรับงานของทีม

| เจ้าของงาน | พื้นที่หลัก | สิ่งที่ต้องเชื่อม |
| --- | --- | --- |
| น็อต | `apps/api`, `apps/worker`, `packages/shared`, `packages/tiktok-client`, `compose.yaml` | API, worker, event contract, integration boundary และหลักฐานการรัน |
| โอ๊ต | `apps/api`, Prisma schema/migrations ที่จะเพิ่ม | PostgreSQL schema v2, migration, relation/index/constraint และ API data layer |
| ซี | `packages/tiktok-client`, `apps/api` | Live Stats/Product adapter และ mapping หลังยืนยัน endpoint จริง |
| ภูมิ | `packages/tiktok-client`, `packages/shared`, `apps/api` | Comment/Chat contract, event mapping และตัวอย่างข้อมูล |
| ทีมเว็บ | `apps/web` | หน้าจอและ flow ที่อ่านข้อมูลจาก API |

ตารางเป็นจุดเริ่มต้นสำหรับแบ่งงาน ไม่ใช่ข้อจำกัดสิทธิ์แก้ไฟล์ หากการเปลี่ยน contract กระทบหลายส่วน ให้คุยกับเจ้าของ consumer ก่อนรวม Pull Request

## วิธีส่งงาน

สร้าง branch ของตัวเองจาก `main`, แก้เฉพาะส่วนที่รับผิดชอบและส่วนที่เกี่ยวข้อง, แนบผลทดสอบใน Pull Request แล้วขอ review จากทีม หลีกเลี่ยงการ commit `node_modules`, `dist`, `.next`, `.env` และข้อมูลลับ

ชื่อ event ใน `packages/shared` เป็น contract กลางภายในทีม การเปลี่ยนชื่อหรือ payload ต้องปรับ validator, fixture, API, worker และ tests ใน Pull Request เดียวกัน ชื่อ endpoint และ shape ฝั่ง TikTok ใน client ยังเป็นเพียง mock/pending verification อย่าเปลี่ยนเป็น `verified` โดยไม่มีหลักฐานจากบัญชีทดสอบที่ได้รับอนุมัติ

## ข้อมูลและความลับ

ใช้เฉพาะ fixture ที่แต่งขึ้นใหม่ ห้าม commit TikTok cookie, session, token, CSRF token, production credential หรือข้อมูลลูกค้า ใช้ placeholder เช่น `<COOKIE>`, `<ROOM_ID>` และ `<REDACTED>` ในเอกสารและ test fixture บัญชี `demo` เป็น dev login ของโปรเจกต์นี้เท่านั้น

การ migrate Prisma จะถือว่าผ่านเมื่อ schema ของโอ๊ตถูกนำเข้าและมี migration output, Prisma Client generation, และ smoke test กับ Dev PostgreSQL จริง ปัจจุบันยังไม่รวม migration ดังกล่าว
