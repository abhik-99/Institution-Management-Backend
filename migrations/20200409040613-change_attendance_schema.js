'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Attendances', 'numAbsent'),
      queryInterface.addColumn('Attendances', 'absent',{
        type: Sequelize.STRING,
        allowNull: false
      })
    ])
  },

  down: (queryInterface, Sequelize) => {
   return Promise.all([
     queryInterface.removeColumn('Attendances', 'absent'),
     queryInterface.addColumn('Attendances', 'numAbsent', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
     })
   ])
  }
};
