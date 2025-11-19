import { cloneDeep, template } from 'lodash';
import { MSBuildFinder } from './msbuild-finder';
import { MSBuildOptions } from './msbuild-options';
import path from 'path';

export class MSBuildCommandBuilder {

    constructor() {}

    private buildArguments(options: MSBuildOptions) {
        let args = [];
        args.push("/target:" + (options.targets ?? ["Rebuild"]).join(";"));
        args.push("/verbosity:" + options.verbosity);

        if (options.toolsVersion) {
            const versionNumber = parseFloat(options.toolsVersion);
            let version;
            
            if (isNaN(versionNumber)) {
                version = "4.0";
            } else if (versionNumber > 15) {
                version = "Current";
            }
            else {
                version = versionNumber.toFixed(1);
            }


            args.push("/toolsversion:" + version);
        }

        if (options.nologo) {
            args.push("/nologo");
        }

        if (options.fileLoggerParameters) {
            args.push("/flp:" + options.fileLoggerParameters);
        }

        if (options.consoleLoggerParameters) {
            args.push("/clp:" + options.consoleLoggerParameters);
        }

        if (options.loggerParameters) {
            args.push("/logger:" + options.loggerParameters);
        }

        // xbuild does not support the `maxcpucount` argument and throws if provided
        if (options.maxcpucount != undefined && options.maxcpucount >= 0 && options.msbuildPath !== 'xbuild') {
            if (options.maxcpucount === 0) {
                args.push('/maxcpucount');
            } else {
                args.push('/maxcpucount:' + options.maxcpucount);
            }
        }

        if (options.nodeReuse === false) {
            args.push('/nodeReuse:False');
        }

        if (options.configuration) {
            options.properties = {
                Configuration: options.configuration,
                ...options.properties
            };
        }

        if (options.solutionPlatform) {
            options.properties = {
                Platform: options.solutionPlatform,
                ...options.properties
            };
        }

        if (options.emitPublishedFiles) {
            options.properties = {
                DeployOnBuild: "true",
                DeployDefaultTarget: options.deployDefaultTarget,
                WebPublishMethod: options.webPublishMethod,
                DeleteExistingFiles: options.deleteExistingFiles,
                _FindDependencies: options.findDependencies,
                PublishUrl: options.publishDirectory,
                ...options.properties
            };
        }

        for (let property in options.properties) {
            args.push('/property:' + property + '=' + options.properties[property]);
        }

        if (options.customArgs) {
            args = args.concat(options.customArgs);
        }

        return args;
    }

    public construct(file: any, options: MSBuildOptions)
    {
        if (!options || Object.keys(options).length <= 0) {
            throw new Error(`No options specified in MSBuildOptions`);
        }

        if (!options.msbuildPath) {
            const msbuildFinder = new MSBuildFinder(options);
            const version = msbuildFinder.findVersion();

            if (version != null)
            {
                if (version[0] != null)
                {
                    options.msbuildPath = version[0] ?? '';
                    options.toolsVersion = version[1] ?? '4.0';
                }
                else 
                    throw new Error(`Invalid version`);
            }
            else 
                throw new Error(`Invalid version`);
        }

        const newOptions = cloneDeep(options);
        
          Object.keys(newOptions.properties).forEach(function(prop) {
            const context = { file: file };
            newOptions.properties[prop] = template(newOptions.properties[prop])(context);
          });
        
          const args = this.buildArguments(newOptions);
        
          return {
            executable: path.normalize(options.msbuildPath),
            args: [file.path].concat(args)
          };
    }
}