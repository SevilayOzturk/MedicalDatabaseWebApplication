const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
    host: '178.128.70.9',
    user: 'test',
    password: 'bar',
    database: 'mydb'
})


exports.login = async(req, res) =>{
    try {
        const { email, password } = req.body;

        if(!email || !password){
            return res.status(400).render('login', {
                message: 'Please provide an email and password'
            })
        }

        db.query('SELECT * FROM user WHERE emailAddress = ?', [email], async(error, results)=>{
            console.log(results);
            //doing the compare() compares the password typed in the login with the password(hashed) in the database
            if(!results || !(await bcrypt.compare(password, results[0].password))) {
            //compares if the email is wrong or if the password is wrong
                res.status(401).render('login', {
                    message: 'Email or Password is incorrect'
                })
            }
            else{
                const id = results[0].id;
                
                //every user when they join creates a unique token
                const token = jwt.sign({id: id}, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                });

                console.log("The token is: " + token);
                
                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }
                res.cookie('jwt', token, cookieOptions);
                res.status(200).redirect("/");
            }
        })

    } catch(error){
        console.log(error);
    }
}

exports.register = (req, res) => {
    console.log(req.body);
    
    //const name = req.body.name;
    //const email = req.body.email;
    //const password = req.body.password;
    //const passwordConfirm = req.body.passwordConfirm;

    //The line below is the same as the line above because in the html the "name" is the same as our "const names"
    //For example in the html the form input for email is named "email" and since we are naming our const variable
    //"email", we can just follow that logic for all the other variables and the line below is a shorter method of doing
    //the line above
    const { name, email, password, passwordConfirm } = req.body;

    //Import database
    db.query('SELECT emailAddress FROM user WHERE emailAddress = ?', [email], async(error, results) => {
        if(error){
            console.log(error);
        }

        if(results.length > 0){
            return res.render('register', {
                message: 'That email is already in use'
            })
        }
        else if(password !== passwordConfirm){
            return res.render('register', {
                message: 'Passwords do not match'
            });
        }

        //we are using await because it can take a bit to encrypt some passwords
        //we are using 8 rounds of encryption
        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        db.query('INSERT INTO user SET ?', {name: name, emailAddress: email, password: hashedPassword }, (error, results)=>{
            if(error){
                console.log(error);
            }
            else{
                console.log(results);
                return res.render('register', {
                    message: 'User registered'
                });
            }
        })
    });
}