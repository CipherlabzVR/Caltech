import React from "react";
import BASE_URL from "Base/api";

const useLeads = () => {
  const [leads, setLeads] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchLeads = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/Leads/GetCRMLeads`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load leads");
        }

        const data = await response.json();
        const items = Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : [];
        const normalized = items.map((lead) => ({
          id: lead.id,
          name: lead.leadName || lead.company || `Lead #${lead.id}`,
          company: lead.company,
          meta: lead,
        }));

        if (isMounted) {
          setLeads(normalized);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching leads:", err);
          setLeads([]);
          setError(err.message || "Failed to load leads");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLeads();

    return () => {
      isMounted = false;
    };
  }, []);

  return { leads, isLoading, error };
};

export default useLeads;

