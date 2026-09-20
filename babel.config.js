module.exports = {
  presets: ["next/babel"],
  plugins: [
    [
      "@stylexjs/babel-plugin",
      {
        dev: process.env.NODE_ENV !== "production",
        runtimeInjection: false,
        treeshakeCompensation: true,
        unstable_moduleResolution: { type: "commonJS" },
      },
    ],
  ],
};
