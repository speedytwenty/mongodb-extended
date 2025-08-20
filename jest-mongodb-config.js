module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      skipMD5: true,
    },
  },
  useSharedDBForAllJestWorkers: false,
};
