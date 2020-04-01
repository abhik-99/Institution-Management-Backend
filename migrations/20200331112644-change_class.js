'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
   return Promise.all([queryInterface.addColumn('Classes','numQuizzes',{
     type: Sequelize.INTEGER,
     allowNull: false,
     defaultValue: 0
   }),
   queryInterface.addColumn('Classes','numHomeworks',{
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  }),
  ])
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
   return Promise.all([
     queryInterface.removeColumn('Classes', 'numHomeworks'),
     queryInterface.removeColumn('Classes', 'numQuizzes')
    ])
  }
};
