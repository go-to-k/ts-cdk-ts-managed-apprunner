import express from "express";

const app: express.Express = express();
const outputValue = process.env?.ENV1 ?? "Hello World";

app.get("/", (req, res) => {
  res.send(outputValue);
});

app.listen(8080, () => {
  console.log(outputValue);
});
