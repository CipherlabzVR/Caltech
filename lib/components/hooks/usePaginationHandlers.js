import { useRef } from "react";

/**
 * Shared pagination UX:
 * - Preserve current page when page size changes (clamp to last valid page using the NEW size).
 * - Jump to first page when searching; restore previous page when search is cleared.
 *
 * @param {object} options
 * @param {number} options.page
 * @param {number} options.pageSize
 * @param {number} options.totalCount
 * @param {string} [options.search=""]
 * @param {function} options.setPage
 * @param {function} options.setPageSize
 * @param {function} [options.setSearch]
 * @param {function} options.onFetch - (page, search, pageSize) => void
 * @param {function} [options.onSearchValueChange] - sync extra search state (e.g. searchTerm)
 * @param {number} [options.searchFirstPage=1] - use 0 for zero-based TablePagination
 * @param {boolean} [options.zeroBasedPage=false] - internal page index starts at 0; MUI Pagination value is converted
 */
export default function usePaginationHandlers({
  page,
  pageSize,
  totalCount,
  search = "",
  setPage,
  setPageSize,
  setSearch,
  onFetch,
  onSearchValueChange,
  searchFirstPage = 1,
  zeroBasedPage = false,
}) {
  const isZeroBased = zeroBasedPage || searchFirstPage === 0;
  const firstPage = isZeroBased ? 0 : searchFirstPage;
  const pageBeforeSearchRef = useRef(firstPage);

  const toInternalPage = (pageValue) =>
    zeroBasedPage ? pageValue - 1 : pageValue;

  const maxPage = (size = pageSize) => {
    const safeSize = Number(size) > 0 ? Number(size) : pageSize;
    const pages = Math.ceil(totalCount / safeSize) || 1;
    return isZeroBased ? Math.max(0, pages - 1) : Math.max(1, pages);
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    const wasEmpty = !String(search).trim();
    const isEmpty = !value.trim();

    if (wasEmpty && !isEmpty) {
      pageBeforeSearchRef.current = page;
    }

    let targetPage = page;
    if (!isEmpty) {
      targetPage = firstPage;
    } else if (!wasEmpty) {
      targetPage = pageBeforeSearchRef.current;
    }

    if (setSearch) {
      setSearch(value);
    }
    if (onSearchValueChange) {
      onSearchValueChange(value);
    }
    setPage(targetPage);
    onFetch(targetPage, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    const internalPage = toInternalPage(value);
    setPage(internalPage);
    onFetch(internalPage, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = Number(event.target.value);
    const newPage = Math.min(page, maxPage(size));
    setPageSize(size);
    setPage(newPage);
    onFetch(newPage, search, size);
  };

  return {
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    handleChangePage: handlePageChange,
    handleChangeRowsPerPage: handlePageSizeChange,
    pageBeforeSearchRef,
  };
}
