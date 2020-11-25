const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const admin = require('firebase-admin');




const serviceAccount = require("./volunteer-network-2ef49-firebase-adminsdk-vv17m-91fcbd43e7.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.99fbs.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());

const client = new MongoClient(uri, { useNewUrlParser: true,useUnifiedTopology: true });
client.connect(err => {
  const volunteerCollection = client.db("volunteer").collection("workList");
  const userCollection = client.db("volunteer").collection("registerList");

  app.post('/registerUser',(req,res)=>{
      const user = req.body;
      userCollection.insertOne(user)
        .then(result=>{
        console.log('Successfully registered in work.');
        res.send(result.insertedCount);
    })
  })
  //add work section
  app.post('/addWork', (req,res)=>{
    const file = req.files.file;
    const name = req.body.name;
    const description = req.body.description;
    const date = req.body.date;
     
    const newImg = file.data;
        const encImg = newImg.toString('base64');
        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };
    volunteerCollection.insertOne({name, date, description, image})
    .then(result => {
        res.send(result.insertedCount > 0)
    })
  })
//End
app.get('/totalWorkList', (req,res)=>{
    volunteerCollection.find({})
    .toArray((err,documents)=>{
        res.send(documents);
    })
})

app.get('/totalRegisterList', (req,res)=>{
    userCollection.find({})
    .toArray((err,documents)=>{
        res.send(documents);
    })
})

app.get('/register/:id', (req,res)=>{
    volunteerCollection.find({_id: ObjectId(req.params.id)})
    .toArray((err,documents)=>{
        res.send(documents[0]);
    })
})

app.get('/registerWorkList', (req,res)=>{
    const bearer = req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer ')){
        const idToken = bearer.split(' ')[1];

        admin.auth().verifyIdToken(idToken)
        .then(function(decodedToken) {
            const tokenEmail = decodedToken.email;
            const queryEmail = req.query.email;
            if(tokenEmail == queryEmail){
                userCollection.find({email: req.query.email})
                .toArray((err,documents)=>{
                    res.status(200).send(documents);
                })
            }
            // ...
        }).catch(function(error) {
          res.status(401).send('un-authorised access')
        });
    }
    else{
        res.status(401).send('un-authorised access')
      }
    


   
})

app.delete('/delete/:id', (req,res)=>{
    userCollection.deleteOne({_id: ObjectId(req.params.id)})
    .then(result=>{
        res.send(result.deletedCount>0);
        
    })
})



});


app.get('/', (req, res) => {
    res.send('Volunteer network server started...')
})


app.listen(process.env.PORT || port)