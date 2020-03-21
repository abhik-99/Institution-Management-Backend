'use strict';
module.exports = (sequelize, DataTypes) => {
  const Classes = sequelize.define('Classes', {
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
    numClasses:{
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
  }, {});
  Classes.associate = function(models) {
    // associations can be defined here
  };
  return Classes;
};