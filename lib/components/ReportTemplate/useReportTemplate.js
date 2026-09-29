import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

/** Loads the (custom or default) HTML for a report template key. */
export default function useReportTemplate(reportKey) {
  const [templateHtml, setTemplateHtml] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportKey) return;
    let active = true;

    const fetchTemplate = async () => {
      try {
        setLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(
          `${BASE_URL}/ReportTemplate/GetReportTemplateByKey?reportKey=${reportKey}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        const data = await response.json().catch(() => null);
        if (!active) return;
        if (response.ok && data) {
          setTemplateHtml(data.htmlContent || "");
        } else {
          toast.error(data?.message || "Failed to load the print template.");
        }
      } catch (error) {
        console.error("Error fetching report template:", error);
        if (active) toast.error("Failed to load the print template.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTemplate();
    return () => {
      active = false;
    };
  }, [reportKey]);

  return { templateHtml, loading };
}
