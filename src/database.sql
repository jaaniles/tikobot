DROP TABLE people;
CREATE TABLE people (nick VARCHAR(255) NOT NULL UNIQUE, firstName VARCHAR(255), lastName VARCHAR(255), year INT(4));
INSERT INTO people (nick, firstName, lastName, year) values ('maamaan', 'jaani', 'leskinen', 2013);
INSERT INTO people (nick, firstName, lastName, year) values ('Roopertti', 'robert', 'kuhlmann', 2015);