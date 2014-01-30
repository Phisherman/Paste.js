#Paste.js

##Welcome to Paste.js!
Paste.js is an minimalistic web application which allows you to create fast texts (notices, lists, minutes...) and share them with a link.

###Current features
- share texts with a link (readonly and editable version)
- auto-save

###Used software
- Font awesome(http://fontawesome.io/)
- jQuery (http://jquery.com/)
- Angular.js (http://angularjs.org/).

###Installation
You need a MySQL server to store the pad data. Open the file Core/datalayer.php and enter your user credentials at the line with **$connect = mysqli_connect("localhost", "root", "")**.
Don't forget that you also need to change the database name one line below.
Then you have to create the database. You can do that for example by selecting *dump.sql* out of phpMyAdmin (or equivalent).
