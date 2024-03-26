import * as dotenv from "dotenv";
const { startApolloServer } = require("./app");

dotenv.config();

async function init() {
  const app = await startApolloServer();
  app.listen(8000, () => {
    console.log("Server is running on port 8000");
  });
}
//   const;

init();
