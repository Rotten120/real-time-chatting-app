import { generateToken } from "./auth.js"

//maxAge default value is 1 week
export const setCookie = async (res, payload, age = 1000*60*60*24*7) => {
  const token = payload? await generateToken(payload) : "";

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: age
  });

  return token;
}

