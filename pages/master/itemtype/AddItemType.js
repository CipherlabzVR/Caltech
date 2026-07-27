import React, { useState } from "react";
import Button from "@mui/material/Button";
import ItemTypeForm from "./ItemTypeForm";

export default function AddItemType({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const initialValues = {
    Name: "",
    Description: "",
    IsActive: true,
    Features: [],
  };
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        + new item type
      </Button>
      <ItemTypeForm
        open={open}
        onClose={() => setOpen(false)}
        initialValues={initialValues}
        fetchItems={fetchItems}
        title="Add Item Type"
        endpoint="CreateItemType"
      />
    </>
  );
}
