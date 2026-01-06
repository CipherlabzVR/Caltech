import React from "react";
import BASE_URL from "Base/api";

const useUsers = () => {
  const [users, setUsers] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/User/GetAllUser`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load users");
        }

        const data = await response.json();
        const items = Array.isArray(data) ? data : data?.result || [];

        if (isMounted) {
          setUsers(
            items.map((user) => ({
              id: user.id,
              internalUserId: user.internalUserId,
              firstName: user.firstName,
              lastName: user.lastName,
            }))
          );
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching users:", err);
          setUsers([]);
          setError(err.message || "Failed to load users");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  return { users, isLoading, error };
};

export default useUsers;
