const app = require("../index");

module.exports = (req, res) => {
  // Route request to the same express handler used locally.
  req.url = "/health";
  return app(req, res);
};
