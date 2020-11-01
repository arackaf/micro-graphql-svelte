var path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const isProd = process.env.NODE_ENV == "production";

module.exports = {
  entry: {
    demo: "./demo/index.js"
  },
  output: {
    filename: "[name]-[contenthash]-bundle.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/dist/"
  },
  mode: isProd ? "production" : "development",
  resolve: {
    extensions: [".mjs", ".js", ".ts", ".tsx", ".svelte"],
    alias: {
      svelte: path.resolve("node_modules", "svelte")
    },
    modules: [path.resolve("./"), path.resolve("./node_modules")],
    mainFields: ["svelte", "browser", "module", "main"]
  },
  module: {
    rules: [
      {
        test: /\.(html|svelte)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            query: {
              presets: ["@babel/preset-typescript"],
              plugins: [
                "@babel/plugin-proposal-class-properties",
                "@babel/plugin-proposal-optional-chaining",
                "@babel/plugin-proposal-nullish-coalescing-operator"
              ]
            }
          },
          {
            loader: "svelte-loader",
            options: {
              emitCss: true
            }
          }
        ]
      },
      {
        test: /\.(t|j)sx?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        query: {
          presets: ["@babel/preset-typescript"],
          plugins: [
            "@babel/plugin-proposal-class-properties",
            "@babel/plugin-proposal-optional-chaining",
            "@babel/plugin-proposal-nullish-coalescing-operator"
          ]
        }
      },
      {
        test: /\.s?css$/,
        oneOf: [
          {
            test: /\.module\.s?css$/,
            use: [
              MiniCssExtractPlugin.loader,
              { loader: "css-loader", options: { modules: true } },
              "sass-loader"
            ]
          },
          {
            use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
          }
        ]
      },
      {
        test: /\.(png|jpg|gif|svg|eot|woff|woff2|ttf)$/,
        use: [
          {
            loader: "file-loader"
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: "demo/index.htm" }),
    new MiniCssExtractPlugin({ filename: "[name]-[contenthash].css" })
  ]
};
