const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "request.js",
    library: "@workablehr/request",
    libraryTarget: "commonjs2"
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /\/node_modules\/.*/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  }
};
