import React, { useEffect, useState } from "react";
import {
  Button,
  Grid,
  Paper,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DocImageList from "@/components/UIElements/SwiperSlider/DocImageList";
import BASE_URL from "Base/api";
import DocType from "../Types/docType";
import DocSubType from "../Types/docSubType";
import ComponentFirstRowsType from "../Types/compFirstRowType";
import ComponentTypes from "../Types/compType";

export default function DocumentListShort() {
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const [info, setInfo] = useState([]);
  const [doclist, setDoclist] = useState([]);

  const fetchComponent = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/ComponentPanel/GetComponentPanelByInq?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Neck Body List");
      }
      const data = await response.json();
      setInfo(data.result.result);
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/AWS/GetAllDocumentsByOption?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Neck Body List");
      }
      const responseData = await response.json();
      if (!responseData.result || !Array.isArray(responseData.result)) {
        throw new Error("Data is not in the expected format");
      }
      const data = responseData.result;
      const filtered = data.filter(
        (item) => item.documentType !== 7 && item.documentSubContentType !== 5
      );

      setDoclist(filtered);
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };

  useEffect(() => {
    fetchComponent();
    fetchDocuments();
  }, []);

  return (
    <>
      <Grid container>
        <Grid item xs={12} lg={5} pr={1}>
          <TableContainer component={Paper}>
            <Table
              size="small"
              aria-label="simple table"
              className="dark-table"
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    style={{ backgroundColor: "#7884ef", color: "#fff" }}
                    colSpan={2}
                  >
                    Component
                  </TableCell>
                </TableRow>
                {info === null ? (
                  <TableCell colSpan={2}>
                    <Typography color="error">Not Selected</Typography>
                  </TableCell>
                ) : (
                  info.map((info, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {info.componentTypes == 16 ||
                        info.componentTypes == 17 ? (
                          <ComponentFirstRowsType
                            typr={info.componentFirstRows}
                          />
                        ) : (
                          <ComponentTypes typr={info.componentTypes} />
                        )}
                      </TableCell>
                      <TableCell>
                        {info.componentValue ? info.componentValue : ""}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableHead>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12} lg={7}>
          <DocImageList />
        </Grid>
        <Grid item xs={12}>
          <Typography fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
            Documents
          </Typography>
          <Grid container>
            {doclist.length == 0 ? (
              <Typography color="error">Documents Not Selected</Typography>
            ) : (
              doclist.map((image, index) => (
                <Grid key={index} item lg={3} md={6} xs={6}>
                  <Button
                    fullWidth
                    sx={{ borderRadius: 0, height: "50px" }}
                    variant="contained"
                  >
                    {" "}
                    <DocType type={image.documentContentType} /> -{" "}
                    <DocSubType type={image.documentSubContentType} />
                  </Button>
                </Grid>
              ))
            )}
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
