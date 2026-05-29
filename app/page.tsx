import { redirect } from "next/navigation"

// Root entry. proxy.ts bounces unauthenticated users to /login first;
// authenticated users land on the dashboard.
export default function Home() {
  redirect("/dashboard")
}
