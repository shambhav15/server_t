import { graphqlContext } from "../interfaces";
import { ApolloServer } from "@apollo/server";
const { expressMiddleware } = require("@apollo/server/express4");
const express = require("express");
const bodyParser = require("body-parser");
import { User } from "./user";
import { Tweet } from "./tweet";
import Cors from "cors";
import JWTService from "../services/jwt";

export async function startApolloServer() {
  const app = express();
  app.use(Cors());
  app.use(bodyParser.json());

  app.get("/", (req: any, res: any) =>
    res.status(200).send({ message: "Everything is good" })
  );

  const GraphQlserver = new ApolloServer<graphqlContext>({
    typeDefs: `
    ${User.types}
    ${Tweet.types}
        type Query {
           ${User.queries}
            ${Tweet.queries}
        }
        type Mutation {
            ${Tweet.mutations}
            ${User.mutations}
        }
    `,
    resolvers: {
      Query: {
        ...User.resolvers.queries,
        ...Tweet.resolvers.queries,
      },
      Mutation: {
        ...Tweet.resolvers.mutations,
        ...User.resolvers.mutations,
      },
      ...Tweet.resolvers.extraResolver,
      ...User.resolvers.extraResolver,
    },
  });

  await GraphQlserver.start();
  app.use(
    "/graphql",
    expressMiddleware(GraphQlserver, {
      context: async ({ req }: any) => {
        return {
          user: req.headers.authorization
            ? JWTService.decodeToken(
                req.headers.authorization.split("Bearer ")[1]
              )
            : undefined,
        };
      },
    })
  );

  return app;
}
