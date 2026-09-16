import React, { useState, useEffect } from 'react';

export default function AdminProducts() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [products, setProducts] = useState([]);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState(100);

  // Order Limit state
  const [orderLimit, setOrderLimit] = useState(50);
  const [orderLimitInput, setOrderLimitInput] = useState('');
  const [limitMsg, setLimitMsg] = useState('');

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      setToken('');
      localStorage.removeItem('adminToken');
    }
  };

  const login = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      setToken(data.data.token);
      localStorage.setItem('adminToken', data.data.token);
      fetchProducts();
    } else {
      alert(data.error);
    }
  };

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success) {
      setProducts(data.data);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchOrderLimit();
    }
  }, [token]);

  const fetchOrderLimit = async () => {
    try {
      const res = await fetch('/api/settings/order-limit');
      const data = await res.json();
      if (data.success) {
        setOrderLimit(data.data.order_item_limit);
        setOrderLimitInput(String(data.data.order_item_limit));
      }
    } catch (e) {
      console.error('Failed to fetch order limit', e);
    }
  };

  const updateOrderLimit = async (e) => {
    e.preventDefault();
    const val = parseInt(orderLimitInput, 10);
    if (isNaN(val) || val < 1 || val > 500) {
      setLimitMsg('Limit harus antara 1 dan 500');
      return;
    }
    try {
      const res = await fetch('/api/settings/order-limit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order_item_limit: val })
      });
      const data = await res.json();
      if (data.success) {
        setOrderLimit(val);
        setLimitMsg('✅ Berhasil disimpan');
        setTimeout(() => setLimitMsg(''), 3000);
      } else {
        setLimitMsg(data.error || 'Gagal menyimpan');
      }
    } catch (e) {
      setLimitMsg('Network error');
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, price, sku, stock_qty: stock, is_active: true, category: 'Dimsum' })
    });
    const data = await res.json();
    if (data.success) {
      fetchProducts();
      setName('');
      setPrice('');
      setSku('');
    } else {
      alert(data.error);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      fetchProducts();
    } else {
      alert(data.error);
    }
  };

  const uploadImage = async (id, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    
    const res = await fetch(`/api/products/${id}/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await res.json();
    if (data.success) {
      fetchProducts();
    } else {
      alert(data.error);
    }
  };

  if (!token) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        <form onSubmit={login} className="flex flex-col gap-3">
          <input className="border p-2" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
          <input className="border p-2" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
          <button className="bg-blue-600 text-white p-2" type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Admin Products</h1>
          <a href="/admin/banners" className="text-blue-500 hover:underline">Go to Banners</a>
        </div>
        <button onClick={handleLogout} className="text-red-500">Logout</button>
      </div>

      {/* Order Limit Settings */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded mb-6">
        <h2 className="font-bold mb-2 text-amber-800">⚙️ Pengaturan Order Limit</h2>
        <p className="text-sm text-amber-700 mb-3">
          Batas maksimum total item yang dapat dibeli customer dalam satu transaksi. (Saat ini: <strong>{orderLimit}</strong> item)
        </p>
        <form onSubmit={updateOrderLimit} className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="500"
            value={orderLimitInput}
            onChange={e => setOrderLimitInput(e.target.value)}
            className="border border-amber-300 p-2 w-24 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="Limit"
          />
          <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition-colors">
            Simpan
          </button>
          {limitMsg && <span className={`text-sm ml-2 ${limitMsg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{limitMsg}</span>}
        </form>
      </div>

      <div className="bg-gray-100 p-4 rounded mb-8">
        <h2 className="font-bold mb-3">Add Product</h2>
        <form onSubmit={addProduct} className="flex gap-2">
          <input required className="border p-2 flex-1" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <input required className="border p-2 w-32" type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} />
          <input required className="border p-2 w-32" placeholder="SKU" value={sku} onChange={e => setSku(e.target.value)} />
          <input required className="border p-2 w-24" type="number" placeholder="Stock" value={stock} onChange={e => setStock(e.target.value)} />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Add</button>
        </form>
      </div>

      <div className="flex flex-col gap-2">
        {products.map(p => (
          <div key={p.id} className="border p-3 flex justify-between items-center bg-white shadow-sm rounded">
            <div className="flex gap-4 items-center">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-16 h-16 object-cover rounded border" />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500 text-center">No Image</div>
              )}
              <div>
                <p className="font-bold">{p.name}</p>
                <p className="text-sm text-gray-500">SKU: {p.sku} | Price: Rp{Number(p.price).toLocaleString('id-ID')} | Stock: {p.stock_qty}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <label className="bg-blue-500 text-white px-3 py-1 rounded text-sm cursor-pointer hover:bg-blue-600 text-center block w-28">
                Set Thumbnail
                <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadImage(p.id, e.target.files[0])} />
              </label>
              <button onClick={() => deleteProduct(p.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 w-28">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
