const express = require('express')
var auth = require('../auth')
const router = express()
const {
    User
} = require('../../db/index')

/**
 * Get request to get profile information of particular user
 */
router.get('/:username', auth.optional, async (req, res,next) => {
    console.log('--- in get profile----')
    // fetch profile using username 
    const profile = await User.findOne({
        where: {
            username: req.params.username
        }
    }).catch(next)
    return res.json({
        user: profile.toProfileJSONFor()
    });
  });

module.exports = router