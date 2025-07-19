module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.ignoreWarnings = [
        (warning) =>
          typeof warning.message === "string" &&
          (
            warning.message.includes("Failed to parse source map") ||
            warning.message.includes("Sass @import rules are deprecated") ||
            warning.message.includes("legacy JS API is deprecated")
          )
      ];
      return webpackConfig;
    },
  },

  devServer: (devServerConfig) => {
    // Xóa các API đã deprecated
    delete devServerConfig.onBeforeSetupMiddleware;
    delete devServerConfig.onAfterSetupMiddleware;

    // Nếu bạn muốn thêm middlewares (debug, proxy...), có thể thêm tại đây
    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      return middlewares;
    };

    return devServerConfig;
  }
};
