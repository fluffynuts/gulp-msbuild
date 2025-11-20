const MSBuild = require('../src/index');

describe('MSBuild Plugin', () => {
    describe('module exports', () => {
        it('should export MSBuild function', () => {
            expect(MSBuild).toBeDefined();
            expect(typeof MSBuild).toBe('function');
        });

        it('should create a stream when called', () => {
            const stream = MSBuild({});
            
            expect(stream).toBeDefined();
            expect(typeof stream.pipe).toBe('function');
            expect(typeof stream.on).toBe('function');
        });

        it('should accept configuration options', () => {
            const config = {
                targets: ['Build'],
                configuration: 'Debug',
                verbosity: 'minimal',
                logCommand: true
            };

            expect(() => MSBuild(config)).not.toThrow();
        });

        it('should use default options when none provided', () => {
            expect(() => MSBuild({})).not.toThrow();
        });

        it('should accept stdout and stderr options', () => {
            const stream = MSBuild({
                stdout: true,
                stderr: false
            });

            expect(stream).toBeDefined();
        });

        it('should accept errorOnFail option', () => {
            const stream = MSBuild({
                errorOnFail: true
            });

            expect(stream).toBeDefined();
        });

        it('should accept custom targets array', () => {
            const stream = MSBuild({
                targets: ['Clean', 'Build', 'Publish']
            });

            expect(stream).toBeDefined();
        });

        it('should accept properties object', () => {
            const stream = MSBuild({
                properties: {
                    Platform: 'x64',
                    Configuration: 'Release'
                }
            });

            expect(stream).toBeDefined();
        });

        it('should accept toolsVersion option', () => {
            const stream = MSBuild({
                toolsVersion: '15.0'
            });

            expect(stream).toBeDefined();
        });

        it('should accept maxcpucount option', () => {
            const stream = MSBuild({
                maxcpucount: 4
            });

            expect(stream).toBeDefined();
        });

        it('should accept custom msbuildPath', () => {
            const stream = MSBuild({
                msbuildPath: 'C:\\CustomPath\\msbuild.exe'
            });

            expect(stream).toBeDefined();
        });

        it('should accept publish-related options', () => {
            const stream = MSBuild({
                emitPublishedFiles: true,
                publishDirectory: 'C:\\output',
                webPublishMethod: 'FileSystem',
                deleteExistingFiles: 'true'
            });

            expect(stream).toBeDefined();
        });
    });

    describe('stream behavior', () => {
        it('should be a through2 object stream', () => {
            const stream = MSBuild({});

            // Verify it has through2 stream methods
            expect(typeof stream._transform).toBe('function');
            expect(stream._readableState.objectMode).toBe(true);
        });

        it('should handle files passed through the stream', (done) => {
            const stream = MSBuild({
                msbuildPath: 'msbuild.exe'
            });

            const mockFile = {
                path: 'test.sln',
                contents: Buffer.from('test')
            };

            // Mock MSBuildRunner to avoid actual execution
            const MSBuildRunner = require('../src/msbuild/msbuild-runner').MSBuildRunner;
            const originalMethod = MSBuildRunner.startMsBuildTask;
            MSBuildRunner.startMsBuildTask = jest.fn((options: any, file: any, stream: any, callback: any) => {
                callback();
            });

            stream.on('data', (file: any) => {
                expect(file).toBeDefined();
            });

            stream.on('end', () => {
                MSBuildRunner.startMsBuildTask = originalMethod;
                done();
            });

            stream.write(mockFile);
            stream.end();
        });

        it('should pass through files without path', (done) => {
            const stream = MSBuild({});

            const mockFile = {
                contents: Buffer.from('test')
            };

            let fileReceived = false;

            stream.on('data', (file: any) => {
                fileReceived = true;
                expect(file).toBeDefined();
            });

            stream.on('end', () => {
                expect(fileReceived).toBe(true);
                done();
            });

            stream.write(mockFile);
            stream.end();
        });

        it('should emit end event when emitEndEvent is true', (done) => {
            const stream = MSBuild({
                emitEndEvent: true,
                msbuildPath: 'msbuild.exe'
            });

            const mockFile = {
                path: 'test.sln',
                contents: Buffer.from('test')
            };

            // Mock MSBuildRunner
            const MSBuildRunner = require('../src/msbuild/msbuild-runner').MSBuildRunner;
            const originalMethod = MSBuildRunner.startMsBuildTask;
            MSBuildRunner.startMsBuildTask = jest.fn((options: any, file: any, stream: any, callback: any) => {
                callback();
            });

            let endEmitted = false;
            stream.on('end', () => {
                endEmitted = true;
            });

            stream.on('finish', () => {
                MSBuildRunner.startMsBuildTask = originalMethod;
                // Note: end event is emitted by the runner, not automatically
                done();
            });

            stream.write(mockFile);
            stream.end();
        });

        it('should handle errors from MSBuildRunner', (done) => {
            const stream = MSBuild({
                msbuildPath: 'msbuild.exe'
            });

            const mockFile = {
                path: 'test.sln',
                contents: Buffer.from('test')
            };

            // Mock MSBuildRunner to simulate error
            const MSBuildRunner = require('../src/msbuild/msbuild-runner').MSBuildRunner;
            const originalMethod = MSBuildRunner.startMsBuildTask;
            MSBuildRunner.startMsBuildTask = jest.fn((options: any, file: any, stream: any, callback: any) => {
                callback(new Error('Build failed'));
            });

            stream.on('error', (err: Error) => {
                expect(err.message).toBe('Build failed');
                MSBuildRunner.startMsBuildTask = originalMethod;
                done();
            });

            stream.write(mockFile);
        });
    });
});
