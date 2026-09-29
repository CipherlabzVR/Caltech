import React from "react";
import BASE_URL from "Base/api";

const useContacts = () => {
  const [contacts, setContacts] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/CRMContacts/GetCRMContacts`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch contacts");
        }

        const data = await response.json();
        const items = Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : [];

        const normalized = items.map((contact) => ({
          id: contact.id,
          name: [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.email || `Contact #${contact.id}`,
          meta: contact,
        }));

        if (isMounted) {
          setContacts(normalized);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching contacts:", err);
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
  }, []);

  return { contacts, isLoading, error };
};

export default useContacts;
