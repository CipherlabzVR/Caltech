import React from "react";
import BASE_URL from "Base/api";

const useCRMAccounts = () => {
  const [accounts, setAccounts] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchAccounts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/CRMAccounts/GetCRMAccounts`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load accounts");
        }

        const data = await response.json();
        const items = Array.isArray(data?.result) ? data.result : [];

        if (isMounted) {
          setAccounts(items);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching CRM accounts:", err);
          setError(err.message || "Failed to load accounts");
          setAccounts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAccounts();

    return () => {
      isMounted = false;
    };
  }, []);

  return { accounts, isLoading, error };
};

export default useCRMAccounts;


