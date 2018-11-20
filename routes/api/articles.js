const express = require('express')
const sequelize = require('sequelize')
const slug = require('slug')
const op = sequelize.Op
const {
    Article,
    Comment,
    Tag,
    User
} = require('../../db/index')
var auth = require('../auth')
var intersection = require('array-intersection');
const router = express()

/**
 * Post request to create a new article
 */
router.post('/', auth.required, async (req, res, next) => {
    console.log("---------------------------new article---------------------")
    // Fetch current user logged in from the payload
    const currentUser = await User.findOne({
        where: {
            id: req.payload.id
        }
    }).catch((err) => {
        console.log(err)
    })
    //create new article using constructor
    var article = new Article()
    article.title = req.body.title
    article.description = req.body.description
    article.body = req.body.body
    article.UserId = currentUser.id

    let tagArray = [] // For storing all tag models 
    let tagInserted = [] // For storing all the tag's string inserted for the article
    const tagList = req.body.tagList

    for (tag in tagList) {
        console.log(tagList[tag])
        if (tagInserted.indexOf(tagList[tag]) > -1) {
            console.log('duplicate tag')
        } else {
            console.log('non duplicate')
            await Tag.findOrCreate({
                where: {
                    name: tagList[tag]
                }
            }).spread((tagFoundOrCreated, created) => {
                tagArray.push(tagFoundOrCreated)
                tagInserted.push(tagList[tag])
            })
        }
    }

    article.save().then((article) => {
        article.setTags(tagArray)
        return res.json({
            article: article.toAuthJSON(currentUser, tagInserted)
        });

    }).catch((err) => {
        console.log(err)

    });

});

/**
 * Put request for Article update
 */
router.put('/:slug', auth.required, async (req, res, next) => {
    console.log('-----------------in put ----------------')

    let tagArray = []
    let tagInserted = []
    // Fetch article to be updated
    let article = await Article.findOne({
        where: {
            slug: req.params.slug
        }
    })
    // Fetch current user logged in
    const currentUser = await User.findOne({
        where: {
            id: req.payload.id
        }
    })
    // Allow update Only if the article is created by current logged in user
    if (article.UserId === req.payload.id) {
        if (req.body.title !== undefined) {
            article.title = req.body.title;
            article.slug = slug(article.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36)
        }

        if (req.body.description !== undefined) {
            article.description = req.body.description;
        }

        if (req.body.body !== undefined) {
            article.body = req.body.body;
        }

        if (req.body.tagList !== undefined) {

            const tagList = req.body.tagList

            for (tag in tagList) {
                // To check if user inserted duplicate tags
                if (tagInserted.indexOf(tagList[tag]) > -1) {
                    console.log('duplicate tag')
                } else {
                    console.log('non duplicate')
                    // Create tag only if tag does not exist, else return existed tag
                    await Tag.findOrCreate({
                        where: {
                            name: tagList[tag]
                        }
                    }).spread((tagFoundOrCreated, created) => {
                        tagArray.push(tagFoundOrCreated)
                        tagInserted.push(tagList[tag])
                    })
                }
            }
            article.setTags(tagArray)
        }

        article.save().then(async function (article) {
            article = await Article.findOne({
                where: {
                    id: article.id
                }
            })
            return res.json({
                article: article.toAuthJSON(currentUser, tagInserted)
            });
        }).catch(next);
    } else {
        return res.sendStatus(403);
    }


});

/**
 * Get request for getting articles 
 * 
 */
