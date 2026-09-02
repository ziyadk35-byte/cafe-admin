import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import client, { API_BASE_URL } from '../api/client';

const STATUS_LABELS = {
  pending: 'جديد',
  confirmed: 'مؤكد',
  preparing: 'بيتحضّر',
  out_for_delivery: 'مع الدليفري',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
};

const NEXT_STATUS = { pending: 'confirmed', confirmed: 'preparing' };
const CURRENT_STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery'];

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Orders() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('current'); // 'current' | 'completed'
  const [detailOrder, setDetailOrder] = useState(null);
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [dispatching, setDispatching] = useState(false);
  const [driverDistances, setDriverDistances] = useState({}); // orderId -> meters
  const socketRef = useRef(null);

  useEffect(() => {
    client.get('/branches').then((res) => {
      setBranches(res.data);
      if (res.data.length > 0) setSelectedBranch(res.data[0]._id);
    });
  }, []);

  const loadOrders = () => {
    if (!selectedBranch) return;
    client.get(`/orders/branch/${selectedBranch}`).then((res) => setOrders(res.data));
  };

  useEffect(() => {
    loadOrders();
    if (!selectedBranch) return;

    socketRef.current?.disconnect();
    const socket = io(API_BASE_URL.replace('/api', ''));
    socketRef.current = socket;
    socket.emit('join_branch', selectedBranch);
    socket.on('new_order', loadOrders);
    socket.on('order_status_updated', loadOrders);
    socket.on('driver_location_updated', (payload) => {
      setOrders((prev) => {
        const order = prev.find((o) => o._id === payload.orderId);
        if (order?.deliveryAddress) {
          const dist = haversine(
            payload.lat,
            payload.lng,
            order.deliveryAddress.location.coordinates[1],
            order.deliveryAddress.location.coordinates[0]
          );
          setDriverDistances((d) => ({ ...d, [payload.orderId]: Math.round(dist) }));
        }
        return prev;
      });
    });

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  const advanceStatus = async (order) => {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;
    await client.patch(`/orders/${order._id}/status`, { status: nextStatus });
    loadOrders();
  };

  const openDispatchModal = async (order) => {
    setDispatchOrder(order);
    try {
      const { data } = await client.get('/staff', { params: { branchId: selectedBranch, role: 'driver' } });
      setDrivers(data.filter((d) => d.isActive));
    } catch {
      setDrivers([]);
    }
  };

  const confirmDispatch = async (driverId) => {
    if (!dispatchOrder) return;
    setDispatching(true);
    try {
      await client.patch(`/orders/${dispatchOrder._id}/dispatch`, { driverId });
      setDispatchOrder(null);
      loadOrders();
    } finally {
      setDispatching(false);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!confirm('متأكد إنك عاوز تمسح الطلب ده نهائي؟')) return;
    await client.delete(`/orders/${id}`);
    setDetailOrder(null);
    loadOrders();
  };

  const handleDeleteToday = async () => {
    if (!selectedBranch) return;
    if (!confirm('هيتمسح كل طلبات النهاردة للفرع ده نهائي. متأكد؟')) return;
    const { data } = await client.delete(`/orders/branch/${selectedBranch}/day`);
    alert(`اتمسح ${data.deletedCount} طلب`);
    loadOrders();
  };

  const filtered = orders.filter((o) =>
    tab === 'current' ? CURRENT_STATUSES.includes(o.status) : !CURRENT_STATUSES.includes(o.status)
  );

  return (
    <div>
      <h1>الطلبات</h1>

      <div className="card">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label>اختر الفرع</label>
            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-danger" onClick={handleDeleteToday} style={{ marginBottom: 12 }}>
            🗑️ امسح كل طلبات النهاردة للفرع ده
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            className={tab === 'current' ? 'btn' : 'btn btn-outline'}
            onClick={() => setTab('current')}
          >
            الطلبات الحالية
          </button>
          <button
            className={tab === 'completed' ? 'btn' : 'btn btn-outline'}
            onClick={() => setTab('completed')}
          >
            الطلبات المكتملة
          </button>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>رقم الطلب</th>
              <th>العميل</th>
              <th>الإجمالي</th>
              <th>الدفع</th>
              <th>الحالة</th>
              <th>التاريخ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o._id}>
                <td style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(o)}>
                  #{o._id.slice(-6)}
                </td>
                <td style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(o)}>
                  {o.customer?.name || '—'}
                </td>
                <td>{o.total} ج.م</td>
                <td>{o.paymentMethod === 'cash' ? 'كاش' : 'أونلاين'}</td>
                <td>
                  <span className="badge">{STATUS_LABELS[o.status]}</span>
                  {o.status === 'out_for_delivery' && driverDistances[o._id] != null && (
                    <div style={{ fontSize: 11, color: 'var(--olive)', marginTop: 4 }}>
                      🚴{' '}
                      {driverDistances[o._id] < 1000
                        ? `${driverDistances[o._id]} متر`
                        : `${(driverDistances[o._id] / 1000).toFixed(1)} كم`}{' '}
                      من العميل
                    </div>
                  )}
                </td>
                <td>{new Date(o.createdAt).toLocaleString('ar-EG')}</td>
                <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {NEXT_STATUS[o.status] && (
                    <button className="btn btn-outline" onClick={() => advanceStatus(o)}>
                      التالي: {STATUS_LABELS[NEXT_STATUS[o.status]]}
                    </button>
                  )}
                  {o.status === 'preparing' && (
                    <button className="btn" onClick={() => openDispatchModal(o)}>
                      🚴 عيّن دليفري
                    </button>
                  )}
                  {!CURRENT_STATUSES.includes(o.status) && (
                    <button className="btn btn-danger" onClick={() => handleDeleteOrder(o._id)}>
                      حذف
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--text-dark-muted)' }}>
                  مفيش طلبات في القسم ده دلوقتي
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order detail modal */}
      {detailOrder && (
        <div
          onClick={() => setDetailOrder(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ width: 480, maxHeight: '85vh', overflowY: 'auto' }}
          >
            <h2 style={{ marginTop: 0 }}>تفاصيل الطلب #{detailOrder._id.slice(-6)}</h2>
            <p>
              <span className="badge">{STATUS_LABELS[detailOrder.status]}</span>
            </p>

            <h3>بيانات العميل</h3>
            <p>الاسم: {detailOrder.customer?.name || '—'}</p>
            <p>الموبايل: {detailOrder.deliveryAddress?.contactPhone || detailOrder.customer?.phone || '—'}</p>
            {detailOrder.deliveryAddress?.contactPhone2 && (
              <p>موبايل تاني: {detailOrder.deliveryAddress.contactPhone2}</p>
            )}
            <p>العنوان: {detailOrder.deliveryAddress?.address}</p>

            <h3>المنتجات</h3>
            {detailOrder.items.map((li, idx) => (
              <p key={idx}>
                {li.quantity} × {li.name} — {li.price * li.quantity} ج.م
              </p>
            ))}
            <p>
              <strong>
                الإجمالي: {detailOrder.total} ج.م ({detailOrder.paymentMethod === 'cash' ? 'كاش' : 'مدفوع أونلاين'})
              </strong>
            </p>

            <h3>مسار الطلب</h3>
            <p>وافق عليه: {detailOrder.confirmedBy?.name || 'لسه ماحدش وافق'}</p>
            <p>
              الدليفري:{' '}
              {detailOrder.driver ? `${detailOrder.driver.name} - ${detailOrder.driver.phone}` : 'لسه ماتحددش'}
            </p>

            {detailOrder.deliveryPhoto && (
              <>
                <h3>صورة تأكيد التسليم</h3>
                <img
                  src={detailOrder.deliveryPhoto}
                  alt="delivery proof"
                  style={{ width: '100%', borderRadius: 12 }}
                />
              </>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setDetailOrder(null)}>
                إغلاق
              </button>
              <button className="btn btn-danger" onClick={() => handleDeleteOrder(detailOrder._id)}>
                حذف الطلب ده
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch driver modal */}
      {dispatchOrder && (
        <div
          onClick={() => setDispatchOrder(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 420 }}>
            <h2 style={{ marginTop: 0 }}>عيّن دليفري</h2>
            <p style={{ color: 'var(--text-dark-muted)' }}>اختار الدليفري اللي هيوصّل الطلب ده</p>

            {drivers.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-dark-muted)' }}>
                مفيش دليفري شغال دلوقتي في الفرع ده
              </p>
            ) : (
              drivers.map((d) => (
                <div
                  key={d._id}
                  onClick={() => !dispatching && confirmDispatch(d._id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--cream-soft)',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                    cursor: dispatching ? 'default' : 'pointer',
                  }}
                >
                  <span className="badge" style={{ background: 'var(--olive-soft)' }}>
                    {d.activeOrderCount > 0 ? `${d.activeOrderCount} طلب معاه` : 'فاضي'}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dark-muted)' }}>{d.phone}</div>
                  </div>
                </div>
              ))
            )}

            <button className="btn btn-outline" onClick={() => setDispatchOrder(null)} style={{ marginTop: 8 }}>
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
