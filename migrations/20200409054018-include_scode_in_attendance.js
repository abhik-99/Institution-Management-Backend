'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Attendances', 'absent'),
      queryInterface.addColumn('Attendances', 'studentCode',{
        type: Sequelize.STRING,
        allowNull: false
      }),
      queryInterface.addColumn('Attendances', 'studentName',{
        type: Sequelize.STRING,
        allowNull: false
      })
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Attendances', 'studentName'),
      queryInterface.removeColumn('Attendances', 'studentCode'),
      queryInterface.addColumn('Attendances', 'absent',{
        type: Sequelize.STRING,
        allowNull: false
      })
    ])
  }
};
