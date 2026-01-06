
import { useEffect, useState } from "react";
import BASE_URL from "Base/api";

const usePaginatedFetch = (
  endpoint,
  initialSearch = "",
  initialPageSize = 10,
  initialIsCurrentDate = true,
  shouldIncludeIsCurrentDateParam = true
) => {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [isCurrentDate, setIsCurrentDate] = useState(initialIsCurrentDate);

  
  const fetchData = async (pageNum = page, term = search, size = pageSize, isTodayOnly = isCurrentDate) => {
    // Only fetch on client side to avoid SSR issues
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const skip = (pageNum - 1) * size;
      const searchParam = term ? encodeURIComponent(term) : "null";
      let query = `${BASE_URL}/${endpoint}?SkipCount=${skip}&MaxResultCount=${size}&Search=${searchParam}`;

      if (shouldIncludeIsCurrentDateParam) {
        query += `&isCurrentDate=${isTodayOnly}`;
      }

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        setData([]);
        setTotalCount(0);
        return;
      }

      // Parse JSON response - handle truncated/malformed JSON from backend
      // Read as text first so we can recover if JSON is malformed
      const text = await response.text();
      let json;
      
      try {
        // Try to parse JSON
        json = JSON.parse(text);
      } catch (jsonError) {
        // If JSON parsing fails, try to recover partial data
        console.warn("JSON parse failed, attempting recovery. Response length:", text.length);
        console.warn("Response preview (first 500 chars):", text.substring(0, 500));
        console.warn("Response preview (last 500 chars):", text.substring(Math.max(0, text.length - 500)));
        console.warn("JSON parse error:", jsonError.message);
        
        try {
          // Try to extract valid tickets from truncated JSON
          const itemsMatch = text.match(/"items":\s*\[(.*)/s);
          if (itemsMatch && itemsMatch[1]) {
            const itemsContent = itemsMatch[1];
            
            // Use a simpler approach: find complete ticket objects
            // Look for patterns like {"ticketNumber":"..."...}
            const ticketPattern = /\{"ticketNumber":"[^"]+"[^}]*\}/g;
            const matches = [];
            let match;
            
            // Try multiple passes with different patterns
            while ((match = ticketPattern.exec(itemsContent)) !== null) {
              try {
                const ticket = JSON.parse(match[0]);
                if (ticket && ticket.ticketNumber) {
                  matches.push(ticket);
                }
              } catch (e) {
                // Try to find a more complete match
                const startPos = match.index;
                let endPos = startPos + match[0].length;
                
                // Look for the closing brace
                let braceCount = 1;
                for (let i = startPos + 1; i < itemsContent.length && braceCount > 0; i++) {
                  if (itemsContent[i] === '{' && itemsContent[i-1] !== '\\') braceCount++;
                  if (itemsContent[i] === '}' && itemsContent[i-1] !== '\\') braceCount--;
                  if (braceCount === 0) {
                    endPos = i + 1;
                    break;
                  }
                }
                
                if (braceCount === 0) {
                  try {
                    const fullTicket = JSON.parse(itemsContent.substring(startPos, endPos));
                    if (fullTicket && fullTicket.ticketNumber) {
                      matches.push(fullTicket);
                    }
                  } catch (e2) {
                    // Skip this ticket
                  }
                }
              }
            }
            
            if (matches.length > 0) {
              console.log(`Recovered ${matches.length} tickets from truncated JSON`);
              json = {
                statusCode: 200,
                message: "Result",
                result: {
                  totalCount: matches.length,
                  items: matches
                }
              };
            } else {
              console.error("Could not extract any valid tickets from response");
              console.error("Full response text:", text);
              setData([]);
              setTotalCount(0);
              return;
            }
          } else {
            console.error("Could not find items array in response");
            console.error("Response structure:", text.substring(0, 1000));
            setData([]);
            setTotalCount(0);
            return;
          }
        } catch (recoveryError) {
          console.error("Recovery failed:", recoveryError);
          console.error("Full response text:", text);
          setData([]);
          setTotalCount(0);
          return;
        }
      }

      // Handle different response structures
      if (json.result) {
        if (Array.isArray(json.result)) {
          setData(json.result);
          setTotalCount(json.result.length);
        } else if (json.result.result && json.result.result.items) {
          // Handle nested result structure: json.result.result.items
          const items = json.result.result.items || [];
          setData(items);
          setTotalCount(json.result.result.totalCount || items.length || 0);
          console.log(`Loaded ${items.length} items from API (nested result)`);
        } else if (json.result.items) {
          const items = json.result.items || [];
          setData(items);
          setTotalCount(json.result.totalCount || items.length || 0);
          console.log(`Loaded ${items.length} items from API`);
        } else {
          console.warn("Unexpected result structure:", json.result);
          setData([]);
          setTotalCount(0);
        }
      } else if (Array.isArray(json)) {
        setData(json);
        setTotalCount(json.length);
        console.log(`Loaded ${json.length} tickets from API (direct array)`);
      } else if (json.items) {
        const items = json.items || [];
        setData(items);
        setTotalCount(json.totalCount || items.length || 0);
        console.log(`Loaded ${items.length} tickets from API (items property)`);
      } else {
        console.warn("Unexpected JSON structure:", Object.keys(json));
        setData([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setData([]);
      setTotalCount(0);
    }
  };

  useEffect(() => {
    // Only fetch on client side to avoid SSR issues
    if (typeof window !== 'undefined') {
      fetchData(1, search, pageSize, initialIsCurrentDate);
    }
  }, []);

  return {
    data,
    totalCount,
    page,
    pageSize,    
    search,
    isCurrentDate,
    setPage,
    setPageSize,    
    setSearch,
    setIsCurrentDate,
    fetchData,
  };
};

export default usePaginatedFetch;
