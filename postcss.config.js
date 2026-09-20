const babelConfig = require("./babel.config");
module.exports = {
  plugins: {
    "@stylexjs/postcss-plugin": {
      include: [
        "app/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "styles/**/*.ts",
      ],
      babelConfig: {
        babelrc: false,
        configFile: false,
        parserOpts: { plugins: ["typescript", "jsx"] },
        plugins: babelConfig.plugins,
      },
      useCSSLayers: true,
    },
  },
};
