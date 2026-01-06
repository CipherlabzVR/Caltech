import React from "react";
import BASE_URL from "Base/api";

const useChartTypes = () => {
  const [chartTypes, setChartTypes] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchChartTypes = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/EnumLookup/ChartTypes`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load chart types");
        }

        const data = await response.json();
        const options = data?.result
          ? Object.entries(data.result).map(([value, label]) => ({
              value,
              label,
            }))
          : [];

        if (isMounted) {
          setChartTypes(options);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching chart types:", err);
          setChartTypes([]);
          setError(err.message || "Failed to load chart types");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchChartTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  return { chartTypes, isLoading, error };
};

export default useChartTypes;


