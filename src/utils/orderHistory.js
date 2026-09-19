/**
 * Order History Manager
 * Manages local persistence, deduplication, and server status sync for user orders.
 */
import api from '../api/client';

const STORAGE_KEY = 'dimsum_order_history';

/**
 * Get all stored orders from localStorage
 * @returns {Array} List of orders sorted newest first
 */
export function getOrderHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading order history:', err);
    return [];
  }
}

/**
 * Save or update an order in the local history
 * @param {Object} orderData 
 */
export function saveOrderToHistory(orderData) {
  if (!orderData || !orderData.orderId) return;

  try {
    const history = getOrderHistory();
    const existingIndex = history.findIndex(o => o.orderId === orderData.orderId);

    if (existingIndex >= 0) {
      // Merge with existing
      history[existingIndex] = {
        ...history[existingIndex],
        ...orderData,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Prepend newest order
      history.unshift({
        ...orderData,
        createdAt: orderData.createdAt || new Date().toISOString()
      });
    }

    // Limit to latest 50 orders
    const trimmed = history.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new Event('dimsum_order_history_updated'));
    return trimmed;
  } catch (err) {
    console.error('Error saving order to history:', err);
  }
}

/**
 * Update the status of a specific order in history
 * @param {string} orderId 
 * @param {string} status 
 * @param {Object} extraData 
 */
export function updateOrderStatusInHistory(orderId, status, extraData = {}) {
  if (!orderId) return;

  try {
    const history = getOrderHistory();
    const existingIndex = history.findIndex(o => o.orderId === orderId);

    if (existingIndex >= 0) {
      history[existingIndex] = {
        ...history[existingIndex],
        status,
        ...extraData,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      window.dispatchEvent(new Event('dimsum_order_history_updated'));
      return history[existingIndex];
    }
  } catch (err) {
    console.error('Error updating order status in history:', err);
  }
}

/**
 * Sync active orders in history with the backend to retrieve latest statuses
 * @returns {Promise<Array>} Updated orders list
 */
export async function syncOrderHistoryWithServer() {
  const history = getOrderHistory();
  if (history.length === 0) return [];

  // Filter orders that could change status (pending_payment, paid, fulfilling)
  const activeOrders = history.filter(o => 
    o.status === 'pending_payment' || o.status === 'paid' || o.status === 'fulfilling'
  );

  if (activeOrders.length === 0) return history;

  let hasChanges = false;
  const updatedHistory = [...history];

  await Promise.all(
    activeOrders.map(async (localOrder) => {
      try {
        const headers = {};
        if (localOrder.accessToken) {
          headers['X-Order-Token'] = localOrder.accessToken;
        }
        const res = await api.get(`/api/orders/${localOrder.orderId}`, { headers });
        if (res.success && res.data) {
          const serverOrder = res.data;
          const idx = updatedHistory.findIndex(o => o.orderId === localOrder.orderId);
          if (idx >= 0 && (serverOrder.status !== localOrder.status || serverOrder.qr_token !== localOrder.qrToken)) {
            updatedHistory[idx] = {
              ...updatedHistory[idx],
              status: serverOrder.status,
              qrToken: serverOrder.qr_token || updatedHistory[idx].qrToken,
              updatedAt: new Date().toISOString()
            };
            hasChanges = true;
          }
        }
      } catch (e) {
        // Silently skip if network error on individual order check
      }
    })
  );

  if (hasChanges) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    window.dispatchEvent(new Event('dimsum_order_history_updated'));
  }

  return updatedHistory;
}
