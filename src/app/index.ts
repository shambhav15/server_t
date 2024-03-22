import { graphqlContext } from "../interfaces";
import { ApolloServer } from "@apollo/server";
const { expressMiddleware } = require("@apollo/server/express4");
const express = require("express");
const bodyParser = require("body-parser");
import { User } from "./user";
import Cors from "cors";
import JWTService from "../services/jwt";

export async function startApolloServer() {
  const app = express();
  app.use(Cors());
  app.use(bodyParser.json());

  const GraphQlserver = new ApolloServer<graphqlContext>({
    typeDefs: `
    ${User.types}
        type Query {
           ${User.queries}
        }
    `,
    resolvers: {
      Query: {
        ...User.resolvers.queries,
      },
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
