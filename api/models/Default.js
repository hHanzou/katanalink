const mongoose = require("mongoose");

const Default = mongoose.model(
  "Default",
  {
    original_url: String,
    hash: String,
  },
  "urls_coll"
);

module.exports = Default;
