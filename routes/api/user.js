const express = require('express')
const sequelize = require('sequelize')
const jwt = require('jsonwebtoken')
var auth = require('../auth')
var op = sequelize.Op

const {
    User
} = require('../../db/index')

const router = express()

/**
 * Get Request to fetch information of the current user logged in
 */
router.get('/user', auth.required, async (req, res,next) => {
    // fetching current user logged in
    const currentUser = await User.findOne({
        where: {
            id: req.payload.id
        }
    })
    // if user not logged in return
    if(!currentUser){
        return res.sendStatus(401);
    }
    return res.json({user: currentUser.toAuthJSON()});
})

/**
 * Put request to update information of the current user logged in
 */
router.put('/user', auth.required, async (req, res,next) => {
     // fetching current user logged in
    const currentUser = await User.findOne({
        where: {
            id: req.payload.id
        }
    }).catch(next)
    // if user not logged in return
    if(!currentUser){
        return res.sendStatus(401);
    } else {
  
      if(req.body.username !== undefined){
        currentUser.username = req.body.username;
      }
      if(req.body.email !== undefined){
        currentUser.email = req.body.email;
      }
      if(req.body.bio !== undefined){
        currentUser.bio = req.body.bio;
      }
      if(req.body.image !== undefined){
        currentUser.image = req.body.image;
      }
      if(req.body.password !== undefined){
        currentUser.password= req.body.password;
      }
      currentUser.save().then((result) => {
        console.log(result)
        return res.json({
            user: currentUser.toAuthJSON()
        });

    }).catch(next);
    
  }});

/**
 * post request to register new user
 */
router.post('/users', async (req, res,next) => {
    console.log("new user entering")
    //create new user
    var user = User.build({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    })
    user.save().then((result) => {
        return res.json({
            user: user.toAuthJSON()
        });
        
    }).catch(next);
})

/**
 * post request for logging in
 */
router.post('/users/login', async (req, res) => {
    if(!req.body.email){
        return res.status(422).json({
            errors: {
                email: "can't be blank"
            }
        })
    }
    if(!req.body.password){
        return res.status(422).json({
            errors: {
                password: "can't be blank"
            }
        })
    }
    console.log("login user entering")
    const userData = req.body
    let whereClause =[] // for builing where clause
    whereClause.push({
        email: userData.email
    })
    whereClause.push({
        password: userData.password
    })
    console.log(whereClause)
    const user = await User.findOne({
       where: {
           [op.and]: whereClause
        }
    })
    if (!user) {
        return res.status(422).json({
            errors: {
                'email or password': 'is invalid'
            }
        })
    } else {
        return res.status(200).json({
            user: user.toAuthJSON()
        });
    }
       
})


module.exports = router