"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NoticesPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/jobs");
  }, [router]);

  return null;
}
