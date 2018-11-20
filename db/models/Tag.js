const Sequelize = require('sequelize')
const DT = Sequelize.DataTypes

module.exports = {
    tag: {
        name: {
            type: DT.STRING(50),
            unique: true
        }
    }
}