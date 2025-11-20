import { ArchitectureService } from '../src/utilities/ArchitectureService';

describe('ArchitectureService', () => {
    describe('static properties', () => {
        it('should have Architecture property', () => {
            expect(ArchitectureService.Architecture).toBeDefined();
            expect(typeof ArchitectureService.Architecture).toBe('string');
        });

        it('should have Platform property', () => {
            expect(ArchitectureService.Platform).toBeDefined();
            expect(typeof ArchitectureService.Platform).toBe('string');
        });

        it('should return valid architecture values', () => {
            const validArchitectures = ['x86', 'x64', 'arm', 'arm64', 'ia32'];
            expect(validArchitectures).toContain(ArchitectureService.Architecture);
        });

        it('should return valid platform values', () => {
            const validPlatforms = ['win32', 'linux', 'darwin', 'aix', 'freebsd', 'openbsd', 'sunos'];
            expect(validPlatforms).toContain(ArchitectureService.Platform);
        });
    });
});
