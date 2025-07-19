module.exports = {
    webpack: {
      configure: (webpackConfig) => {
        webpackConfig.ignoreWarnings = [
          (warning) =>
            typeof warning.message === "string" &&
            warning.message.includes("Failed to parse source map")
        ];
        return webpackConfig;
      },
    },
    devServer: (devServerConfig) => {
      // Loại bỏ các option đã deprecated
      delete devServerConfig.onBeforeSetupMiddleware;
      delete devServerConfig.onAfterSetupMiddleware;
  
      // Nếu muốn có setupMiddlewares thì thêm tại đây
      devServerConfig.setupMiddlewares = (middlewares, devServer) => {
        return middlewares;
      };
  
      return devServerConfig;
    }
  };
  