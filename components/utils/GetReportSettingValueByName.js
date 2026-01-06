import BASE_URL from 'Base/api';
import { useState, useEffect } from 'react';

const GetReportSettingValueByName = (settingName) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/ReportSetting/GetReportSettingValueByName?settingName=${settingName}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch');
        }

        const result = await response.text();
        setData(result);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };

    fetchData();
  }, [settingName]);

  return { data };
};

export default GetReportSettingValueByName;
