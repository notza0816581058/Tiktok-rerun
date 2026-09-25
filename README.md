# Live Hub

เว็บไซต์กลางต้นแบบสำหรับงานไลฟ์ของทีม แยกจากเว็บอ้างอิง และไม่เก็บรหัสผ่าน คุกกี้ ข้อมูลลูกค้า หรือโค้ดของระบบต้นทาง UI ใช้ข้อมูลที่แต่งขึ้นใหม่ทั้งหมด

## ส่วนที่เพิ่มจากงานของน็อต (Day 03)

| งาน | สิ่งที่มีในโปรเจกต์ | สถานะ |
| --- | --- | --- |
| P0-2 Monorepo + Dev Environment | `apps/web`, `apps/api`, `apps/worker`, `packages/shared`, Docker Compose สำหรับ PostgreSQL/Redis/API/worker/web และ healthcheck | รันได้ใน Dev/Test |
| P0-4 Shared Package / Event Contracts | event envelope และ validator สำหรับ `live.*`, stats, comment, chat, product และ event เสริม; mock events และ tests | Proposed v1; รอทีม review |
| P0-6 TikTok Client Skeleton | typed transport, fixtures/tests, sanitized cURL template, proxy config, retry planner และ log redaction | Mock เท่านั้น; Pending verification |

งานของน็อตเกี่ยวกับเว็บนี้โดยตรง: เว็บอ่านสถานะ API/DB/Redis/worker ผ่าน `/api/system/health`; API ใช้ client mock สร้าง Live Stats แล้วแปลงเป็น shared event ที่ตรวจสอบได้; worker รับ event envelope บน Redis และส่ง heartbeat ให้เว็บตรวจสถานะ งานเหล่านี้เป็นฐานให้หน้าบัญชี ไลฟ์ สถิติ สินค้า และคอมเมนต์ต่อข้อมูลจริงภายหลัง

## เริ่มใช้งานด้วย Docker

ต้องมี Docker Desktop ที่เปิดใช้งานอยู่

เปิดเทอร์มินัลที่โฟลเดอร์รากของโปรเจกต์ แล้วรัน:

```powershell
docker compose up --build -d
docker compose ps
```

เปิด [http://localhost:3100/dashboard](http://localhost:3100/dashboard) เข้าสู่ระบบด้วยบัญชีตัวอย่าง `demo` / `demo1234` ซึ่งเป็นของโปรเจกต์ใหม่นี้เท่านั้น ก่อนใช้งานนอกเครื่องให้กำหนด `APP_USERNAME`, `APP_PASSWORD`, `SESSION_SECRET` ที่ปลอดภัยในไฟล์ `.env` และอย่าใช้ค่า dev ใน production

ตรวจระบบ:

```powershell
Invoke-RestMethod http://localhost:4000/health/ready
Invoke-RestMethod http://localhost:4000/api/v1/mock/live-stats
npm ci
npm run demo:event
docker compose logs worker --tail 20
```

`/health/ready` แสดงสถานะ PostgreSQL, Redis และ worker ตามจริง; `demo:event` ส่ง event จำลองให้ worker ทดสอบการเชื่อม โดยไม่สั่งงาน TikTok ปิดชุดบริการด้วย `docker compose down` ซึ่งยังเก็บข้อมูลใน volume ของ PostgreSQL ไว้

## รันแบบพัฒนา

```powershell
docker compose up -d postgres redis
npm ci
npm run dev
```

เว็บอยู่ที่ `localhost:3100`, API ที่ `localhost:4000`, PostgreSQL dev ที่ `localhost:5433`, Redis dev ที่ `localhost:6380` ใช้ `npm test`, `npm run lint`, `npm run format:check` และ `npm run build` เพื่อตรวจทุก workspace

## โครงสร้าง

- `apps/web` — Next.js/TypeScript UI, login สำหรับระบบใหม่นี้ และหน้า Dashboard, Accounts, Live Session, Video Library, Playlist, Product Set, Comment + AI, Analytics, Sales, Logs, Settings
- `apps/api` — backend API, healthcheck, สถานะ integration และ mock Live Stats/Product
- `apps/worker` — Redis heartbeat และตัวรับ event ที่ตรวจ shared contract ก่อนประมวลผล
- `packages/shared` — proposed event contracts v1, validator และ mock event factory
- `packages/tiktok-client` — client boundary และ mock transport ของ endpoint ที่ยังไม่ยืนยัน

## งานที่รอทีม

- **โอ๊ต P0-3:** นำ Schema v2 ที่ผ่าน review เข้า Prisma, รัน migration กับ Dev DB และส่งผลการตรวจ index/relation/constraint ฐาน PostgreSQL ใน Compose พร้อมแล้ว แต่ยังไม่มี migration จริง
- **ซีและภูมิ P0-5:** ยืนยัน Integration/Comment/Chat contracts และปรับ proposed request/response กับ event mapping ให้ตรงหลักฐานที่ตรวจแล้ว
- **น็อต P0-6 ขั้นถัดไป:** เสียบ verified transport หลังได้รับ endpoint และบัญชีทดสอบที่อนุมัติ; เพิ่ม unit/integration tests โดยไม่เปิดคำสั่งที่เปลี่ยนข้อมูลจริงก่อนพร้อม

คำสั่ง Add Product, Pin Product, Chat และ Start Live ในโครงปัจจุบันเป็น mock/simulated เท่านั้น ไม่มีการเรียกแพลตฟอร์มจริง ระบบล็อกอินยังเป็นบัญชี dev เดียว ก่อนใช้งานจริงต้องเพิ่ม users table, password hashing, rate limiting และ audit log

สมาชิกทีมดูจุดรับงาน วิธีสร้าง branch และข้อกำหนดข้อมูลลับใน [CONTRIBUTING.md](CONTRIBUTING.md)
ผลตรวจ Day 03 จากการติดตั้งใหม่และ Docker หลัง restart อยู่ใน [docs/day03-verification.md](docs/day03-verification.md)
