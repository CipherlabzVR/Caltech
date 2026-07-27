import { useEffect } from "react";
import { useRouter } from "next/router";

/** Redirect legacy customer-bill URLs to the unified print page. */
export default function CustomerBillRedirect() {
  const router = useRouter();
  const { id, documentNumber } = router.query;

  useEffect(() => {
    if (!router.isReady || !id) return;
    const q = new URLSearchParams({
      id: String(id),
      type: "customer-bill",
    });
    if (documentNumber) q.set("documentNumber", String(documentNumber));
    router.replace(`/service/job-card/print?${q.toString()}`);
  }, [router.isReady, id, documentNumber, router]);

  return null;
}
