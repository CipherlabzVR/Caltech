import React, { useMemo, useState } from "react";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import ItemTypeForm from "./ItemTypeForm";

export default function EditItemType({ itemType, fetchItems }) {
  const [open, setOpen] = useState(false);

  const initialValues = useMemo(
    () => ({
      Name: itemType?.name || "",
      Description: itemType?.description || "",
      IsActive: !!itemType?.isActive,
      Features: (itemType?.features || []).map((f) => ({
        Id: f.id,
        Name: f.name || "",
        SortOrder: f.sortOrder || 0,
        Options: (f.options || []).map((o) => ({
          Id: o.id,
          Value: o.value || "",
          SortOrder: o.sortOrder || 0,
        })),
      })),
    }),
    [itemType]
  );

  return (
    <>
      <IconButton color="primary" onClick={() => setOpen(true)} title="Edit">
        <EditIcon fontSize="small" />
      </IconButton>
      <ItemTypeForm
        open={open}
        onClose={() => setOpen(false)}
        initialValues={initialValues}
        itemTypeId={itemType?.id}
        fetchItems={fetchItems}
        title="Edit Item Type"
        endpoint="UpdateItemType"
      />
    </>
  );
}
