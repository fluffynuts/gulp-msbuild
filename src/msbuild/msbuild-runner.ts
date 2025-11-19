import { spawn, SpawnOptions } from 'child_process';
import { MSBuildCommandBuilder } from './msbuild-command-builder';
import { MSBuildOptions } from './msbuild-options';
import * as fs from 'fs';
import { glob } from 'glob';
import gutil from './gutil';
import { cyan, red } from 'colorette';


export class MSBuildRunner {
  public static startMsBuildTask(options: MSBuildOptions, file: any, stream: any, callback: any) {
    console.log('');
    const commandBuilder = new MSBuildCommandBuilder();
    const command = commandBuilder.construct(file, options);

    if (options.logCommand) {
      console.log(cyan("Using MSBuild command:"), command.executable, command.args.join(" "));
    }

    const spawnOptions: SpawnOptions = {
      stdio: [
          'ignore',
          options.stdout ? 'inherit' : 'ignore',
          options.stderr ? 'inherit' : 'ignore'
      ]
  };

    let closed = false;
    
    const child = spawn(command.executable, command.args, spawnOptions);

    child.on("error", (error) => {
      if (error) { console.log(error); }

      // The "exit" event also can fire after the error event. We need to guard
      // when the process has already been closed:
      // https://nodejs.org/api/child_process.html#child_process_event_error
      if (closed) { return; }

      closed = true;

      if (error) {
        console.log(red('MSBuild failed!'));

        if (options.errorOnFail) {
          return callback(error);
        }
      }

      return callback();
    });

    child.on("exit", async (code, signal) => {
      // The "exit" event also can fire after the error event. We need to guard
      // when the process has already been closed:
      // https://nodejs.org/api/child_process.html#child_process_event_error
      if (closed) { return; }

      closed = true;
      if (code === 0) {
        console.log(cyan('MSBuild complete!'));
        console.log('');

        if (options.emitPublishedFiles) {
          const publishDirectory = options.publishDirectory;
          await glob('**/*', { cwd: publishDirectory, nodir: true, absolute: true })
            .then((files: string | any[]) => {
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
            })
            .catch((err: Error) => {
              if (err) {
                const msg = 'Error globbing published files at ' + publishDirectory;
                console.log(red(msg));
                return callback(err);
              }

            });
        } else {
          return callback();
        }
      } else {
        let msg;

        if (code) {
          // Exited normally, but failed.
          msg = 'MSBuild failed with code ' + code + '!';
        } else {
          // Killed by parent process.
          msg = 'MSBuild killed with signal ' + signal + '!';
        }

        console.log(red(msg));
        console.log('');

        if (options.errorOnFail) {
          return callback(new Error(msg));
        }
      }
    });
  }
}