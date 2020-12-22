
module.exports = {

    isValidCommand: (argv) => {
        let extractTypes = ['failed', 'skipped'];
        let errMsg = '';
        if (argv._ && argv._.length > 0 && argv._.length < 3) {
            if ((argv._.length === 1)
                && extractTypes.includes(argv.e)
                && argv.o) {

                return true;
            } else if (argv._.length === 2) {
                return true;
            } else {
                errMsg = "Invalid or insufficient options... ";
            }
            throw new Error(errMsg);
        } else {
            throw new Error("Invalid command arguments...");
        }
    },
    getUsageMessage : () => {
        return ` 
        USAGE:
            Extract failed or skipped test suites to another directory:
                mochamerge <input json filename> -e <failed | skipped> -o <output dir>
            Merge 2 reports
                mochamerge <main json report> <second json report> [-o <output filename>]
        `;
    },
    getOperation: (argv) => {
        let cmd={operation:null, options:[]};
        if(argv._.length == 2){
            cmd.operation = 'merge';
            cmd.options['mainFile'] = argv._[0];
            cmd.options['secondFile'] = argv._[1];
            cmd.options['outputFile'] = argv.o ? argv.o : argv._[0];
            return cmd;
        }
        if(argv._.length == 1){
            cmd.operation = 'extract';
            cmd.options['file'] = argv._[0];
            cmd.options['type'] = argv.e;
            cmd.options['outputDir'] = argv.o;
            return cmd;
        }
        throw new Error("Internal Error... Unable to created Operation.");
    }
};