"use strict";

const path = require("path");
var constants = require("./constants");
const fs = require("fs");
const PluginError = require("plugin-error");
const child = require("child_process");
var constants = require("./constants");
const childProcess = require("child_process");
const os = require("os");
const lsCache = {};

function msBuildFromWhere(pathRoot) {
  const vsWherePath = path.join(pathRoot, "Microsoft Visual Studio", "Installer", "vswhere.exe");
  const whereProcess = child.spawnSync(vsWherePath,
    [ "-latest", "-products", "*", "-requires", "Microsoft.Component.MSBuild" ],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: "pipe",
      encoding: "utf-8"
    }
  );

  if (whereProcess.output === null) {
    return "";
  }
  let cmdOutput = "";
  if (whereProcess.output.length > 0){
    for (let index = 0; index < whereProcess.output.length; index++) {
      cmdOutput = whereProcess.output[index] || "";
      if (cmdOutput.length > 0) {
        break;
      }
    }
  }
  const installKeyword = "installationPath";
  if (cmdOutput.length > 0) {
    const results = cmdOutput.split(/\r?\n/);
    for (let cmdLineIndex = 0; cmdLineIndex < results.length; cmdLineIndex++) {
      const cmdLine = results[cmdLineIndex];
      if (cmdLine.startsWith(installKeyword)) {
        const match = cmdLine.replace(installKeyword + ": ", "");
        return match;
      }
    }
  }
  return "";
}

module.exports.msBuildFromWhere = msBuildFromWhere;

function detectMsBuild15Dir (pathRoot) {
  const wherePath = msBuildFromWhere(pathRoot) || "";
  if (wherePath.length > 0) {
    return wherePath;
  }
  const vs2017Path = path.join(pathRoot, "Microsoft Visual Studio", "2017");
  const possibleFolders = [ "BuildTools", "Enterprise", "Professional", "Community" ];

  for (let index = 0; index < possibleFolders.length; index++) {
    try {
      const folderPath = path.join(vs2017Path, possibleFolders[index]);
      fs.statSync(folderPath);
      return folderPath;
    } catch (e) {}
  }
}

// Use MSBuild over XBuild where possible
const detectMsBuildOverXBuild = function () {
  try {
    const output = child.spawnSync("which", [ "msbuild" ], { encoding: "utf8" });
    if (output.stderr && output.stderr !== 0) {
      return "xbuild";
    }
    return "msbuild";
  } catch (e) {
  }
};

function lsR(folder) {
  if (lsCache[folder]) {
    return lsCache[folder];
  }
  return lsCache[folder] = fs.readdirSync(folder)
    .reduce((acc, cur) => {
      const fullPath = path.join(folder, cur);
      const st = fs.statSync(fullPath);
      if (st.isFile()) {
        acc.push(fullPath);
        return acc;
      }
      return acc.concat(lsR(fullPath));
    }, []);
}

function findMSBuildExeUnder(folder) {
  return lsR(folder).filter(fpath => {
    const fileName = path.basename(fpath);
    return fileName.toLowerCase() === "msbuild.exe";
  });
}

function addDetectedMsBuildVersionsToConstantsLookup(executables) {
  return executables.map(exe => {
    try {
      const proc = childProcess.spawnSync(exe, [ "/version" ], { encoding: "utf8" });
      const lines = proc.stdout.split(os.EOL);
      const thisVersion = lines[lines.length - 1];
      const verParts = thisVersion.split(".");
      const major = verParts[0];
      const shortVer = `${major}.0`; // not technically correct: I see msbuild 16.1 on my machine, but keeps in line with prior versioning
      const ver = parseFloat(shortVer);
      if (!constants.MSBUILD_VERSIONS[shortVer]) {
        constants.MSBUILD_VERSIONS[ver] = shortVer;
        return ver;
      }
    } catch (e) {
      console.warn(`Unable to query version of ${exe}: ${e}`);
    }
  })
  .filter(ver => !!ver)
  .reduce((acc, cur) => {
    if (acc.indexOf(cur) === -1) {
      acc.push(cur);
    }
    return acc;
  }, [])
  .sort()
  .reverse();
}

