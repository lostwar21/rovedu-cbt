"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
    try {
        const username = formData.get("username");
        const password = formData.get("password");

        await signIn("credentials", {
            username,
            password,
            redirectTo: "/",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Username atau password salah." };
                default:
                    return { error: "Terjadi kesalahan saat login." };
            }
        }
        throw error;
    }
}
