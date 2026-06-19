import axios from "axios";

const BASE_URL = "http://localhost:8000";

export const triggerDeployment = async (cmd: string) => {
  const res = await axios.post(`${BASE_URL}/deploy`, null, {
    params: { cmd },
  });
  return res.data;
};
