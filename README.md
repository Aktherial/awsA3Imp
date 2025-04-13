# awsA3Imp

Use a .env file for all of the different credentials and stuff

- Put database results within home page
- Setup log in/out redirects
- Wishlist tied to user? Some how use the user ID as a primary key and use a seperate table to store the id's of items
- 

------------------deployment------------------------

remove gitignore?? not sure if needed but i did -T

eb create "env name placeholder"

eb setenv VAR1=value VAR2=value

VAR is each env value ensure to change from local routing to beanstalk domain
