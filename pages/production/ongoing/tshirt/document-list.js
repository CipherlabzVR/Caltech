import React, { useEffect, useState } from "react";
import {
  Button,
  ButtonGroup,
  Grid,
  Paper,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import BASE_URL from "Base/api";
import DocImageList from "@/components/UIElements/SwiperSlider/DocImageList";
import DocType from "../Types/docType";
import DocSubType from "../Types/docSubType";

export default function DocumentListTShirt() {
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const [selectedNeck, setSelectedNeck] = useState();
  const [polo, setPolo] = useState({});
  const [crewfirst, setCrewfirst] = useState({});
  const [crewsecond, setCrewsecond] = useState({});
  const [vfirst, setVfirst] = useState({});
  const [vsecond, setVsecond] = useState({});
  const [vthird, setVthird] = useState({});
  const [doclist, setDoclist] = useState([]);
  const [isContrastSelected, setIsContrastSelected] = useState();
  const [isAHPiePinSelected, setIsAHPiePinSelected] = useState();
  const [isCuffPiePinSelected, setIsCuffPiePinSelected] = useState();
  const [isBottomDHEMSelected, setIsBottomDHEMSelected] = useState();

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
    fetchDocuments();
  }, []);

  const fetchNeckBodyList = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/GetAllNeckBody?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
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
      const resultWithNeckBody1 = data.result.find(
        (item) => item.neckBodyTypes === 1
      );
      const resultWithNeckBody2 = data.result.find(
        (item) => item.neckBodyTypes === 2
      );
      const resultWithNeckBody3 = data.result.find(
        (item) => item.neckBodyTypes === 3
      );
      const resultWithNeckBody4 = data.result.find(
        (item) => item.neckBodyTypes === 4
      );

      if (resultWithNeckBody1) {
        setIsContrastSelected(true);
      }
      if (resultWithNeckBody2) {
        setIsAHPiePinSelected(true);
      }
      if (resultWithNeckBody3) {
        setIsCuffPiePinSelected(true);
      }
      if (resultWithNeckBody4) {
        setIsBottomDHEMSelected(true);
      }
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };

  const fetchNeckType = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/GetNeckType?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
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
      setSelectedNeck(data.result.necKTypes);
      fetchNeckDetails(data.result.necKTypes);
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };

  const fetchNeckDetails = async (neck) => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}&necKTypes=${neck}`,
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
      if (neck === 1) {
        setPolo(data.result[0]);
      } else if (neck === 2) {
        const resultWithNeckFirstRows5 = data.result.find(
          (item) => item.neckFirstRows === 5
        );

        const resultWithNeckFirstRows6 = data.result.find(
          (item) => item.neckFirstRows === 6
        );

        if (resultWithNeckFirstRows5) {
          setCrewfirst(resultWithNeckFirstRows5);
        }
        if (resultWithNeckFirstRows6) {
          setCrewsecond(resultWithNeckFirstRows6);
        }
      } else if (neck === 3) {
        const resultWithNeckFirstRows7 = data.result.find(
          (item) => item.neckFirstRows === 7
        );

        const resultWithNeckFirstRows8 = data.result.find(
          (item) => item.neckFirstRows === 8
        );

        const resultWithNeckFirstRows9 = data.result.find(
          (item) => item.neckFirstRows === 9
        );

        if (resultWithNeckFirstRows7) {
          setVfirst(resultWithNeckFirstRows7);
        }
        if (resultWithNeckFirstRows8) {
          setVsecond(resultWithNeckFirstRows8);
        }
        if (resultWithNeckFirstRows9) {
          setVthird(resultWithNeckFirstRows9);
        }
      }
    } catch (error) {
      //console.error("Error fetching Neck Body List:", error);
    }
  };

  useEffect(() => {
    fetchNeckBodyList();
    fetchNeckType();
  }, []);

  return (
    <>
      <Grid container>
        <Grid item xs={12} lg={5} pr={1}>
          {selectedNeck === 1 ? (
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
                      Polo Neck
                    </TableCell>
                  </TableRow>
                  {polo.neckFirstRows === 10 ? (
                    ""
                  ) : (
                    <TableRow>
                      <TableCell>Collar Type</TableCell>
                      <TableCell>
                        {polo.neckFirstRows === 1
                          ? "PLAIN KNITTED COLLAR"
                          : polo.neckFirstRows === 2
                          ? "TIFFIN KNITTED COLLAR"
                          : polo.neckFirstRows === 3
                          ? "SELF FABRIC COLLAR"
                          : polo.neckFirstRows === 4
                          ? "SELF FABRIC COLLAR WITH PIE PIN"
                          : ""}
                      </TableCell>
                    </TableRow>
                  )}
                  {polo.neck2ndRowS === 9 ? (
                    ""
                  ) : (
                    <TableRow>
                      <TableCell>Collar Design</TableCell>
                      <TableCell>
                        {polo.neck2ndRowS === 1
                          ? "Full"
                          : polo.neck2ndRowS === 2
                          ? "Chinese"
                          : "Not Selected"}
                      </TableCell>
                    </TableRow>
                  )}
                  {polo.neck3rdRowS === 6 ? (
                    ""
                  ) : (
                    <TableRow>
                      <TableCell>Placket Type</TableCell>
                      <TableCell>
                        {polo.neck3rdRowS === 1
                          ? "Single Placket"
                          : polo.neck3rdRowS === 2
                          ? "Piping Single Placket"
                          : polo.neck3rdRowS === 3
                          ? "Double Color Double Placket"
                          : polo.neck3rdRowS === 4
                          ? "Single Color Double Placket"
                          : polo.neck3rdRowS === 5
                          ? "Zipper"
                          : "Not Selected"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableHead>
              </Table>
            </TableContainer>
          ) : selectedNeck === 2 ? (
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
                      Crew Neck
                    </TableCell>
                  </TableRow>
                  {crewsecond.neckFirstRows === 6 ? (
                    <TableRow>
                      <TableCell>Crew Neck</TableCell>
                      <TableCell>
                        {crewsecond.neck2ndRowS === 9
                          ? "Not Selected"
                          : crewsecond.neck2ndRowS === 5
                          ? "RIB"
                          : crewsecond.neck2ndRowS === 6
                          ? "Fabric"
                          : ""}
                      </TableCell>
                    </TableRow>
                  ) : (
                    ""
                  )}
                  {crewfirst.neckFirstRows === 5 ? (
                    <TableRow>
                      <TableCell>Chinese CLR / CN</TableCell>
                      <TableCell>
                        {crewfirst.neck2ndRowS === 9
                          ? "Not Selected"
                          : crewfirst.neck2ndRowS === 3
                          ? "Normal"
                          : crewfirst.neck2ndRowS === 4
                          ? "1 / 8 Line"
                          : ""}
                      </TableCell>
                    </TableRow>
                  ) : (
                    ""
                  )}
                </TableHead>
              </Table>
            </TableContainer>
          ) : selectedNeck === 3 ? (
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
                      V Neck
                    </TableCell>
                  </TableRow>
                  {vfirst.neckFirstRows === 7 ? (
                    <TableRow>
                      <TableCell>V Neck</TableCell>
                      <TableCell>
                        {vfirst.neck2ndRowS === 9
                          ? "Not Selected"
                          : vfirst.neck2ndRowS === 5
                          ? "RIB"
                          : vfirst.neck2ndRowS === 6
                          ? "Fabric"
                          : ""}
                      </TableCell>
                    </TableRow>
                  ) : (
                    ""
                  )}
                  {vsecond.neckFirstRows === 8 ? (
                    <TableRow>
                      <TableCell>Chinese V Neck</TableCell>
                      <TableCell>
                        {vsecond.neck2ndRowS === 9
                          ? "Not Selected"
                          : vsecond.neck2ndRowS === 3
                          ? "Normal"
                          : vsecond.neck2ndRowS === 4
                          ? "1 / 8 Line"
                          : ""}
                      </TableCell>
                    </TableRow>
                  ) : (
                    ""
                  )}
                  {vthird.neckFirstRows === 9 ? (
                    <TableRow>
                      <TableCell>Full CLR V Neck</TableCell>
                      <TableCell>
                        {vthird.neck2ndRowS === 9
                          ? "Not Selected"
                          : vthird.neck2ndRowS === 3
                          ? "Normal"
                          : vthird.neck2ndRowS === 4
                          ? "1 / 8 Line"
                          : ""}
                      </TableCell>
                    </TableRow>
                  ) : (
                    ""
                  )}
                </TableHead>
              </Table>
            </TableContainer>
          ) : (
            "Neck type is not selected"
          )}
        </Grid>
        <Grid item xs={12} lg={7}>
          <DocImageList />
        </Grid>
        <Grid item xs={12}>
          <Typography fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
            Other Details
          </Typography>
          <ButtonGroup fullWidth>
            {isContrastSelected ? (
              <Button variant="contained">Contrast</Button>
            ) : (
              ""
            )}
            {isAHPiePinSelected ? (
              <Button variant="contained">A/H Pie Pin</Button>
            ) : (
              ""
            )}
            {isCuffPiePinSelected ? (
              <Button variant="contained">Cuff Pie Pin</Button>
            ) : (
              ""
            )}
            {isBottomDHEMSelected ? (
              <Button variant="contained">Bottom D / Hem</Button>
            ) : (
              ""
            )}
            {isContrastSelected ||
            isAHPiePinSelected ||
            isCuffPiePinSelected ||
            isBottomDHEMSelected ? (
              ""
            ) : (
              <Typography color="error">Not selected</Typography>
            )}
          </ButtonGroup>
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
