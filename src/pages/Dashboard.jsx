import React, { useEffect, useState } from 'react';
import client from '../api/client';

function dateValue(d) { return d.toISOString().slice(0, 10); }

export default function Dashboard() {
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState(null);
  const [performers, setPerformers] = useState(null);

  useEffect(() => {
    const to = new Date();
    const from = new Date(Date.now() - 29 * 86400000);
    Promise.all([
      client.get('/branches'),
      client.get('/products'),
      client.get('/reports/sales', { params: { from: dateValue(from), to: dateValue(to) } }),
      client.get('/reports/top-performers', { params: { from: dateValue(from), to: dateValue(to) } }),
    ]).then(([branchRes, productRes, salesRes, performerRes]) => {
      setBranches(branchRes.data);
      setProducts(productRes.data);
      setSales(salesRes.data);
      setPerformers(performerRes.data);
    }).catch(() => {});
  }, []);

  const cashier = performers?.fastestCashier;
  const driver = performers?.fastestDriver;
  const most = sales?.mostOrderedProduct;

  return (
    <div>
      <h1>نظرة عامة</h1>
      <p style={{ color: 'var(--text-dark-muted)' }}>مؤشرات الأداء محسوبة على آخر 30 يوم. للتفاصيل واختيار فرع معيّن افتح صفحة التقارير.</p>
      <div className="grid">
        <div className="card"><h2>الفروع</h2><div style={{ fontSize: 32, fontWeight: 800 }}>{branches.length}</div></div>
        <div className="card"><h2>المنتجات</h2><div style={{ fontSize: 32, fontWeight: 800 }}>{products.length}</div></div>
        <div className="card"><h2>أكتر منتج اتطلب</h2><div style={{ fontSize: 23, fontWeight: 800, color: 'var(--gold)' }}>{most?._id || '—'}</div><div>{most ? `${most.quantitySold} قطعة` : 'مفيش بيانات كفاية'}</div></div>
        <div className="card"><h2>أسرع كاشير</h2><div style={{ fontSize: 23, fontWeight: 800 }}>{cashier?.name || '—'}</div>{cashier && <><div>متوسط قبول الطلب: <b>{cashier.avgAcceptMinutes} دقيقة</b></div><div>أسرع قبول: <b>{cashier.fastestAcceptMinutes} دقيقة</b></div><div>متوسط التحضير: <b>{cashier.avgPreparationMinutes != null ? `${cashier.avgPreparationMinutes} دقيقة` : '—'}</b></div></>}</div>
        <div className="card"><h2>أسرع دليفري</h2><div style={{ fontSize: 23, fontWeight: 800 }}>{driver?.name || '—'}</div>{driver && <><div>متوسط وقت التوصيل: <b>{driver.avgDeliveryMinutes} دقيقة</b></div><div>أسرع توصيلة: <b>{driver.fastestDeliveryMinutes} دقيقة</b></div><div>عدد التوصيلات: <b>{driver.deliveryCount}</b></div></>}</div>
        <div className="card"><h2>طلبات آخر 30 يوم</h2><div style={{ fontSize: 32, fontWeight: 800 }}>{sales?.totalOrders ?? '—'}</div><div>إجمالي: {sales ? `${sales.totalRevenue} ج.م` : '—'}</div></div>
      </div>
      <div className="card">
        <h2>الفروع النشطة</h2>
        <table><thead><tr><th>الاسم</th><th>العنوان</th><th>نطاق التوصيل</th></tr></thead><tbody>{branches.map((b) => <tr key={b._id}><td>{b.name}</td><td>{b.address}</td><td>{(b.deliveryRadiusMeters / 1000).toFixed(1)} كم</td></tr>)}</tbody></table>
      </div>
    </div>
  );
}
