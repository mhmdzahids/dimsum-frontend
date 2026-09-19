import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth - Access the customer authentication context.
 *
 * @returns {{
 *   user: Object|null,
 *   token: string,
 *   isLoggedIn: boolean,
 *   loading: boolean,
 *   coins: number,
 *   login: (token: string, user: Object, initialCoins?: number) => void,
 *   logout: () => void,
 *   updateUser: (updatedUserData: Object) => void,
 *   setCoins: (amount: number) => void,
 *   refreshSession: () => Promise<Object|null>
 * }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
