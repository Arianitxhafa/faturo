// Next.js 16 proxy (formerly middleware): Auth.js checks the session and applies callbacks.authorized.
export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
