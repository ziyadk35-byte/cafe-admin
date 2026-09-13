import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { uploadImageToCloudinary } from '../api/imageUpload';

const emptyForm = {
  name: '', nameEn: '', description: '', descriptionEn: '', ingredients: '', ingredientsEn: '',
  price: '', category: 'hot', image: '', onSale: false, salePrice: '', availableBranches: [],
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const load = () => {
    client.get('/products').then((res) => setProducts(res.data));
    client.get('/branches').then((res) => setBranches(res.data));
  };
  useEffect(() => { load(); }, []);

  const toggleBranch = (branchId) => setForm((f) => ({ ...f, availableBranches: f.availableBranches.includes(branchId) ? f.availableBranches.filter((id) => id !== branchId) : [...f.availableBranches, branchId] }));
  const splitIngredients = (value) => value.split(/[,،\n]/).map((x) => x.trim()).filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.name || !form.price) return setError('اسم المنتج والسعر مطلوبين');
    if (form.onSale && !form.salePrice) return setError('اكتب سعر العرض لو فعّلت خيار العرض');
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), salePrice: form.onSale ? Number(form.salePrice) : undefined, ingredients: splitIngredients(form.ingredients), ingredientsEn: splitIngredients(form.ingredientsEn) };
      if (editingId) await client.put(`/products/${editingId}`, payload); else await client.post('/products', payload);
      setForm(emptyForm); setEditingId(null); load();
    } catch (err) { setError(err.response?.data?.message || 'حصل خطأ في الحفظ'); }
    finally { setSaving(false); }
  };

  const seedDemo = async () => {
    if (!confirm('هيتم إضافة/تحديث منتجات تجريبية في كل الأصناف مع صور ومكونات وعروض. تكمل؟')) return;
    setSeeding(true); setError('');
    try { const { data } = await client.post('/products/seed-demo'); alert(`تم تجهيز المنتجات التجريبية. جديد: ${data.createdCount} - تم تحديثه: ${data.updatedCount}`); load(); }
    catch (err) { setError(err.response?.data?.message || 'فشل إضافة المنتجات التجريبية'); }
    finally { setSeeding(false); }
  };

  const handleEdit = (p) => { setEditingId(p._id); setForm({ name: p.name, nameEn: p.nameEn || '', description: p.description || '', descriptionEn: p.descriptionEn || '', ingredients: (p.ingredients || []).join('، '), ingredientsEn: (p.ingredientsEn || []).join(', '), price: p.price, category: p.category, image: p.image || '', onSale: !!p.onSale, salePrice: p.salePrice || '', availableBranches: p.availableBranches || [] }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleDelete = async (id) => { if (!confirm('متأكد إنك عاوز تمسح المنتج ده؟')) return; await client.delete(`/products/${id}`); load(); };
  const cancelEdit = () => { setEditingId(null); setForm(emptyForm); setError(''); };
  const handleImageUpload = async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploadingImage(true); setError(''); try { const url = await uploadImageToCloudinary(file); setForm((f) => ({ ...f, image: url })); } catch { setError('فشل رفع الصورة، حاول تاني'); } finally { setUploadingImage(false); e.target.value = ''; } };

  return <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><h1>المنتجات</h1><button className="btn" onClick={seedDemo} disabled={seeding}>{seeding ? '...جاري الإضافة' : '🧪 إضافة منتجات تجريبية بالصور والعروض'}</button></div>
    <div className="card"><h2>{editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2><form onSubmit={handleSubmit}>
      <div className="form-row"><div><label>اسم المنتج بالعربي</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></div><div><label>اسم المنتج بالإنجليزي</label><input dir="ltr" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })}/></div></div>
      <div className="form-row"><div><label>الوصف بالعربي</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></div><div><label>الوصف بالإنجليزي</label><textarea dir="ltr" rows={3} value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}/></div></div>
      <div className="form-row"><div><label>المكونات بالعربي (افصل بفاصلة)</label><textarea rows={2} value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })}/></div><div><label>Ingredients in English</label><textarea dir="ltr" rows={2} value={form.ingredientsEn} onChange={(e) => setForm({ ...form, ingredientsEn: e.target.value })}/></div></div>
      <div className="form-row"><div><label>السعر</label><input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}/></div><div><label>القسم</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="hot">سخن</option><option value="cold">ساقع</option><option value="food">أكل</option></select></div></div>
      <label>صورة المنتج</label><div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="رابط الصورة أو ارفع صورة" style={{ flex: 1, minWidth: 250 }}/><label className="btn btn-outline" style={{ cursor: 'pointer', margin: 0 }}>{uploadingImage ? '...رفع' : 'رفع صورة'}<input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }}/></label>{form.image && <img src={form.image} alt="preview" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 10 }}/>}</div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}><input type="checkbox" checked={form.onSale} onChange={(e) => setForm({ ...form, onSale: e.target.checked })} style={{ width: 'auto' }}/> المنتج عليه عرض</label>
      {form.onSale && <div><label>سعر العرض</label><input type="number" step="0.01" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })}/></div>}
      <label>الفروع المتاح فيها المنتج</label><p style={{ color: 'var(--text-dark-muted)', marginTop: 0 }}>لو ما اخترتش أي فرع، المنتج هيكون متاح في كل الفروع.</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>{branches.map((b) => <label key={b._id} style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'var(--cream-soft)', padding: '8px 10px', borderRadius: 10 }}><input type="checkbox" style={{ width: 'auto' }} checked={form.availableBranches.includes(b._id)} onChange={() => toggleBranch(b._id)}/>{b.name}</label>)}</div>
      {error && <div className="error-text">{error}</div>}<div style={{ display: 'flex', gap: 8 }}><button className="btn" disabled={saving}>{saving ? '...جاري الحفظ' : editingId ? 'حفظ التعديل' : 'إضافة المنتج'}</button>{editingId && <button type="button" className="btn btn-outline" onClick={cancelEdit}>إلغاء</button>}</div>
    </form></div>

    <div className="card"><h2>المنتجات الحالية</h2><table><thead><tr><th>الصورة</th><th>الاسم</th><th>المكونات</th><th>القسم</th><th>السعر</th><th>العرض</th><th></th></tr></thead><tbody>{products.map((p) => <tr key={p._id}><td>{p.image ? <img src={p.image} alt="" style={{ width: 55, height: 55, objectFit: 'cover', borderRadius: 8 }}/> : '—'}</td><td><strong>{p.name}</strong><div style={{ fontSize: 12, color: 'var(--text-dark-muted)' }}>{p.nameEn}</div></td><td style={{ maxWidth: 280 }}>{(p.ingredients || []).join('، ') || '—'}</td><td>{p.category === 'hot' ? 'سخن' : p.category === 'cold' ? 'ساقع' : 'أكل'}</td><td>{p.price} ج.م</td><td>{p.onSale ? <span className="badge" style={{ background: '#F5D8D3' }}>{p.salePrice} ج.م 🔥</span> : '—'}</td><td style={{ display: 'flex', gap: 6 }}><button className="btn btn-outline" onClick={() => handleEdit(p)}>تعديل</button><button className="btn btn-danger" onClick={() => handleDelete(p._id)}>حذف</button></td></tr>)}{products.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>مفيش منتجات. استخدم زر المنتجات التجريبية للاختبار.</td></tr>}</tbody></table></div>
  </div>;
}
