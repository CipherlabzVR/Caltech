import React from "react";
import BASE_URL from "Base/api";

const useContactsByAccount = (accountId) => {
  const [contacts, setContacts] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchContacts = async () => {
      if (!accountId) {
        if (isMounted) {
          setContacts([]);
          setError(null);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(
          `${BASE_URL}/CRMContacts/GetCRMContactsByAccountId?accountId=${accountId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load contacts");
        }

        const data = await response.json();
        const items = Array.isArray(data?.result) ? data.result : [];

        if (isMounted) {
          setContacts(items);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching contacts by account:", err);
          setContacts([]);
          setError(err.message || "Failed to load contacts");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchContacts();

    return () => {
      isMounted = false;
    };
  }, [accountId]);

  return { contacts, isLoading, error };
};

export default useContactsByAccount;
