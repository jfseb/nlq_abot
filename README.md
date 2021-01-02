# nlq_abot [![Build Status](https://travis-ci.org/jfseb/nlq_abot.svg?branch=master)](https://travis-ci.org/jfseb/nlq_abot) [![Coverage Status](https://coveralls.io/repos/github/jfseb/nlq_abot/badge.svg)](https://coveralls.io/github/jfseb/nlq_abot)


database free query bot. 

This project contains 

 1. the nlq bot. 
 2. two testmodels ( testmodel , testmodel2 ) 
 3. functionality to generate files required by wosap_app for 
    arbitrary models. 
    
    

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



# Generating model files 

 each model consists of two schema files and the data file
   xxxx.model.doc.json
   xxxx.model.mongooseschema.json
   xxxx.model.data.json

The following additional files are generated from this data via 

```
set NQL_ABOT_MODELPATH=...\testmodel 
npm run preparemodels

node --max-old-space-size=14000 preparemodel


```


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

the bot runs against "testmodel" per default,

to change this one must either remove the cache in smbmodel\_cache.js.zp and/or set
```
 SET NLQ_ABOT_MODELPATH=c:\.....\model`
 SET NLQ_ABOT_MODELPATH=c:/...../model`
```
(No trailing slash)


# model cache 
 SET NLQ_ABOT_NO_FILECACHE=true or manually delete the _cache.zip file to adjust to model changes. 
 the cache is recreated on the first run.


# whats new

- proper ordering for "numberic" columns

list all sender with gründungsjahr smaller than 1972

# discriminate    (less than number <coundcat> from )     (cat less than numberic)


# introduce comparison operators

  smaller than,  larger than

# date columns   before after


# Query behaviour on specific data aspects

The model now supports 
  1) multivalued members,
  2) non-stringy members


## undefined or empty 

The following are treated equivalently: 
```json 
{}  // property not prest
{ categoryA : undefined }
{ categoryA: null} 
{ categoryA: [] }  // for multivalues
```


## Multivalued members 

Multivalued members come in two flavours, simple multivalued and tuple 



### simple multivalued members vs tuple 

```json
{
  category0 : "Akey",
  categoryA : ["Val1","Val2"],
  categoryB : [1,2]
}
```

tupled member: 
```json
{
  category0 : "Akey",
  _category : [{ catA1 : "val1", catA2 : 1, catA3 :["AB","CD"]},
               { catA1 : "val2", catA2 : 2},
  ],
  categoryB : [1,2]
}
```

list all category0 where CatA1 val1 and catA2 2; 

list all category0, catA3 where CatA3 CD; 

This will *not* find Akey. 








### Behaviour on result processing: 

There are basically 3 options when 

```json
{
  category0 : "Akey",
  categoryA : ["Val1","Val2"],
  categoryB : [1,2]
}
```

 list all category0, categoryA, categoryB 

  1) Pick "first" representative value 
      ```
      "AKey" and "Val1" and 1
      ```

  2) Flatten lists
      ```
      "AKey" and "Val1","Val2" and 1,2
      ```
 
  3) expand cross product
      ```
      "AKey" and "Val1" and 1
      "AKey" and "Val1" and 2
      "AKey" and "Val2" and 1
      "AKey" and "Val2" and 2
      ```

With tuples, additional combinations either losing or retaining the correlation can be envisioned, e.g.
```
   "("val1",1,"AB"),("val1",1,"CD"),("val2",2)
```

```
"AKey" and "Val1" and 1 and "AB" and 1
"AKey" and "Val1" and 1 and "CD" and 1
"AKey" and "Val1" and 1 and "CD" and 2
"AKey" and "Val1" and 1 and "AB" and 2
"AKey" and "Val2" and 2 and undefined and 1
"AKey" and "Val2" and 2 and undefined and 2
```

Similar considerations can be made when generating the QBE table. 

  { category : PickFirst|Flatten|Expand }


Should the filter be used to eliminate 
  only whole records or member/tuples of the result? 

    List all AppKey, BusinessGroup with more than 3 BusinessGroup?
    => `Akey, ["A","B","C","D","E"]`

    List all AppKey, BusinessGroup with more than 3 BusinessGroup and BusinessGroup A? 
    => `Akey, "A"`

At which phase. 

Note ambiguities like. 
 
   on the input BusinessGroup : [ "GRPA_1", "GRPA_2", "GRP_B" ]

  List all AppKey with more than 2 BusinessGroup starting with 'GRPA'  (currently not supported)
  List all AppKey with more than 2 BusinessGroup and BusinessGroup starting with 'GRPA'
  List all AppKey with more than 2 BusinessGroup and BusinessGroup starting with 'GRPA'



### complex (tupled multivalued members)

```json 
{ categoryA : undefined }   <=> { categoryA: null} <=> { categoryA: [] };
```


The model now supports 
  1) multivalued members,
  2) non-stringy members

{


}