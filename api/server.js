const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const CryptoJS = require("crypto-js");

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

mongoose
  .connect(`mongodb://localhost:27017/katanalink`, {})
  .then(() => {
    // Iniciando o servidor
    app.listen(port, () => {
      console.log(`server running on http://localhost:${port}`);
    });
  })
  .catch((err) => console.log(err));

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error to mongodb:"));
db.once("open", () => {
  console.log("connected at MongoDB.");
});

const DefaultSchema = require("./models/Default");

function isURL(str) {
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" +
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
      "((\\d{1,3}\\.){3}\\d{1,3}))" +
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
      "(\\?[;&a-z\\d%_.~+=-]*)?" +
      "(\\#[-a-z\\d_]*)?$",
    "i"
  );
  return !!pattern.test(str);
}

function createRandomHash(len) {
  const randomString = Math.random().toString(36).substring(2);
  const hash = CryptoJS.SHA256(randomString).toString();
  return hash.substring(0, len);
}

app.get("/", (req, res) => {
  res.send("Olá, mundo!");
});

app.post("/", async (req, res) => {
  const { url } = req.body;
  if (!isURL(url)) {
    return res.status(401).json({ msg: "insert a valid url" });
  }
  try {
    let hash;
    while (true) {
      hash = createRandomHash(7);
      const hashExists = await DefaultSchema.find({ hash: hash });
      console.log(hashExists);
      if (hashExists.length === 0) {
        break;
      }
    }
    const newDefault = new DefaultSchema({
      original_url: url,
      hash: hash,
    });
    newDefault
      .save()
      .then((savedDefault) => {
        console.log("doc saved:", savedDefault);
      })
      .catch((error) => {
        console.error("error on save doc:", error);
      });
    return res.status(200).json({ msg: `${hash}` });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ msg: "server error" });
  }
});
