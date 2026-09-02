import React, { useEffect, useState } from 'react';
import client from '../api/client';

const emptyForm = { code: '', discountPercent: 10, expiresAt: '', usageLimit: '' };

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => client.get('/coupons').then((res) => setCoupons(res.data));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.code || !form.discountPercent) {
      setError('اكتب الكود ونسبة الخصم');
      return;
    }
    setSaving(true);
    try {
      await client.post('/coupons', {
        code: form.code,
        discountPercent: Number(form.discountPercent),
        expiresAt: form.expiresAt || null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'حصل خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon) => {
    await client.put(`/coupons/${coupon._id}`, { isActive: !coupon.isActive });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('متأكد إنك عاوز تمسح الكوبون ده؟')) return;
    await client.delete(`/coupons/${id}`);
    load();
  };

  return (
    <div>
      <h1>كوبونات الخصم</h1>

      <div className="card">
        <h2>كوبون جديد</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div>
              <label>الكود (مثال: WELCOME10)</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <label>نسبة الخصم %</label>
              <input
                type="number"
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div>
              <label>تاريخ الانتهاء (اختياري)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
            <div>
              <label>عدد مرات الاستخدام المسموحة (اختياري)</label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                placeholder="سيبها فاضية = بلا حدود"
              />
            </div>
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="btn" disabled={saving}>
            {saving ? '...جاري الحفظ' : 'إضافة الكوبون'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>الكوبونات الحالية</h2>
        <table>
          <thead>
            <tr>
              <th>الكود</th>
              <th>الخصم</th>
              <th>الاستخدام</th>
              <th>ينتهي</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c._id}>
                <td style={{ fontWeight: 700 }}>{c.code}</td>
                <td>{c.discountPercent}%</td>
                <td>
                  {c.usedCount} / {c.usageLimit || '∞'}
                </td>
                <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('ar-EG') : '—'}</td>
                <td>
                  <span className="badge" style={{ background: c.isActive ? 'var(--olive-soft)' : '#F5D8D3' }}>
                    {c.isActive ? 'شغال' : 'موقوف'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline" onClick={() => toggleActive(c)}>
                    {c.isActive ? 'إيقاف' : 'تفعيل'}
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(c._id)}>
                    حذف
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--text-dark-muted)' }}>
                  لسه مفيش كوبونات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
