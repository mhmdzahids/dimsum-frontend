// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import DataView from '../DataView';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('DataView component', () => {
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

  it('renders loading state when loading is true', () => {
    act(() => {
      root.render(<DataView loading={true} data={null}>{() => null}</DataView>);
    });

    expect(container.innerHTML).toContain('Memuat data...');
  });

  it('renders error state with retry button when error is provided', () => {
    const onRetry = vi.fn();
    act(() => {
      root.render(
        <DataView loading={false} error="Gagal koneksi server" onRetry={onRetry} data={null}>
          {() => null}
        </DataView>
      );
    });

    expect(container.innerHTML).toContain('Gagal Memuat');
    expect(container.innerHTML).toContain('Gagal koneksi server');
    expect(container.innerHTML).toContain('Coba Lagi');

    const button = container.querySelector('button');
    act(() => {
      button.click();
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders empty fallback when data is empty array or null', () => {
    act(() => {
      root.render(
        <DataView loading={false} error={null} data={[]} empty={<p>Keranjang kosong</p>}>
          {() => null}
        </DataView>
      );
    });

    expect(container.innerHTML).toContain('Keranjang kosong');
  });

  it('renders children with data when data is available', () => {
    const items = ['Siomay Ayam', 'Hakau'];
    act(() => {
      root.render(
        <DataView loading={false} error={null} data={items}>
          {(list) => (
            <ul>
              {list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </DataView>
      );
    });

    expect(container.innerHTML).toContain('Siomay Ayam');
    expect(container.innerHTML).toContain('Hakau');
  });
});
