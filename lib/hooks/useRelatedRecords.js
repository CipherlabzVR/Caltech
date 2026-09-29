import React from "react";
import BASE_URL from "Base/api";

const endpointMap = {
  "1": {
    url: "/Leads/GetCRMLeads",
    map: (item) => ({
      value: String(item.id),
      label: item.leadName || item.company || `Lead #${item.id}`,
      meta: item,
    }),
  },
  "2": {
    url: "/CRMContacts/GetCRMContacts",
    map: (item) => ({
      value: String(item.id),
      label: [item.firstName, item.lastName].filter(Boolean).join(" ") || item.email || `Contact #${item.id}`,
      meta: item,
    }),
  },
  "3": {
    url: "/CRMAccounts/GetCRMAccounts",
    map: (item) => ({
      value: String(item.id),
      label: item.accountName || item.email || `Account #${item.id}`,
      meta: item,
    }),
  },
  "4": {
    url: "/CRMOpportunities/GetCRMOpportunities",
    map: (item) => ({
      value: String(item.id),
      label: item.opportunityName || `Opportunity #${item.id}`,
      meta: item,
    }),
  },
};

const useRelatedRecords = (relatedEntityType) => {
  const [records, setRecords] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchRecords = async () => {
      if (!relatedEntityType || !endpointMap[relatedEntityType]) {
        if (isMounted) {
          setRecords([]);
          setError(null);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const { url, map } = endpointMap[relatedEntityType];
        const response = await fetch(`${BASE_URL}${url}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load related records");
        }

        const data = await response.json();
        const items = Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : [];
        const mapped = items.map(map);

        if (isMounted) {
          setRecords(mapped);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching related records:", err);
          setRecords([]);
          setError(err.message || "Failed to load related records");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRecords();

    return () => {
      isMounted = false;
    };
  }, [relatedEntityType]);

  return { records, isLoading, error };
};

export default useRelatedRecords;
