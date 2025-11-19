import { join } from 'path';
import { ArchitectureService } from '../utilities/ArchitectureService';
import * as os from 'os';
import { v4 } from 'uuid';

export class MSBuildOptions {
    public stdout: boolean | undefined;
    public stderr: boolean | undefined;
    public errorOnFail: boolean | undefined;
    public logCommand: boolean | undefined;
    public targets: string[] | undefined;
    public configuration: string | undefined;
    public toolsVersion: string | undefined;
    public properties: any;
    public verbosity: string | undefined;
    public maxcpucount: number | undefined;
    public nologo: boolean | undefined;
    public platform: string | undefined;
    public architecture: string | undefined;
    public windir: string | undefined;
    public msbuildPath: string | undefined;
    public fileLoggerParameters: string  | undefined;
    public consoleLoggerParameters: string  | undefined;
    public loggerParameters: string | undefined;
    public nodeReuse: boolean | undefined;
    public customArgs: string[];
    public emitEndEvent: boolean  | undefined;
    public solutionPlatform: string | undefined;
    public emitPublishedFiles: boolean | undefined;
    public deployDefaultTarget: string;
    public webPublishMethod: string;
    public deleteExistingFiles: string;
    public findDependencies: string;
    public publishDirectory: string;

    constructor(
        {
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
        }
    ) {
        this.stdout = stdout;
        this.stderr = stderr;
        this.errorOnFail = errorOnFail;
        this.logCommand = logCommand;
        this.targets = targets;
        this.configuration = configuration;
        this.toolsVersion = toolsVersion;
        this.properties = properties;
        this.verbosity = verbosity;
        this.maxcpucount = maxcpucount;
        this.nologo = nologo;
        this.platform = platform;
        this.architecture = architecture;
        this.windir = windir;
        this.msbuildPath = msbuildPath;
        this.fileLoggerParameters = fileLoggerParameters;
        this.consoleLoggerParameters = consoleLoggerParameters;
        this.loggerParameters = loggerParameters;
        this.nodeReuse = nodeReuse;
        this.customArgs = customArgs;
        this.emitEndEvent = emitEndEvent;
        this.solutionPlatform = solutionPlatform;
        this.emitPublishedFiles = emitPublishedFiles;
        this.deployDefaultTarget = deployDefaultTarget;
        this.webPublishMethod = webPublishMethod;
        this.deleteExistingFiles = deleteExistingFiles;
        this.findDependencies = findDependencies;
        this.publishDirectory = publishDirectory;
    }
}
