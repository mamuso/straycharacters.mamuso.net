module.exports = {
  output: "export",
  trailingSlash: true,
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    deviceSizes: [480, 800, 1200, 1600, 2400],
    imageSizes: [],
  },
};
