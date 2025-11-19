import { MSBuildOptions } from './msbuild/msbuild-options';
import through from 'through2';
import { MSBuildRunner } from './msbuild/msbuild-runner';
import { join } from 'path';
import { ArchitectureService } from './utilities/ArchitectureService';
import * as os from 'os';
import { v4 } from 'uuid';

function MSBuild({
        stdout = false,
        stderr = true,
        errorOnFail = false,
        logCommand = false,
        targets = ['rebuild'],
        configuration = 'Release',
        toolsVersion = 'auto',
        properties = {},
        verbosity = 'normal',
        maxcpucount = 0,
        nologo = true,
        platform = process.platform,
        architecture = ArchitectureService.Architecture,
        windir = ArchitectureService.Platform,
        msbuildPath = undefined,
        fileLoggerParameters = undefined,
        consoleLoggerParameters = undefined,
        loggerParameters = undefined,
        nodeReuse = true,
        customArgs = [],
        emitEndEvent = false,
        solutionPlatform = undefined,
        emitPublishedFiles = false,
        deployDefaultTarget = 'WebPublish',
        webPublishMethod = 'FileSystem',
        deleteExistingFiles = 'true',
        findDependencies = 'true',
        publishDirectory = join(os.tmpdir(), v4())
    }) {

    let options = new MSBuildOptions({
        stdout: stdout,
        stderr: stderr,
        errorOnFail: errorOnFail,
        logCommand: logCommand,
        targets: targets,
        configuration: configuration,
        toolsVersion: toolsVersion,
        properties: properties,
        verbosity: verbosity,
        maxcpucount: maxcpucount,
        nologo: nologo,
        platform: platform,
        architecture: architecture,
        windir: windir,
        msbuildPath: msbuildPath,
        fileLoggerParameters: fileLoggerParameters,
        consoleLoggerParameters: consoleLoggerParameters,
        loggerParameters: loggerParameters,
        nodeReuse: nodeReuse,
        customArgs: customArgs,
        emitEndEvent: emitEndEvent,
        solutionPlatform: solutionPlatform,
        emitPublishedFiles: emitPublishedFiles,
        deployDefaultTarget: deployDefaultTarget,
        webPublishMethod: webPublishMethod,
        deleteExistingFiles: deleteExistingFiles,
        findDependencies: findDependencies,
        publishDirectory: publishDirectory
    });

    const stream = through.obj(function (file: any, enc: BufferEncoding, callback: through.TransformCallback) {
        const self = this;
        
        if (!file || !file.path) {
            self.push(file);
            return callback();
        }

        return MSBuildRunner.startMsBuildTask(options, file, self, function (err: Error | null) {
            if (err) {
                return callback(err);
            }
            if (options.emitEndEvent) {
                self.emit("end");
            }
            return callback();
        });
    });

    return stream;
}

module.exports = MSBuild;
module.exports.default = MSBuild;