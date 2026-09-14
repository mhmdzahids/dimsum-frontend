import React, { useState, useEffect } from 'react';

export default function AdminProducts() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [email, setEmail] = useState('admin@dimsum.id');
  const [password, setPassword] = useState('password123');
  
  const [products, setProducts] = useState([]);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState(100);

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
    if (token) fetchProducts();
  }, [token]);

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
        <button onClick={() => { setToken(''); localStorage.removeItem('adminToken'); }} className="text-red-500">Logout</button>
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
