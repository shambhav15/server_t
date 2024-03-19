const express = require("express");
const { startApolloServer } = require("./app");

async function init() {
  const app = await startApolloServer();
  app.listen(8000, () => {
    console.log("Server is running on port 8000");
  });
}
//   const;

init();
