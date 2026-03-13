import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const userRole = req.auth?.user?.role; // ADMIN | GURU | PENGAWAS | SISWA

    // 1. Jika pengguna BUKAN mencoba ke halaman login (/) dan BELUM login, lempar ke login
    if (!isLoggedIn && nextUrl.pathname !== "/") {
        return NextResponse.redirect(new URL("/", nextUrl));
    }

    // 2. Jika pengguna SUDAH login dan mencoba ke halaman login (/), arahkan ke dashboard masing-masing
    if (isLoggedIn && nextUrl.pathname === "/") {
        return NextResponse.redirect(new URL(`/${userRole?.toLowerCase()}`, nextUrl));
    }

    // 3. Aturan Proteksi Rute (RBAC):
    // Jika mencoba masuk ke URL tertentu, pastikan Role-nya cocok!
    if (nextUrl.pathname.startsWith("/admin") && userRole !== "ADMIN") {
        return NextResponse.redirect(new URL(`/${userRole?.toLowerCase()}`, nextUrl));
    }
    if (nextUrl.pathname.startsWith("/guru") && userRole !== "GURU") {
        return NextResponse.redirect(new URL(`/${userRole?.toLowerCase()}`, nextUrl));
    }
    if (nextUrl.pathname.startsWith("/pengawas") && userRole !== "PENGAWAS") {
        return NextResponse.redirect(new URL(`/${userRole?.toLowerCase()}`, nextUrl));
    }
    if (nextUrl.pathname.startsWith("/siswa") && userRole !== "SISWA") {
        return NextResponse.redirect(new URL(`/${userRole?.toLowerCase()}`, nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    // Hanya jalankan middleware ini pada rute aplikasi, abaikan file statis/gambar
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
