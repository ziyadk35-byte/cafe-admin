import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { uploadImageToCloudinary } from '../api/imageUpload';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: 'hot',
  image: '',
  onSale: false,
  salePrice: '',
  availableBranches: [],
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const load = () => {
    client.get('/products').then((res) => setProducts(res.data));
    client.get('/branches').then((res) => setBranches(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleBranch = (branchId) => {
    setForm((f) => ({
      ...f,
      availableBranches: f.availableBranches.includes(branchId)
        ? f.availableBranches.filter((id) => id !== branchId)
        : [...f.availableBranches, branchId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.price) {
      setError('اسم المنتج والسعر مطلوبين');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        salePrice: form.onSale ? Number(form.salePrice) : undefined,
      };
      if (form.onSale && !form.salePrice) {
        setError('اكتب سعر العرض لو فعّلت خيار العرض');
        setSaving(false);
        return;
      }
      if (editingId) {
        await client.put(`/products/${editingId}`, payload);
      } else {
        await client.post('/products', payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'حصل خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category,
      image: product.image || '',
      onSale: product.onSale || false,
      salePrice: product.salePrice || '',
      availableBranches: product.availableBranches || [],
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('متأكد إنك عاوز تمسح المنتج ده؟')) return;
    await client.delete(`/products/${id}`);
    load();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploadingImage(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setForm((f) => ({ ...f, image: url }));
    } catch (err) {
      setError('فشل رفع الصورة، حاول تاني');
    } finally {
      setUploadingImage(false);
      e.target.value = ''; // allow re-selecting the same file later
    }
  };

  return (
    <div>
      <h1>المنتجات</h1>

      <div className="card">
        <h2>{editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
        <form onSubmit={handleSubmit}>
          <label>اسم المنتج</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <label>الوصف</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="form-row">
            <div>
              <label>السعر (ج.م)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <label>التصنيف</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="hot">سخن</option>
                <option value="cold">ساقع</option>
                <option value="food">أكل</option>
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              style={{ width: 'auto', margin: 0 }}
              checked={form.onSale}
              onChange={(e) => setForm({ ...form, onSale: e.target.checked })}
            />
            المنتج ده جزء من عرض حالي (يظهر في تاب "عروضنا")
          </label>
          {form.onSale && (
            <>
              <label>سعر العرض (ج.م)</label>
              <input
                type="number"
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                placeholder="أقل من السعر الأصلي"
              />
            </>
          )}

          <label>صورة المنتج</label>
          {form.image ? (
            <div style={{ marginBottom: 12 }}>
              <img
                src={form.image}
                alt="معاينة"
                style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 12, display: 'block', marginBottom: 8 }}
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setForm({ ...form, image: '' })}
              >
                إزالة الصورة
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
              {uploadingImage && <div style={{ fontSize: 12, color: 'var(--text-dark-muted)', marginTop: 6 }}>...جاري رفع الصورة</div>}
            </div>
          )}

          <label>متاح في الفروع (اتركها فاضية = كل الفروع)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {branches.map((b) => (
              <label
                key={b._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'var(--cream-soft)',
                  padding: '6px 10px',
                  borderRadius: 999,
                  fontSize: 13,
                  cursor: 'pointer',
                  margin: 0,
                }}
              >
                <input
                  type="checkbox"
                  style={{ width: 'auto', margin: 0 }}
                  checked={form.availableBranches.includes(b._id)}
                  onChange={() => toggleBranch(b._id)}
                />
                {b.name}
              </label>
            ))}
          </div>

          {error && <div className="error-text">{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" disabled={saving || uploadingImage}>
              {saving ? '...جاري الحفظ' : editingId ? 'حفظ التعديل' : 'إضافة المنتج'}
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
        <h2>المنتجات الحالية</h2>
        <div className="grid">
          {products.map((p) => (
            <div key={p._id} className="product-card">
              <img src={p.image || 'https://placehold.co/300x200/FAF3E6/241812?text=%20'} alt={p.name} />
              <div className="product-card-body">
                <div className="name">{p.name}</div>
                <div className="price">
                  {p.onSale ? (
                    <>
                      <span style={{ textDecoration: 'line-through', color: 'var(--text-dark-muted)', fontWeight: 600, fontSize: 12, marginLeft: 6 }}>
                        {p.price} ج.م
                      </span>
                      {p.salePrice} ج.م 🔥
                    </>
                  ) : (
                    `${p.price} ج.م`
                  )}
                </div>
                <div className="product-card-actions">
                  <button className="btn btn-outline" onClick={() => handleEdit(p)}>
                    تعديل
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(p._id)}>
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
