import axios from "axios";

const syncUser = async (url,token)=>{
    const response = await axios.post(`${url}/sync/platforms`,{},{
        headers:{
            Authorization:`Bearer ${token}`
        }
    });

    return response.data;
}

const getSyncStatus = async (url, token) => {
  try {
    const response = await axios.get(
      `${url}/sync/status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching sync status:", error);
    return null;
  }
};

export{syncUser,getSyncStatus};