require('dotenv').config()
const mongoClient=require('mongodb').MongoClient;
const state={
    db:null
}

module.exports.connect=function(done){
    const url=process.env.database_url
    const dbname=process.env.database_name

    mongoClient.connect(url,(err,data)=>{
        
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })
    
}

module.exports.get=function(){
    return state.db
}