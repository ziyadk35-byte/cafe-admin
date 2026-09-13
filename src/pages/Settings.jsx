import React, { useEffect, useState } from 'react';
import client from '../api/client';

export default function Settings() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    client.get('/loyalty/settings').then((res) => setForm(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await client.put('/loyalty/settings', {
        pointsThreshold: Number(form.pointsThreshold),
        pointsDiscountAmount: Number(form.pointsDiscountAmount),
        subscriptionPriceEGP: Number(form.subscriptionPriceEGP),
        subscriptionDiscountPercent: Number(form.subscriptionDiscountPercent),
      });
      setForm(data);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (!form) return null;

  return (
    <div>
      <h1>الإعدادات</h1>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h2>⭐ نقط الولاء</h2>
          <p style={{ color: 'var(--text-dark-muted)' }}>
            العميل ياخد نقطة على كل 10 جنيه بيصرفهم (بيتحسبوا تلقائي، ده مش قابل للتعديل).
          </p>

          <div className="form-row">
            <div>
              <label>عدد النقط المطلوب للخصم</label>
              <input
                type="number"
                value={form.pointsThreshold}
                onChange={(e) => setForm({ ...form, pointsThreshold: e.target.value })}
              />
            </div>
            <div>
              <label>قيمة الخصم (جنيه)</label>
              <input
                type="number"
                value={form.pointsDiscountAmount}
                onChange={(e) => setForm({ ...form, pointsDiscountAmount: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2>📅 الاشتراك الشهري</h2>
          <p style={{ color: 'var(--text-dark-muted)' }}>
            العميل يدفع مرة واحدة كل شهر ويحصل على خصم على كل طلباته طول الفترة دي.
          </p>

          <div className="form-row">
            <div>
              <label>سعر الاشتراك الشهري (جنيه)</label>
              <input
                type="number"
                value={form.subscriptionPriceEGP}
                onChange={(e) => setForm({ ...form, subscriptionPriceEGP: e.target.value })}
              />
            </div>
            <div>
              <label>نسبة الخصم أثناء الاشتراك (%)</label>
              <input
                type="number"
                value={form.subscriptionDiscountPercent}
                onChange={(e) => setForm({ ...form, subscriptionDiscountPercent: e.target.value })}
              />
            </div>
          </div>
        </div>

        <button className="btn" disabled={saving}>
          {saving ? '...جاري الحفظ' : 'حفظ الإعدادات'}
        </button>
        {saved && <span style={{ color: 'var(--olive)', marginRight: 12 }}>✓ تم الحفظ</span>}
      </form>
    </div>
  );
}
