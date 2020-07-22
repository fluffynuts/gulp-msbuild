'use strict';

const path = require("path");
const constants = require("./constants");
const PluginError = require("plugin-error");
const cloneDeep = require("lodash.clonedeep");
const intersection = require("lodash.intersection");
const template = require("lodash.template");

module.exports.buildArguments = function(options) {
  let args = [];
  args.push("/target:" + options.targets.join(";"));
  args.push("/verbosity:" + options.verbosity);
  if (options.toolsVersion) {
    let version = parseFloat(options.toolsVersion).toFixed(1);
    if (isNaN(version)) {
      version = "4.0";
    } else if (version > 15) {
      version = "Current"; // msbuild 16.0 accepts this
    }
    args.push("/toolsversion:" + version);
  }

  if (options.nologo) {
    args.push("/nologo");
  }

  if (options.fileLoggerParameters) {
    args.push("/flp:" + options.fileLoggerParameters);
  }

  if (options.consoleLoggerParameters) {
    args.push("/clp:" + options.consoleLoggerParameters);
  }

  if (options.loggerParameters) {
    args.push("/logger:" + options.loggerParameters);
  }

  // xbuild does not support the `maxcpucount` argument and throws if provided
  if (options.maxcpucount >= 0 && options.msbuildPath !== 'xbuild') {
    if (options.maxcpucount === 0) {
      args.push('/maxcpucount');
    } else {
      args.push('/maxcpucount:' + options.maxcpucount);
    }
  }

  if (options.nodeReuse === false) {
    args.push('/nodeReuse:False');
  }

  if (options.configuration) {
    options.properties = {
      Configuration: options.configuration,
      ...options.properties
    };
  }

  if (options.solutionPlatform) {
    options.properties = {
      Platform: options.solutionPlatform,
      ...options.properties
    };
  }

  if (options.emitPublishedFiles) {
    options.properties = {
      DeployOnBuild: "true",
      DeployDefaultTarget: options.deployDefaultTarget,
      WebPublishMethod: options.webPublishMethod,
      DeleteExistingFiles: options.deleteExistingFiles,
      _FindDependencies: options.findDependencies,
      PublishUrl: options.publishDirectory,
      ...options.properties
    };
  }

  for (let property in options.properties) {
    args.push('/property:' + property + '=' + options.properties[property]);
  }

  if (options.customArgs) {
    args = args.concat(options.customArgs);
  }

  return args;
};

module.exports.construct = function(file, options) {
  if (!options || Object.keys(options).length <= 0) {
    throw new PluginError(constants.PLUGIN_NAME, 'No options specified!');
  }

  if (!options.msbuildPath) {
    const msbuildFinder = require("./msbuild-finder");
    options.msbuildPath = msbuildFinder.find(options);
  }


  const newOptions = cloneDeep(options);

  intersection(Object.keys(newOptions), ['consoleLoggerParameters', 'fileLoggerParameters', 'loggerParameters']).forEach(function(prop) {
    const context = { file: file };
    newOptions[prop] = template(newOptions[prop])(context);
  });

  Object.keys(newOptions.properties).forEach(function(prop) {
    const context = { file: file };
    newOptions.properties[prop] = template(newOptions.properties[prop])(context);
  });

  const args = this.buildArguments(newOptions);

  return {
    executable: path.normalize(options.msbuildPath),
    args: [file.path].concat(args)
  };
};
