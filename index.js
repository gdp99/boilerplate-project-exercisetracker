const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  }
).catch(error => console.error(error));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  }
})

let users = mongoose.model('users', userSchema)

let exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
})

let exercises = mongoose.model('exercise', exerciseSchema)

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req,res)=>{
  const name = req.body.username;
  const user = new users({
    username: name,
  })
  user.save()
  res.json(user)
})

app.get('/api/users', (req,res)=>{
  users.find({}, (err, list)=>{
    if(!err){
      if(list.length!=0){
        res.json(list)
      }
    }
  })

})

app.post('/api/users/:_id/exercises', (req, res)=>{
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date;
  const id = req.params._id;
  users.findOne({_id: id},(err,user)=>{
    const exercise = new exercises({
      userId: id,
      description: description,
      date: date ? new Date(date).toDateString() : new Date().toDateString(),
      duration: parseInt(duration),
    })
    exercise.save()
    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      date: new Date(exercise.date).toDateString(),
      duration: parseInt(exercise.duration)
    })
  })
})


app.get('/api/users/:_id/logs', async (req, res)=>{
  const id = req.params._id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;
  const user = await users.findOne({_id: id})
  if(user)
  {
    const username = user.username;
    let query = exercises.find({
      userId: id
    });
    
    let dateFilter = {};
    if(from) {
      dateFilter.date = { ...dateFilter.date, $gte: new Date(from) };
    }
    if(to) {
      dateFilter.date = { ...dateFilter.date, $lte: new Date(to) };
    }
    if(Object.keys(dateFilter).length > 0) {
      query = query.find(dateFilter);
    }
    
    if(limit) {
      query = query.limit(Number(limit));
    }
    
    let list = await query;
    list = list.map((exercise)=>{
      return ({
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      })
    })
    const output = {
      username: username,
      count: list.length,
      _id: id,
      log: list
    }
    res.json(output)
  }
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
