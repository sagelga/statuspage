import React from 'react';
import './ApiSection.style.css';

export const ApiSection: React.FC = () => {
  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">JSON API</h2>
      </div>
      <div className="api-card">
        <div className="api-line"><span className="api-method">GET</span> <a href="/api/status">/api/status</a></div>
        <p className="api-desc">รองรับการเรียกใช้งานผ่านโปรแกรม &bull; ไม่จำกัดอัตราการเรียก &bull; อนุญาต CORS ทุกโดเมน</p>
      </div>
    </div>
  );
};
