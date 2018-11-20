const express = require('express')
var auth = require('../auth')
const router = express()
const {
    Tag
} = require('../../db/index')
/**
 * Get request to fetch all the tag names 
 */
router.get('/', auth.optional, async (req, res,next) => {
    console.log('--- in get tags----')
    const tags = await Tag.findAll({attributes: ['name']}).catch(next)
    let tagsArray = []
    for(tag in tags){
        tagsArray.push(tags[tag].name)
    }
    return res.json({
        tags: tagsArray
    });
  });
module.exports = router