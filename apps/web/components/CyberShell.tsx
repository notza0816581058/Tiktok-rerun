'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CircleCheck,
  LogOut,
  Menu,
  Play,
  Plus,
  RefreshCw,
  Settings,
  ShoppingCart,
  Upload,
  X,
} from 'lucide-react';
import '../app/cyber.css';

type Page =
  | 'dashboard'
  | 'accounts'
  | 'live'
  | 'videos'
  | 'playlists'
  | 'products'
  | 'comments'
  | 'analytics'
  | 'sales'
  | 'logs'
  | 'settings';
const primary: { id: Page; mark: string; label: string }[] = [
  { id: 'dashboard', mark: '[#]', label: 'บัญชีไลฟ์' },
  { id: 'videos', mark: '[>]', label: 'คลังวิดีโอ' },
  { id: 'comments', mark: '[~]', label: 'ตอบอัตโนมัติ' },
  { id: 'analytics', mark: '[%]', label: 'สถิติ AI' },
  { id: 'sales', mark: '[฿]', label: 'ยอดขาย' },
];
const workspace: { id: Page; mark: string; label: string }[] = [
  { id: 'accounts', mark: '[A]', label: 'Accounts' },
  { id: 'live', mark: '[L]', label: 'Live Session' },
  { id: 'playlists', mark: '[P]', label: 'Playlist' },
  { id: 'products', mark: '[$]', label: 'Product Set' },
  { id: 'logs', mark: '[!]', label: 'Logs' },
  { id: 'settings', mark: '[*]', label: 'Settings' },
];
const names: Record<Page, string> = {
  dashboard: 'บัญชีไลฟ์',
  accounts: 'บัญชีทั้งหมด',
  live: 'Live Session',
  videos: 'คลังวิดีโอ',
  playlists: 'Playlist',
  products: 'Product Set',
  comments: 'ตอบอัตโนมัติ',
  analytics: 'สถิติการตอบของ AI',
  sales: 'ยอดขายไลฟ์',
  logs: 'บันทึกระบบ',
  settings: 'ตั้งค่าระบบ',
};
const sampleVideos = [
  { name: 'demo-product-01.mp4', size: '32.4 MB', code: '01' },
  { name: 'demo-loop-02.mp4', size: '48.2 MB', code: '02' },
  { name: 'demo-promo-03.mp4', size: '21.8 MB', code: '03' },
  { name: 'demo-intro-04.mp4', size: '16.7 MB', code: '04' },
];

function Btn({
  children,
  onClick,
  tone = 'default',
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: 'default' | 'pink' | 'green' | 'cyan' | 'danger';
  className?: string;
}) {
  return (
    <button className={'cyber-btn ' + tone + ' ' + className} onClick={onClick}>
      {children}
    </button>
  );
}
function Badge({
  children,
  tone = 'cyan',
}: {
  children: React.ReactNode;
  tone?: 'cyan' | 'green' | 'pink' | 'dim' | 'yellow';
}) {
  return <span className={'cyber-badge ' + tone}>{children}</span>;
}
function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="cyber-panel">
      <div className="cyber-panel-title">
        <span className="cyber-spark">▪</span>
        {title}
        {action && <span className="cyber-panel-action">{action}</span>}
      </div>
      {children}
    </section>
  );
}

