import { useState, useEffect } from "react";
import BASE_URL from "Base/api";

const useLoggedUserCompanyLetterhead = () => {
  const [letterheadImage, setLetterheadImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyData, setCompanyData] = useState(null);

  useEffect(() => {
    const fetchLetterhead = async () => {
      // Only fetch on client side
      if (typeof window === "undefined") {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found");
          setLoading(false);
          return;
        }

        const response = await fetch(`${BASE_URL}/Company/GetLoggedUserCompany`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch company data: ${response.status}`);
        }

        const result = await response.json();

        if (result.statusCode === 200 && result.result) {
          setCompanyData(result.result);
          setLetterheadImage(result.result.letterHeadImage || null);
        } else {
          throw new Error(result.message || "Failed to retrieve company data");
        }
      } catch (err) {
        console.error("Error fetching company letterhead:", err);
        setError(err.message || "Error fetching company letterhead");
        setLetterheadImage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLetterhead();
  }, []);

  return { letterheadImage, companyData, loading, error };
};

export default useLoggedUserCompanyLetterhead;

