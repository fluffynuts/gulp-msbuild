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

function msBuildFromWhere(pathRoot, findAll) {
  findAll = findAll || false;
  const vsWherePath = path.join(pathRoot, "Microsoft Visual Studio", "Installer", "vswhere.exe");
  if (!fs.existsSync(vsWherePath)) {
    // no vswhere -- fall back on manual methods
    return [];
  }
  let args = findAll ? [] : [ "-latest" ];
  args = args.concat([ "-products", "*", "-requires", "Microsoft.Component.MSBuild" ]);
  const whereProcess = child.spawnSync(
    vsWherePath,
    args,
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: "pipe",
      encoding: "utf-8"
    }
  );

  if (whereProcess.output === null) {
    return [];
  }
  let cmdOutput = "";
  if (whereProcess.output.length > 0) {
    for (let index = 0; index < whereProcess.output.length; index++) {
      cmdOutput = whereProcess.output[index] || "";
      if (cmdOutput.length > 0) {
        break;
      }
    }
  }
  const installKeyword = "installationPath";
  const installationVersionKeyword = "installationVersion";
  const all = [];
  if (cmdOutput.length > 0) {
    let installationPath, installationVersion;

    const results = cmdOutput.split(/\r?\n/);
    for (let cmdLineIndex = 0; cmdLineIndex < results.length; cmdLineIndex++) {
      const cmdLine = results[cmdLineIndex];
      if (cmdLine.startsWith(installKeyword)) {
        installationPath = cmdLine.replace(installKeyword + ": ", "");
      }

      if (cmdLine.startsWith(installationVersionKeyword)) {
        let versionParts = cmdLine.replace(installationVersionKeyword + ": ", "").split(".");
        if (versionParts.length > 0) {
          installationVersion = parseFloat(versionParts[0]);
        }
      }
      if (installationPath && installationVersion) {
        all.push({ installationPath, installationVersion });
        installationPath = undefined;
        installationVersion = undefined;
      }
    }

  }

  all.sort((a, b) => a.installationVersion - b.installationVersion);
  if (findAll) {
    return all.map(o => [ o.installationPath, o.installationVersion ]);
  } else {
    const highest = all[all.length - 1];
    if (highest === undefined) {
      return [];
    }
    return [ highest.installationPath, highest.installationVersion ];
  }
}

module.exports.msBuildFromWhere = msBuildFromWhere;

