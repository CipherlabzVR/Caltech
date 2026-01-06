import BASE_URL from 'Base/api';
import { useState, useEffect } from 'react';

const GetAllCompanies = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/Company/GetAllCompanies`, {
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

export default GetAllCompanies;
