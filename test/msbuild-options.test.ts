import { MSBuildOptions } from '../src/msbuild/msbuild-options';

describe('MSBuildOptions', () => {
    describe('constructor', () => {
        it('should create options with default values', () => {
            const options = new MSBuildOptions({});

            expect(options.stdout).toBe(false);
            expect(options.stderr).toBe(true);
            expect(options.errorOnFail).toBe(false);
            expect(options.logCommand).toBe(false);
            expect(options.targets).toEqual(['rebuild']);
            expect(options.configuration).toBe('Release');
            expect(options.verbosity).toBe('normal');
            expect(options.maxcpucount).toBe(0);
            expect(options.nologo).toBe(true);
            expect(options.nodeReuse).toBe(true);
        });

        it('should create options with custom values', () => {
            const options = new MSBuildOptions({
                stdout: true,
                stderr: false,
                errorOnFail: true,
                logCommand: true,
                targets: ['Clean', 'Build'],
                configuration: 'Debug',
                verbosity: 'detailed',
                maxcpucount: 4,
                nologo: false
            });

            expect(options.stdout).toBe(true);
            expect(options.stderr).toBe(false);
            expect(options.errorOnFail).toBe(true);
            expect(options.logCommand).toBe(true);
            expect(options.targets).toEqual(['Clean', 'Build']);
            expect(options.configuration).toBe('Debug');
            expect(options.verbosity).toBe('detailed');
            expect(options.maxcpucount).toBe(4);
            expect(options.nologo).toBe(false);
        });

        it('should handle properties object', () => {
            const properties = {
                Platform: 'x64',
                OutputPath: 'bin\\output'
            };

            const options = new MSBuildOptions({
                properties: properties
            });

            expect(options.properties).toEqual(properties);
        });

        it('should handle toolsVersion', () => {
            const options = new MSBuildOptions({
                toolsVersion: '15.0'
            });

            expect(options.toolsVersion).toBe('15.0');
        });

        it('should handle msbuildPath', () => {
            const path = 'C:\\Program Files\\MSBuild\\msbuild.exe';
            const options = new MSBuildOptions({
                msbuildPath: path as any
            });

            expect(options.msbuildPath).toBe(path);
        });

        it('should handle logger parameters', () => {
            const options = new MSBuildOptions({
                fileLoggerParameters: 'LogFile=build.log' as any,
                consoleLoggerParameters: 'ErrorsOnly' as any,
                loggerParameters: 'CustomLogger,logger.dll' as any
            });

            expect(options.fileLoggerParameters).toBe('LogFile=build.log');
            expect(options.consoleLoggerParameters).toBe('ErrorsOnly');
            expect(options.loggerParameters).toBe('CustomLogger,logger.dll');
        });

        it('should handle publish options', () => {
            const options = new MSBuildOptions({
                emitPublishedFiles: true,
                publishDirectory: 'C:\\output',
                webPublishMethod: 'FileSystem',
                deployDefaultTarget: 'WebPublish',
                deleteExistingFiles: 'true',
                findDependencies: 'true'
            });

            expect(options.emitPublishedFiles).toBe(true);
            expect(options.publishDirectory).toBe('C:\\output');
            expect(options.webPublishMethod).toBe('FileSystem');
            expect(options.deployDefaultTarget).toBe('WebPublish');
            expect(options.deleteExistingFiles).toBe('true');
            expect(options.findDependencies).toBe('true');
        });

        it('should handle custom args array', () => {
            const customArgs = ['/arg1', '/arg2:value'];
            const options = new MSBuildOptions({
                customArgs: customArgs as any
            });

            expect(options.customArgs).toEqual(customArgs);
        });

        it('should handle emitEndEvent flag', () => {
            const options = new MSBuildOptions({
                emitEndEvent: true
            });

            expect(options.emitEndEvent).toBe(true);
        });
    });
});