function detectMsBuild15Dir(pathRoot) {

  const vs2017Path = path.join(pathRoot, "Microsoft Visual Studio", "2017");
  const possibleFolders = [ "BuildTools", "Enterprise", "Professional", "Community" ];

  for (let index = 0; index < possibleFolders.length; index++) {
    try {
      const folderPath = path.join(vs2017Path, possibleFolders[index]);
      fs.statSync(folderPath);
      return folderPath;
    } catch (e) {
    }
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
      if (proc.stdout === null) {
        // happens if the process couldn't actually be started, eg ARM64 binary on AMD64 system
        return undefined;
      }
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

function autoDetectVersion(pathRoot, matchVersion) {

  // Try to detect using fromWhere
  const findAll = matchVersion !== undefined;
  const wherePath = msBuildFromWhere(pathRoot, findAll);
  if (wherePath.length > 0) {
    if (findAll) {
      for (const pair of wherePath) {
        const [ _, version ] = pair;
        if (version === matchVersion) {
          return pair;
        }
      }
    } else {
      return wherePath;
    }
  }

  if (matchVersion >= 15.0) {
    // Try to detect MSBuild 15.0.
    const msbuild15OrLaterDir = detectMsBuild15Dir(pathRoot);
    if (msbuild15OrLaterDir) {
      const msbuildHome = path.join(msbuild15OrLaterDir, "MSBuild");
      const msbuildExecutables = findMSBuildExeUnder(msbuildHome);
      const detected = addDetectedMsBuildVersionsToConstantsLookup(msbuildExecutables);
      return [ msbuild15OrLaterDir, detected[0] || 15.0 ];
    }
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
      return [ pathRoot, parseFloat(msbuildVersions.pop()) ];
    }
  }
  return matchVersion === undefined
    ? [ pathRoot, 4.0 ]
    : [];
}

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

  const buildIs64Bit = options.architecture === "x64";
  const hostIs64Bit = constants.DEFAULTS.architecture === "x64";

  // On 64-bit systems msbuild is always under the x86 directory. If this
  // doesn"t exist we are on a 32-bit system. See also:
  // https://blogs.msdn.microsoft.com/visualstudio/2013/07/24/msbuild-is-now-part-of-visual-studio/
  let pathRoot = process.env["ProgramFiles"] || "C:/Program Files";
  if (hostIs64Bit) {
    pathRoot = process.env["ProgramFiles(x86)"] || "C:/Program Files (x86)";
  }

  let msbuildRoot = pathRoot;
  let toolsVersion = parseFloat(options.toolsVersion);

  if (isNaN(toolsVersion)) {
    // if the toolsVersion is 'auto' or any other non-parsable string
    // we'll auto delect the version
    const auto = autoDetectVersion(pathRoot);
    msbuildRoot = auto[0];
    toolsVersion = parseFloat(auto[1]);
    options.toolsVersion = toolsVersion;
  } else {
    if (toolsVersion < 1) {
      throw new Error(`Invalid MSBuild version was supplied: ${options.toolsVersion}`);
    }
    const matched = autoDetectVersion(pathRoot, toolsVersion);
    if (matched.length) {
      msbuildRoot = matched[0];
      toolsVersion = parseFloat(matched[1]);
      options.toolsVersion = toolsVersion;
    } else if (toolsVersion <= 4.0) {
      // try find in windir
      return findWindirMsBuildFor(buildIs64Bit, toolsVersion);
    } else {
      // fall back on msbuild 15
      const msbuildDir = detectMsBuild15Dir(pathRoot);
      if (msbuildDir && toolsVersion >= 15.0) {
        msbuildRoot = msbuildDir;
      }
    }
  }

  const
    configuredVersion = constants.MSBUILD_VERSIONS[toolsVersion],
    version = configuredVersion === undefined ? toolsVersion.toString() : configuredVersion;
  if (!version) {
    throw new PluginError(constants.PLUGIN_NAME, "No or invalid MSBuild version was supplied! Please set or check the value of the 'toolsVersion' property.");
  }

  let major = parseInt(version.split(".")[0]);
  if (major >= 16) {
    if (buildIs64Bit) {
      return path.join(msbuildRoot, "MSBuild", "Current", "Bin", "amd64", "MSBuild.exe");
    } else {
      return path.join(msbuildRoot, "MSBuild", "Current", "Bin", "MSBuild.exe");
    }
  } else if (major > 15 && major < 16) {
    let x64_dir = buildIs64Bit ? "amd64" : "";
    const msbuildHome = path.join(msbuildRoot, "MSBuild");
    const msbuildExe = findMSBuildExeUnder(msbuildHome)
      .filter(exe => {
        const pathParts = exe.split(path.sep);
        return buildIs64Bit
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
    let x64_dir = buildIs64Bit ? "amd64" : "";
    return path.join(msbuildRoot, "MSBuild", version, "Bin", x64_dir, "MSBuild.exe");
  }

  const framework = buildIs64Bit ? "Framework64" : "Framework";
  return path.join(options.windir, "Microsoft.Net", framework, version, "MSBuild.exe");
};

function findWindirMsBuildFor(is64Bit, toolsVersion, windir) {
  windir = windir || process.env.WINDIR;
  if (!windir) {
    return []; // can't look when we don't know where
  }
  const framework = is64Bit ? "Framework64" : "Framework";
  const baseDir = path.join(windir, "Microsoft.NET", framework);
  const frameworkVersions = fs.readdirSync(baseDir)
    .filter(p => isDir(path.join(baseDir, p)))
    .map(p => p.replace(/^v/, "")) // strip leading 'v'
    .map(p => parseFloat(p))
    .filter(version => !isNaN(version));
  const match = frameworkVersions.find(
    ver => ver.toFixed(1) === toolsVersion.toFixed(1)
  );
  if (!match) {
    throw new Error(`No or invalid MSBuild version was supplied! (Can't find msbuild for toolsVersion under ${baseDir} (perhaps override windir?))`);
  }
  return path.join(baseDir, `v${match}`, "MSBuild.exe");
}

function isDir(at) {
  try {
    const st = fs.statSync(at);
    return st && st.isDirectory();
  } catch (e) {
    return false;
  }
}
