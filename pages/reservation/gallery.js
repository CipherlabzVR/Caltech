import React, { useEffect, useState } from "react";
import { Grid, Box, Typography } from "@mui/material";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import BASE_URL from "Base/api";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";

const Gallery = () => {
  const [itemData, setItemData] = useState([]);
  const controller = "ReservationMedia/Delete";

  const fetchImages = async () => {
    try {
      const response = await fetch(`${BASE_URL}/ReservationMedia/GetAll`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setItemData(data.result);
    } catch (error) {
      console.error("Error fetching", error);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Gallery</h1>
        <ul>
          <li>
            <Link href="/">Reservation</Link>
          </li>
          <li>Gallery</li>
        </ul>
      </div>

      <Grid container my={2} spacing={2}>
        <Grid item xs={12}>
          <Box p={3} sx={{ bgcolor: "background.paper" }}>
            <Box sx={{ width: "100%", height: "auto" }}>
              {itemData.length === 0 ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  flexDirection="column"
                  sx={{
                    width: "100%",
                    py: 10,
                    color: "text.secondary",
                    border: "1px dashed #ccc",
                    borderRadius: "8px",
                  }}
                >
                  <ImageNotSupportedIcon sx={{ fontSize: 60, mb: 2 }} />
                  <Typography>No Images Found</Typography>
                </Box>
              ) : (
                <ImageList variant="masonry" cols={3} gap={8}>
                  {itemData.map((item, index) => (
                    <ImageListItem key={index}>
                      <img
                        src={item.imageURL}
                        alt={item.fileName}
                        loading="lazy"
                        style={{ borderRadius: "8px" }}
                      />
                      <ImageListItemBar
                        title={item.fileName}
                        position="bottom"
                        sx={{
                          background:
                            "linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0))",
                          padding: "8px",
                        }}
                        actionIcon={
                          <DeleteConfirmationById
                            id={item.id}
                            controller={controller}
                            fetchItems={fetchImages}
                          />
                        }
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default Gallery;
