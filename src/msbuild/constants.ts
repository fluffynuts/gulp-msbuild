export const MSBUILD_VERSIONS: { [key: string]: string } = {
    // If installed will be inside the win directory
    '1.0': 'v1.0.3705',
    '1.1': 'v1.1.4322',
    '2.0': 'v2.0.50727',
    '3.5': 'v3.5',
    '4.0': 'v4.0.30319',

    // As of version 12 the program will be located inside Program Files (x86) with the tool version set as the version
    '12.0': '12.0',
    '14.0': '14.0',
    '15.0': '15.0',

    // As of version 16 the tool version is current therefore to differentiate between the version we check for the year directory instead
    '16.0': '2019',
    '17.0': '2022',

    // As of version 18 the program will be located inside Program Files\Microsoft Visual Studio with the tool version set as the version
    '18.0': '18'
};
