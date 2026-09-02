import React, { useEffect, useState } from 'react';
import client from '../api/client';

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

export default function Reports() {
  const [from, setFrom] = useState(toDateInputValue(new Date(Date.now() - 7 * 86400000)));
  const [to, setTo] = useState(toDateInputValue(new Date()));
  const [report, setReport] = useState(null);

  const load = () => {
    client.get('/reports/sales', { params: { from, to } }).then((res) => setReport(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const setPreset = (days) => {
    setFrom(toDateInputValue(new Date(Date.now() - days * 86400000)));
    setTo(toDateInputValue(new Date()));
  };

  return (
    <div>
      <h1>تقرير المبيعات</h1>

      <div className="card">
        <div className="form-row" style={{ alignItems: 'flex-end' }}>
          <div>
            <label>من تاريخ</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label>إلى تاريخ</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <button className="btn" onClick={load} style={{ marginBottom: 12 }}>
              تحديث
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => { setPreset(1); load(); }}>
            اليوم
          </button>
          <button className="btn btn-outline" onClick={() => { setPreset(7); load(); }}>
            آخر أسبوع
          </button>
          <button className="btn btn-outline" onClick={() => { setPreset(30); load(); }}>
            آخر شهر
          </button>
        </div>
      </div>

      {report && (
        <>
          <div className="grid">
            <div className="card">
              <h2>إجمالي المبيعات</h2>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold)' }}>
                {report.totalRevenue} ج.م
              </div>
            </div>
            <div className="card">
              <h2>عدد الطلبات</h2>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{report.totalOrders}</div>
            </div>
            <div className="card">
              <h2>متوسط قيمة الطلب</h2>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{report.avgOrderValue} ج.م</div>
            </div>
          </div>

          <div className="card">
            <h2>المبيعات حسب الفرع</h2>
            <table>
              <thead>
                <tr>
                  <th>الفرع</th>
                  <th>المبيعات</th>
                  <th>عدد الطلبات</th>
                </tr>
              </thead>
              <tbody>
                {report.byBranch.map((b) => (
                  <tr key={b._id}>
                    <td>{b.branchName}</td>
                    <td>{b.revenue} ج.م</td>
                    <td>{b.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2>الأكتر مبيعًا</h2>
            <table>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الكمية المباعة</th>
                  <th>الإيراد</th>
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((p) => (
                  <tr key={p._id}>
                    <td>{p._id}</td>
                    <td>{p.quantitySold}</td>
                    <td>{p.revenue} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
