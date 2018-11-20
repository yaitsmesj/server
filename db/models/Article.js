const Sequelize = require('sequelize')
const DT = Sequelize.DataTypes


module.exports = {
    article: {
        slug: {
            type: DT.STRING(150),
            unique: {
                args: true,
                msg: 'is already taken.'
            },
            validate: {
                  isLowercase: true
            }
        },
        title: {
            type: DT.STRING(150)
        },
        description:{
            type: DT.STRING(500)
        },
        body: {
            type: DT.STRING(500)
        }
    }
}