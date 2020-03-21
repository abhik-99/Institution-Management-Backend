'use strict';
module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define('Attendance', {
    schoolCode:{
      type: DataTypes.STRING,
      allowNull: false
    },
    teacherCode:{
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
    numAbsent:{
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {});
  Attendance.associate = function(models) {
    // associations can be defined here
  };
  return Attendance;
};