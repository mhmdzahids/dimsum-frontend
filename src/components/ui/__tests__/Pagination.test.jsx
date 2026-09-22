// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Pagination from '../Pagination';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('Pagination component', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders record counts correctly for 100 items with 10 per page', () => {
    act(() => {
      root.render(
        <Pagination
          currentPage={1}
          totalItems={100}
          pageSize={10}
          onPageChange={() => {}}
          itemLabel="produk"
        />
      );
    });

    expect(container.innerHTML).toContain('Menampilkan');
    expect(container.innerHTML).toContain('1');
    expect(container.innerHTML).toContain('10');
    expect(container.innerHTML).toContain('100');
    expect(container.innerHTML).toContain('produk');
  });

  it('handles page switching when clicking a page number or next', () => {
    const onPageChange = vi.fn();
    act(() => {
      root.render(
        <Pagination
          currentPage={1}
          totalItems={50}
          pageSize={10}
          onPageChange={onPageChange}
        />
      );
    });

    const buttons = container.querySelectorAll('button');
    // Click page 2 button
    const page2Btn = Array.from(buttons).find(b => b.textContent === '2');
    expect(page2Btn).toBeTruthy();

    act(() => {
      page2Btn.click();
    });

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables previous button on first page', () => {
    act(() => {
      root.render(
        <Pagination
          currentPage={1}
          totalItems={50}
          pageSize={10}
          onPageChange={() => {}}
        />
      );
    });

    const prevBtn = container.querySelector('button[aria-label="Halaman Sebelumnya"]');
    expect(prevBtn).toBeTruthy();
    expect(prevBtn.disabled).toBe(true);
  });

  it('renders empty message when totalItems is 0 and no pagination buttons', () => {
    act(() => {
      root.render(
        <Pagination
          currentPage={1}
          totalItems={0}
          pageSize={10}
          onPageChange={() => {}}
          itemLabel="varian"
        />
      );
    });

    expect(container.innerHTML).toContain('Tidak ada varian');
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });
});
