const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Exclude cache folders from Metro bundler
config.resolver.blockList = [
  /node_modules\/react-native-css-interop\/.cache\/.*/,
  ...((config.resolver.blockList) || []),
];

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
