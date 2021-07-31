const path = require("path");

module.exports = {
    mode: "production",
    entry: "./src/index.ts",
    target: "node",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bot.bundle.js",
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                include: [
                    path.resolve(__dirname, "src"),
                    path.resolve("node_modules"),
                ],
                loader: "ts-loader",
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".js", ".json"],
    },
};
