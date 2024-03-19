import { User } from "@prisma/client";
import JWT from "jsonwebtoken";

const JWT_secret = "28hbj9oj&*@*37^%@#(";

class JWTService {
  public static generateTokenForUser(user: User) {
    const payLoad = {
      id: user?.id,
      email: user?.email,
    };

    const token = JWT.sign(payLoad, JWT_secret);
    return token;
  }
}
export default JWTService;
