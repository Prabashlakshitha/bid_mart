import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewProductForm from "@/components/NewProductForm";
import { isStorageConfigured } from "@/lib/supabase/admin";

export default async function NewLotPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl mb-1">Add a new lot</h1>
      <p className="text-slate mb-8">
        Set the cost and margin — the starting price is calculated automatically.
      </p>
      <NewProductForm storageEnabled={isStorageConfigured()} />
    </div>
  );
}
