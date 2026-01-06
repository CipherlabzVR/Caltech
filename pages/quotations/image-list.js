import * as React from 'react';
import Box from '@mui/material/Box';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import BASE_URL from 'Base/api';
import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import DocType from 'pages/inquiry/Types/docType';
import DocSubType from 'pages/inquiry/Types/docSubType';

export default function TitlebarBelowMasonryImageList({ inquiry }) {
    const [documents, setDocuments] = useState([]);

    const fetchDocuments = async (inquiryId, optionId, windowType) => {
        try {
            const response = await fetch(
                `${BASE_URL}/AWS/GetAllDocumentsByOption?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
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
            // const filtered = data.filter(
            //     (item) => item.documentType !== 7 && item.documentSubContentType !== 5 && item.documentURL != ""
            // );
            const filtered = data.filter(
                (item) => item.documentURL != ""
            );
            setDocuments(filtered);
        } catch (error) {
            console.error("Error fetching Neck Body List:", error);
        }
    };

    useEffect(() => {
        if (inquiry) {
            fetchDocuments(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
        }
    }, [inquiry]);


    return (
        <Box>
            <ImageList variant="masonry" cols={3} gap={8}>
                {documents.length === 0 ? <Typography color="error">Documents Not Selected</Typography> : (documents.map((item, index) => (
                    <ImageListItem key={item.img}>
                        <img
                            srcSet={`${item.documentURL}?w=248&fit=crop&auto=format&dpr=2 2x`}
                            src={`${item.documentURL}?w=248&fit=crop&auto=format`}
                            alt={item.title}
                            loading="lazy"
                        />
                        <ImageListItemBar
                            position="below"
                            title={
                                <>
                                    <DocType type={item.documentContentType} /> - <DocSubType type={item.documentSubContentType} />
                                </>
                            }
                        />
                    </ImageListItem>
                )))}
            </ImageList>
        </Box>
    );
}

