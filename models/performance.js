const { Sequelize, DataTypes} = require('sequelize');
const sequelize = new Sequelize();

const Performance = sequelize.define('Performace',{
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
    examType:{
        type: DataTypes.INTEGER,
        allowNull: false,
        comment:"This value can only be 1,2 or 3 for class-test, mid-term or final."
    },
    subjectCode:{
        type: DataTypes.STRING,
        allowNull: false
    },
    fullMarks:{
        type: DataTypes.FLOAT,
        allowNull: false
    },
    marksObtained:{
        type: DataTypes.FLOAT,
        allowNull: false
    },
    date:{
        type: DataTypes.DATEONLY,
        allowNull: false
    },
},{
    freezeTableName:true
});