import React from "react";
import BASE_URL from "Base/api";

const useRelatedEntityTypes = () => {
  const [entities, setEntities] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchEntities = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/EnumLookup/RelatedEntityTypes`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load related entities");
        }

        const data = await response.json();
        const options = data?.result
          ? Object.entries(data.result).map(([value, label]) => ({
              value,
              label,
            }))
          : [];

        if (isMounted) {
          setEntities(options);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching related entities:", err);
          setEntities([]);
          setError(err.message || "Failed to load related entities");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchEntities();

    return () => {
      isMounted = false;
    };
  }, []);

  return { entities, isLoading, error };
};

export default useRelatedEntityTypes;
