import React, { useEffect, useState } from 'react';
import client from '../api/client';

const emptyForm = { name: '', address: '', phone: '', lat: '', lng: '', deliveryRadiusMeters: 8000, deliveryFee: 25 };

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => client.get('/branches').then((res) => setBranches(res.data));

  useEffect(() => {
    load();
  }, []);

  const toggleOpen = async (branch) => {
    await client.patch(`/branches/${branch._id}/toggle-open`, { isOpen: !branch.isOpen });
    load();
  };

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
      },
      () => setError('معرفناش نحدد موقعك، اكتب الإحداثيات يدويًا')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.address || !form.lat || !form.lng) {
      setError('املأ كل الحقول المطلوبة');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        address: form.address,
        phone: form.phone,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        deliveryRadiusMeters: Number(form.deliveryRadiusMeters),
        deliveryFee: Number(form.deliveryFee),
      };
      if (editingId) {
        await client.put(`/branches/${editingId}`, payload);
      } else {
        await client.post('/branches', payload);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'حصل خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (branch) => {
    setEditingId(branch._id);
    setForm({
      name: branch.name,
      address: branch.address,
      phone: branch.phone || '',
      lat: branch.location?.coordinates?.[1]?.toString() || '',
      lng: branch.location?.coordinates?.[0]?.toString() || '',
      deliveryRadiusMeters: branch.deliveryRadiusMeters,
      deliveryFee: branch.deliveryFee ?? 25,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  return (
    <div>
      <h1>الفروع</h1>

      <div className="card">
        <h2>{editingId ? 'تعديل الفرع' : 'إضافة فرع جديد'}</h2>
        <form onSubmit={handleSubmit}>
          <label>اسم الفرع</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <label>العنوان</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

          <label>رقم تليفون الفرع</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

          <div className="form-row">
            <div>
              <label>Latitude (خط العرض)</label>
              <input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
            </div>
            <div>
              <label>Longitude (خط الطول)</label>
              <input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
            </div>
          </div>
          <button type="button" className="btn btn-outline" onClick={useMyLocation} style={{ marginBottom: 12 }}>
            📍 استخدم موقعي الحالي
          </button>

          <label>نطاق التوصيل (متر)</label>
          <input
            type="number"
            value={form.deliveryRadiusMeters}
            onChange={(e) => setForm({ ...form, deliveryRadiusMeters: e.target.value })}
          />

          <label>رسوم التوصيل (جنيه)</label>
          <input
            type="number"
            value={form.deliveryFee}
            onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
          />

          {error && <div className="error-text">{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" disabled={saving}>
              {saving ? '...جاري الحفظ' : editingId ? 'حفظ التعديل' : 'إضافة الفرع'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={cancelEdit}>
                إلغاء
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>الفروع الحالية</h2>
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>العنوان</th>
              <th>التليفون</th>
              <th>نطاق التوصيل</th>
              <th>رسوم التوصيل</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b._id}>
                <td>{b.name}</td>
                <td>{b.address}</td>
                <td>{b.phone}</td>
                <td>{(b.deliveryRadiusMeters / 1000).toFixed(1)} كم</td>
                <td>{b.deliveryFee ?? 25} ج.م</td>
                <td>
                  <span className="badge" style={{ background: b.isOpen ? 'var(--olive-soft)' : '#F5D8D3' }}>
                    {b.isOpen ? 'مفتوح' : 'مقفول مؤقتًا'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline" onClick={() => handleEdit(b)}>
                    تعديل
                  </button>
                  <button className="btn btn-outline" onClick={() => toggleOpen(b)}>
                    {b.isOpen ? 'قفل مؤقت' : 'فتح تاني'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
