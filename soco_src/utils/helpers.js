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

    deepCopy: function(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        return JSON.parse(JSON.stringify(obj));
    }
};
this.helpers = helpers;