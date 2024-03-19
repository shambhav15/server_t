import { prismaClient } from "../clients/db";
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const express = require("express");
const bodyParser = require("body-parser");
import { User } from "./user";
import Cors from "cors";

export async function startApolloServer() {
  const app = express();
  app.use(Cors());

  app.use(bodyParser.json());
  const GraphQlserver = new ApolloServer({
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
  app.use("/graphql", expressMiddleware(GraphQlserver));

  return app;
}
