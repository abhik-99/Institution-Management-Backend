# Institution Management Backend

**Project by**:- Abhik Banerjee

**Contact**:- 
1. abhik@abhikbanerjee.com
2. abhik.banerjee.1999@gmail.com

**LinkedIn**:- https://www.linkedin.com/in/banerjee-1331/

# Project Description
This project is a test project created by me. It features complete Authentication workflow implemented using NodeJs and JWT. The project tries to follow an MVC Structure. Databases used for making this backend were Google Cloud Platform's Firestore and Cloud SQL. The workflow features are as given below. The backend has been developved using Node and ExpressJS. For a complete list of dependencies, please check [package.json](https://github.com/abhik-99/Institution-Management-Backend/blob/master/package.json) file in the project root directory.

## Features of the Backend Server
1. Contains complete workflow of three types of Users already designed. 
2. Authentication Workflow using JWT Token.
3. Contains Password Recovery Workflow already implemented.
4. Built to use MySQL (using Sequqlize ORM) and FireStore (NoSQL).
5. Can be easily deployed on any PAAS or IAAS Cloud Offering.
6. Has Mailing Functionality already implemented using SendGrid. This can be used for Recovery Purposes or for sending notifications.


## Types of Users:-
1. **Teachers** - The teachers can sign-in to check submission of homework, give homework, check the performance of student, send event type messages to a group of student, edit the performance report and create quizes. The Teachers can also give attendance for a specific class they have taught or access the attendance records of a student. Furthermore, based on the letter of absence filed by parents, the attendance data is also changed. The teachers can also approve or reject letter of absence.
2. **Parents** - The parents can signin to check the reports on their students, file for an absence letter, send direct messages to teachers and look up events.
3. **Students** - The students can sign-in to check or submit homework. They can check their performance or absent record. The students can also complete quizes given by the teachers.

## Setup and Start the Project.
1. Move to the root directory of the project and run ```npm install``` to install all the dependencies.
2. Execute ```npm test``` or ```nodemon``` to start up the project on a developmental server.

**Please note**: This project was created for developmental purposes. The codes in the repository should not be deployed to a production environment without proper verification. To find a list of endpoints exposed by the backend, please look up *API Documentation.rtf* in the project root directory.


