"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-xl border border-[#D8C89D] px-4 py-2 text-sm font-semibold text-[#2A2F36] transition hover:border-[#C79A4A] hover:text-[#C79A4A]"
    >
      Sair
    </button>
  );
}
