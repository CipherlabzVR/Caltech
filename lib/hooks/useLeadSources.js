import React from "react";
import BASE_URL from "Base/api";

const useLeadSources = () => {
  const [sources, setSources] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchSources = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/EnumLookup/LeadSources`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load lead sources");
        }

        const data = await response.json();
        const options = data?.result
          ? Object.entries(data.result).map(([value, label]) => ({
              value,
              label,
            }))
          : [];

        if (isMounted) {
          setSources(options);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching lead sources:", err);
          setSources([]);
          setError(err.message || "Failed to load lead sources");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSources();

    return () => {
      isMounted = false;
    };
  }, []);

  return { sources, isLoading, error };
};

export default useLeadSources;


