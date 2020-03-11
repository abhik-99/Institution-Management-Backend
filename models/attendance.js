const {sequelize, Sequelize} = require('../controllers/db');
const Attendance = sequelize.define('Attendance',{
   sid:{
       type: Sequelize.INTEGER,
       primaryKey: true,
       autoIncrement: true
   }, 
   schoolCode:{
       type: Sequelize.STRING,
       unique: true,
       allowNull: false
   },
   teacherCode:{
       type: Sequelize.STRING,
       allowNull: false
   },
   studentCode:{
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
   date:{
       type: Sequelize.DATEONLY,
       allowNull: false
   },
},{
    freezeTableName: true
});

module.exports = {Attendance};