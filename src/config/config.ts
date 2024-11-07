export default () => {
  return {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
    database: {
      connectionString: process.env.MONGO_URI,
    },
  }
}
