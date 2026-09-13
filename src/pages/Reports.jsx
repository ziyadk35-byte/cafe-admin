import React, { useEffect, useState } from 'react';
import client from '../api/client';

function toDateInputValue(date) { return date.toISOString().slice(0, 10); }

export default function Reports() {
  const [from, setFrom] = useState(toDateInputValue(new Date(Date.now() - 7 * 86400000)));
  const [to, setTo] = useState(toDateInputValue(new Date()));
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [report, setReport] = useState(null);
  const [topPerformers, setTopPerformers] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async (override = {}) => {
    setLoading(true);
    try {
      const params = { from: override.from ?? from, to: override.to ?? to };
      const selected = override.branchId ?? branchId;
      if (selected) params.branchId = selected;
      const [sales, performers] = await Promise.all([
        client.get('/reports/sales', { params }),
        client.get('/reports/top-performers', { params }),
      ]);
      setReport(sales.data); setTopPerformers(performers.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { client.get('/branches').then((res) => setBranches(res.data)); load(); }, []);

  const applyPreset = (days) => {
    const nextFrom = toDateInputValue(new Date(Date.now() - (days - 1) * 86400000));
    const nextTo = toDateInputValue(new Date());
    setFrom(nextFrom); setTo(nextTo); load({ from: nextFrom, to: nextTo });
  };

  return <div>
    <h1>التقارير والأداء</h1>
    <div className="card">
      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <div><label>الفرع</label><select value={branchId} onChange={(e) => setBranchId(e.target.value)}><option value="">كل الفروع</option>{branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></div>
        <div><label>من تاريخ</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)}/></div>
        <div><label>إلى تاريخ</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)}/></div>
        <div><button className="btn" onClick={() => load()} style={{ marginBottom: 12 }} disabled={loading}>{loading ? '...جاري التحديث' : 'تحديث'}</button></div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button className="btn btn-outline" onClick={() => applyPreset(1)}>اليوم</button><button className="btn btn-outline" onClick={() => applyPreset(7)}>آخر أسبوع</button><button className="btn btn-outline" onClick={() => applyPreset(30)}>آخر شهر</button></div>
    </div>

    {report && <>
      <div className="grid">
        <div className="card"><h2>إجمالي المبيعات</h2><div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold)' }}>{report.totalRevenue} ج.م</div></div>
        <div className="card"><h2>عدد الطلبات</h2><div style={{ fontSize: 28, fontWeight: 800 }}>{report.totalOrders}</div></div>
        <div className="card"><h2>متوسط قيمة الطلب</h2><div style={{ fontSize: 28, fontWeight: 800 }}>{report.avgOrderValue} ج.م</div></div>
        <div className="card"><h2>أكتر منتج اتطلب</h2><div style={{ fontSize: 22, fontWeight: 800 }}>{report.mostOrderedProduct?._id || '—'}</div><small>{report.mostOrderedProduct ? `${report.mostOrderedProduct.quantitySold} قطعة` : 'مفيش بيانات'}</small></div>
      </div>

      <div className="card"><h2>المبيعات حسب الفرع</h2><table><thead><tr><th>الفرع</th><th>المبيعات</th><th>عدد الطلبات</th></tr></thead><tbody>{report.byBranch.map((b) => <tr key={b._id}><td>{b.branchName}</td><td>{b.revenue} ج.م</td><td>{b.orders}</td></tr>)}{report.byBranch.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center' }}>مفيش بيانات</td></tr>}</tbody></table></div>

      <div className="card"><h2>الأكتر طلبًا</h2><table><thead><tr><th>المنتج</th><th>الكمية المباعة</th><th>الإيراد</th></tr></thead><tbody>{report.topProducts.map((p) => <tr key={p._id}><td>{p._id}</td><td>{p.quantitySold}</td><td>{p.revenue} ج.م</td></tr>)}{report.topProducts.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center' }}>مفيش بيانات في الفترة دي</td></tr>}</tbody></table></div>
    </>}

    {topPerformers && <>
      <div className="card"><h2>⚡ أسرع الكاشيرز</h2><p style={{ color: 'var(--text-dark-muted)' }}>الترتيب حسب متوسط الوقت من ظهور الطلب للكاشير (وبعد نجاح الدفع الأونلاين) لحد قبوله. مدة التحضير محسوبة من بداية التحضير لحد تعيين الدليفري.</p><table><thead><tr><th>الكاشير</th><th>الموبايل</th><th>طلبات قبلها</th><th>متوسط وقت القبول</th><th>أسرع قبول</th><th>متوسط التحضير</th></tr></thead><tbody>{topPerformers.topCashiers.map((c, i) => <tr key={c._id}><td>{i === 0 ? '🏆 ' : ''}{c.name}</td><td>{c.phone}</td><td>{c.acceptedOrders}</td><td>{c.avgAcceptMinutes} دقيقة</td><td>{c.fastestAcceptMinutes} دقيقة</td><td>{c.avgPreparationMinutes != null ? `${c.avgPreparationMinutes} دقيقة` : '—'}</td></tr>)}{topPerformers.topCashiers.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center' }}>الطلبات القديمة قبل التحديث مش مسجل فيها توقيت القبول؛ البيانات هتظهر مع الطلبات الجديدة.</td></tr>}</tbody></table></div>

      <div className="card"><h2>🚴 أسرع الدليفريز</h2><p style={{ color: 'var(--text-dark-muted)' }}>الوقت محسوب من لحظة تعيين الدليفري لحد لحظة تسجيل الطلب كمُسلّم، مش من updatedAt.</p><table><thead><tr><th>الدليفري</th><th>الموبايل</th><th>عدد التوصيلات</th><th>متوسط وقت التوصيل</th><th>أسرع توصيلة</th></tr></thead><tbody>{topPerformers.topDrivers.map((d, i) => <tr key={d._id}><td>{i === 0 ? '🏆 ' : ''}{d.name}</td><td>{d.phone}</td><td>{d.deliveryCount}</td><td>{d.avgDeliveryMinutes} دقيقة</td><td>{d.fastestDeliveryMinutes} دقيقة</td></tr>)}{topPerformers.topDrivers.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center' }}>مفيش بيانات توصيل في الفترة دي</td></tr>}</tbody></table></div>

      <div className="card"><h2>🏆 أكتر العملاء طلبًا</h2><table><thead><tr><th>العميل</th><th>الموبايل</th><th>عدد الطلبات</th><th>إجمالي الصرف</th></tr></thead><tbody>{topPerformers.topCustomers.map((c) => <tr key={c._id}><td>{c.name}</td><td>{c.phone}</td><td>{c.orderCount}</td><td>{c.totalSpent} ج.م</td></tr>)}{topPerformers.topCustomers.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center' }}>مفيش بيانات في الفترة دي</td></tr>}</tbody></table></div>
    </>}
  </div>;
}
