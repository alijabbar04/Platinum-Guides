// Signs release builds with a private upload key when these Gradle properties exist
// (put them in ~/.gradle/gradle.properties, never in the repo):
//   RDR2_LEDGER_STORE_FILE=D:/Android/keystores/rdr2-ledger.jks
//   RDR2_LEDGER_STORE_PASSWORD=...
//   RDR2_LEDGER_KEY_ALIAS=rdr2-ledger
//   RDR2_LEDGER_KEY_PASSWORD=...
// Using the same key for every build lets an update install over the old app,
// which keeps the saved progress. Without the properties, Expo's default debug key is used.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARK = '// rdr2-ledger-release-signing';

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let g = cfg.modResults.contents;
    if (g.includes(MARK)) return cfg;
    g = g.replace(
      /signingConfigs\s*\{/,
      `signingConfigs {
        ${MARK}
        if (project.hasProperty('RDR2_LEDGER_STORE_FILE')) {
            release {
                storeFile file(RDR2_LEDGER_STORE_FILE)
                storePassword RDR2_LEDGER_STORE_PASSWORD
                keyAlias RDR2_LEDGER_KEY_ALIAS
                keyPassword RDR2_LEDGER_KEY_PASSWORD
            }
        }`,
    );
    g = g.replace(
      /(release\s*\{[^}]*?)signingConfig\s+signingConfigs\.debug/,
      `$1signingConfig project.hasProperty('RDR2_LEDGER_STORE_FILE') ? signingConfigs.release : signingConfigs.debug`,
    );
    cfg.modResults.contents = g;
    return cfg;
  });
};
