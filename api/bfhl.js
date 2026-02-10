const app = require("../index");

module.exports = (req, res) => {
  // Route request to the same express handler used locally.
  req.url = "/bfhl";
  return app(req, res);
};
