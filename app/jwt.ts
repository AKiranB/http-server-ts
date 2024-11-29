import jwt from "jsonwebtoken";

const SECRET_KEY = "NOTSOSECRET";

export const createToken = (
  payload: Record<string, any>,
  expiresIn: number
) => {
  return jwt.sign(payload, SECRET_KEY, {
    expiresIn,
  });
};

export const verifyToken = ({ token }: { token: string }) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    console.log(err);
    return null;
  }
};
