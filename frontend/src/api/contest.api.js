import axios from "axios";

const getAllContestsAPI = async (url, token) => {
  const response = await axios.get(`${url}/contest`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.contests;
};

const joinContestAPI = async (url, slug, token) => {
  const response = await axios.post(
    `${url}/contest/${slug}/join`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

const leaveContestAPI = async (url, slug, token) => {
  const response = await axios.post(
    `${url}/contest/${slug}/leave`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

const getContestBySlugAPI = async (url, slug, token) => {
  const response = await axios.get(`${url}/contest/${slug}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

const getContestProblemsAPI = async (url, slug, token) => {
  const response = await axios.get(`${url}/contest/${slug}/problems`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export { getAllContestsAPI, joinContestAPI, leaveContestAPI, getContestBySlugAPI, getContestProblemsAPI };
