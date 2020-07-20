'use strict';

const through = require("through2"),
  cloneDeep = require("lodash.clonedeep"),
  constants = require("./lib/constants"),
  msbuildRunner = require("./lib/msbuild-runner"),
  didYouMean = require("didyoumean"),
  chalk = require("chalk"),
  PluginError = require("plugin-error");


function mergeOptionsWithDefaults(options) {
  return {
    ...constants.DEFAULTS,
    ...options
  };
}

function validateOptions(options) {
  for (let key in options) {
    const defaultKeys = Object.keys(constants.DEFAULTS);
    if (defaultKeys.indexOf(key) < 0) {
      let match;
      let msg = "Unknown option '" + key + "'!";

      if (!!(match = didYouMean(key, defaultKeys))) {
        msg += " Did you mean '" + match + "'?";
      }

      throw new PluginError(constants.PLUGIN_NAME, chalk.red(msg));
    }
  }
}

module.exports = function(options) {
  const mergedOptions = cloneDeep(mergeOptionsWithDefaults(options));
  validateOptions(mergedOptions);

  const stream = through.obj(function (file, enc, callback) {
    const self = this;
    if (!file || !file.path) {
      self.push(file);
      return callback();
    }

    return msbuildRunner.startMsBuildTask(mergedOptions, file, self, function (err) {
      if (err) {
        return callback(err);
      }
      if (mergedOptions.emitEndEvent) {
        self.emit("end");
      }
      return callback();
    });
  });

  return stream;
};
