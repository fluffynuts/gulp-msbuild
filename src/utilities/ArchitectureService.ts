import * as os from 'os';

export class ArchitectureService {
    public static Platform = os.platform();

    public static Architecture = os.arch();
}