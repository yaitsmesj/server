const Sequelize = require('sequelize')
const DT = Sequelize.DataTypes

module.exports = {
    user: {
        username: {
            type: DT.STRING(50),
            unique: {
                args: true,
                msg: 'is already taken.'
            },
            allowNull: false,
            validate: {
                is: {
                    args: /^[a-zA-Z0-9]+$/,
                    msg: "is invalid"
                  },
                  isLowercase: true
            }
        },
        email: {
            type: DT.STRING(50),
            unique: {
                args: true,
                msg: 'is already taken.'
            },
            allowNull: false,
            validate: {
                isEmail: {
                    args: true,
                    msg: "is invalid"
                  },
                  isLowercase: true
            }
        },
        password:{
            type: DT.STRING(50),
            allowNull: false
        },
        bio: {
            type: DT.STRING(500),
            allowNull: true
        },
        image: {
            type: DT.STRING(500),
            allowNull: true
        }
    }
}