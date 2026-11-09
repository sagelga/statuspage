"use client";

import React, { useState } from "react";
import { ArrowUpRight, ChartColumn, Clock, Lock } from "lucide-react";
import BottomSheet from "@/components/ui/BottomSheet";
import { getCookiePreferences, setCookiePreferences } from "@/utils/cookies";
import "./CookieSettingsModal.css";

interface CookieSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface CookieSettingsContentProps {
  onClose: () => void;
  onSave: () => void;
}

const CookieSettingsContent: React.FC<CookieSettingsContentProps> = ({
  onClose,
  onSave,
}) => {
  // The content mounts fresh each time the sheet opens, so this captures the
  // latest saved choice without a state-syncing effect.
  const [initial] = useState(() => getCookiePreferences());
  const [analytics, setAnalytics] = useState(initial.analytics);

  const persist = (nextAnalytics: boolean) => {
    setCookiePreferences({
      functional: true,
      analytics: nextAnalytics,
      consentGiven: true,
      consentTimestamp: Date.now(),
    });
    onSave();
    onClose();
  };

  const consentLabel = initial.consentGiven
    ? initial.consentTimestamp
      ? `บันทึกความยินยอมล่าสุด: ${new Date(
          initial.consentTimestamp,
        ).toLocaleString("th-TH", {
          dateStyle: "medium",
          timeStyle: "short",
        })}`
      : "บันทึกความยินยอมแล้ว"
    : "ยังไม่ได้บันทึกการตั้งค่าในอุปกรณ์นี้";

  return (
    <div className="cookie-settings-content">
      <p className="cookie-settings-intro">
        เลือกได้ว่าอะไรควรเปิด คุกกี้ที่จำเป็นต้องเปิดไว้เพื่อให้เว็บไซต์ทำงานได้ตามปกติ
      </p>

      <div className="cookie-settings-list">
        <div className="cookie-category">
          <span className="cookie-category-icon" aria-hidden="true">
            <Lock size={17} strokeWidth={2} />
          </span>
          <div className="cookie-category-body">
            <div className="cookie-category-header">
              <div className="cookie-category-info">
                <h3 className="cookie-category-name">คุกกี้ที่จำเป็น</h3>
                <span className="cookie-category-badge">เปิดเสมอ</span>
              </div>
              <span
                className="cookie-category-toggle disabled"
                role="switch"
                aria-checked="true"
                aria-disabled="true"
                aria-label="คุกกี้ที่จำเป็น เปิดเสมอ"
                title="คุกกี้ที่จำเป็นไม่สามารถปิดได้"
              >
                <span className="toggle-track toggle-on">
                  <span className="toggle-thumb" />
                </span>
              </span>
            </div>
            <p className="cookie-category-description">
              จำเป็นต่อการจดจำการตั้งค่า การนำทาง และการทำงานพื้นฐานของเว็บไซต์
            </p>
          </div>
        </div>

        <div className="cookie-category">
          <span className="cookie-category-icon" aria-hidden="true">
            <ChartColumn size={17} strokeWidth={2} />
          </span>
          <div className="cookie-category-body">
            <div className="cookie-category-header">
              <div className="cookie-category-info">
                <h3 className="cookie-category-name">คุกกี้วิเคราะห์</h3>
              </div>
              <button
                type="button"
                className="cookie-category-toggle"
                role="switch"
                aria-checked={analytics}
                aria-label="คุกกี้วิเคราะห์"
                onClick={() => setAnalytics((prev) => !prev)}
              >
                <span
                  className={`toggle-track${analytics ? " toggle-on" : ""}`}
                >
                  <span className="toggle-thumb" />
                </span>
              </button>
            </div>
            <p className="cookie-category-description">
              ช่วยให้เราเห็นภาพรวมการใช้งานแบบไม่ระบุตัวตน
              เพื่อพัฒนาหน้าสถานะให้ดีขึ้น
            </p>
          </div>
        </div>
      </div>

      <div className="cookie-consent-meta">
        <Clock size={13} aria-hidden="true" />
        <span>{consentLabel}</span>
      </div>

      <div className="cookie-settings-actions">
        <button
          type="button"
          className="cookie-essential-btn"
          onClick={() => persist(false)}
        >
          ใช้เท่าที่จำเป็น
        </button>
        <button
          type="button"
          className="cookie-save-btn"
          onClick={() => persist(analytics)}
        >
          บันทึกการเลือก
        </button>
      </div>

      <div className="cookie-settings-foot">
        <a
          href="https://sagelga.com/privacy-policy"
          className="cookie-learn-more-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          นโยบายความเป็นส่วนตัว
          <ArrowUpRight size={12} aria-hidden="true" />
        </a>
        <span>เปลี่ยนใจได้ทุกเมื่อ</span>
      </div>
    </div>
  );
};

const CookieSettingsModal: React.FC<CookieSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="ตั้งค่าคุกกี้"
      eyebrow="ความเป็นส่วนตัว"
      variant="page"
      closeLabel="ปิด"
    >
      {isOpen ? (
        <CookieSettingsContent onClose={onClose} onSave={onSave} />
      ) : null}
    </BottomSheet>
  );
};

export default CookieSettingsModal;
