import React from "react";
import BASE_URL from "Base/api";

const useQuoteStatuses = () => {
  const [statuses, setStatuses] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchStatuses = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/EnumLookup/QuoteStatuses`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch quote statuses");
        }

        const data = await response.json();
        const options = data?.result
          ? Object.entries(data.result).map(([value, label]) => ({ value, label }))
          : [];

        if (isMounted) {
          setStatuses(options);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching quote statuses:", err);
          setError(err);
          setStatuses([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStatuses();

    return () => {
      isMounted = false;
    };
  }, []);

  return { statuses, isLoading, error };
};

export default useQuoteStatuses;
