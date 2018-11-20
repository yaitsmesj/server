const Sequelize = require('sequelize')
const DT = Sequelize.DataTypes

module.exports = {
    comment: {
        body: {
            type: DT.STRING(500)
        }
    }
}