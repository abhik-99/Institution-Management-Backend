'use strict';
module.exports = (sequelize, DataTypes) => {
  const Classes = sequelize.define('Classes', {
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
  }, {});
  Classes.associate = function(models) {
    // associations can be defined here
  };
  return Classes;
};