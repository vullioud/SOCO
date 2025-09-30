/**
 * Helper utilities for the SoCoABE model.
 */
class Helpers {
    static calculateSatisfaction(preferences, beliefs) {
        if (preferences.length !== beliefs.length) {
            throw new Error('Preferences and beliefs arrays must have the same length.');
        }
        let satisfactionByES = []; 
        let totalSatisfaction = 0;
        let weightSum = 0;
        for (let i = 0; i < preferences.length; i++) {
            const weight = preferences[i];
            const belief = beliefs[i];
            const beliefMean = belief.alpha / (belief.alpha + belief.beta);
            const satisfaction = 1 - Math.abs(weight - beliefMean);
            satisfactionByES.push(satisfaction); 
            totalSatisfaction += weight * satisfaction;
            weightSum += weight;
        }
        return {
            overallSatisfaction: weightSum > 0 ? totalSatisfaction / weightSum : 0,
            satisfactionByES: satisfactionByES
        };
    }

    static calculateSwitchProbability(satisfaction, precision, inertia = 0.5, steepness = 2.0) {
        const dissatisfactionScore = (1 - satisfaction) * precision;
        return 1 / (1 + Math.exp(-steepness * (dissatisfactionScore - inertia)));
    }

    static softmax(values, temperature = 1.0) {
        const maxVal = Math.max(...values);
        const exp_values = values.map(v => Math.exp((v - maxVal) / temperature));
        const sum_exp = exp_values.reduce((a, b) => a + b, 0);
        return exp_values.map(v => v / sum_exp);
    }

    static assignStandsToAgents(standIds, numAgents, method = 'equal') {
        const assignments = Array(numAgents).fill(0).map(() => []);
        switch (method) {
            case 'equal':
                standIds.forEach((standId, index) => assignments[index % numAgents].push(standId));
                break;
            case 'random':
                standIds.forEach(standId => assignments[Math.floor(Math.random() * numAgents)].push(standId));
                break;
            default:
                throw new Error(`Unknown stand assignment method: ${method}`);
        }
        return assignments;
    }
    
    static normalizeVector(vector) {
        const sum = vector.reduce((a, b) => a + b, 0);
        return sum === 0 ? vector : vector.map(v => v / sum);
    }

    static calculateStdDev(arr) {
        if (!arr || arr.length < 2) {
            return 0;
        }
        const n = arr.length;
        const mean = arr.reduce(function(a, b) { return a + b; }) / n;
        const variance = arr.map(function(x) { return Math.pow(x - mean, 2); }).reduce(function(a, b) { return a + b; }) / n;
        return Math.sqrt(variance);
    }
}


// Universal Module Definition
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Helpers;
} else {
    this.Helpers = Helpers;
}