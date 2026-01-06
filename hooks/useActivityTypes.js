import React from "react";
import BASE_URL from "Base/api";

const useActivityTypes = () => {
  const [types, setTypes] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchTypes = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/EnumLookup/ActivityTypes`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load activity types");
        }

        const data = await response.json();
        const options = data?.result
          ? Object.entries(data.result).map(([value, label]) => ({
              value,
              label,
            }))
          : [];

        if (isMounted) {
          setTypes(options);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching activity types:", err);
          setTypes([]);
          setError(err.message || "Failed to load activity types");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  return { types, isLoading, error };
};

export default useActivityTypes;
