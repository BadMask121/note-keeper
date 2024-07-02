"use client"

import SigninPage from "@/components/signin";
import SignupCard from "@/components/signup";
import { ProtectedRoutes } from "@/lib/routes";
import { getUser } from "@/lib/storage";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [page, setPage] = useState<"signin" | "signup">("signin");
  const session = getUser();
  if (session) {
    router.push(ProtectedRoutes.Note)
    return
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {
        page === "signin" ? <SigninPage goToSignup={() => setPage("signup")} /> : <SignupCard goToSignin={() => setPage("signin")} />
      }
    </main>
  );
}