function autoDetectVersion (pathRoot) {
  // Try to detect MSBuild 15.0.
  const msbuild15OrLaterDir = detectMsBuild15Dir(pathRoot);
  if (msbuild15OrLaterDir) {
    const msbuildHome = path.join(msbuild15OrLaterDir, "MSBuild");
    const msbuildExecutables = findMSBuildExeUnder(msbuildHome);
    const detected = addDetectedMsBuildVersionsToConstantsLookup(msbuildExecutables);
    return [msbuild15OrLaterDir, detected[0] || 15.0 ];
  }

  // Detect MSBuild lower than 15.0.
  // ported from https://github.com/stevewillcock/grunt-msbuild/blob/master/tasks/msbuild.js#L167-L181
  const msbuildDir = path.join(pathRoot, "MSBuild");
  let msbuildDirExists;
  try {
    fs.statSync(msbuildDir);
    msbuildDirExists = true;
  } catch (e) {
    msbuildDirExists = false;
  }

  if (msbuildDirExists) {
    const msbuildVersions = fs.readdirSync(msbuildDir)
      .filter(function (entryName) {
        let binDirExists = true;
        const binDirPath = path.join(msbuildDir, entryName, "Bin");
        try {
          fs.statSync(binDirPath);
        } catch (e) {
          binDirExists = false;
        }

        return entryName.indexOf("1") === 0 && binDirExists;
      });

    if (msbuildVersions.length > 0) {
      // Return latest installed msbuild version
      return [pathRoot, parseFloat(msbuildVersions.pop())];
    }
  }

  return [pathRoot, 4.0];
};

module.exports.find = function (options) {
  if (options.platform.match(/linux|darwin/)) {
    const msbuildPath = detectMsBuildOverXBuild();
    if (msbuildPath) {
      return msbuildPath;
    }
    return "xbuild";
  } else if (!options.platform.match(/^win/)) {
    return "xbuild";
  }

  let msbuildRoot;
  const is64Bit = options.architecture === "x64";

  // On 64-bit systems msbuild is always under the x86 directory. If this
  // doesn"t exist we are on a 32-bit system. See also:
  // https://blogs.msdn.microsoft.com/visualstudio/2013/07/24/msbuild-is-now-part-of-visual-studio/
  let pathRoot;
  if (is64Bit) {
    pathRoot = process.env["ProgramFiles(x86)"] || "C:/Program Files (x86)";
  } else {
    pathRoot = process.env["ProgramFiles"] || "C:/Program Files";
  }

  let major;
  // auto-detection also registers higher msbuild versions which from 2019+
  let shouldProbe = options.toolsVersion === "auto";
  if (options.toolsVersion !== "auto") {
    major = parseInt(("" + options.toolsVersion).split(".")[0]);
    if (!isNaN(major) && major > 15) {
      shouldProbe = true;
    }
  }
  const auto = shouldProbe ? autoDetectVersion(pathRoot) : null;
  if (options.toolsVersion === "auto") {
    // var result = autoDetectVersion(pathRoot);
    msbuildRoot = auto[0]
    options.toolsVersion = auto[1];
  } else {
    const msbuildDir = detectMsBuild15Dir(pathRoot);
    if (options.toolsVersion >= 15.0) {
      if (msbuildDir) {
        msbuildRoot = msbuildDir;
      } else {
        msbuildRoot = pathRoot;
      }
    } else {
      msbuildRoot = pathRoot;
    }
  }

  const version = constants.MSBUILD_VERSIONS[options.toolsVersion];
  if (!version) {
    throw new PluginError(constants.PLUGIN_NAME, "No MSBuild Version was supplied!");
  }

  major = parseInt(version.split(".")[0]);
  if (major > 15) {
    let x64_dir = is64Bit ? "amd64" : "";
    const msbuildHome = path.join(msbuildRoot, "MSBuild");
    const msbuildExe = findMSBuildExeUnder(msbuildHome)
      .filter(exe => {
        const pathParts = exe.split(path.sep);
        return is64Bit
          ? pathParts.indexOf(x64_dir) > -1
          : pathParts.indexOf(x64_dir) === -1;
      })[0];
    if (!msbuildExe) {
        throw new PluginError(
          constants.PLUGIN_NAME,
          `Unable to find msbuild.exe under ${msbuildHome}`);
      }
      return msbuildExe;
  } else if (major >= 12 && major <= 15) {
    let x64_dir = is64Bit ? "amd64" : "";
    return path.join(msbuildRoot, "MSBuild", version, "Bin", x64_dir, "MSBuild.exe");
  } else {
    const framework = is64Bit ? "Framework64" : "Framework";
    return path.join(options.windir, "Microsoft.Net", framework, version, "MSBuild.exe");
  }
};
