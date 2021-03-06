#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs');
const path = require('path');
const { min, max } = require('lodash');
const { TestReport, Test, Suite } = require('mochawesome-report-generator/bin/types.js');
const f = require('./lib/files.js');
const mUtils = require('./lib/mocha-utils.js');
const appUtils = require('./lib/app-utils.js');

try {
    if (appUtils.isValidCommand(argv)) {
        let cmd = appUtils.getOperation(argv);
        console.log(cmd);
        switch (cmd.operation) {
            case 'merge':
                mergeMochaJsonReports(cmd.options.mainFile,
                    cmd.options.secondFile,
                    cmd.options.outputFile);
                console.log('Merge completed successfully.');
                break;
            case 'extract':
                extractTestSuites(cmd.options.file,
                    cmd.options.type,
                    cmd.options.outputDir);
                console.log('Extract completed successfully.');
                break;

            default:
                showErrorUsage("Internal error.");
                process.exit(1);
                break;
        }
    } else {
        showErrorUsage('Invalid command.');
        process.exit(1);
    }
} catch (e) {
    console.error("Some internal problem caused a fatal error. " + e.message ? e.message : '');
}

// console.log(argv);
// let argsValidated = false;
// let error = null;

// if (argv._ && argv._.length > 0 && argv._.length < 3) {
//     argsValidated = argv._.length === 1 && argv.e && argv.o
//         && (argv.e === 'failed' || argv.e === 'skipped')
//         && (argv.o.length > 2);

//     if (!argsValidated) {
//         argsValidated = argv._.length === 2;
//     }

// }

// if (!argsValidated) {
//     showErrorUsage();
// } else {
//     // proceed if all is good
//     if (argv._.length === 1) {
//         extractTestSuites(argv._[0], argv.e, argv.o);
//     } else {
//         mergeMochaJsonReports(argv._[0], argv._[1], argv.o ? argv.o : argv._[0]);
//     }
// }

function showErrorUsage(errMsg) {
    console.error(errMsg + appUtils.getUsageMessage());
};



function extractTestSuites(filename, type, dir) {
    //verify dir exists or created
    if (!f.pathExists(dir)) {
        f.createDir(dir);
    }
    if (!f.isDir(dir)) {
        throw new Error("Output directory '" + dir + "' is not accessible or not a directory.");
    }

    let report = mUtils.getReportFromFile(filename);
    mUtils.traverseSuites(report.results, (sts, i, s) => {
        if ((type === 'failed' && mUtils.hasSuiteFailures(s))
            || (type === 'skipped' && mUtils.hasSuiteSkipped(s))) {
            let source = s.fullFile;
            let dest = path.join(dir, f.extractFilenname(source));
            fs.copyFileSync(source, dest);
            console.log("copy file:" + source + "  to:" + dest);
        }
    }, (sts, i, s) => {
        return (type === 'failed' && mUtils.hasSuiteFailures(s))
            || (type === 'skipped' && mUtils.hasSuiteSkipped(s))
    }
        , null);
};


function mergeMochaJsonReports(mainFile, secondFile, outputFile) {
    if (!outputFile) {
        outputFile = mainFile;
    }
    // read files as structure
    const mainReport = mUtils.getReportFromFile(mainFile);
    const secondReport = mUtils.getReportFromFile(secondFile);

    let filenameKey = (suite) => {
        if (suite && suite.fullFile && suite.fullFile.trim().length > 0) {
            return f.extractFilenname(suite.fullFile);
        }
        return null;
    };

    let sMap = new Map();
    mUtils.getSuiteMap(secondReport.results, sMap, filenameKey);

    console.log("number of suites mapped:" + sMap.size);

    let replaceSuite = (suiteArray, index, currentSuite) => {
        let key = filenameKey(currentSuite);
        if (sMap.has(key)) {
            console.log("Key Matched:" + key);
            suiteArray[index] = sMap.get(key);
        }
    }

    let isNotReplaced = (suiteArray, index, oldSuite) => {
        let key = filenameKey(suite)
        // if the suite has been replaced, then IDs must differ
        let sameObject = suiteArray[i].uuid === oldSuite.uuid;
        console.log(sameObject);
        return sameObject;
    }

    let removeFromMap = (suiteArray, index, oldSuite) => {
        let key = filenameKey(oldSuite);
        sMap.delete(key);
    }

    mUtils.traverseSuites(mainReport.results, replaceSuite, isNotReplaced, removeFromMap);

    //console.log("number of suites left in map:"+sMap.size);

    // Merge left over suites to results (as Top level suites)
    let topLevelSuites = mainReport.results && mainReport.results.length > 0 ?
        mainReport.results[0].suites : [];
    sMap.forEach((newSuite, key, map) => {
        topLevelSuites.push(newSuite);
    });

    //Calculate & Update statistics in the main report
    let stats = mUtils.getBasicStats(mainReport.results);

    stats.start = min([mainReport.stats.start, secondReport.stats.start]);
    stats.end = max([mainReport.stats.end, secondReport.stats.end]);

    console.log(stats);
    mainReport.stats = stats;
    f.writeFile(outputFile, JSON.stringify(mainReport, null, 4));
}

// let totalSuites=0;

// let suitesCounter =(suite) => {
//     if(suite){
//         totalsuites += suite.suites.length;
//     }
// };

// let traverseSuite = (suite,f) =>{
//     suite.suites.forEach( s => {
//         traverseSuite(s,f);
//     });
//     f();
// };

// testReport.results.forEach(s => {
//     traverseSuite(s,suitesCounter);
// });

// console.log("Suites:"+totalSuites);

// console.log("Passed:"+testReport.stats.passes);
// console.log("Failed:"+testReport.stats.failures);
// console.log("Skipped:"+testReport.stats.skipped);

// read each source file
// Replace tests from src file to dest file

//re-calculate stats

// write dest file

