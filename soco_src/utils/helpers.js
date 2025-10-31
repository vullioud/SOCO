var helpers = {
    calculate_std_dev: function(arr) {
        if (!arr || arr.length < 2) {
            return 0;
        }
        const n = arr.length;
        const mean = arr.reduce((a, b) => a + b) / n;
        const variance = arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n;
        return Math.sqrt(variance);
    },

        /**
     * Creates a deep copy of a JSON-compatible object.
     * This is crucial for giving each agent its own mutable copy of configurations.
     * @param {object} obj The object to copy.
     * @returns {object} A new object that is a deep copy of the original.
     */
    deepCopy: function(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        // A simple and effective way to deep copy JSON-like objects.
        return JSON.parse(JSON.stringify(obj));
    }
};
this.helpers = helpers;