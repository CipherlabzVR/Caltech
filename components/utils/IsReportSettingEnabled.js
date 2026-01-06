import BASE_URL from 'Base/api';

const IsReportSettingEnabled = async (settingName) => {
  try {
    const response = await fetch(
      `${BASE_URL}/ReportSetting/IsReportSettingEnabled?nameOrId=${settingName}`,
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
    return result === "true";
  } catch (err) {
    console.error('Fetch error:', err);
    return false;
  }
};

export default IsReportSettingEnabled;
