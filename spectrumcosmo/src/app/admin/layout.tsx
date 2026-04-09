export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Unprotected wrapper so that `/admin/login` does NOT get the admin sidebar/layout.
  // All protected admin routes live under the `(dashboard)` route group and
  // use their own authenticated layout defined in `admin/(dashboard)/layout.tsx`.
  return children
}
