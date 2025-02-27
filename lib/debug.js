"use strict";
const path = require("path");
const debug = require("debug");
module.exports = {
  createDebugLogger: function(filename) {
    const
      basename = path.basename(filename),
      ext = path.extname(filename),
      label = basename.replace(ext, "");
    return debug(label);
  }
};
