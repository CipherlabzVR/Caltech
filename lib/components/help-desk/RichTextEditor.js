import React, { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Box, Typography } from "@mui/material";

// Dynamically import ReactQuill only on client side
const ReactQuill = dynamic(
  () => import("react-quill").then((mod) => mod.default || mod),
  { ssr: false }
);

// Import CSS only on client side
if (typeof window !== "undefined") {
  require("react-quill/dist/quill.snow.css");
}

const RichTextEditor = ({ value, onChange, error, helperText, label, ...props }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: [] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
        [{ script: "sub" }, { script: "super" }],
        [{ align: [] }],
        ["link", "image", "video"],
        [{ color: [] }, { background: [] }],
        ["clean"],
      ],
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "script",
    "align",
    "link",
    "image",
    "video",
    "color",
    "background",
  ];

  return (
    <Box>
      {label && (
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
          {label}
        </Typography>
      )}
      <Box
        sx={{
          "& .ql-container": {
            minHeight: "200px",
            fontSize: "1rem",
            fontFamily: "inherit",
          },
          "& .ql-editor": {
            minHeight: "200px",
          },
          "& .ql-toolbar": {
            borderTopLeftRadius: "4px",
            borderTopRightRadius: "4px",
            borderBottom: "none",
          },
          "& .ql-container": {
            borderBottomLeftRadius: "4px",
            borderBottomRightRadius: "4px",
            borderTop: error ? "2px solid #d32f2f" : "1px solid rgba(0, 0, 0, 0.23)",
          },
          "& .ql-container:hover": {
            borderTop: error ? "2px solid #d32f2f" : "2px solid rgba(0, 0, 0, 0.87)",
          },
          "& .ql-container.ql-snow": {
            borderColor: error ? "#d32f2f" : "rgba(0, 0, 0, 0.23)",
          },
          "& .ql-toolbar.ql-snow": {
            borderColor: error ? "#d32f2f" : "rgba(0, 0, 0, 0.23)",
          },
        }}
      >
        {isMounted && ReactQuill ? (
          <ReactQuill
            theme="snow"
            value={value || ""}
            onChange={onChange}
            modules={modules}
            formats={formats}
            placeholder="Enter description..."
            {...props}
          />
        ) : (
          <Box
            sx={{
              minHeight: "200px",
              border: error ? "2px solid #d32f2f" : "1px solid rgba(0, 0, 0, 0.23)",
              borderRadius: "4px",
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            Loading editor...
          </Box>
        )}
      </Box>
      {error && helperText && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
          {helperText}
        </Typography>
      )}
      {!error && helperText && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default RichTextEditor;

