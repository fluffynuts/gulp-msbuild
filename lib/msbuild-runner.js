"use strict";

const commandBuilder = require("./msbuild-command-builder");
const glob = require("glob");
const chalk = require("chalk");
const fs = require("fs");
const childProcess = require("child_process");
const gutil = require("./gutil");

module.exports.startMsBuildTask = function (options, file, stream, callback) {
  const command = commandBuilder.construct(file, options);

  if (options.logCommand) {
    console.log(chalk.cyan("Using MSBuild command:"), command.executable, command.args.join(" "));
  }

  const io = [ "ignore" ];

  io.push(options.stdout ? process.stdout : "ignore");
  io.push(options.stderr ? process.stderr : "ignore");

  const spawnOptions = { stdio: io };

  let closed = false;
  const cp = childProcess.spawn(command.executable, command.args, spawnOptions);

  cp.on("error", function (err) {
    if (err) { console.log(err); }

    // The "exit" event also can fire after the error event. We need to guard
    // when the process has already been closed:
    // https://nodejs.org/api/child_process.html#child_process_event_error
    if (closed) { return; }

    closed = true;
    if (err) {
      console.log(chalk.red("MSBuild failed!"));

      if (options.errorOnFail) {
        return callback(err);
      }
    }

    return callback();
  });

  cp.on("exit", function (code, signal) {
    // The "exit" event also can fire after the error event. We need to guard
    // when the process has already been closed:
    // https://nodejs.org/api/child_process.html#child_process_event_error
    if (closed) { return; }

    closed = true;
    if (code === 0) {
      console.log(chalk.cyan("MSBuild complete!"));

      if (options.emitPublishedFiles) {
        const publishDirectory = options.publishDirectory;
        glob("**/*", { cwd: publishDirectory, nodir: true, absolute: true }, function (err, files) {
          if (err) {
            const msg = "Error globbing published files at " + publishDirectory;
            console.log(chalk.red(msg));
            return callback(err);
          }

          for (let i = 0; i < files.length; i++) {
            const filePath = files[i];

            if (fs.statSync(filePath).isFile()) {
              stream.push(new gutil.File({
                cwd: publishDirectory,
                base: publishDirectory,
                path: filePath,
                contents: new Buffer(fs.readFileSync(filePath))
              }));
            }
          }
          return callback();
        });
      } else {
        return callback();
      }
    } else {
      let msg;

      if (code) {
        // Exited normally, but failed.
        msg = "MSBuild failed with code " + code + "!";
      } else {
        // Killed by parent process.
        msg = "MSBuild killed with signal " + signal + "!";
      }

      console.log(chalk.red(msg));

      if (options.errorOnFail) {
        return callback(new Error(msg));
      }
    }
  });
};
