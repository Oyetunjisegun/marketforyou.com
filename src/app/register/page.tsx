import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a free Marketforyou account to buy and sell.",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
