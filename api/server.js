const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const CryptoJS = require("crypto-js");

/// server configs ///
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());
///

/// db configs ///
mongoose
  .connect(`mongodb://localhost:27017/katanalink`, {})
  .then(() => {
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
///

//function to verify if text is url
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

//create a random unique hash
function createRandomHash(len) {
  const randomString = Math.random().toString(36).substring(2);
  const hash = CryptoJS.SHA256(randomString).toString();
  return hash.substring(0, len);
}

//get all
app.get("/", async (req, res) => {
  const originalUrl = await DefaultSchema.find(
    {},
    { _id: 0, original_url: 0, __v: 0 }
  );
  if (originalUrl.length < 1) {
    // return res.status(200).json({ url: originalUrl[0].original_url });
    return res.status(404).json({ msg: "not found" });
  } else {
    return res.status(200).json({ hashs: originalUrl });
  }
});

//get hash
app.get("/:hash", async (req, res) => {
  const hash = req.params.hash;
  //   console.log(hash);
  const originalUrl = await DefaultSchema.find(
    { hash: hash },
    { _id: 0, hash: 0, __v: 0 }
  );
  if (originalUrl.length === 1) {
    // return res.status(200).json({ url: originalUrl[0].original_url });
    return res.redirect(originalUrl[0].original_url);
  } else {
    return res.status(404).json({ msg: "not found" });
  }
});

// receive a url and create a shorturl in db with a random unique hash
app.post("/", async (req, res) => {
  const { url } = req.body;
  if (!isURL(url)) {
    return res.status(401).json({ msg: "insert a valid url" });
  }
  try {
    let hash;
    // create a new hash if the generated exists on db
    while (true) {
      hash = createRandomHash(7);
      const hashExists = await DefaultSchema.find({ hash: hash });
      //   console.log(hashExists);
      if (hashExists.length === 0) {
        break;
      }
    }

    // try to insert a new url and hash in db
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

    return res.status(200).json({ msg: `http://localhost:3000/${hash}` });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ msg: "server error" });
  }
});
