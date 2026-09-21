import React, { useCallback, useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Typography, CircularProgress, Box } from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;
const TABLE_COL_SPAN = 10;

const computeHasMore = (pageNumber, totalCount, pageSize) =>
  pageNumber * pageSize < totalCount;

const formatDateTime = (value) => {
  if (!value) return "–";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "–";
    return `${formatDate(value)} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return "–";
  }
};

const formatPrice = (value) =>
  value != null && value !== "" ? formatCurrency(value) : "–";

export default function PriceEditHistoryView({ showCostPrice = false }) {
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const fetchingMoreRef = useRef(false);
  const loadMoreArmedRef = useRef(true);
  const tableContainerRef = useRef(null);

  const colSpan = showCostPrice ? TABLE_COL_SPAN : TABLE_COL_SPAN - 2;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPage = useCallback(
    async (pageNumber, { append = false, term = debouncedSearch } = {}) => {
      if (typeof window === "undefined") return { items: [], totalCount: 0 };

      const token = localStorage.getItem("token");
      const skip = (pageNumber - 1) * PAGE_SIZE;
      const searchParam = term ? encodeURIComponent(term) : "null";
      const url =
        `${BASE_URL}/StockBalance/GetStockBalanceDetailsLogPage` +
        `?SkipCount=${skip}&MaxResultCount=${PAGE_SIZE}&Search=${searchParam}&Filter=null`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load price edit history.");
      }

      const json = await response.json();
      let items = [];
      let count = 0;

      if (Array.isArray(json?.result)) {
        items = json.result;
        count = json.result.length;
      } else if (json?.result?.result?.items) {
        items = json.result.result.items || [];
        count = Number(json.result.result.totalCount ?? items.length);
      } else if (json?.result?.items) {
        items = json.result.items || [];
        count = Number(json.result.totalCount ?? items.length);
      }

      if (append) {
        setRows((prev) => [...prev, ...items]);
      } else {
        setRows(items);
      }

      setTotalCount(count);
      setPage(pageNumber);
      setHasMore(computeHasMore(pageNumber, count, PAGE_SIZE));

      return { items, totalCount: count };
    },
    [debouncedSearch]
  );

  useEffect(() => {
    let cancelled = false;

    const loadFirstPage = async () => {
      try {
        setLoading(true);
        setHasMore(false);
        fetchingMoreRef.current = false;
        loadMoreArmedRef.current = true;
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollTop = 0;
        }
        await fetchPage(1, { append: false, term: debouncedSearch });
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching price edit history:", error);
          toast.error(error.message || "Failed to load price edit history.");
          setRows([]);
          setTotalCount(0);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFirstPage();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, fetchPage]);

  const loadMore = useCallback(async () => {
    if (
      !loadMoreArmedRef.current ||
      fetchingMoreRef.current ||
      loading ||
      loadingMore ||
      !hasMore
    ) {
      return;
    }

    loadMoreArmedRef.current = false;
    fetchingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      await fetchPage(nextPage, { append: true, term: debouncedSearch });
    } catch (error) {
      console.error("Error loading more price edit history:", error);
      toast.error(error.message || "Failed to load more history.");
      loadMoreArmedRef.current = true;
    } finally {
      setLoadingMore(false);
      fetchingMoreRef.current = false;
    }
  }, [debouncedSearch, fetchPage, hasMore, loading, loadingMore, page]);

  const handleTableScroll = (event) => {
    const container = event.currentTarget;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom > 160) {
      loadMoreArmedRef.current = true;
    }

    if (distanceFromBottom <= 80) {
      loadMore();
    }
  };

  return (
    <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
      <Grid item xs={12} lg={4}>
        <Search className="search-form">
          <StyledInputBase
            placeholder="Search item, code, batch..."
            inputProps={{ "aria-label": "search price edit history" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Search>
      </Grid>

      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? "Loading history..."
              : `${totalCount} change(s)${hasMore ? " • scroll for more" : ""}`}
          </Typography>
        </Box>

        <TableContainer
          component={Paper}
          ref={tableContainerRef}
          onScroll={handleTableScroll}
          sx={{ maxHeight: 560, overflow: "auto" }}
        >
          <Table stickyHeader aria-label="price edit history table" className="dark-table">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Changed On</TableCell>
                <TableCell>Item Code</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell>Batch No</TableCell>
                <TableCell align="right">Old Selling Price</TableCell>
                <TableCell align="right">New Selling Price</TableCell>
                {showCostPrice && <TableCell align="right">Old Cost Price</TableCell>}
                {showCostPrice && <TableCell align="right">New Cost Price</TableCell>}
                <TableCell>Changed By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center" sx={{ py: 4 }}>
                    <Typography color="error">No price edit history found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={row.id ?? index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{formatDateTime(row.changedOn)}</TableCell>
                    <TableCell>{row.productCode || "–"}</TableCell>
                    <TableCell>{row.productName || "–"}</TableCell>
                    <TableCell>{row.batchNumber || "–"}</TableCell>
                    <TableCell align="right">{formatPrice(row.oldSellingPrice)}</TableCell>
                    <TableCell align="right">{formatPrice(row.newSellingPrice)}</TableCell>
                    {showCostPrice && (
                      <TableCell align="right">{formatPrice(row.oldCostPrice)}</TableCell>
                    )}
                    {showCostPrice && (
                      <TableCell align="right">{formatPrice(row.newCostPrice)}</TableCell>
                    )}
                    <TableCell>{row.changedByName || "–"}</TableCell>
                  </TableRow>
                ))
              )}
              {loadingMore && (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center" sx={{ py: 2 }}>
                    <CircularProgress size={22} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}
