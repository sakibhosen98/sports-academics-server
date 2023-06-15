const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1w56ggc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    const classesCollection = client.db("academiesDB").collection("classes");
    const myClassesCollection = client.db("academiesDB").collection("myClasses");
    const usersCollection = client.db("academiesDB").collection("users");

    // console.log(process.env.ACCESS_TOKEN_SECRET)

    // jwt
    app.post('/jwt', (req, res) => {
      const user = req.body;
      console.log(user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})

      res.send({token})
    })

    // verify Admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }

    // users related apis
    app.get('/users', async(req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    })


    // find user roll by email api
    app.get('/users/admin/:email', async(req, res) => {
      const email = req.params.email;
      const query = {email: email}
      // console.log(query);
      const user = await usersCollection.findOne(query)
      if(user){
        const role  = user.role;
        const isAdmin = role === 'admin';
        const isInstructor = role === 'instructor';
        const isUser = role === 'user';
      }
      // console.log('admin user', user)
      res.send(user)
    })


    app.post('/users', async(req, res) => {
      const user = req.body;
      console.log(user)
      const query = {email: user.email}
      const existingUser = await usersCollection.findOne(query);
      console.log('existingUser', existingUser)
      if(existingUser){
        return res.send({message: 'user already exists'})
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })

    // manage classes peanding, approve, deny
    app.patch('/classes/approved/:id', async (req, res) => {
      const id = req.params.id;
      console.log('id',id)
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          roles: 'approved'
        },
      };

      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result);

    })
    // manage classes deny method
    app.patch('/classes/deny/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          roles: 'deny'
        },
      };

      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    // make admin
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    // make instructor
    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'instructor'
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

      // delete users
      app.delete('/users/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await usersCollection.deleteOne(query);
        res.send(result);
      })

    // instructions data post method
    app.post('/classes', async(req, res) => {
      const instructor = req.body;
      console.log(instructor);
      const result = await classesCollection.insertOne(instructor);
      res.send(result);
    })


    // classes data get method
    app.get('/classes', async(req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    })

    app.get('/classes/:id', async(req, res) => {
      const id = req.params.id;
      const query = { _id: new Object(id)}
      const result = await classesCollection.findOne(query);
      res.send(result)
    })


    // myClass
    app.post('/myClasses', async(req, res) => {
      const instructor = req.body;
      console.log(instructor);
      const result = await myClassesCollection.insertOne(instructor);
      res.send(result);
    })


    // classes get method
    app.get('/myClasses', async(req, res) => {
      const result = await myClassesCollection.find().toArray();
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('academies is runnig')
})


app.listen(port, () => {
  console.log(`academies is runnig on port: ${port}`)
})