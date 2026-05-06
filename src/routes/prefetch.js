const loaders = {
  home: () => import("../pages/HomePage"),
  plp: () => import("../pages/PLPPage"),
  pdp: () => import("../pages/PDPPage"),
  cart: () => import("../pages/CartPage"),
  checkout: () => import("../pages/CheckoutPage"),
  account: () => import("../pages/AccountPage"),
  login: () => import("../pages/LoginPage"),
  signup: () => import("../pages/SignupPage"),
  forgotPassword: () => import("../pages/ForgotPasswordPage"),
  resetPassword: () => import("../pages/ResetPasswordPage"),
  about: () => import("../pages/AboutPage"),
  contact: () => import("../pages/ContactPage"),
  orderTracking: () => import("../pages/OrderTrackingPage"),
  notFound: () => import("../pages/NotFoundPage"),
};

const prefetched = new Set();

export function getRouteLoader(key) {
  return loaders[key];
}

export function prefetchRoute(key) {
  const loader = loaders[key];
  if (!loader || prefetched.has(key)) return;
  prefetched.add(key);
  void loader().catch(() => {
    prefetched.delete(key);
  });
}
