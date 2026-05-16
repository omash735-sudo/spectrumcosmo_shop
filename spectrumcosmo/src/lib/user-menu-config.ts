export interface UserMenuItem {
  label: string;
  href: string;
  icon: string;
  requiresAuth: boolean;
  onClick?: () => void;
}

// Dynamic menu items based on user role and auth status
export function getUserMenuItems(isLoggedIn: boolean, userName?: string, userEmail?: string): UserMenuItem[] {
  if (!isLoggedIn) {
    return [
      { label: 'Sign In', href: '/login', icon: 'User', requiresAuth: false },
      { label: 'Create Account', href: '/signup', icon: 'UserPlus', requiresAuth: false },
    ];
  }

  return [
    { label: `Hello, ${userName || 'User'}`, href: '#', icon: 'User', requiresAuth: true },
    { label: 'My Profile', href: '/account/profile', icon: 'User', requiresAuth: true },
    { label: 'My Orders', href: '/account/orders', icon: 'Package', requiresAuth: true },
    { label: 'Wishlist', href: '/account/wishlist', icon: 'Heart', requiresAuth: true },
    { label: 'Addresses', href: '/account/addresses', icon: 'MapPin', requiresAuth: true },
    { label: 'Settings', href: '/account/settings', icon: 'Settings', requiresAuth: true },
    { label: 'Logout', href: '#', icon: 'LogOut', requiresAuth: true },
  ];
}
