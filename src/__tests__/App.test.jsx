// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '../App';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }) => <div data-testid="google-auth-provider">{children}</div>
}));

describe('App Component Smoke Test', () => {
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

  it('renders App root without crashing or throwing ReferenceError', async () => {
    await act(async () => {
      root.render(<App />);
    });

    expect(container.innerHTML).not.toContain('ReferenceError');
    expect(container.innerHTML).not.toContain('AdminIndexRedirect is not defined');
    expect(container.innerHTML).not.toContain('Terjadi Kendala Memuat Halaman');
  });
});
