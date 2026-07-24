import { cookies } from "next/headers";
import { SecureGate } from "@/components/SecureGate";

export default async function Home() {
  const cookieStore = await cookies();
  const initialAuthenticated =
    cookieStore.get("2212_archive_session")?.value === "granted";

  return <SecureGate initialAuthenticated={initialAuthenticated} />;
}
