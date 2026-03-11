import Cookies from "js-cookie";

const COOKIE_KEY = "viafarm_admin_token";

/* SAVE TOKEN */
export function setToken(token: string) {
  Cookies.set(COOKIE_KEY, token, {
    expires: 7,         
    secure: true,       
    sameSite: "strict",  
  });
}

/* GET TOKEN */
export function getToken(): string | null {
  return Cookies.get(COOKIE_KEY) || null;
}

/* CLEAR TOKEN */
export function clearToken() {
  Cookies.remove(COOKIE_KEY);
}

/* AUTH HEADER FOR AXIOS */
export function getAuthConfig() {
  const token = getToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
}
