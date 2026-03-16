
import { Icons } from './Icons';

export const IncidentHistory = () => `
  <div class="section">
    <div class="section-header">
      <h2 class="section-title">ประวัติเหตุการณ์</h2>
      <span class="section-meta">14 วันที่ผ่านมา</span>
    </div>
    <div class="incident-card" id="incidents">
      <div class="no-incidents">
        <span class="no-incidents-icon">${Icons.check}</span>
        ไม่มีเหตุการณ์ที่บันทึกไว้ในช่วงนี้
      </div>
    </div>
  </div>
`;
