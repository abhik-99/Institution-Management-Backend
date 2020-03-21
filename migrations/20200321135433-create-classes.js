'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Classes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
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
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Classes');
  }
};