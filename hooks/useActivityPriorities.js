import React from "react";
import BASE_URL from "Base/api";

const useActivityPriorities = () => {
  const [priorities, setPriorities] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchPriorities = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/EnumLookup/ActivityPriorities`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load activity priorities");
        }

        const data = await response.json();
        const options = data?.result
          ? Object.entries(data.result).map(([value, label]) => ({
              value,
              label,
            }))
          : [];

        if (isMounted) {
          setPriorities(options);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching activity priorities:", err);
          setPriorities([]);
          setError(err.message || "Failed to load activity priorities");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPriorities();

    return () => {
      isMounted = false;
    };
  }, []);

  return { priorities, isLoading, error };
};

export default useActivityPriorities;
