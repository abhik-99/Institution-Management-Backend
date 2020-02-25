const { Sequelize, DataTypes} = require('sequelize');
const sequelize = new Sequelize();
const Attendance = sequelize.define('Attendance',{
   id:{
       type: DataTypes.UUIDV4,
       primaryKey: true,
       autoIncrement: true
   }, 
   schoolCode:{
       type: DataTypes.STRING,
       unique: true,
       allowNull: false
   },
   teacherCode:{
       type: DataTypes.STRING,
       allowNull: false
   },
   studentCode:{
       type: DataTypes.STRING,
       allowNull: false
   },
   class:{
       type: DataTypes.STRING,
       allowNull: false
   },
   section:{
       type: DataTypes.STRING,
       allowNull: false
   },
   subjectCode:{
       type: DataTypes.STRING,
       allowNull: false
   },
   date:{
       type: DataTypes.DATEONLY,
       allowNull: false
   },
},{
    freezeTableName: true
});