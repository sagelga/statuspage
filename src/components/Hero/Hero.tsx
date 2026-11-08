import React from 'react';
import { HeroIcons } from '../Icons';
import { ServiceStatus } from '../../types';
import './Hero.style.css';

type DisplayStatus = ServiceStatus | 'loading' | 'error';

interface AffectedService {
  name: string;
  responseTime: number | null;
  status: ServiceStatus;
}

interface HeroProps {
  status: ServiceStatus | 'loading';
  checkedAt?: string;
  error?: boolean;
  serviceCount: number;
  affectedService?: AffectedService | null;
  affectedCount?: number;
  downCount?: number;
  uptime30d?: number | null;
  onRefresh?: () => void;
}

const TITLES: Record<DisplayStatus, string> = {
  operational: 'ทุกระบบทำงานปกติ',
  degraded: 'บางบริการทำงานช้าลง',
  down: 'มีบริการที่ใช้งานไม่ได้',
  loading: 'กำลังตรวจสอบสถานะ…',
  error: 'ตรวจสอบสถานะไม่ได้',
};

const KICKERS: Record<DisplayStatus, string> = {
  operational: 'สถานะปัจจุบัน',
  degraded: 'พบความหน่วง',
  down: 'ต้องการความสนใจ',
  loading: 'กรุณารอสักครู่',
  error: 'เชื่อมต่อข้อมูลไม่ได้',
};

const ICONS: Record<DisplayStatus, string> = {
  operational: HeroIcons.operational,
  degraded: HeroIcons.degraded,
  down: HeroIcons.down,
  loading: HeroIcons.loading,
  error: HeroIcons.degraded,
};

function formatCheckedAt(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function formatResponseTime(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  return `${value.toLocaleString('en-US')} ms`;
}

const RefreshIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <polyline points="21 3 21 9 15 9" />
  </svg>
);

export const Hero: React.FC<HeroProps> = ({
  status,
  checkedAt,
  error = false,
  serviceCount,
  affectedService = null,
  affectedCount = 0,
  downCount = 0,
  uptime30d = null,
  onRefresh,
}) => {
  const displayStatus: DisplayStatus = error ? 'error' : status;
  const checkedTime = formatCheckedAt(checkedAt);
  const responseTime = affectedService ? formatResponseTime(affectedService.responseTime) : null;
  const affectedTotal = Math.max(affectedCount, affectedService ? 1 : 0);

  let sub: React.ReactNode;
  let aside: React.ReactNode = null;

  switch (displayStatus) {
    case 'operational':
      sub = (
        <>
          {checkedTime ? (
            <>
              ตรวจสอบล่าสุด <strong>{checkedTime} น.</strong> ·{' '}
            </>
          ) : null}
          {serviceCount} บริการที่ตรวจสอบ
        </>
      );
      if (uptime30d !== null || onRefresh) {
        aside = (
          <div className="hero-aside">
            {uptime30d !== null && (
              <div className="hero-uptime">
                <b>{uptime30d.toFixed(2)}%</b>
                <span>ความพร้อมใช้งาน 30 วัน</span>
              </div>
            )}
            {onRefresh && (
              <button type="button" className="hero-refresh" onClick={onRefresh}>
                <RefreshIcon />
                รีเฟรช
              </button>
            )}
          </div>
        );
      }
      break;

    case 'degraded':
      sub = (
        <>
          {affectedTotal > 1 ? (
            <>มี <strong>{affectedTotal} บริการ</strong> ที่ต้องดู ·{' '}</>
          ) : affectedService ? (
            <>
              <strong>{affectedService.name}</strong>
              {responseTime ? (
                <>
                  {' '}· <span className="hero-mono">{responseTime}</span>
                </>
              ) : null}
              {' '}ตอบสนองช้าลง ·{' '}
            </>
          ) : (
            <>บางบริการตอบสนองช้าลง ·{' '}</>
          )}
          <a className="hero-link" href="#components">ดูรายละเอียด</a>
        </>
      );
      aside = (
        <div className="hero-aside">
          <div className="hero-uptime">
            <b>{affectedTotal}</b>
            <span>บริการที่มีปัญหา</span>
          </div>
          {onRefresh && (
            <button type="button" className="hero-refresh" onClick={onRefresh}>
              <RefreshIcon />
              รีเฟรช
            </button>
          )}
        </div>
      );
      break;

    case 'down':
      sub = (
        <>
          {downCount > 1 ? (
            <>มี <strong>{downCount} บริการ</strong> ที่ใช้งานไม่ได้ ·{' '}</>
          ) : affectedService ? (
            <>
              <strong>{affectedService.name}</strong> ไม่ตอบสนองในขณะนี้ ·{' '}
            </>
          ) : (
            <>มีบริการที่ไม่ตอบสนอง ·{' '}</>
          )}
          <a className="hero-link" href="#components">ดูรายละเอียด</a>
        </>
      );
      aside = (
        <div className="hero-aside">
          <div className="hero-uptime">
            <b>{Math.max(downCount, 1)}</b>
            <span>บริการที่ใช้งานไม่ได้</span>
          </div>
          {onRefresh && (
            <button type="button" className="hero-refresh" onClick={onRefresh}>
              <RefreshIcon />
              รีเฟรช
            </button>
          )}
        </div>
      );
      break;

    case 'loading':
      sub = 'กำลังรวบรวมผลการตรวจสอบล่าสุด';
      break;

    case 'error':
    default:
      sub = 'เชื่อมต่อข้อมูลสถานะไม่ได้ ข้อมูลที่เห็นอาจไม่ใช่ข้อมูลล่าสุด และไม่ได้หมายความว่าบริการล่ม';
      break;
  }

  return (
    <section className="hero" aria-busy={displayStatus === 'loading'}>
      <div className={`hero-banner ${displayStatus}`}>
        <div
          className="hero-icon"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: ICONS[displayStatus] }}
        ></div>
        <div className="hero-text">
          <p className="hero-kicker">
            <span className="hero-live-dot" aria-hidden="true"></span>
            {KICKERS[displayStatus]}
          </p>
          <h1 className="hero-title" aria-live="polite" aria-atomic="true">{TITLES[displayStatus]}</h1>
          <p className="hero-sub">{sub}</p>
          {displayStatus === 'error' && onRefresh && (
            <button type="button" className="hero-retry" onClick={onRefresh}>
              <RefreshIcon />
              ลองอีกครั้ง
            </button>
          )}
        </div>
        {aside}
      </div>
    </section>
  );
};