router.get('/', auth.optional, async (req, res, next) => {
    console.log('------------in get articles--------')
    var limit = 20;
    var offset = 0;
    let tags = [] // to store array of strings in query params
    let whereClause = []
    for (let key of Object.keys(req.query)) {

        switch (key) {
            case 'limit':
                limit = req.query.limit;
                break;
            case 'offset':
                offset = req.query.offset;
                break;
            case 'tag':
                tags = req.query.tag
                break;
            case 'author':
                const author = await User.findOne({
                    where: {
                        username: req.query.author
                    }
                })
                if (author) {
                    whereClause.push({
                        UserId: {
                            [op.eq]: author.id
                        }
                    })
                }
                break;
        }
    }
    let filterArticle = [] // to store the id's of article to be fetched
    if (tags) {
        // find all the tags in the query
        const tagsModel = await Tag.findAll({
            where: {
                name: {
                    [op.in]: tags.split(',')
                }
            }
        })
        console.log(tagsModel)
        // for each tag
        for (model in tagsModel) {
            // find articles associated with it
            const articlesTemp = await tagsModel[model].getArticles({
                attributes: ['id']
            })
            let articleIds = [] // to temperarily store article id's before intersection
            for (article in articlesTemp) {
                articleIds.push(articlesTemp[article].id)
            }
            if (model === "0") {
                filterArticle = intersection(articleIds) // to exclude repeated id
            } else {
                filterArticle = intersection(filterArticle, articleIds) // intersection needed for articles having all the tags in the query
            }

        }
        whereClause.push({
            id: {
                [op.in]: filterArticle
            }
        })
    }

    const articles = await Article.findAll({
        where: {
            [op.and]: whereClause
        },
        limit: limit,
        order: [
            ['createdAt', 'DESC']
        ],
        offset: offset
    }).catch(next)
    const articleArray = articles.map(async article => {
        let tagInserted = []
        const user = await User.findOne({
            where: {
                id: article.UserId
            }
        })
        let associatedTags = await article.getTags()

        console.log(associatedTags)
        for (tag in associatedTags) {
            tagInserted.push(associatedTags[tag].name)
        }

        return article.toAuthJSON(user, tagInserted);
    })
    const results = await Promise.all(articleArray)
    return res.json({
        articles: results,
        articlesCount: articles.length
    })


});



/**
 * Delete reuest to destroy Article
 */
router.delete('/:slug', auth.required, async (req, res, next) => {
    //Fetch current user logged in
    const currentUser = await User.findOne({
        where: {
            id: req.payload.id
        }
    })
    if (!currentUser) { // if user is not logged in, then return
        return res.sendStatus(401);
    }
    // Fetch article to be destroyed
    let article = await Article.findOne({
        where: {
            slug: req.params.slug
        }
    })
    // Allow deletion only if article is created by current logged in user, else return
    if (article.UserId === req.payload.id) {
        Article.destroy({
            where: {
                id: article.id
            }
        }).then(function () {
            return res.sendStatus(204)
        }).catch(next);
    } else {
        return res.sendStatus(403);
    }

});

/**
 * post request for adding new comment to a article
 */
router.post('/:slug/comments', auth.required, async (req, res, next) => {
    // Fetch the article from given slug
    const article = await Article.findOne({
        where: {
            slug: req.params.slug
        }
    })
    // Fetch current user logged in
    const currentUser = await User.findOne({
        where: {
            id: req.payload.id
        }
    })
    if (!currentUser) { // if user is not logged in then return
        return res.sendStatus(401);
    }
    // create comment
    let comment = await article.createComment({
        body: req.body.comment.body,
        UserId: currentUser.id
    }).catch(next)
    return res.json({
        comment: comment.toJSONFor(currentUser)
    })
});

/**
 * Get request for all the comments of the article
 */

router.get('/:slug/comments', auth.optional, async (req, res, next) => {
    // Fetch article of which comments has to be extracted
    const article = await Article.findOne({
        where: {
            slug: req.params.slug
        }
    }).catch(next)
    if (article) {
        const comments = await article.getComments().catch(next)
        const commentArray = comments.map(async comment => {
            const author = await User.findOne({
                where: {
                    id: comment.UserId
                }
            })
            return comment.toJSONFor(author);
        })
        const results = await Promise.all(commentArray)
        return res.json({
            comments: results
        })
    } else {
        return res.sendStatus(404);
    }
});

/**
 * Delete request to destroy comment
 */
router.delete('/:slug/comments/:id', auth.required, async (req, res, next) => {
    // Fetch current user logged in
    const currentUser = await User.findOne({
        where: {
            id: req.payload.id
        }
    })
    if (!currentUser) {
        return res.sendStatus(401);
    }
    //Fetch article of which comment has to be deleted
    let article = await Article.findOne({
        where: {
            slug: req.params.slug
        }
    })
    // fetch comment to be destroyed
    let comment = await Comment.findOne({
        where: {
            id: req.params.id
        }
    })
    // Allow delete only if comment is added by current user logged in
    if (comment.UserId === req.payload.id) {
        article.removeComment(comment)

            .then(function () {
                console.log('deleted comment')
                return res.sendStatus(204)
            }).catch(next);

    } else {
        return res.sendStatus(403);
    }

});

module.exports = router