'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
   return Promise.all([
     queryInterface.addColumn('Attendances', 'period',{
       type: Sequelize.INTEGER,
       allowNull: false,
     }),
     queryInterface.addColumn('Attendances', 'date',{
       type: Sequelize.STRING,
       allowNull: false
     })
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
     queryInterface.removeColumn('Attendances', 'period'),
     queryInterface.removeColumn('Attendances', 'date')
   ])
  }
};
