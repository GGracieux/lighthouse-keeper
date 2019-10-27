const fs = require('fs');
const QueueManager = require('./QueueManager.js')
const Lighthouse = require('./Lighthouse.js')
const mkdirp = require('mkdirp');

class Runner {

    //--- Initialisation ------------------------------
    constructor() {
        this.qm = new QueueManager()
        this.lighthouse = new Lighthouse()
        this.qm.emptyQueue()
        this.qm.startEnqueuer()
    }

    //--- Runs a lighthouse test ------------------------------
    runQueue() {

        let jobs = this.qm.getJobIdsToRun()
        if (jobs.length > 0) {
          
            this.lighthouse.runJob(jobs[0]).then(
                result => {
    
                    // Process job result
                    this.handleJobResult(result)
    
                    // Launch next job
                    this.runQueue()
                
                },
                err => {
                    let action = 'Error'
                    logger.error('Job ' + err.jobId  + ' - ' +  action.padEnd(10,' ') + ' : ' + err.conf.url)
                    logger.error(JSON.stringify(err))
                }
            )
        } else {
            logger.info('No test in queue, wainting ...')
            setTimeout(this.runQueue.bind(this), 3000); // 60000
        }
    }

    //--- Process lighthouse job results ------------------------------
    handleJobResult(jobResult) {

        let action = 'Extracting';
        logger.info('Job ' + jobResult.jobId + ' - ' + action.padEnd(10,' ') +  ' : ' + jobResult.conf.url)

        // reads report.json
        let reportPath = __dirname + '/../data/tmp/' + jobResult.jobId + '.report'
        let report = JSON.parse(fs.readFileSync(reportPath + '.json', 'utf8'));

        // extracting data
        let line = jobResult.jobId
        global.conf.logs["report-fields"].forEach(key => {
            let keyparts = key.split('.')
            let item = report
            var BreakException = {};
            try {
                keyparts.forEach(keypart => {
                    if (item.hasOwnProperty(keypart)) {
                        item = item[keypart]
                    } else {
                        throw "not found property";
                    }
                })
            } catch(e) {
                item = ''
            }
            line += ";" + item
        })
        console.log(line)

        // writing result to log
        fs.appendFile(__dirname + '/../data/logs/results.log', line+"\n", function(err) {
            if(err) {
                return console.log(err);
            }
        });

        // Creating directory structure for report storage
        let d = new Date()
        let datePart = d.getFullYear() + '/' + d.getMonth().toString().padStart(2,0) + '/' + d.getDay().toString().padStart(2,0)
        let archiveDir = __dirname + '/../data/reports/' + datePart + '/'
        mkdirp.sync(archiveDir)

        // Moving reports
        global.conf["reports"]["formats"].forEach(format => {
            fs.renameSync(reportPath + '.' + format, archiveDir + jobResult.jobId + '.report.' + format)
        });

        // Removing json report
        if (!global.conf["reports"]["formats"].includes('json')) {
            fs.unlinkSync(reportPath + '.json')
        }

        // Deleting .run file
        let runFilePath = __dirname + '/../data/tmp/' + jobResult.jobId + '.run.json'
        fs.unlinkSync(runFilePath)

        // Log
        action = 'End'
        logger.info('Job ' + jobResult.jobId  + ' - ' +  action.padEnd(10,' ') + ' : ' + jobResult.conf.url)
    }

}

module.exports = Runner