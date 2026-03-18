import React from 'react';
import { Icons } from '../Icons';
import './IncidentHistory.style.css';

export const IncidentHistory: React.FC = () => {
  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">ประวัติเหตุการณ์</h2>
        <span className="section-meta">14 วันที่ผ่านมา</span>
      </div>
      <div className="incident-card" id="incidents">
        <div className="no-incidents-empty">
          <div className="no-incidents-timeline">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="no-incidents-day" title={`${14 - i} วันที่แล้ว`}></div>
            ))}
          </div>
          <div className="no-incidents-body">
            <span className="no-incidents-icon" dangerouslySetInnerHTML={{ __html: Icons.check }}></span>
            <div>
              <p className="no-incidents-title">ทุกอย่างเรียบร้อยดีตลอด 14 วัน</p>
              <p className="no-incidents-sub">ไม่มีเหตุการณ์ที่ส่งผลต่อบริการในช่วงนี้ — ประวัติเหตุการณ์จะแสดงที่นี่เมื่อมีการบันทึก</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
