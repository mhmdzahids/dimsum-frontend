import React, { useState, useEffect } from 'react';
import {
  Flame,
  Tag,
  Percent,
  X,
  Check,
  CheckCircle2,
  Settings,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  ArrowRight,
  Plus,
  Package,
  Leaf,
  Beaker
} from 'lucide-react';
import api from '../api/client';
import { getAdminRole, canManageProducts } from '../utils/adminAuth';

export default function AdminProducts() {
  const userRole = getAdminRole() || 'admin';
  const isAdmin = canManageProducts(userRole);

  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'ingredients'
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [productRecipes, setProductRecipes] = useState({});

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('pack');
  const [packSize, setPackSize] = useState('25');

  // Order Limit state
  const [orderLimit, setOrderLimit] = useState(50);
  const [orderLimitInput, setOrderLimitInput] = useState('');
  const [limitMsg, setLimitMsg] = useState({ text: '', type: 'success' });

  // Discount modal state
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [selectedProductForDiscount, setSelectedProductForDiscount] = useState(null);
  const [isDiscountActive, setIsDiscountActive] = useState(false);
  const [originalPriceInput, setOriginalPriceInput] = useState('');
  const [discountPercentInput, setDiscountPercentInput] = useState(20);
  const [discountSavingLoading, setDiscountSavingLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [discountSuccessMsg, setDiscountSuccessMsg] = useState('');

  // Recipe modal state
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedProductForRecipe, setSelectedProductForRecipe] = useState(null);
  const [newRecipeIngredient, setNewRecipeIngredient] = useState('');
  const [newRecipeAmount, setNewRecipeAmount] = useState('');
  const [newRecipeUnit, setNewRecipeUnit] = useState('gram');
  const [newRecipeNotes, setNewRecipeNotes] = useState('');
  const [recipeSavingLoading, setRecipeSavingLoading] = useState(false);
  const [recipeError, setRecipeError] = useState('');

  const fetchProducts = async () => {
    const res = await api.get('/api/products');
    if (res.success && Array.isArray(res.data)) {
      setProducts(res.data);
    }
  };

  const fetchIngredients = async () => {
    const res = await api.get('/api/ingredients');
    if (res.success && Array.isArray(res.data)) {
      setIngredients(res.data);
    }
  };

  const fetchProductRecipe = async (productId) => {
    const res = await api.get(`/api/ingredients/product/${productId}/recipe`);
    if (res.success && Array.isArray(res.data)) {
      setProductRecipes(prev => ({ ...prev, [productId]: res.data }));
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchIngredients();
    fetchOrderLimit();
  }, []);

  useEffect(() => {
    if (activeTab === 'ingredients') {
      products.forEach(p => fetchProductRecipe(p.id));
    }
  }, [activeTab, products]);

  const addRecipeItem = async (e) => {
    e.preventDefault();
    if (!newRecipeIngredient) {
      setRecipeError('Bahan harus dipilih');
      return;
    }
    setRecipeSavingLoading(true);
    const res = await api.post(`/api/ingredients/product/${selectedProductForRecipe.id}/recipe`, {
      ingredient_id: newRecipeIngredient,
      amount_per_pack: 0.0,
      unit_measure: 'pcs',
      notes: newRecipeNotes
    });
    if (res.success) {
      fetchProductRecipe(selectedProductForRecipe.id);
      closeRecipeModal();
    } else {
      setRecipeError('Gagal menyimpan resep');
    }
    setRecipeSavingLoading(false);
  };

  const removeRecipeItem = async (productId, ingredientId) => {
    if (confirm('Hapus bahan ini dari resep?')) {
      const res = await api.delete(`/api/ingredients/product/${productId}/recipe/${ingredientId}`);
      if (res.success) {
        fetchProductRecipe(productId);
      }
    }
  };

  const openRecipeModal = (p) => {
    setSelectedProductForRecipe(p);
    setNewRecipeIngredient('');
    setNewRecipeAmount('');
    setRecipeModalOpen(true);
  };

  const closeRecipeModal = () => {
    setRecipeModalOpen(false);
    setSelectedProductForRecipe(null);
    setRecipeError('');
  };

  const fetchOrderLimit = async () => {
    try {
      const res = await api.get('/api/settings/order-limit');
      if (res.success && res.data) {
        setOrderLimit(res.data.order_item_limit);
        setOrderLimitInput(String(res.data.order_item_limit));
      }
    } catch (e) {
      console.error('Failed to fetch order limit', e);
    }
  };

  const updateOrderLimit = async (e) => {
    e.preventDefault();
    const val = parseInt(orderLimitInput, 10);
    if (isNaN(val) || val < 1 || val > 500) {

      setLimitMsg({ text: 'Limit harus antara 1 dan 500', type: 'error' });
      return;
    }
    try {
      const res = await api.put('/api/settings/order-limit', { order_item_limit: val }, { auth: 'admin' });
      if (res.success) {
        setOrderLimit(val);
        setLimitMsg({ text: 'Limit berhasil diupdate!', type: 'success' });
        setTimeout(() => setLimitMsg({ text: '', type: 'success' }), 3000);
      } else {
        setLimitMsg({ text: res.error || 'Gagal update limit', type: 'error' });
      }
    } catch (e) {
      setLimitMsg({ text: 'Network error', type: 'error' });
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    const res = await api.post('/api/products', {
      name,
      price,
      sku,
      unit,
      pack_size: packSize,
      is_active: true,
      category: 'Dimsum'
    }, { auth: 'admin' });
    if (res.success) {
      fetchProducts();
      setName('');
      setPrice('');
      setSku('');
      setUnit('pack');
      setPackSize('25');
    } else {
      alert(res.error || 'Gagal menambahkan produk');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Hapus produk ini?')) return;
    const res = await api.delete(`/api/products/${id}`, { auth: 'admin' });
    if (res.success) {
      fetchProducts();
    } else {
      alert(res.error || 'Gagal menghapus produk');
    }
  };

  const uploadImage = async (id, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);

    const res = await api.upload(`/api/products/${id}/image`, formData, { auth: 'admin' });
    if (res.success) {
      fetchProducts();
    } else {
      alert(res.error || 'Gagal mengunggah gambar');
    }
  };

  // Open discount modal for a specific product
  const openDiscountModal = (product) => {
    setSelectedProductForDiscount(product);
    const active = Boolean(product.is_discount && product.discount_percent > 0);
    setIsDiscountActive(active);

    const initialOriginal = product.original_price
      ? Number(product.original_price)
      : (active
        ? Math.round(Number(product.price) / (1 - (product.discount_percent || 20) / 100))
        : Number(product.price));

    setOriginalPriceInput(initialOriginal || '');
    setDiscountPercentInput(product.discount_percent || 20);
    setDiscountError('');
    setDiscountSuccessMsg('');
    setDiscountModalOpen(true);
  };

  // Close discount modal
  const closeDiscountModal = () => {
    if (discountSavingLoading) return;
    setDiscountModalOpen(false);
    setSelectedProductForDiscount(null);
  };

  // Live calculation values
  const numOriginal = parseFloat(originalPriceInput) || 0;
  const numPercent = parseInt(discountPercentInput, 10) || 0;
  const computedSellingPrice = isDiscountActive && numOriginal > 0 && numPercent > 0 && numPercent < 100
    ? Math.round(numOriginal * (1 - numPercent / 100))
    : (isDiscountActive ? 0 : (selectedProductForDiscount ? Number(selectedProductForDiscount.price) : 0));
  const computedSavings = isDiscountActive && numOriginal > 0 && numPercent > 0
    ? Math.max(0, numOriginal - computedSellingPrice)
    : 0;

  // Save discount to backend API
  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    if (!selectedProductForDiscount) return;
    setDiscountError('');
    setDiscountSuccessMsg('');

    if (isDiscountActive) {
      if (!numOriginal || numOriginal <= 0) {
        setDiscountError('Harga normal awal harus lebih besar dari 0');
        return;
      }
      if (!numPercent || numPercent < 1 || numPercent > 99) {
        setDiscountError('Persentase diskon harus bernilai antara 1% dan 99%');
        return;
      }
    }

    setDiscountSavingLoading(true);
    try {
      const payload = isDiscountActive
        ? {
          is_discount: true,
          original_price: numOriginal,
          discount_percent: numPercent
        }
        : {
          is_discount: false,
          original_price: null,
          discount_percent: 0
        };

      const res = await api.put(`/api/products/${selectedProductForDiscount.id}`, payload, { auth: 'admin' });
      if (res.success) {
        setDiscountSuccessMsg('Pengaturan diskon berhasil diperbarui!');
        await fetchProducts();
        setTimeout(() => {
          closeDiscountModal();
        }, 800);
      } else {
        setDiscountError(res.error || 'Gagal menyimpan pengaturan diskon');
      }
    } catch (err) {
      setDiscountError('Terjadi kesalahan jaringan saat menyimpan diskon');
    } finally {
      setDiscountSavingLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Tab Navigation */}
      {isAdmin && (
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 ${activeTab === 'products'
              ? 'text-brand-blue border-brand-blue'
              : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            <Package size={16} className="inline mr-2 align-text-bottom" />
            Produk
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 ${activeTab === 'ingredients'
              ? 'text-brand-blue border-brand-blue'
              : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            <Leaf size={16} className="inline mr-2 align-text-bottom" />
            Bahan Baku & Resep
          </button>
        </div>
      )}

      {/* Order Limit Settings (Admin only) */}
      {isAdmin && activeTab === 'products' && (
        <div className="bg-amber-50/70 border border-amber-200/80 p-5 rounded-card shadow-xs">
          <h2 className="font-bold mb-2 text-amber-800 flex items-center gap-2">
            <Settings size={18} /> Pengaturan Order Limit
          </h2>
          <p className="text-sm text-amber-700 mb-3">
            Maks. item per order: <strong>{orderLimit}</strong>
          </p>
          <form onSubmit={updateOrderLimit} className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="500"
              value={orderLimitInput}
              onChange={e => setOrderLimitInput(e.target.value)}
              className="border border-amber-300 bg-white p-2 w-28 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
              placeholder="Limit"
            />
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 font-medium text-sm transition-colors">
              Simpan Limit
            </button>
            {limitMsg.text && (
              <span className={`text-sm ml-2 flex items-center gap-1 ${limitMsg.type === 'success' ? 'text-green-600 font-semibold' : 'text-red-500'}`}>
                {limitMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {limitMsg.text}
              </span>
            )}
          </form>
        </div>
      )}

      {/* Add Product Section (Admin only) */}
      {isAdmin && (
        <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl mb-8 shadow-xs">
          <h2 className="font-bold mb-3 text-gray-800 flex items-center gap-2">
            <Plus size={18} /> Tambah Menu Baru
          </h2>
          <form onSubmit={addProduct} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <input required className="border border-gray-300 bg-white p-2 flex-1 min-w-[180px] rounded-lg text-sm" placeholder="Nama Menu" value={name} onChange={e => setName(e.target.value)} />
              <input required className="border border-gray-300 bg-white p-2 w-36 rounded-lg text-sm" type="number" placeholder="Harga Jual" value={price} onChange={e => setPrice(e.target.value)} />
              <input required className="border border-gray-300 bg-white p-2 w-36 rounded-lg text-sm" placeholder="SKU" value={sku} onChange={e => setSku(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                required
                className="border border-gray-300 bg-white p-2 rounded-lg text-sm flex-1 min-w-[140px]"
                value={unit}
                onChange={e => setUnit(e.target.value)}
              >
                <option value="pack">Pack</option>
                <option value="mika">Mika</option>
                <option value="vakum">Vakum</option>
                <option value="pcs">Pcs</option>
                <option value="custom">Custom</option>
              </select>
              <input
                required
                className="border border-gray-300 bg-white p-2 w-32 rounded-lg text-sm"
                type="number"
                min="1"
                placeholder="Isi per unit"
                value={packSize}
                onChange={e => setPackSize(e.target.value)}
              />
              <button type="submit" className="bg-green-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors">
                Tambah Menu
              </button>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="font-semibold text-gray-600">Catatan:</span> Stok menu baru otomatis <strong>0 pack</strong>. Penambahan stok fisik dilakukan melalui menu <strong className="text-gray-700">Produksi Kemasan (P2)</strong> setelah diverifikasi Checker.
            </p>
          </form>
        </div>
      )}

      {/* Ingredients Tab */}
      {isAdmin && activeTab === 'ingredients' && (
        <div className="space-y-6">
          {/* Product Recipes Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <Flame size={18} /> Resep Produk
            </h3>

            {products.map(product => {
              const productRecipe = productRecipes[product.id] || [];
              return (
                <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sku}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openRecipeModal(product)}
                        className="text-xs bg-brand-blue text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        + Tambah Bahan
                      </button>
                      <button
                        onClick={() => fetchProductRecipe(product.id)}
                        className="text-xs bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  {productRecipe.length > 0 ? (
                    <div className="space-y-2">
                      {productRecipe.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{item.ingredient_name}</span>
                            {item.notes && (
                              <span className="text-xs text-gray-500 italic">({item.notes})</span>
                            )}
                          </div>
                          <button
                            onClick={() => removeRecipeItem(product.id, item.ingredient_id)}
                            className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Belum ada resep bahan baku untuk produk ini</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center mb-1">
          <h2 className="font-bold text-gray-800 text-lg">Daftar Menu ({products.length})</h2>
          <span className="text-xs text-gray-500"></span>
        </div>

        {products.map(p => {
          const hasDiscount = Boolean(p.is_discount && p.discount_percent > 0);
          return (
            <div
              key={p.id}
              className={`p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white shadow-xs rounded-xl border transition-all ${hasDiscount
                ? 'border-brand-red/30 bg-red-50/20'
                : 'border-gray-200'
                }`}
            >
              <div className="flex gap-4 items-center min-w-0">
                <div className="relative w-16 h-16 shrink-0">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 text-center border border-dashed border-gray-300">
                      No Image
                    </div>
                  )}
                  {hasDiscount && (
                    <span className="absolute -top-1.5 -left-1.5 bg-brand-red text-white border-2 border-white rounded-full px-1.5 py-0.5 shadow-xs flex items-center gap-0.5">
                      <Flame size={9} className="fill-white text-white shrink-0 -skew-x-[14deg] -rotate-[6deg] transform" />
                      <span className="font-black italic text-[9px] leading-none">{p.discount_percent}%</span>
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 text-base">{p.name}</p>
                    {hasDiscount ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-brand-red/10 text-brand-red border border-brand-red/20">
                        <Flame size={11} className="fill-brand-red text-brand-red -skew-x-[14deg] -rotate-[6deg] transform" />
                        Diskon {p.discount_percent}% Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        Harga Normal
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                    <span>SKU: <strong className="text-gray-700">{p.sku}</strong></span>
                    <span>Stok: <strong className="text-gray-700">{p.stock_qty} {p.unit_label || ((p.sku || '').includes('MIKA') || (p.name || '').toLowerCase().includes('mika') ? 'mika (isi 50)' : 'pack (isi 25)')}</strong></span>
                  </div>

                  {/* Pricing Overview */}
                  <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                    {hasDiscount ? (
                      <>
                        <span className="text-xs text-gray-400 line-through">
                          Rp{Number(p.original_price || (p.price / (1 - p.discount_percent / 100))).toLocaleString('id-ID')}
                        </span>
                        <span className="text-sm font-black text-brand-gold">
                          Rp{Number(p.price).toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 font-medium">
                          Hemat Rp{(Number(p.original_price || 0) - Number(p.price)).toLocaleString('id-ID')}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-black text-brand-gold">
                        Rp{Number(p.price).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons (Admin only) */}
              {isAdmin && (
                <div className="flex flex-wrap md:flex-col gap-2 items-end shrink-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => openDiscountModal(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all w-full md:w-32 cursor-pointer ${hasDiscount
                      ? 'bg-brand-red text-white hover:bg-red-700 shadow-xs'
                      : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                      }`}
                  >
                    <Flame size={13} className={hasDiscount ? "fill-white text-white -skew-x-[14deg] -rotate-[6deg] transform" : "text-amber-700"} />
                    {hasDiscount ? 'Edit Diskon' : 'Pasang Diskon'}
                  </button>

                  <label className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-100 text-center flex items-center justify-center gap-1.5 w-full md:w-32 transition-colors">
                    <ImageIcon size={13} />
                    Thumbnail
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadImage(p.id, e.target.files[0])} />
                  </label>

                  <button
                    type="button"
                    onClick={() => deleteProduct(p.id)}
                    className="bg-gray-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-50 hover:border-red-300 flex items-center justify-center gap-1.5 w-full md:w-32 transition-colors"
                  >
                    <Trash2 size={13} />
                    Hapus
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Discount Management Modal */}
      {discountModalOpen && selectedProductForDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center border border-brand-red/20">
                  <Flame size={20} className="fill-brand-red text-brand-red -skew-x-[14deg] -rotate-[6deg] transform" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base leading-tight">Kelola Diskon Menu</h3>
                  <p className="text-xs text-gray-500 truncate max-w-[240px]">{selectedProductForDiscount.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDiscountModal}
                disabled={discountSavingLoading}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDiscount} className="p-5 space-y-5">
              {/* Toggle Discount Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50/50">
                <div>
                  <label htmlFor="discountToggle" className="font-bold text-sm text-gray-800 block cursor-pointer">
                    Aktifkan Diskon Promo
                  </label>
                  <span className="text-xs text-gray-500">
                    {isDiscountActive ? 'Menu berstatus promo' : 'Harga normal'}
                  </span>
                </div>
                <button
                  id="discountToggle"
                  type="button"
                  onClick={() => setIsDiscountActive(!isDiscountActive)}
                  className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer ${isDiscountActive ? 'bg-brand-red' : 'bg-gray-300'
                    }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${isDiscountActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>

              {isDiscountActive ? (
                <>
                  {/* Original Normal Price Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Harga Normal / Asli (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        required
                        value={originalPriceInput}
                        onChange={(e) => setOriginalPriceInput(e.target.value)}
                        placeholder="Contoh: 100000"
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red"
                      />
                    </div>

                  </div>

                  {/* Discount Percentage Input & Presets */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Persentase Diskon (%)
                      </label>
                      <span className="text-xs font-black text-brand-red">
                        {numPercent}% OFF
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        required
                        value={discountPercentInput}
                        onChange={(e) => setDiscountPercentInput(e.target.value)}
                        placeholder="20"
                        className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                        %
                      </span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[11px] text-gray-500 mr-1">Pilihan Cepat:</span>
                      {[10, 15, 20, 25, 30, 50].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setDiscountPercentInput(val)}
                          className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-colors cursor-pointer ${numPercent === val
                            ? 'bg-brand-red text-white border-brand-red'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Real-time Calculation Summary */}
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Harga Normal Awal:</span>
                      <span className="font-semibold line-through text-gray-500">
                        Rp{numOriginal.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-brand-red font-medium">
                      <span>Potongan Diskon ({numPercent}%):</span>
                      <span className="font-bold">
                        - Rp{computedSavings.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="border-t border-red-200/70 pt-2 flex justify-between items-baseline">
                      <span className="text-xs font-bold text-gray-800">Harga Jual Customer:</span>
                      <span className="text-lg font-black text-brand-gold">
                        Rp{computedSellingPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Mini Preview in Menu */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                      Preview Tampilan Menu Pelanggan:
                    </span>
                    <div className="bg-white rounded-[14px] p-2.5 border-[1.2px] border-brand-red/40 flex items-center gap-3 shadow-xs">
                      <div className="relative w-12 h-12 bg-gray-100 rounded-[10px] shrink-0 flex items-center justify-center">
                        <Flame size={18} className="text-brand-red/40" />
                        <span className="absolute -top-1.5 -left-1.5 bg-brand-red text-white border-2 border-white rounded-full px-1 py-0.2 shadow-xs flex items-center gap-0.5">
                          <Flame size={8} className="fill-white text-white shrink-0 -skew-x-[14deg] -rotate-[6deg] transform" />
                          <span className="font-black italic text-[8px] leading-none">{numPercent}%</span>
                        </span>
                      </div>
                      <div className="min-w-0 flex-grow">
                        <div className="text-xs font-bold text-brand-blue truncate">{selectedProductForDiscount.name}</div>
                        <div className="flex items-center gap-1 text-[10px] mt-0.5">
                          <span className="text-gray-400 line-through">Rp{numOriginal.toLocaleString('id-ID')}</span>
                          <span className="bg-brand-red/10 text-brand-red text-[9px] font-bold px-1 rounded">-{numPercent}%</span>
                        </div>
                        <div className="text-xs font-black text-brand-gold mt-0.5">
                          Rp{computedSellingPrice.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-center space-y-2">
                  <p className="text-xs text-gray-600">
                    Diskon akan <strong>dinonaktifkan</strong>.
                  </p>
                </div>
              )}

              {/* Error Message */}
              {discountError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{discountError}</span>
                </div>
              )}

              {/* Success Message */}
              {discountSuccessMsg && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{discountSuccessMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeDiscountModal}
                  disabled={discountSavingLoading}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={discountSavingLoading}
                  className="flex-1 py-2.5 bg-brand-red hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  {discountSavingLoading ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check size={14} strokeWidth={2.5} />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipe Management Modal */}
      {recipeModalOpen && selectedProductForRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-green-100 text-green-700 flex items-center justify-center border border-green-200">
                  <Beaker size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base leading-tight">Tambah Bahan ke Resep</h3>
                  <p className="text-xs text-gray-500 truncate max-w-[240px]">{selectedProductForRecipe.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeRecipeModal}
                disabled={recipeSavingLoading}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={addRecipeItem} className="p-5 space-y-4">
              {/* Ingredient Select */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Pilih Bahan Baku
                </label>
                <select
                  required
                  value={newRecipeIngredient}
                  onChange={(e) => setNewRecipeIngredient(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                >
                  <option value="">-- Pilih Bahan --</option>
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  value={newRecipeNotes}
                  onChange={(e) => setNewRecipeNotes(e.target.value)}
                  placeholder="Contoh: untuk isian"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                />
              </div>

              {/* Error Message */}
              {recipeError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{recipeError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeRecipeModal}
                  disabled={recipeSavingLoading}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={recipeSavingLoading}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  {recipeSavingLoading ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check size={14} strokeWidth={2.5} />
                      Simpan Bahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
