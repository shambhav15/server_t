import axios from "axios";
import { prismaClient } from "../../clients/db";
import JWTService from "../../services/jwt";
interface GoogleUserData {
  iss?: string;
  azp?: string;
  aud?: string;
  sub?: string;
  email: string;
  email_verified: string;
  nbf?: string;
  name?: string;
  picture?: string;
  given_name: string;
  family_name?: string;
  iat?: string;
  exp?: string;
  jti?: string;
  alg?: string;
  kid?: string;
  typ?: string;
}

const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const googleToken = token;
    const googleOAuthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
    googleOAuthURL.searchParams.set("id_token", googleToken);

    const { data } = await axios.get<GoogleUserData>(
      googleOAuthURL.toString(),
      {
        responseType: "json",
      }
    );

    const checkForUser = await prismaClient.user.findUnique({
      where: { email: data.email },
    });

    if (!checkForUser) {
      await prismaClient.user.create({
        data: {
          email: data.email,
          firstname: data.given_name,
          lastname: data.family_name,
          profileImageURL: data.picture,
        },
      });
    }
    const userInDb = await prismaClient.user.findUnique({
      where: { email: data.email },
    });

    if (!userInDb) {
      throw new Error("User with email not found");
    }
    const userToken = JWTService.generateTokenForUser(userInDb);
    return userToken;
  },
};

export const resolvers = { queries };
