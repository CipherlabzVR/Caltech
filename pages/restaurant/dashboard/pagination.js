import { FormControl, Grid, InputLabel, MenuItem, Pagination, Select } from "@mui/material";

const PaginationUI = ({ totalCount, pageSize, page, onPageChange, onPageSizeChange }) => {
  return (
    <Grid container justifyContent="space-between" mt={2} mb={2}>
      <Pagination
        count={Math.ceil((totalCount || 0) / (pageSize || 1))}
        page={page}
        onChange={onPageChange}
        shape="rounded"
        sx={{
          "& .MuiPaginationItem-root": {
            color: "rgba(254, 101, 100, 1)",
            "&:hover": {
              backgroundColor: "rgba(254, 101, 100, 1)",
              color: "#fff",
            },
          },
          "& .Mui-selected": {
            backgroundColor: "rgba(254, 101, 100, 1)",
            color: "#fff",
            "&:hover": {
              color: "#fff",
              backgroundColor: "rgba(254, 101, 100, 1)",
            },
          },
        }}
      />
      <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
        <InputLabel>Page Size</InputLabel>
        <Select value={pageSize} label="Page Size" onChange={onPageSizeChange}>
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={25}>25</MenuItem>
          <MenuItem value={50}>50</MenuItem>
        </Select>
      </FormControl>
    </Grid>
  );
};

export default PaginationUI;
