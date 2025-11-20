import vinyl from 'vinyl'

const gutil: {
    File: typeof vinyl
} = {
    // this really only exists to facilitate existing tests
    File: vinyl
};

export default gutil; 