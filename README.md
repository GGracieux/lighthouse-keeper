# Lightkeeper - Lighthouse orchestrator

Lightkeeper is a simple lighthouse job orchestrator made with nodejs.

## Usage

### Launch with CLI

### Prerequisites

- Install Chrome or Chromium
- Install Lighthouse
```bash
npm install -g lighthouse
```

### Execution
    
```bash
./lighthouse-keeper \
    --config-dir /your/config/dir \
    --data-dir /your/result/dir
```
Arguments : 
- config-dir : Directory containing your config files. Default config files from this package are located under /conf. See below for configuration details.
- data-dir : Directory for result storage, will be created if it does not exists. See below for results details.

### Launch with Docker

### Prerequisites

- clone [lighthouse-orchestrator](https://github.com/GGracieux/lighthouse-orchestrator) repository
```bash
git clone git@github.com:GGracieux/lighthouse-orchestrator.git
```
- build dockerfile
```bash
docker build -t lightkeeper .
```

### Execution
    
- Create a docker-compose.yml specifying config-dir and data-dir folders (see below for configuration and results details). For example :
```yml
version: '3.2'
services:
  lightkeeper:
    image: lightkeeper
    volumes:
      - /tmp/conf:/lightkeeper/conf:rw
      - /tmp/data:/lightkeeper/data:rw
    ports:
      - 8086:80
```


- Launch 
```bash
docker-compose up
```

## Configuration

All configuration files must be located under the config-dir passed as command argument.  
For a quick start, you can copy the default config files from this package (/conf folder).

### jobs.json
This file defines the jobs to run with lighthouse. Each job must specify the following properties : 
- url : the url to run
- profiles : the list of profiles to run the test with, see below for profile configuration
- cron : the frequency at wich test should be run. Notation is like cron with seconds granularity.

The config file below runs 
- https://www.google.com with mobile configuration every 10 minutes
- https://www.example.com with mobile and desktop configuration every hour
```json
{
    "jobs": [
        {
            "url":"https://www.google.com",
            "profiles":[ "mobile" ],
            "cron": "1 */10 * * * *"
        },
        {
            "url":"https://www.example.com",
            "profiles":[ "mobile", "desktop"],
            "cron": "1 1 */1 * * *"
        }
    ]
}
```

### lightkeeper.json
This file defines the general execution parameters of lighkeeper.
- reports.format : defines lighthouse report format
- logs : defines log reloated configuration
  - logs.params : if set to true, job configuration is written when writting job result
  - logs.fields : list of fields from lighthouse json report to writte as job resul
- webserver.enabled : enables/disables data publishing on webserver
- webserver.port : defines webserver port

Configuration example :
```json
{
    "reports":{
        "formats": ["html", "json", "csv"]
    },
    "logs":{
        "params":true,
        "fields":[
            "fetchTime",
            "requestedUrl",
            "audits.first-contentful-paint.numericValue",
            "audits.first-meaningful-paint.numericValue",
            "audits.speed-index.numericValue",
            "audits.first-cpu-idle.numericValue",
            "audits.interactive.numericValue",
            "audits.max-potential-fid.numericValue"
        ]
    },
    "webserver":{
        "enabled": true,
        "port": 80
    }
}
```
### profile.xxxxx.json
The profile.xxxxx.files are lighthouse configuration files. The xxxxx filename part defines the profile name which you can use in jobs.json.

You can add as many profile as you want based on [lighthouse configuration format](https://github.com/GoogleChrome/lighthouse/blob/HEAD/docs/configuration.md)

Lightkeeper comes with two default profiles, mobile and desktop, they are identical to [lr-desktop-config.js](https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/lr-desktop-config.js) and [lr-mobile-config.js](https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/lr-mobile-config.js)


## Results

Every data produced by lightkeeper is stored under the data-dir passed as command argument.

### /log/lightkeeper.log
This is the application log, it monitors job activity, and errors. 
Log example
```log
2019-10-27T10:29:01.723Z|info|No test in queue, wainting ...
2019-10-27T10:29:01.723Z|info|No test in queue, wainting ...
2019-10-27T10:30:01.021Z|info|Job 1572258601021-891 : Adding (mobile) https://www.google.com
2019-10-27T10:30:01.023Z|info|Job 1572258601023-594 : Adding (desktop) https://www.google.com
2019-10-27T10:30:01.724Z|info|Job 1572258601021-891 : Launching : (mobile) https://www.google.com
2019-10-27T10:30:11.971Z|info|Job 1572258601021-891 : Processing (mobile) https://www.google.com
2019-10-27T10:30:11.979Z|info|Job 1572258601021-891 : Ending (mobile) https://www.google.com
2019-10-27T10:30:11.979Z|info|Job 1572258601023-594 : Launching : (desktop) https://www.google.com
2019-10-27T10:30:21.926Z|info|Job 1572258601023-594 : Processing (desktop) https://www.google.com
2019-10-27T10:30:21.937Z|info|Job 1572258601023-594 : Ending (desktop) https://www.google.com
2019-10-27T10:30:41.355Z|info|No test in queue, wainting ...
2019-10-27T10:31:41.360Z|info|No test in queue, wainting ...
```
### /log/results.log
This is the results log, it logs results according to lightkeeper.json configuration file
Log example
```log
1572258601021-891;https://www.google.com;mobile;2019-10-27T10:30:01.021Z;2019-10-28T10:30:02.854Z;1139.849;1139.849;1196.1174340012133;3068.889;3260.899;218
1572258601023-594;https://www.google.com;desktop;2019-10-27T10:30:01.023Z;2019-10-28T10:30:13.085Z;308.812;319.812;423.8787076179145;592.44;673.316;58
```

### /reports
This folder contains a directory stucture as follow : /reports/YYYY/MM/DD/report-files.ext
directory listing example 
```bash
ls -l reports/2019/10/27/
1572258601021-891-mobile-https:www.google.com.csv
1572258601021-891-mobile-https:www.google.com.html
1572258601021-891-mobile-https:www.google.com.json
1572258601023-594-desktop-https:www.google.com.csv
1572258601023-594-desktop-https:www.google.com.html
1572258601023-594-desktop-https:www.google.com.json
```

### /tmp
This folder contains the job queue and lighthouse reports before they are moved to /data/reports