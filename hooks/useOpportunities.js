import React from "react";
import BASE_URL from "Base/api";

const useOpportunities = () => {
  const [opportunities, setOpportunities] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchOpportunities = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/CRMOpportunities/GetCRMOpportunities`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load opportunities");
        }

        const data = await response.json();
        const items = Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : [];

        const normalized = items.map((opportunity) => ({
          id: opportunity.id,
          name: opportunity.opportunityName || `Opportunity #${opportunity.id}`,
          meta: opportunity,
        }));

        if (isMounted) {
          setOpportunities(normalized);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching opportunities:", err);
          setOpportunities([]);
          setError(err.message || "Failed to load opportunities");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOpportunities();

    return () => {
      isMounted = false;
    };
  }, []);

  return { opportunities, isLoading, error };
};

export default useOpportunities;
