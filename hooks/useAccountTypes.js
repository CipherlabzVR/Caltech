import React from "react";
import BASE_URL from "Base/api";

const useAccountTypes = () => {
  const [accountTypes, setAccountTypes] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    const fetchAccountTypes = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/EnumLookup/AccountTypes`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch account types");
        }

        const data = await response.json();
        const options = data?.result
          ? Object.entries(data.result).map(([id, label]) => ({
              id,
              label,
            }))
          : [];

        if (isMounted) {
          setAccountTypes(options);
        }
      } catch (error) {
        console.error("Error fetching account types:", error);
        if (isMounted) {
          setAccountTypes([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAccountTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  return { accountTypes, isLoading };
};

export default useAccountTypes;


