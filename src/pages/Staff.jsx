import React, { useEffect, useState } from 'react';
import client from '../api/client';

const emptyForm = { name: '', phone: '', password: '', role: 'branch_staff', branch: '' };

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filterBranch, setFilterBranch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    client.get('/staff').then((res) => setStaff(res.data));
    client.get('/branches').then((res) => setBranches(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (member) => {
    setEditingId(member._id);
    setForm({
      name: member.name,
      phone: member.phone,
      password: '',
      role: member.role,
      branch: member.branch?._id || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (editingId) {
      if (!form.name || !form.branch) {
        setError('الاسم والفرع مطلوبين');
        return;
      }
      setSaving(true);
      try {
        await client.put(`/staff/${editingId}`, {
          name: form.name,
          role: form.role,
          branch: form.branch,
        });
        cancelEdit();
        load();
      } catch (err) {
        setError(err.response?.data?.message || 'حصل خطأ في الحفظ');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!form.name || !form.phone || !form.password || !form.branch) {
      setError('املأ كل الحقول');
      return;
    }
    if (form.password.length < 6) {
      setError('كلمة المرور لازم تكون 6 حروف على الأقل');
      return;
    }
    setSaving(true);
    try {
      await client.post('/staff', form);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'حصل خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (member) => {
    await client.put(`/staff/${member._id}`, { isActive: !member.isActive });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('متأكد إنك عاوز تمسح الموظف ده؟')) return;
    await client.delete(`/staff/${id}`);
    load();
  };

  return (
    <div>
      <h1>الموظفين</h1>

      <div className="card">
        <h2>{editingId ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div>
              <label>الاسم</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            {!editingId && (
              <div>
                <label>رقم الموبايل</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            )}
          </div>

          <div className="form-row">
            {!editingId && (
              <div>
                <label>كلمة المرور المبدئية</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="هتديها للموظف بنفسك"
                />
              </div>
            )}
            <div>
              <label>الدور</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="branch_staff">كاشير / موظف فرع</option>
                <option value="driver">دليفري</option>
              </select>
            </div>
          </div>

          <label>الفرع</label>
          <select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
            <option value="">اختر فرع</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          {error && <div className="error-text">{error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn" disabled={saving}>
              {saving ? '...جاري الحفظ' : editingId ? 'حفظ التعديلات' : 'إضافة الموظف'}
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
        <h2>الموظفين الحاليين</h2>
        <label>فلترة حسب الفرع</label>
        <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} style={{ maxWidth: 260 }}>
          <option value="">كل الفروع</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الموبايل</th>
              <th>الدور</th>
              <th>الفرع</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {staff
              .filter((s) => !filterBranch || s.branch?._id === filterBranch)
              .map((s) => (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td>{s.phone}</td>
                <td>{s.role === 'branch_staff' ? 'كاشير' : 'دليفري'}</td>
                <td>{s.branch?.name || '—'}</td>
                <td>
                  <span className="badge" style={{ background: s.isActive ? 'var(--olive-soft)' : '#F5D8D3' }}>
                    {s.isActive ? 'شغال' : 'موقوف'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline" onClick={() => startEdit(s)}>
                    تعديل
                  </button>
                  <button className="btn btn-outline" onClick={() => toggleActive(s)}>
                    {s.isActive ? 'إيقاف' : 'تفعيل'}
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(s._id)}>
                    حذف
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--text-dark-muted)' }}>
                  لسه مفيش موظفين مضافين
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
