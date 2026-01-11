import BASE_URL from 'Base/api';
import { useState, useEffect } from 'react';

const GetAllSalesPersons = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/SalesPerson/GetAllSalesPerson`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch');
        }

        const result = await response.json();
        // Handle different response structures
        const salesPersons = result.result || result.data || result || [];
        setData(Array.isArray(salesPersons) ? salesPersons : []);
      } catch (err) {
        console.error('Error fetching salespersons:', err);
        setData([]);
      }
    };

    fetchData();
  }, []);

  return { data };
};

export default GetAllSalesPersons;
