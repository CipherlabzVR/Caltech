import BASE_URL from 'Base/api';
import { useState, useEffect } from 'react';

const GetAllWarehouse = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/Warehouse/GetAllWarehouse`, {
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
        setData(result.result);
      } catch (err) {
      //
      }
    };

    fetchData();
  }, []);

  return { data };
};

export default GetAllWarehouse;
