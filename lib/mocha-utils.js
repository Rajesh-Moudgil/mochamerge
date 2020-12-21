const { TestReport, Test, Suite } = require('mochawesome-report-generator/bin/types.js');
const f = require('./files.js');

function getSuiteMap(suites, map, keyFunc) {
    if (!(suites && suites.length)) {
        return;
    }
    suites.forEach(suite => {
        let key = keyFunc(suite);
        if (key)
            map.set(key, suite);
        this.getSuiteMap(suite.suites, map, keyFunc);
    });
};

let traverseSuites = (suites, pre, isDiveDeep, post) => {
    if (!(suites && suites.length)) {
        return;
    }
    suites.forEach((suite, i) => {
        if (pre && pre instanceof Function) {
            pre(suites, i, suite);
        }

        if (isDiveDeep && isDiveDeep instanceof Function) {
            traverseSuites(suite.suites, pre, isDiveDeep, post);
        }

        if (post && post instanceof Function) {
            post(suites, i, suite);
        }

    });
}

let newStats = () => {
    return {
        suites: 0,
        tests: 0,
        passes: 0,
        pending: 0,
        failures: 0,
        start: null,
        end: null,
        duration: 0,
        testsRegistered: 0,
        passPercent: 0,
        pendingPercent: 0,
        other: 0,
        hasOther: false,
        skipped: 0,
        hasSkipped: false
    };
};

let captureSuiteStats = (suite, accStats) => {
    if (!(suite)) {
        return;
    }
    if ((!accStats) || suite.root) {
        return;     //no place to accumulate stats or its a root suite, no further processing required.
    }
    accStats.suites++;
    accStats.testsRegistered += suite.tests ? suite.tests.length : 0;
    accStats.passes += suite.passes ? suite.passes.length : 0;
    accStats.pending += suite.pending ? suite.pending.length : 0;
    accStats.failures += suite.failures ? suite.failures.length : 0;
    accStats.skipped += suite.skipped ? suite.skipped.length : 0;

    suite.beforeHooks.concat(suite.afterHooks, suite.tests).forEach(test => {
        accStats.duration += test.duration;
    });
};

let calculateStats = (stats) => {
    stats.tests = stats.testsRegistered - stats.skipped;
    stats.other = stats.passes + stats.failures + stats.pending - stats.tests;
    stats.hasOther = stats.other > 0;
    stats.hasSkipped = stats.skipped > 0;
    stats.passPercent = Math.round(stats.passes / (stats.testsRegistered - stats.pending) * 1000) / 10;
    stats.pendingPercent = Math.round(stats.pending / stats.testsRegistered * 1000) / 10;
}

let getBasicStats = (suites) => {
    let accStats = newStats();
    traverseSuites(suites, (sts, i, s) => {
        captureSuiteStats(s, accStats);
    }, () => true, null);
    calculateStats(accStats);

    return accStats;
};

let getReportFromFile = (mainFile) => {
    return JSON.parse(f.readFile(mainFile));
};

let hasSuiteFailures = (s) => {
    if ((!s) || s.root) {
        return false;
    }
    return s.failures.length > 0;
};
let hasSuiteSkipped = (s) => {
    if ((!s) || s.root) {
        return false;
    }
    return s.skipped.length > 0;
};

module.exports = {

    getSuiteMap: getSuiteMap,
    traverseSuites: traverseSuites,
    newStats: newStats,
    getBasicStats: getBasicStats,
    getReportFromFile: getReportFromFile,
    hasSuiteFailures: hasSuiteFailures,
    hasSuiteSkipped: hasSuiteSkipped
};

