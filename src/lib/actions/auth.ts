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
                    console.error("🔥 AUTH ERROR:", error.type, error.message);
                    return { error: `Kesalahan login: ${error.type} - ${error.message?.substring(0, 100)}` };
            }
        }
        throw error;
    }
}
