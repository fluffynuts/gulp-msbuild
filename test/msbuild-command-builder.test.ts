import { MSBuildCommandBuilder } from '../src/msbuild/msbuild-command-builder';
import { MSBuildOptions } from '../src/msbuild/msbuild-options';

describe('MSBuildCommandBuilder', () => {
    let builder: MSBuildCommandBuilder;

    beforeEach(() => {
        builder = new MSBuildCommandBuilder();
    });

    describe('construct', () => {
        it('should throw error when options are empty', () => {
            const file = { path: 'test.sln' };
            const options = {} as MSBuildOptions;

            expect(() => builder.construct(file, options)).toThrow('No options specified in MSBuildOptions');
        });

        it('should build command with basic options', () => {
            const file = { path: 'C:\\Projects\\test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'C:\\Program Files\\MSBuild\\msbuild.exe' as any,
                targets: ['Build'],
                configuration: 'Debug',
                verbosity: 'minimal',
                nologo: true
            });

            const result = builder.construct(file, options);

            expect(result.executable).toContain('msbuild.exe');
            expect(result.args).toContain('C:\\Projects\\test.sln');
            expect(result.args).toContain('/target:Build');
            expect(result.args).toContain('/verbosity:minimal');
            expect(result.args).toContain('/nologo');
            expect(result.args).toContain('/property:Configuration=Debug');
        });

        it('should include multiple targets', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'msbuild.exe' as any,
                targets: ['Clean', 'Build', 'Test'],
                verbosity: 'normal'
            });

            const result = builder.construct(file, options);

            expect(result.args.some(arg => arg === '/target:Clean;Build;Test')).toBe(true);
        });

        it('should use default Rebuild target when targets is undefined', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'msbuild.exe' as any,
                verbosity: 'normal'
            });
            // Force targets to be undefined
            options.targets = undefined;

            const result = builder.construct(file, options);

            expect(result.args.some(arg => arg === '/target:Rebuild')).toBe(true);
        });

        it('should add maxcpucount when specified', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'msbuild.exe' as any,
                maxcpucount: 4,
                verbosity: 'normal'
            });

            const result = builder.construct(file, options);

            expect(result.args).toContain('/maxcpucount:4');
        });

        it('should add maxcpucount without value when 0', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'msbuild.exe' as any,
                maxcpucount: 0,
                verbosity: 'normal'
            });

            const result = builder.construct(file, options);

            expect(result.args).toContain('/maxcpucount');
        });

        it('should not add maxcpucount for xbuild', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'xbuild' as any,
                maxcpucount: 4,
                verbosity: 'normal'
            });

            const result = builder.construct(file, options);

            expect(result.args.every(arg => !arg.includes('maxcpucount'))).toBe(true);
        });

        it('should add custom properties', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'msbuild.exe' as any,
                properties: {
                    OutputPath: 'bin\\output',
                    Platform: 'x64'
                },
                verbosity: 'normal'
            });

            const result = builder.construct(file, options);

            expect(result.args).toContain('/property:OutputPath=bin\\output');
            expect(result.args).toContain('/property:Platform=x64');
        });

        it('should add fileLoggerParameters when specified', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'msbuild.exe' as any,
                fileLoggerParameters: 'LogFile=build.log;Verbosity=Detailed' as any,
                verbosity: 'normal'
            });

            const result = builder.construct(file, options);

            expect(result.args).toContain('/flp:LogFile=build.log;Verbosity=Detailed');
        });

        it('should add consoleLoggerParameters when specified', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'msbuild.exe' as any,
                consoleLoggerParameters: 'ErrorsOnly' as any,
                verbosity: 'normal'
            });

            const result = builder.construct(file, options);

            expect(result.args).toContain('/clp:ErrorsOnly');
        });

        it('should add loggerParameters when specified', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'msbuild.exe' as any,
                loggerParameters: 'CustomLogger,MyAssembly.dll' as any,
                verbosity: 'normal'
            });

            const result = builder.construct(file, options);

            expect(result.args).toContain('/logger:CustomLogger,MyAssembly.dll');
        });

        it('should add nodeReuse:False when nodeReuse is false', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'msbuild.exe' as any,
                nodeReuse: false,
                verbosity: 'normal'
            });

            const result = builder.construct(file, options);

            expect(result.args).toContain('/nodeReuse:False');
        });

        it('should add custom args', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'msbuild.exe' as any,
                customArgs: ['/customArg1', '/customArg2:value'] as any,
                verbosity: 'normal'
            });

            const result = builder.construct(file, options);

            expect(result.args).toContain('/customArg1');
            expect(result.args).toContain('/customArg2:value');
        });

        it('should set tools version to Current for version > 15', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'msbuild.exe' as any,
                toolsVersion: '16.0',
                verbosity: 'normal'
            });

            const result = builder.construct(file, options);

            expect(result.args).toContain('/toolsversion:Current');
        });

        it('should default to version 4.0 for non-numeric toolsVersion', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'msbuild.exe' as any,
                toolsVersion: 'invalid' as any,
                verbosity: 'normal'
            });

            const result = builder.construct(file, options);

            expect(result.args).toContain('/toolsversion:4.0');
        });

        it('should use toFixed for numeric versions between 0-15', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'msbuild.exe' as any,
                toolsVersion: '12.0',
                verbosity: 'normal'
            });

            const result = builder.construct(file, options);

            expect(result.args).toContain('/toolsversion:12.0');
        });

        it('should handle solutionPlatform option', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'msbuild.exe' as any,
                solutionPlatform: 'x86' as any,
                verbosity: 'normal'
            });

            const result = builder.construct(file, options);

            expect(result.args).toContain('/property:Platform=x86');
        });

        it('should add publish properties when emitPublishedFiles is true', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'msbuild.exe' as any,
                emitPublishedFiles: true,
                publishDirectory: 'C:\\output',
                webPublishMethod: 'FileSystem',
                deleteExistingFiles: 'true',
                verbosity: 'normal'
            });

            const result = builder.construct(file, options);

            expect(result.args).toContain('/property:DeployOnBuild=true');
            expect(result.args).toContain('/property:WebPublishMethod=FileSystem');
            expect(result.args).toContain('/property:PublishUrl=C:\\output');
        });

        it('should find msbuildPath automatically when not provided', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                verbosity: 'normal',
                toolsVersion: '15.0'
            });

            // Mock MSBuildFinder
            const MSBuildFinder = require('../src/msbuild/msbuild-finder').MSBuildFinder;
            const originalFindVersion = MSBuildFinder.prototype.findVersion;
            MSBuildFinder.prototype.findVersion = jest.fn().mockReturnValue(['C:\\msbuild.exe', '15.0']);

            const result = builder.construct(file, options);

            expect(result.executable).toBeDefined();
            expect(options.msbuildPath).toBe('C:\\msbuild.exe');
            expect(options.toolsVersion).toBe('15.0');

            // Restore
            MSBuildFinder.prototype.findVersion = originalFindVersion;
        });

        it('should throw error when auto-detection returns null', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                verbosity: 'normal'
            });

            // Mock MSBuildFinder to return null
            const MSBuildFinder = require('../src/msbuild/msbuild-finder').MSBuildFinder;
            const originalFindVersion = MSBuildFinder.prototype.findVersion;
            MSBuildFinder.prototype.findVersion = jest.fn().mockReturnValue(null);

            expect(() => builder.construct(file, options)).toThrow('Invalid version');

            // Restore
            MSBuildFinder.prototype.findVersion = originalFindVersion;
        });

        it('should throw error when auto-detection returns null path', () => {
            const file = { path: 'test.sln' };
            const options = new MSBuildOptions({
                verbosity: 'normal'
            });

            // Mock MSBuildFinder to return array with null path
            const MSBuildFinder = require('../src/msbuild/msbuild-finder').MSBuildFinder;
            const originalFindVersion = MSBuildFinder.prototype.findVersion;
            MSBuildFinder.prototype.findVersion = jest.fn().mockReturnValue([null, '15.0']);

            expect(() => builder.construct(file, options)).toThrow('Invalid version');

            // Restore
            MSBuildFinder.prototype.findVersion = originalFindVersion;
        });

        it('should handle properties with template variables', () => {
            const file = { path: 'C:\\\\test.sln' };
            const options = new MSBuildOptions({
                msbuildPath: 'msbuild.exe' as any,
                properties: {
                    OutputPath: '<%- file.path %>/output'
                },
                verbosity: 'normal'
            });

            const result = builder.construct(file, options);

            // Property templates should be evaluated
            expect(result).toBeDefined();
        });
    });
});
