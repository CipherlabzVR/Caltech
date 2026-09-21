
import { useEffect, useState } from "react";
import BASE_URL from "Base/api";
import usePaginationHandlers from "@/components/hooks/usePaginationHandlers";

const usePaginatedFetch = (endpoint, initialSearch = "", initialPageSize = 10) => {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [isCurrentDate, setIsCurrentDate] = useState(true);

  
  const fetchData = async (pageNum = page, term = search, size = pageSize, isTodayOnly = isCurrentDate) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (pageNum - 1) * size;
      const query = `${BASE_URL}/${endpoint}&SkipCount=${skip}&MaxResultCount=${size}&Search=${term || "null"}&isCurrentDate=${isTodayOnly}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const json = await response.json();
      setData(json.result.items || []);
      setTotalCount(json.result.totalCount || 0);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchData(1, search, pageSize);
  }, []);

  const {
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    handleChangePage,
    handleChangeRowsPerPage,
    pageBeforeSearchRef,
  } = usePaginationHandlers({
    page,
    pageSize,
    totalCount,
    search,
    setPage,
    setPageSize,
    setSearch,
    onFetch: (targetPage, value, size) =>
      fetchData(targetPage, value, size, isCurrentDate),
  });

  return {
    data,
    totalCount,
    page,
    pageSize,    
    search,
    isCurrentDate,
    setPage,
    setPageSize,    
    setSearch,
    setIsCurrentDate,
    fetchData,
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    handleChangePage,
    handleChangeRowsPerPage,
    pageBeforeSearchRef,
  };
};

export default usePaginatedFetch;
