const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

function withRegulaLicenseCopy(config) {
  // Android — copy license to android/app/src/main/assets/
  config = withDangerousMod(config, ['android', async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const trackedLicensePath = path.join(projectRoot, 'assets', 'regula.license');

    if (!fs.existsSync(trackedLicensePath)) {
      console.warn('⚠️ regula.license not found at:', trackedLicensePath);
      return config;
    }

    const androidAssetsDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'assets');
    const androidDestPath = path.join(androidAssetsDir, 'regula.license');
    fs.mkdirSync(androidAssetsDir, { recursive: true });
    fs.copyFileSync(trackedLicensePath, androidDestPath);
    console.log('✅ Copied regula.license to Android assets');

    return config;
  }]);

  // iOS — copy license and patch .pbxproj to add to bundle resources
  config = withDangerousMod(config, ['ios', async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const platformProjectRoot = config.modRequest.platformProjectRoot;
    const projectName = config.modRequest.projectName || 'YourApp';

    const trackedLicensePath = path.join(projectRoot, 'assets', 'regula.license');
    if (!fs.existsSync(trackedLicensePath)) {
      console.warn('⚠️ regula.license not found at:', trackedLicensePath);
      return config;
    }

    const iosDestDir = path.join(platformProjectRoot, projectName);
    const iosDestPath = path.join(iosDestDir, 'regula.license');
    if (!fs.existsSync(iosDestDir)) fs.mkdirSync(iosDestDir, { recursive: true });
    fs.copyFileSync(trackedLicensePath, iosDestPath);
    console.log('✅ Copied regula.license to iOS project');

    // Patch .pbxproj to add regula.license to bundle resources
    try {
      const pbxprojPath = path.join(platformProjectRoot, `${projectName}.xcodeproj`, 'project.pbxproj');
      if (!fs.existsSync(pbxprojPath)) {
        console.warn('⚠️ .pbxproj not found at:', pbxprojPath);
        return config;
      }

      let pbxproj = fs.readFileSync(pbxprojPath, 'utf8');
      if (pbxproj.includes('regula.license')) {
        console.log('ℹ️ regula.license already referenced in .pbxproj');
        return config;
      }

      const genUUID = () => crypto.randomBytes(12).toString('hex').toUpperCase();
      const fileRefUUID = genUUID();
      const buildFileUUID = genUUID();

      // Add PBXFileReference
      const fileRefEntry = `\t\t${fileRefUUID} /* regula.license */ = {isa = PBXFileReference; lastKnownFileType = file; name = regula.license; path = ${projectName}/regula.license; sourceTree = SOURCE_ROOT; };`;
      pbxproj = pbxproj.replace(/\/\* End PBXFileReference section \*\//, `${fileRefEntry}\n/* End PBXFileReference section */`);

      // Add PBXBuildFile
      const buildFileEntry = `\t\t${buildFileUUID} /* regula.license in Resources */ = {isa = PBXBuildFile; fileRef = ${fileRefUUID} /* regula.license */; };`;
      pbxproj = pbxproj.replace(/\/\* End PBXBuildFile section \*\//, `${buildFileEntry}\n/* End PBXBuildFile section */`);

      // Add to PBXResourcesBuildPhase
      pbxproj = pbxproj.replace(
        /(\/\* Resources \*\/ = \{[^}]*isa = PBXResourcesBuildPhase;[^}]*files = \()/,
        `$1\n\t\t\t\t${buildFileUUID} /* regula.license in Resources */,`
      );

      // Add file reference to project group
      const groupRegex = new RegExp(`(children = \\([^)]*?)(\\);[^}]*?path = ${projectName};)`, 's');
      if (groupRegex.test(pbxproj)) {
        pbxproj = pbxproj.replace(groupRegex, `$1\t\t\t\t${fileRefUUID} /* regula.license */,\n$2`);
      }

      fs.writeFileSync(pbxprojPath, pbxproj, 'utf8');
      console.log('✅ Added regula.license to Xcode bundle resources');
    } catch (error) {
      console.warn('⚠️ Failed to patch .pbxproj for regula.license:', error.message);
    }

    return config;
  }]);

  return config;
}

module.exports = function withRegulaLicense(config) {
  return withRegulaLicenseCopy(config);
};
