module.exports = {
    webpack: {
      configure: (webpackConfig) => {
        webpackConfig.ignoreWarnings = [
          (warning) =>
            typeof warning.message === "string" &&
            warning.message.includes("Failed to parse source map")
        ];
        return webpackConfig;
      }
    }
  };
  