const argv = require('minimist')(process.argv.slice(2));
const { min, max } = require('lodash');
const { TestReport, Test, Suite } = require('mochawesome-report-generator/bin/types.js');
const f = require('./lib/files.js');
const mUtils = require('./lib/mocha-utils.js');


function mergeMochaJsonReports(mainFile,secondFile,outputFile){
    // read files as structure
    const mainReport=JSON.parse( f.readFile(mainFile));
    const secondReport=JSON.parse( f.readFile(secondFile));

    let filenameKey = (suite) => {
        if(suite && suite.fullFile && suite.fullFile.trim().length > 0){
            return suite.fullFile.replace(/^.*[\\\/]/, '');
        }
        return null;
    };

    let sMap=new Map();
    mUtils.getSuiteMap(secondReport.results,sMap,filenameKey);

    console.log("number of suites mapped:"+sMap.size);

    let replaceSuite = (suiteArray,index,currentSuite) => {
        let key=filenameKey(currentSuite);
        if(sMap.has(key)){
            console.log("Key Matched:"+key);
            suiteArray[index]=sMap.get(key);
        }
    }

    let isNotReplaced = (suiteArray,index,oldSuite) => {
        let key=filenameKey(suite)
        // if the suite has been replaced, then IDs must differ
        let sameObject = suiteArray[i].uuid === oldSuite.uuid;
        console.log(sameObject);
        return sameObject;
    }

    let removeFromMap = (suiteArray,index,oldSuite) => {
        let key = filenameKey(oldSuite);
        sMap.delete(key);
    }

    mUtils.traverseSuites(mainReport.results,replaceSuite,isNotReplaced,removeFromMap);

    //console.log("number of suites left in map:"+sMap.size);

    // Merge left over suites to results (as Top level suites)
    let topLevelSuites=mainReport.results && mainReport.results.length >0?
            mainReport.results[0].suites:[];
    sMap.forEach((newSuite,key,map) => {
        topLevelSuites.push(newSuite);
    });

    //Calculate & Update statistics in the main report
    let stats=mUtils.getBasicStats(mainReport.results);

    stats.start =  min ([mainReport.stats.start,secondReport.stats.start]);
    stats.end = max ([mainReport.stats.end,secondReport.stats.end]) ;

    console.log(stats);
    mainReport.stats=stats;
    f.writeFile(outputFile, JSON.stringify( mainReport));
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

