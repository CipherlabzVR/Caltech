import React from "react";
import BASE_URL from "Base/api";

const useActiveCampaigns = (refreshKey = 0) => {
  const [campaigns, setCampaigns] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchCampaigns = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/CRMCampaign/GetActiveCampaigns`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok) throw new Error("Failed to load campaigns");
        const data = await response.json();
        const list = Array.isArray(data?.result) ? data.result : [];
        if (isMounted) setCampaigns(list);
      } catch (err) {
        if (isMounted) {
          setCampaigns([]);
          setError(err.message || "Failed to load campaigns");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCampaigns();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  return { campaigns, isLoading, error };
};

export default useActiveCampaigns;
