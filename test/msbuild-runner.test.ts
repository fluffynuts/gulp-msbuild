import { MSBuildRunner } from '../src/msbuild/msbuild-runner';
import { MSBuildOptions } from '../src/msbuild/msbuild-options';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import { glob } from 'glob';

// Mock modules
jest.mock('child_process');
jest.mock('fs');
jest.mock('glob');

describe('MSBuildRunner', () => {
    let mockOptions: MSBuildOptions;
    let mockFile: any;
    let mockStream: any;
    let mockCallback: jest.Mock;
    let mockChildProcess: EventEmitter;
    const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
    const mockFs = fs as jest.Mocked<typeof fs>;
    const mockGlob = glob as jest.MockedFunction<typeof glob>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Suppress console output in tests
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        
        mockOptions = new MSBuildOptions({
            msbuildPath: 'C:\\msbuild.exe' as any,
            verbosity: 'normal',
            stdout: false,
            stderr: false,
            errorOnFail: false,
            logCommand: false
        });

        mockFile = { path: 'C:\\test.sln' };
        mockStream = { push: jest.fn() };
        mockCallback = jest.fn();

        // Create a mock child process
        mockChildProcess = new EventEmitter();
        mockSpawn.mockReturnValue(mockChildProcess as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('startMsBuildTask', () => {
        it('should be defined', () => {
            expect(MSBuildRunner.startMsBuildTask).toBeDefined();
        });

        it('should spawn msbuild process', () => {
            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, mockCallback);

            expect(mockSpawn).toHaveBeenCalled();
            const spawnArgs = mockSpawn.mock.calls[0];
            expect(spawnArgs[0]).toContain('msbuild.exe');
            expect(spawnArgs[1]).toContain('C:\\test.sln');
        });

        it('should handle successful build (exit code 0)', (done) => {
            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, (err: Error | null) => {
                expect(err).toBeUndefined();
                done();
            });

            // Simulate successful exit
            setImmediate(() => mockChildProcess.emit('exit', 0, null));
        });

        it('should handle build failure with errorOnFail option', (done) => {
            mockOptions.errorOnFail = true;

            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, (err: Error | null) => {
                expect(err).toBeDefined();
                expect(err?.message).toContain('MSBuild failed with code 1');
                done();
            });

            setImmediate(() => mockChildProcess.emit('exit', 1, null));
        });

        it('should handle process killed by signal with errorOnFail', (done) => {
            mockOptions.errorOnFail = true;

            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, (err: Error | null) => {
                expect(err).toBeDefined();
                expect(err?.message).toContain('killed with signal');
                done();
            });

            setImmediate(() => mockChildProcess.emit('exit', null, 'SIGTERM'));
        });

        it('should handle process error', (done) => {
            const testError = new Error('Process error');

            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, (err: Error | null) => {
                expect(err).toBeUndefined();
                done();
            });

            setImmediate(() => mockChildProcess.emit('error', testError));
        });

        it('should handle process error with errorOnFail', (done) => {
            mockOptions.errorOnFail = true;
            const testError = new Error('Process error');

            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, (err: Error | null) => {
                expect(err).toBe(testError);
                done();
            });

            setImmediate(() => mockChildProcess.emit('error', testError));
        });

        it('should not callback on exit after error already closed process', (done) => {
            const testError = new Error('Process error');

            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, (err: Error | null) => {
                // Should only be called once from error, not from exit
                expect(err).toBeUndefined();
                
                // Try to emit exit after error - should be ignored
                mockChildProcess.emit('exit', 1, null);
                
                setTimeout(done, 50);
            });

            setImmediate(() => {
                mockChildProcess.emit('error', testError);
            });
        });

        it('should handle error event without error object', (done) => {
            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, (err: Error | null) => {
                expect(err).toBeUndefined();
                done();
            });

            setImmediate(() => {
                // Emit error event with null/undefined error
                mockChildProcess.emit('error', null);
            });
        });

        it('should handle exit event after error was already handled', (done) => {
            const testError = new Error('Test error');
            let callbackCount = 0;

            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, () => {
                callbackCount++;
                
                if (callbackCount === 1) {
                    // First call from error
                    setTimeout(() => {
                        // After some time, verify callback wasn't called again
                        expect(callbackCount).toBe(1);
                        done();
                    }, 50);
                }
            });

            setImmediate(() => {
                mockChildProcess.emit('error', testError);
                // Try to emit exit - should be ignored due to closed flag
                setImmediate(() => {
                    mockChildProcess.emit('exit', 0, null);
                });
            });
        });

        it('should handle second error event after first error (closed guard)', (done) => {
            const testError1 = new Error('First error');
            const testError2 = new Error('Second error');
            let callbackCount = 0;

            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, () => {
                callbackCount++;
                
                if (callbackCount === 1) {
                    // First call from first error
                    setTimeout(() => {
                        // Verify callback wasn't called again from second error
                        expect(callbackCount).toBe(1);
                        done();
                    }, 50);
                }
            });

            setImmediate(() => {
                mockChildProcess.emit('error', testError1);
                // Try to emit another error - should hit the closed guard and return early
                setImmediate(() => {
                    mockChildProcess.emit('error', testError2);
                });
            });
        });

        it('should not call callback twice on error then exit', (done) => {
            const testError = new Error('Process error');
            let callCount = 0;

            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, () => {
                callCount++;
                expect(callCount).toBe(1);
                setTimeout(done, 10);
            });

            setImmediate(() => {
                mockChildProcess.emit('error', testError);
                mockChildProcess.emit('exit', 1, null);
            });
        });

        it('should log command when logCommand is true', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            mockOptions.logCommand = true;

            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, mockCallback);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.anything(),
                expect.stringContaining('msbuild.exe'),
                expect.any(String)
            );

            consoleSpy.mockRestore();
        });

        it('should emit published files when emitPublishedFiles is true', (done) => {
            mockOptions.emitPublishedFiles = true;
            mockOptions.publishDirectory = 'C:\\output';

            const mockFiles = [
                'C:\\output\\file1.txt',
                'C:\\output\\file2.txt'
            ];

            mockGlob.mockResolvedValue(mockFiles as any);
            mockFs.statSync.mockReturnValue({ isFile: () => true } as any);
            mockFs.readFileSync.mockReturnValue(Buffer.from('test content'));

            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, (err: Error | null) => {
                expect(err).toBeUndefined();
                expect(mockStream.push).toHaveBeenCalledTimes(2);
                done();
            });

            setImmediate(() => mockChildProcess.emit('exit', 0, null));
        });

        it('should handle glob errors when emitting published files', (done) => {
            mockOptions.emitPublishedFiles = true;
            mockOptions.publishDirectory = 'C:\\output';
            mockOptions.errorOnFail = false;

            mockGlob.mockRejectedValue(new Error('Glob error'));

            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, (err: Error | null) => {
                expect(err).toBeDefined();
                done();
            });

            setImmediate(() => mockChildProcess.emit('exit', 0, null));
        });

        it('should skip non-file entries when emitting published files', (done) => {
            mockOptions.emitPublishedFiles = true;
            mockOptions.publishDirectory = 'C:\\output';

            const mockFiles = ['C:\\output\\file1.txt'];

            mockGlob.mockResolvedValue(mockFiles as any);
            mockFs.statSync.mockReturnValue({ isFile: () => false } as any);

            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, (err: Error | null) => {
                expect(err).toBeUndefined();
                expect(mockStream.push).not.toHaveBeenCalled();
                done();
            });

            setImmediate(() => mockChildProcess.emit('exit', 0, null));
        });

        it('should use stdout and stderr options', () => {
            mockOptions.stdout = true;
            mockOptions.stderr = true;

            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, mockCallback);

            const spawnOptions = mockSpawn.mock.calls[0][2];
            expect(spawnOptions?.stdio).toEqual(['ignore', 'inherit', 'inherit']);
        });

        it('should ignore stdout and stderr when options are false', () => {
            mockOptions.stdout = false;
            mockOptions.stderr = false;

            MSBuildRunner.startMsBuildTask(mockOptions, mockFile, mockStream, mockCallback);

            const spawnOptions = mockSpawn.mock.calls[0][2];
            expect(spawnOptions?.stdio).toEqual(['ignore', 'ignore', 'ignore']);
        });
    });
});
