const Sequelize = require('sequelize')
var jwt = require('jsonwebtoken');
var slug = require('slug')
const {  user } = require('./models/userModel')
const { comment } = require('./models/Comment')
const { article } = require('./models/Article')
const { tag } = require('./models/Tag')

const db = new Sequelize({
  dialect: 'sqlite',
  storage: __dirname + '/store.db'
})

const User = db.define('User', user)
const Comment = db.define('Comment', comment)
const Tag = db.define('Tag', tag)
const Article = db.define('Article', article , {
  validate: {
    validateSlug() {
        this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36)
      
    }
  }
} )
/**
 * Mapping model for Article and Tags
 */
const ArticleTags = db.define('ArticleTag',{})

/**
 * Declaring Associations
 */
Article.belongsTo(User )
User.hasMany(Article)

Comment.belongsTo(Article)
Article.hasMany(Comment)

Article.belongsToMany(Tag , { through: ArticleTags })
Tag.belongsToMany(Article , { through: ArticleTags })

Comment.belongsTo(User)
User.hasMany(Comment)

/**
 * Defining Prototypes of all the models
 */

/**
 * prototype to generate json web token for the user
 */
User.prototype.setJWT = function() {
  console.log('setting JWT')
  var today = new Date();
  var exp = new Date(today); 
  exp.setDate(today.getDate() + 60); 

  return jwt.sign({
    id: this.id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000), // setting expiry date for the token
  }, 'secretKey');
}

/**
 * To return the user information in json format
 * return type -> json
 */
User.prototype.toAuthJSON = function () {
  return {
    username: this.username,
    email: this.email,
    token: this.setJWT(),
    bio: this.bio,
    image: this.image
  };
}

/**
 * To return the user's profile in json format
 * Parameters -> user -> user obeject
 * return type -> json
 */
User.prototype.toProfileJSONFor = function (user) {
  return {
    username: this.username,
    bio: this.bio,
    image: this.image || 'https://static.productionready.io/images/smiley-cyrus.jpg'
  };
}

/**
 * To return comment information in json format
 * Parameters -> user -> author of the comment
 * return type -> json
 */
Comment.prototype.toJSONFor = function(user) {
  return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      body: this.body,
      author: user.toProfileJSONFor(user)
    }
}

/**
 * To return Article's information in json format
 * Parameter -> user - Author of article
 *              tagInserted - tags of the article
 * return type -> json
 */
Article.prototype.toAuthJSON = function(user,tagInserted) {
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    tagList: tagInserted,
    author: user.toProfileJSONFor(user)
    }
}
// exporting all modules
module.exports = {
  db,
  User,
  Comment,
  Article,
  Tag
}