export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token"); // or wherever you store it

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response; // Return the response object
};

export const getToken = () => localStorage.getItem("token");
