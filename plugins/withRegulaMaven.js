const { withProjectBuildGradle, withSettingsGradle } = require('@expo/config-plugins');

const REGULA_MAVEN_URL = 'https://maven.regulaforensics.com/RegulaDocumentReader';
const REGULA_MAVEN_LINE = `        maven { url "${REGULA_MAVEN_URL}" } // Regula Document Reader + Face SDK`;

const withRegulaMaven = (config) => {
  // 1. settings.gradle (dependencyResolutionManagement — Expo SDK 54 / AGP 7+)
  config = withSettingsGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      if (!config.modResults.contents.includes(REGULA_MAVEN_URL)) {
        config.modResults.contents = config.modResults.contents.replace(
          /(dependencyResolutionManagement\s*\{[\s\S]*?repositories\s*\{)/,
          `$1\n${REGULA_MAVEN_LINE}`
        );
      }
    }
    return config;
  });

  // 2. build.gradle (allprojects — legacy fallback)
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      if (!config.modResults.contents.includes(REGULA_MAVEN_URL)) {
        if (config.modResults.contents.includes('allprojects')) {
          config.modResults.contents = config.modResults.contents.replace(
            /(allprojects\s*\{[\s\S]*?repositories\s*\{)/,
            `$1\n${REGULA_MAVEN_LINE}`
          );
        }
      }
    }
    return config;
  });

  return config;
};

module.exports = withRegulaMaven;
