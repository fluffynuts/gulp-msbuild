import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { MSBUILD_VERSIONS } from './constants';
import { MSBuildOptions } from './msbuild-options';
import { ArchitectureService } from '../utilities/ArchitectureService';

export class MSBuildFinder {
    private buildIs64Bit: boolean;
    private version: string;
    private windir: string;

    public constructor(options: MSBuildOptions)
    {
        this.buildIs64Bit = ArchitectureService.Architecture === 'x64';
        this.version = options.toolsVersion ?? 'auto'
        this.windir = options.windir ?? 'C:\Windows';
    }

    public findVersion(): (string | null)[] | null {
        if (this.version == 'auto')
            return this.getLatestAvailableVersion();

        const parsedNumber = parseFloat(this.version);

        if (isNaN(parsedNumber))
            throw new Error('version unknown');

        const vswherePath = path.join(process.env['ProgramFiles(x86)'] || '', 'Microsoft Visual Studio', 'Installer', 'vswhere.exe');
    
        if (!fs.existsSync(vswherePath)) {
            console.error('vswhere.exe not found');
            return null;
        }
    
        try {
            const installationsBuffer = execSync(`"${vswherePath}" -products * -requires Microsoft.Component.MSBuild -format json`);
            const installations = JSON.parse(installationsBuffer.toString());
    
            const installationPaths =  installations.map((installation: any) => this.concatCorrectPath(installation.installationPath)) as string[];
            const installedPath = this.getInstalledVersion(installationPaths);
            
            return [
                installedPath,
                this.version
            ]
        } catch (error: any) {
            console.error(`Error executing vswhere: ${error.message}`);
            return null;
        }
    }

    concatCorrectPath(installationPath: string): string {
        const major = (Number)(this.version.split('.')[0]);

        if (major >= 16) {
            return this.concatV16AndAbove(installationPath, this.version);
        } else if (major >= 12 && major <= 15) {
            return this.concatV15AndBelow(installationPath, this.version);
        }
        
        return this.concatPreV12(this.version);
    }

    concatPreV12(version: string): string {
        let toolVersion = MSBUILD_VERSIONS[version];
        const framework = this.buildIs64Bit ? 'Framework64' : 'Framework';
        return path.join(this.windir, 'Microsoft.Net', framework, toolVersion, 'MSBuild.exe');
    }

    concatV15AndBelow(installationPath: string, version: string): string {
        return path.join(installationPath, 'MSBuild', version, 'Bin', this.getx64_dir(), 'MSBuild.exe');
    }

    concatV16AndAbove(installationPath: string, version: string): string {
        if (!installationPath.includes(MSBUILD_VERSIONS[version]))
            return '';

        return path.join(installationPath, 'MSBuild', 'Current', 'Bin', this.getx64_dir(), 'MSBuild.exe');
    }

    getInstalledVersion(installationPaths: string[]): string | null {
        let installedPath: string | null = null;

        for (let i = 0; i < installationPaths.length; i++) {
            const installationPath = installationPaths[i];

            if (installationPath == '')
                continue;
            
            if (fs.existsSync(installationPath)) {
              installedPath = installationPath;
              break;
            }
          }

        return installedPath;
    }

    getLatestAvailableVersion(): (string | null)[] | null {
        let installationPaths: string[] =  [];
        let versions: string[] = [];

        for(const key in MSBUILD_VERSIONS)
        {
            this.version = key;
            const installationPath = this.findVersion();

            if (installationPath != null)
            {
                if (installationPath[0] != null) {
                    installationPaths.push(installationPath[0]);
                    versions.push(key)
                }
            }
        }

        if (installationPaths.length === 0)
            return null;

        return [
            installationPaths[installationPaths.length -1],
            versions[versions.length -1]
        ];
    }

    getx64_dir() {
        return this.buildIs64Bit ? 'amd64' : '';
    }
}