const {sequelize, Sequelize} = require('../controllers/db');

const Classes = sequelize.define('Classes',{
    schoolCode:{
        type: Sequelize.STRING,
        allowNull: false
    },
    teacherCode:{
        type: Sequelize.STRING,
        allowNull: false
    },
    class:{
        type: Sequelize.STRING,
        allowNull: false
    },
    section:{
        type: Sequelize.STRING,
        allowNull: false
    },
    subjectCode:{
        type: Sequelize.STRING,
        allowNull: false
    },
    numClasses:{
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
},
{ 
    freezeTableName: true
});

module.exports = {Classes};