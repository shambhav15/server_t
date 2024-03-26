import { prismaClient } from "../../clients/db";
import { graphqlContext } from "../../interfaces";
import { User } from "@prisma/client";
import userService from "../../services/user";
import { redisClient } from "../../clients/redis";

const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const googleToken = await userService.verifyGoogleAuthToken(token);
    return googleToken;
  },

  getCurrentUser: async (parent: any, args: any, ctx: graphqlContext) => {
    const id = ctx.user?.id;
    if (!id) return null;

    const user = await userService.getUserById(id);
    return user;
  },
  getUserById: async (
    parent: any,
    { id }: { id: string },
    ctx: graphqlContext
  ) => {
    const user = await userService.getUserById(id);
    return user;
  },
};

const extraResolver = {
  User: {
    tweets: (parent: User) => {
      return prismaClient.tweet.findMany({
        where: { authorId: parent.id },
      });
    },
    follower: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: {
          following: {
            id: parent.id,
          },
        },
        include: {
          follower: true,
        },
      });
      return result.map((r) => r.follower);
    },
    following: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: {
          follower: {
            id: parent.id,
          },
        },
        include: {
          following: true,
        },
      });
      return result.map((r) => r.following);
    },
    recommendedUsers: async (parent: User, _: any, ctx: graphqlContext) => {
      if (!ctx.user) return [];

      const cachedUsers = await redisClient.get(
        `RECOMMENDED_USERS:${ctx.user.id}`
      );

      if (cachedUsers) {
        return JSON.parse(cachedUsers);
      }

      const myFollowings = await prismaClient.follows.findMany({
        where: {
          follower: { id: ctx.user.id },
        },
        include: {
          following: {
            include: { followers: { include: { following: true } } },
          },
        },
      });

      const users: User[] = [];

      for (const followings of myFollowings) {
        for (const followingOfFollowedUser of followings.following.followers) {
          if (
            followingOfFollowedUser.following.id !== ctx.user.id &&
            myFollowings.findIndex(
              (e) => e?.followingId === followingOfFollowedUser.following.id
            ) < 0
          ) {
            users.push(followingOfFollowedUser.following);
          }
        }
      }

      await redisClient.set(
        `RECOMMENDED_USERS:${ctx.user.id}`,
        JSON.stringify(users)
      );

      return users;
    },
  },
};

const mutations = {
  followUser: async (
    parent: any,
    { to }: { to: string },
    ctx: graphqlContext
  ) => {
    if (!ctx.user) throw new Error("Unauthorized");

    await userService.followUser(ctx.user.id, to);
    await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
    return true;
  },
  unfollowUser: async (
    parent: any,
    { to }: { to: string },
    ctx: graphqlContext
  ) => {
    if (!ctx.user) throw new Error("Unauthorized");
    await userService.unfollowUser(ctx.user.id, to);
    await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
    return true;
  },
};

export const resolvers = { queries, extraResolver, mutations };
