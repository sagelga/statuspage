import React from 'react';
import { HeroIcons, HeroTitles } from '../Icons';
import { ServiceStatus } from '../../types';
import './Hero.style.css';

interface HeroProps {
  status?: ServiceStatus | 'loading';
  checkedAt?: string;
  error?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ status = 'loading', checkedAt, error }) => {
  if (error) {
    const ErrorIcon = HeroIcons.down;
    return (
      <div className="hero">
        <div className="hero-banner down">
          <div className="hero-icon">
            <ErrorIcon />
          </div>
          <div className="hero-text">
            <h1 className="hero-title">ไม่สามารถโหลดสถานะได้</h1>
            <p className="hero-sub">กรุณาลองรีเฟรชหน้าเว็บ</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'operational' || status === 'loading') return null;

  const Icon = status === 'degraded' ? HeroIcons.degraded : HeroIcons.down;

  return (
    <div className="hero">
      <div className={`hero-banner ${status}`}>
        <div className="hero-icon">
          <Icon />
        </div>
        <div className="hero-text">
          <h1 className="hero-title">{HeroTitles[status] || status}</h1>
          <p className="hero-sub">
            ตรวจสอบล่าสุด:{' '}
            {checkedAt
              ? new Date(checkedAt).toLocaleString('th-TH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </p>
        </div>
      </div>
    </div>
  );
};
