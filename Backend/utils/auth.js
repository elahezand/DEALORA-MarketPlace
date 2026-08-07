const { hash, compare } = require("bcryptjs");
const { sign, verify } = require("jsonwebtoken");

const hashPassword = (password) => {
  return hash(password, 12);
};

const verifyPassword = (password, hashedPassword) => {
  return compare(password, hashedPassword);
};

const generateToken = async (data) => {
  const token = await sign({ ...data }, process.env.ACCESS_TOKEN, {
    algorithm: "HS256",
    expiresIn: "60s"
  })

  return token
}
const generateRefreshToken = async (data) => {
  const token = await sign({ ...data }, process.env.REFRESH_TOKEN, {
    algorithm: "HS256",
    expiresIn: "15d"
  })

  return token
}

const verifyToken = async (token) => {
  try {
    return await verify(token, process.env.ACCESS_TOKEN)
  } catch (err) {
    return null
  }
}

const verifyRefreshToken = async (refreshToken) => {
  const verifiredfreshtoken = await verify(refreshToken, process.env.REFRESH_TOKEN,)
  return verifiredfreshtoken
}

const getMe = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.json(null);

    const payloadToken = await verifyRefreshToken(token);
    if (!payloadToken) return res.json(null);

    const user = await UserModel.findOne({ email: payloadToken.email });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
  getMe
};

