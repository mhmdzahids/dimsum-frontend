// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AdminProducts from '../AdminProducts';
import api from '../../api/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    upload: vi.fn(),
  },
}));

vi.mock('../../utils/adminAuth', () => ({
  getAdminRole: () => 'superadmin',
  canManageProducts: () => true,
}));

describe('AdminProducts Edit Display Name', () => {
  let container;
  let root;

  const mockProduct = {
    id: 1,
    name: 'Dimsum Ayam Original',
    price: 65000,
    sku: 'DIM-AYAM-01',
    stock_qty: 100,
    is_active: true,
    is_discount: false,
    discount_percent: 0,
    unit: 'pack',
    unit_label: 'pack (isi 25)',
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();

    api.get.mockImplementation((url) => {
      if (url === '/api/products') {
        return Promise.resolve({ success: true, data: [mockProduct] });
      }
      if (url === '/api/ingredients') {
        return Promise.resolve({ success: true, data: [] });
      }
      if (url === '/api/orders/daily-limit') {
        return Promise.resolve({ success: true, data: { order_limit: 50 } });
      }
      return Promise.resolve({ success: true, data: [] });
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders product and opens edit name modal when Edit Nama button is clicked', async () => {
    await act(async () => {
      root.render(<AdminProducts />);
    });

    expect(container.textContent).toContain('Dimsum Ayam Original');

    // Click "Edit Nama" button
    const editButtons = Array.from(container.querySelectorAll('button')).filter(
      (btn) => btn.textContent.includes('Edit Nama')
    );
    expect(editButtons.length).toBeGreaterThan(0);

    await act(async () => {
      editButtons[0].click();
    });

    // Modal should now be open
    expect(container.textContent).toContain('Edit Nama Display Produk');
    expect(container.textContent).toContain('Preview Tampilan Pelanggan');

    const input = container.querySelector('input[placeholder="Contoh: Dimsum Ayam Original"]');
    expect(input).not.toBeNull();
    expect(input.value).toBe('Dimsum Ayam Original');
  });

  it('submits updated name to backend API and updates the product display name', async () => {
    api.put.mockResolvedValueOnce({
      success: true,
      data: { ...mockProduct, name: 'Dimsum Ayam Jumbo Super' },
    });

    await act(async () => {
      root.render(<AdminProducts />);
    });

    const editBtn = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent.includes('Edit Nama')
    );

    await act(async () => {
      editBtn.click();
    });

    const input = container.querySelector('input[placeholder="Contoh: Dimsum Ayam Original"]');

    // Change input value using native setter so React detects change
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    await act(async () => {
      nativeInputValueSetter.call(input, 'Dimsum Ayam Jumbo Super');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const form = input.closest('form');
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(api.put).toHaveBeenCalledWith(
      '/api/products/1',
      { name: 'Dimsum Ayam Jumbo Super' },
      { auth: 'admin' }
    );

    expect(container.textContent).toContain('Nama produk berhasil diperbarui!');
    expect(container.textContent).toContain('Dimsum Ayam Jumbo Super');
  });

  it('validates against empty product name', async () => {
    await act(async () => {
      root.render(<AdminProducts />);
    });

    // Click the pencil button next to the title
    const pencilBtn = container.querySelector('button[title="Edit Nama Display Menu"]');
    expect(pencilBtn).not.toBeNull();

    await act(async () => {
      pencilBtn.click();
    });

    const input = container.querySelector('input[placeholder="Contoh: Dimsum Ayam Original"]');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    await act(async () => {
      nativeInputValueSetter.call(input, '   ');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const form = input.closest('form');
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(api.put).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Nama produk tidak boleh kosong');
  });
});
