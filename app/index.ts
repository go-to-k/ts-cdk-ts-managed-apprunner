import express from "express";
const app: express.Express = express();
const outputValue = process.env?.ENV1 ?? "Hello World";
app.listen(8080, () => {
  console.log(outputValue);
});
