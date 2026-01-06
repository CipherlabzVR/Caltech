import React from "react";
import BASE_URL from "Base/api";

const useOpportunityStages = () => {
  const [stages, setStages] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchStages = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const response = await fetch(`${BASE_URL}/EnumLookup/OpportunityStages`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load opportunity stages");
        }

        const data = await response.json();
        const options = data?.result
          ? Object.entries(data.result).map(([value, label]) => ({
              value,
              label,
            }))
          : [];

        if (isMounted) {
          setStages(options);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching opportunity stages:", err);
          setStages([]);
          setError(err.message || "Failed to load opportunity stages");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStages();

    return () => {
      isMounted = false;
    };
  }, []);

  return { stages, isLoading, error };
};

export default useOpportunityStages;


