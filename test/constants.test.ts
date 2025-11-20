import { MSBUILD_VERSIONS } from '../src/msbuild/constants';

describe('MSBUILD_VERSIONS constants', () => {
    it('should export MSBUILD_VERSIONS object', () => {
        expect(MSBUILD_VERSIONS).toBeDefined();
        expect(typeof MSBUILD_VERSIONS).toBe('object');
    });

    it('should contain legacy .NET Framework versions (1.0 - 4.0)', () => {
        expect(MSBUILD_VERSIONS['1.0']).toBe('v1.0.3705');
        expect(MSBUILD_VERSIONS['1.1']).toBe('v1.1.4322');
        expect(MSBUILD_VERSIONS['2.0']).toBe('v2.0.50727');
        expect(MSBUILD_VERSIONS['3.5']).toBe('v3.5');
        expect(MSBUILD_VERSIONS['4.0']).toBe('v4.0.30319');
    });

    it('should contain Visual Studio 2013-2017 versions (12.0 - 15.0)', () => {
        expect(MSBUILD_VERSIONS['12.0']).toBe('12.0');
        expect(MSBUILD_VERSIONS['14.0']).toBe('14.0');
        expect(MSBUILD_VERSIONS['15.0']).toBe('15.0');
    });

    it('should contain Visual Studio 2019-2022 versions (16.0 - 17.0)', () => {
        expect(MSBUILD_VERSIONS['16.0']).toBe('2019');
        expect(MSBUILD_VERSIONS['17.0']).toBe('2022');
    });

    it('should contain Visual Studio future versions (18.0)', () => {
        expect(MSBUILD_VERSIONS['18.0']).toBe('18');
    });

    it('should have all expected version keys', () => {
        const expectedVersions = [
            '1.0', '1.1', '2.0', '3.5', '4.0',
            '12.0', '14.0', '15.0',
            '16.0', '17.0', '18.0'
        ];

        const keys = Object.keys(MSBUILD_VERSIONS);
        expectedVersions.forEach(version => {
            expect(keys).toContain(version);
        });
    });

    it('should have at least the expected number of version entries', () => {
        const keys = Object.keys(MSBUILD_VERSIONS);
        expect(keys.length).toBe(11);
    });
});
