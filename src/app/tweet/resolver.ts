import { Tweet } from "@prisma/client";
import { graphqlContext } from "../../interfaces";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import userService from "../../services/user";
import TweetServices, { CreateTweetPayload } from "../../services/tweet";

const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
});

const queries = {
  getAllTweets: () => TweetServices.getAllTweets(),
  getSignedURLForTweet: async (
    parent: any,
    { imageType, imageName }: { imageType: string; imageName: string },
    ctx: graphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("Unauthorized");
    const allowedImageTypes = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
    ];
    if (!allowedImageTypes.includes(imageType))
      throw new Error("unsupported image type");

    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || "",
      Key: `uploads/${
        ctx.user.id
      }/tweets/${imageName}-${Date.now()}.${imageType}`,
      ContentType: imageType,
    });

    const signiedURL = await getSignedUrl(s3Client, putObjectCommand);
    return signiedURL;
  },
};

const mutations = {
  createTweet: async (
    parent: any,
    { payload }: { payload: CreateTweetPayload },
    ctx: graphqlContext
  ) => {
    if (!ctx.user) throw new Error("Unauthorized");

    const tweet = await TweetServices.createTweet({
      ...payload,
      userId: ctx.user.id,
    });
    return tweet;
  },
};

const extraResolver = {
  Tweet: {
    author: async (parent: Tweet) => {
      const author = await userService.getUserById(parent.authorId);
      return author;
    },
  },
};

export const resolvers = { mutations, extraResolver, queries };
