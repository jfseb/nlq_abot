# nlq_abot [![Build Status](https://travis-ci.org/jfseb/nlq_abot.svg?branch=master)](https://travis-ci.org/jfseb/mgnlq_abot) [![Coverage Status](https://coveralls.io/repos/github/jfseb/mgnlq_abot/badge.svg)](https://coveralls.io/github/jfseb/nlq_abot)


query bot for mongo database



```javascript
npm install


gulp test
```


# run


```javascript
node smartbot.js
```

This will attempt to connect to mongodatabase
testdb on the default port



# Development

Where is what ?

mgnlq_er
mgnlq_parser1




# Deployment


In an actual setup or test run, the following environment variables
must be supplied:

- DATABASE_URL must point to a postgresSQL Database (user management, recording)
                     default to:  var pglocalurl = "postgres://xx:pwpwpwp@localhost:5432/abot";

- SET ABOT_DBNOSSL=true to not use SSL when connecting to Database URL



- var envModelPath = process.env["ABOT_MODELPATH"] || "node_modules/mgnlq_testmodel/testmodel"; (mgnlq_model)


# Test execution

> to record test data, set MGNLQ_TESTMODEL_REPLAY=RECORD

# running the bot / picking a db

the bot runs against "testdb" per default,

to change this one must either remove the cache in smbmodel\_cache.js.zp and/or set
 SET MQNLQ_MODEL_NO_FILECACHE=true
Then one may set ABOT_MONGODB=testdb2  to switch to an alternate db.

the cache is recreated on the first run.



# Regression tests

per default the regression test runs against mock db files!


 example: run against testmodel2  ( constants are in mgnlq_testmodel2)

to run against true db:
 SET MQNLQ_MODEL_NO_FILECACHE=true
 SET ABOT_MONGODB=testdb2
 SET MGNLQ_TESTMODEL2_REPLAY=RECORD


beware, recently changed behaviour to let modelnames and collection names be plural

# A quick mongo guide

locate mongo on your system, e.g.
```
>mongo

show dbs

use test2db

show collections

db.metamodels.find({modelname: 'iupacs'});

db.collections.find()

```


-> testdb2 : Too large keys to index ( WiredTiger ) ?

list all sample questions


#
- proper ordering for "numberic" columns

list all sender with gründungsjahr smaller than 1972

# discriminate    (less than number <coundcat> from )     (cat less than numberic)


# introduce comparison operators

  smaller than,  larger than

# date columns   before after