export default function CyberShell({ section, username }: { section: Page; username: string }) {
  const router = useRouter();
  const [clock, setClock] = useState('--:--:--');
  const [mobile, setMobile] = useState(false);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState('');
  const [tab, setTab] = useState('ตอบอัตโนมัติ');
  const [search] = useState('');
  const [autoReply, setAutoReply] = useState(true);
  const [welcome, setWelcome] = useState(true);
  const [systemStatus, setSystemStatus] = useState<'checking' | 'ready' | 'degraded' | 'offline'>(
    'checking',
  );
  const [dependencies, setDependencies] = useState<Record<string, string>>({});
  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString('th-TH', { hour12: false }));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    fetch('/api/system/health', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (active) {
          setSystemStatus(data.status);
          setDependencies(data.dependencies ?? {});
        }
      })
      .catch(() => {
        if (active) setSystemStatus('offline');
      });
    return () => {
      active = false;
    };
  }, []);
  const notify = (value: string) => {
    setToast(value);
    window.setTimeout(() => setToast(''), 3500);
  };
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }
  function accountCard(name: string, handle: string, idx: number) {
    return (
      <article className="cyber-account-card" key={name}>
        <div className="cyber-card-head">
          <span>
            <i className="cyber-square" /> SLEEP
          </span>
          <span className="cyber-card-head-right">
            ♂ CYBER HOST{' '}
            <Btn tone="green" onClick={() => notify('บัญชีตัวอย่าง: พร้อมตรวจสอบ')}>
              ตรวจ
            </Btn>
          </span>
        </div>
        <div className="cyber-card-body">
          <div className={'cyber-avatar avatar-' + idx}>
            <span>▶</span>
            <small>DEMO {idx + 1}</small>
          </div>
          <div className="cyber-account-info">
            <div className="cyber-account-name">
              <span className="cyber-initial">{name.charAt(0)}</span>
              <strong>{name}</strong>
            </div>
            <div className="cyber-handle">{handle}</div>
            <div className="cyber-chip-row">
              <Badge tone="cyan">▣ {handle}</Badge>
              <Badge tone="dim">▥ HD</Badge>
              <Badge tone="green">▣ วิดีโอพร้อม</Badge>
            </div>
            <div className="cyber-chip-row">
              <Badge tone="green">● คอมเมนต์</Badge>
              <Badge tone="green">▣ ส่งแชท</Badge>
              <Badge tone="green">▣ AI ตอบ</Badge>
              <Badge tone="cyan">⚡ AUTO</Badge>
            </div>
          </div>
        </div>
        <div className="cyber-card-actions">
          <Btn tone="green" onClick={() => notify('เริ่มไลฟ์ได้เมื่อเชื่อม worker และบัญชีทดสอบ')}>
            <Play size={12} fill="currentColor" /> เริ่มไลฟ์
          </Btn>
          <Btn onClick={() => setModal('สถานะบัญชี')}>สถานะ</Btn>
          <Btn onClick={() => router.push('/products')}>
            <ShoppingCart size={13} /> เพิ่มสินค้า
          </Btn>
          <Btn onClick={() => router.push('/settings')}>
            <Settings size={13} /> ตั้งค่า
          </Btn>
          <Btn onClick={() => setModal('แก้ไขบัญชี')}>แก้ไข</Btn>
          <Btn tone="danger" onClick={() => notify('ข้อมูลตัวอย่างไม่ได้ถูกลบ')}>
            ลบ
          </Btn>
        </div>
      </article>
    );
  }
  function accountView() {
    return (
      <>
        <div className="cyber-toolbar">
          <Btn tone="pink" onClick={() => setModal('เพิ่มบัญชี')}>
            <Plus size={14} /> เพิ่มบัญชี
          </Btn>
          <Btn onClick={() => notify('ข้อมูลตัวอย่างล่าสุดแล้ว')}>
            <RefreshCw size={13} /> รีเฟรชยอด
          </Btn>
          <Btn onClick={() => router.push('/videos')}>
            <Upload size={13} /> อัปโหลดวิดีโอ
          </Btn>
          <Btn onClick={() => setModal('ภาพรวมทุกบัญชี')}>▣ ภาพรวม</Btn>
          <Btn onClick={() => setModal('Telegram')}>▣ Telegram</Btn>
        </div>
        <div className="cyber-account-grid">
          {accountCard('Demo Shop A', '@demo_shop_a', 0)}
          {section === 'accounts' && accountCard('Demo Shop B', '@demo_shop_b', 1)}
        </div>
      </>
    );
  }
  function videoView() {
    return (
      <>
        <Panel title="อัปโหลดวิดีโอเข้าคลัง">
          <div
            className="cyber-drop"
            onClick={() => notify('การอัปโหลดจะเปิดใช้หลังเชื่อมพื้นที่จัดเก็บ')}
          >
            <Upload size={22} />
            <strong>ลากไฟล์วิดีโอมาวางที่นี่</strong>
            <small>หรือกดเพื่อเลือกไฟล์ · รองรับ .mp4 · ข้อมูลตัวอย่าง</small>
          </div>
          <div className="cyber-small-center">พื้นที่ว่าง: ตัวอย่าง 20 GB</div>
        </Panel>
        <Panel title="วิดีโอในคลัง">
          <div className="cyber-video-grid">
            {sampleVideos
              .filter((v) => v.name.includes(search.toLowerCase()))
              .map((v) => (
                <div className="cyber-video-card" key={v.name}>
                  <div className="cyber-video-thumb">
                    <span className="cyber-play">▶</span>
                    <span className="cyber-mp4">MP4</span>
                    <small>{v.code}</small>
                  </div>
                  <div className="cyber-video-meta">
                    <strong>{v.name}</strong>
                    <small>{v.size}</small>
                    <Btn onClick={() => notify('วิดีโอตัวอย่างไม่ได้ถูกลบ')}>ลบ</Btn>
                  </div>
                </div>
              ))}
          </div>
        </Panel>
      </>
    );
  }
  function commentsView() {
    return (
      <>
        <Panel title="ตั้งค่าการตอบอัตโนมัติ">
          <div className="cyber-inline">
            <label>
              เลือกบัญชี{' '}
              <select>
                <option>Demo Shop A</option>
                <option>Demo Shop B</option>
              </select>
            </label>
            <Btn tone="pink" onClick={() => notify('บันทึกการตั้งค่าตัวอย่างแล้ว')}>
              ▣ บันทึกการตั้งค่า
            </Btn>
          </div>
          <div className="cyber-tabs">
            {[
              'ทั่วไป',
              'ตัวเลือกไลฟ์',
              'สินค้า',
              'อัตโนมัติ',
              'ตอบอัตโนมัติ',
              'AI ช่วยตอบ',
              'สถิติ & คอมเมนต์',
            ].map((t) => (
              <button className={tab === t ? 'active' : ''} onClick={() => setTab(t)} key={t}>
                {t}
              </button>
            ))}
          </div>
          <div className="cyber-form-section">
            <label className="cyber-check">
              <input
                type="checkbox"
                checked={autoReply}
                onChange={(e) => setAutoReply(e.target.checked)}
              />{' '}
              💬 ตอบคอมเมนต์อัตโนมัติตามคำที่ดักจับ
            </label>
            <p>เมื่อมีคอมเมนต์ตรงกับคำที่กำหนด ระบบจะส่งคำตอบกลับในไลฟ์</p>
            <div className="cyber-empty-rule">
              ยังไม่มีกฎตอบในข้อมูลตัวอย่าง{' '}
              <Btn onClick={() => setModal('เพิ่มกฎตอบ')}>+ เพิ่มกฎตอบ</Btn>
            </div>
            <label className="cyber-check">
              <input
                type="checkbox"
                checked={welcome}
                onChange={(e) => setWelcome(e.target.checked)}
              />{' '}
              👋 ทักทายคนเข้าไลฟ์
            </label>
            <p>ตั้งข้อความทักทายโดยใช้ {'{user}'} แทนชื่อผู้เข้าชม</p>
            <textarea defaultValue={'ยินดีต้อนรับ {user} เข้าสู่ไลฟ์'} aria-label="ข้อความทักทาย" />
            <h3>🛡 กันสแปม</h3>
            <div className="cyber-input-grid">
              <label>
                เว้นจังหวะ (วินาที)
                <input type="number" defaultValue="4" min="1" />
              </label>
              <label>
                กันตอบซ้ำ (วินาที)
                <input type="number" defaultValue="30" min="1" />
              </label>
              <label>
                สูงสุดต่อนาที
                <input type="number" defaultValue="12" min="1" />
              </label>
            </div>
          </div>
        </Panel>
      </>
    );
  }
  function analyticsView() {
    return (
      <>
        <div className="cyber-section-summary">
          <label>
            เลือกบัญชี{' '}
            <select>
              <option>Demo Shop A</option>
              <option>Demo Shop B</option>
            </select>
          </label>
          <Btn onClick={() => notify('แสดงข้อมูลตัวอย่างล่าสุดแล้ว')}>
            <RefreshCw size={13} /> รีเฟรช
          </Btn>
        </div>
        <div className="cyber-metrics">
          <div>
            <strong>24</strong>
            <span>AI ตอบทั้งหมด</span>
          </div>
          <div>
            <strong>23</strong>
            <span>สำเร็จ</span>
          </div>
          <div>
            <strong>1</strong>
            <span>รอตรวจสอบ</span>
          </div>
        </div>
        <div className="cyber-columns">
          <Panel title="คำถามยอดฮิต">
            <div className="cyber-list">
              {[
                ['ราคาเท่าไร', '8'],
                ['มีสินค้าอะไรบ้าง', '6'],
                ['จัดส่งกี่วัน', '4'],
                ['วิธีสั่งซื้อ', '3'],
              ].map(([t, n]) => (
                <div key={t}>
                  <span>{t}</span>
                  <Badge tone="cyan">{n}</Badge>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="รายการล่าสุด">
            <div className="cyber-list">
              {[
                'ถามเรื่องสินค้า → AI ตอบแล้ว',
                'ถามเรื่องราคา → AI ตอบแล้ว',
                'คำถามใหม่ → รอตรวจสอบ',
              ].map((t, i) => (
                <div key={t}>
                  <span>{t}</span>
                  <Badge tone={i === 2 ? 'yellow' : 'green'}>{i === 2 ? 'รอ' : 'สำเร็จ'}</Badge>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </>
    );
  }
  function genericView() {
    if (section === 'sales')
      return (
        <Panel title="ยอดขายไลฟ์ — รวมทุกบัญชีที่กำลังไลฟ์">
          <div className="cyber-empty">
            <ShoppingCart size={30} />
            <strong>ยังไม่มีบัญชีที่กำลังไลฟ์</strong>
            <small>ยอดขายจะแสดงเมื่อเชื่อม Live Stats และข้อมูลสินค้า</small>
            <Btn onClick={() => notify('แสดงข้อมูลตัวอย่างล่าสุดแล้ว')}>⟳ รีเฟรชยอด</Btn>
          </div>
        </Panel>
      );
    if (section === 'live')
      return (
        <>
          <div className="cyber-metrics">
            <div>
              <strong>0</strong>
              <span>กำลังไลฟ์</span>
            </div>
            <div>
              <strong>1</strong>
              <span>ร่างเซสชัน</span>
            </div>
            <div>
              <strong>●</strong>
              <span>ระบบสตรีมพร้อม</span>
            </div>
          </div>
          <Panel title="เซสชันไลฟ์">
            <div className="cyber-row">
              <span>▣ ไลฟ์ตัวอย่างช่วงเย็น</span>
              <Badge tone="yellow">ร่าง</Badge>
              <Btn onClick={() => setModal('Live Session')}>ดูรายละเอียด</Btn>
            </div>
            <p className="cyber-hint">เตรียมจุดเชื่อม video worker, heartbeat และสถิติสดของทีม</p>
          </Panel>
        </>
      );
    if (section === 'playlists')
      return (
        <Panel title="เพลย์ลิสต์">
          <div className="cyber-row">
            <span>▶ โปรโมชันชุด A</span>
            <Badge tone="green">2 วิดีโอ</Badge>
            <Btn onClick={() => setModal('เพลย์ลิสต์')}>ดูรายการ</Btn>
          </div>
          <div className="cyber-row">
            <span>▶ สินค้าใหม่</span>
            <Badge tone="yellow">ร่าง</Badge>
            <Btn onClick={() => setModal('เพลย์ลิสต์')}>ดูรายการ</Btn>
          </div>
        </Panel>
      );
    if (section === 'products')
      return (
        <Panel title="ชุดสินค้า">
          <div className="cyber-row">
            <span>▣ ชุดทดลอง A</span>
            <Badge tone="green">3 รายการ</Badge>
            <Btn onClick={() => setModal('ชุดสินค้า')}>ดูรายการ</Btn>
          </div>
          <div className="cyber-row">
            <span>▣ ชุดทดลอง B</span>
            <Badge tone="yellow">ร่าง</Badge>
            <Btn onClick={() => setModal('ชุดสินค้า')}>ดูรายการ</Btn>
          </div>
          <p className="cyber-hint">
            พร้อมเชื่อม Search Product, Add Product และ Pin Product หลังยืนยัน endpoint
          </p>
        </Panel>
      );
    if (section === 'logs')
      return (
        <Panel title="บันทึกกิจกรรม">
          <div className="cyber-row">
            <span>09:32 · ซิงก์รายการสินค้า</span>
            <Badge tone="green">สำเร็จ</Badge>
          </div>
          <div className="cyber-row">
            <span>09:20 · สร้างเพลย์ลิสต์ตัวอย่าง</span>
            <Badge tone="green">สำเร็จ</Badge>
          </div>
          <div className="cyber-row">
            <span>08:55 · ตรวจสอบบัญชีตัวอย่าง B</span>
            <Badge tone="yellow">รอตรวจสอบ</Badge>
          </div>
        </Panel>
      );
    return (
      <Panel title="การเชื่อมต่อระบบ">
        <div className="cyber-row">
          <span>▣ PostgreSQL · น็อต</span>
          <Badge tone={dependencies.postgres === 'ready' ? 'green' : 'yellow'}>
            {dependencies.postgres === 'ready' ? 'เชื่อมต่อแล้ว' : 'รอเชื่อม'}
          </Badge>
        </div>
        <div className="cyber-row">
          <span>▣ Redis · น็อต</span>
          <Badge tone={dependencies.redis === 'ready' ? 'green' : 'yellow'}>
            {dependencies.redis === 'ready' ? 'เชื่อมต่อแล้ว' : 'รอเชื่อม'}
          </Badge>
        </div>
        <div className="cyber-row">
          <span>▣ Worker heartbeat · น็อต</span>
          <Badge tone={dependencies.worker === 'ready' ? 'green' : 'yellow'}>
            {dependencies.worker === 'ready' ? 'ทำงาน' : 'รอเชื่อม'}
          </Badge>
        </div>
        <div className="cyber-row">
          <span>▣ Prisma Migration v2 · โอ๊ต</span>
          <Badge tone="yellow">รอเชื่อม</Badge>
        </div>
        <div className="cyber-row">
          <span>▣ TikTok API · ซี</span>
          <Badge tone="yellow">รอยืนยัน Endpoint</Badge>
        </div>
        <div className="cyber-row">
          <span>▣ Comment / Chat Contract · ภูมิ</span>
          <Badge tone="yellow">รอยืนยัน</Badge>
        </div>
        <div className="cyber-row">
          <span>▣ บัญชีผู้ดูแลระบบ</span>
          <Badge tone="green">เปิดใช้</Badge>
        </div>
      </Panel>
    );
  }
  return (
    <div className="cyber-shell">
      <aside className={'cyber-sidebar ' + (mobile ? 'mobile-open' : '')}>
        <div className="cyber-brand">
          <span className="cyber-brand-blocks">
            <i />
            <i />
          </span>
          <div>
            <strong>LIVE HUB</strong>
            <small>TEAM MGR</small>
          </div>
          <button className="cyber-mobile-close" onClick={() => setMobile(false)}>
            <X size={17} />
          </button>
        </div>
        <div className="cyber-sidebar-scroll">
          <nav className="cyber-nav">
            {primary.map((item) => (
              <Link
                className={'cyber-nav-item ' + (section === item.id ? 'active' : '')}
                href={'/' + item.id}
                key={item.id}
                onClick={() => setMobile(false)}
              >
                <b>{item.mark}</b> {item.label}
              </Link>
            ))}
          </nav>
          <div className="cyber-nav-divider">WORKSPACE</div>
          <nav className="cyber-nav cyber-secondary-nav">
            {workspace.map((item) => (
              <Link
                className={'cyber-nav-item ' + (section === item.id ? 'active' : '')}
                href={'/' + item.id}
                key={item.id}
                onClick={() => setMobile(false)}
              >
                <b>{item.mark}</b> {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="cyber-foot">
          <div className="cyber-clock-card">
            <div className="cyber-clock-art">✦</div>
            <div>
              <strong>{clock.slice(0, 5)}</strong>
              <small>บอทพักผ่อน 💤</small>
            </div>
          </div>
          <div className="cyber-foot-ready">
            ■ {systemStatus === 'ready' ? 'ระบบสตรีม: พร้อม' : 'ระบบสตรีม: รอเชื่อม'}
          </div>
          <div className="cyber-theme-swatches">
            <span />
            <span />
            <span />
          </div>
          <small>v0.1.0 · LIVE HUB</small>
        </div>
      </aside>
      {mobile && <div className="cyber-backdrop" onClick={() => setMobile(false)} />}
      <div className="cyber-main">
        <header className="cyber-topbar">
          <button className="cyber-menu" onClick={() => setMobile(true)}>
            <Menu size={19} />
          </button>
          <h1>{names[section]}</h1>
          <div className="cyber-stat">
            <i /> 0 <small>LIVE</small>
          </div>
          <div className="cyber-stat red">
            1 / 2 <small>บัญชี</small>
          </div>
          <div className="cyber-stat ready">
            <i /> {systemStatus === 'ready' ? 'ระบบ' : 'รอ'}
            <br />
            {systemStatus === 'ready' ? 'พร้อม' : 'เชื่อม'}
          </div>
          <div className="cyber-stat version">
            <small>VER</small> v0.1.0
          </div>
          <div className="cyber-member">
            <span>●</span>
            <div>
              <strong>{username}</strong>
              <small>ระบบตัวอย่าง · 2 บัญชี</small>
            </div>
            <Btn tone="danger" onClick={logout}>
              <LogOut size={12} /> ออก
            </Btn>
          </div>
          <div className="cyber-top-actions">
            <Btn onClick={() => notify('แสดงข้อมูลตัวอย่างล่าสุดแล้ว')}>
              <RefreshCw size={13} /> รีเฟรช
            </Btn>
            <Btn tone="pink" onClick={() => setModal('เพิ่มบัญชี')}>
              <Plus size={13} /> เพิ่มบัญชี
            </Btn>
          </div>
        </header>
        <main className="cyber-content">
          {section === 'dashboard' || section === 'accounts'
            ? accountView()
            : section === 'videos'
              ? videoView()
              : section === 'comments'
                ? commentsView()
                : section === 'analytics'
                  ? analyticsView()
                  : genericView()}
        </main>
      </div>
      {toast && (
        <div className="cyber-toast">
          <CircleCheck size={17} />
          {toast}
          <button onClick={() => setToast('')}>×</button>
        </div>
      )}
      {modal && (
        <div className="cyber-modal-backdrop" onClick={() => setModal('')}>
          <div className="cyber-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cyber-modal-head">
              <h2>▣ {modal}</h2>
              <button onClick={() => setModal('')}>
                <X size={17} />
              </button>
            </div>
            <div className="cyber-modal-body">
              {modal === 'ภาพรวมทุกบัญชี' ? (
                <>
                  <p>รวม 2 · 🔴 ไลฟ์ 0 · ⚪ หยุด 2 · ⚠ ปัญหา 0</p>
                  <div className="cyber-row">
                    <span>Demo Shop A</span>
                    <Badge tone="yellow">หยุด</Badge>
                  </div>
                  <div className="cyber-row">
                    <span>Demo Shop B</span>
                    <Badge tone="yellow">หยุด</Badge>
                  </div>
                </>
              ) : (
                <>
                  <p>ส่วนนี้เป็นหน้าตัวอย่างสำหรับการเชื่อมงานของทีม</p>
                  <label>
                    ชื่อรายการ
                    <input placeholder="กรอกข้อมูลตัวอย่าง" />
                  </label>
                </>
              )}
            </div>
            <div className="cyber-modal-actions">
              <Btn onClick={() => setModal('')}>ปิด</Btn>
              <Btn
                tone="pink"
                onClick={() => {
                  setModal('');
                  notify('บันทึกตัวอย่างแล้ว');
                }}
              >
                บันทึก
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
