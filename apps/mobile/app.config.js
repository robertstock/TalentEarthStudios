module.exports = ({ config }) => {
    // Debugging: Log what Expo thinks the ID is before we touch it
    console.log("DEBUG: Original Bundle Identifier:", config.ios ? config.ios.bundleIdentifier : 'undefined');

    const newBundleId = "com.finleypro.mobile.v2";

    return {
        ...config,
        ios: {
            ...config.ios,
            // Forcefully overwrite it to a new unique ID
            bundleIdentifier: newBundleId,
        },
        android: {
            ...config.android,
            package: newBundleId,
        },
    };
};
