const express = require("express");
const app = express();
const cors = require("cors");
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const URL = "mongodb://localhost:27017";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const secret = "KpeMI5QzAp";

let usersList = [];
app.use(express.json())
app.use(cors({
    origin: "*"
}))

let authenticate = function (req, res, next) {
    if (req.headers.authorization) {
        try {
            let result = jwt.verify(req.headers.authorization, secret);
            if (result) {
                next();
            }
        } catch (error) {
            res.status(401).json({ message: "Token Expired" })
        }
    } else {
        res.status(401).json({ message: "Not Authorized" })
    }
}

app.get("/users", async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("nodecrud");
        let users = await db.collection("users").find({}).toArray();
        await connection.close();
        res.json(users);
    } catch (error) {
        console.log(error)
    }
});

app.get("/user/:id", async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("nodecrud");
        let objId = mongodb.ObjectId(req.params.id)
        let user = await db.collection("users").findOne({ _id: objId })
        await connection.close()
        if (user) {
            res.json(user)
        } else {
            res.status(401).json({ message: "User Not Found" })
        }
    } catch (error) {
        res.status(500).json({ message: "Something Went Wrong" })
    }
})

app.post("/create-user", async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("nodecrud")
        await db.collection("users").insertOne(req.body)
        await connection.close();
        res.json({ message: "User Added" })
    } catch (error) {
        console.log(error)
    }
});

app.put("/user/:id", async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("nodecrud");
        let objId = mongodb.ObjectId(req.params.id)
        await db.collection("users").updateMany({ _id: objId }, { $set: req.body })
        await connection.close();
        res.json({ message: "User Updated" })
    } catch (error) {
        console.log(error)
    }
})

app.delete("/user/:id", async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("nodecrud");
        let objId = mongodb.ObjectId(req.params.id)
        await db.collection("users").deleteOne({ _id: objId })
        await connection.close();
        res.json({ message: "User Deleted" })
    } catch (error) {
        console.log(error)
    }
});

let sender = nodemailer.createTransport({
    service : "gmail",
    auth : {
        user : "dummydrive0122@gmail.com",
        pass : "hello@123"
    }
});

app.post("/register", async function (req, res) {
let composemail = {
    from : "dummydrive0122@gmail.com",
    to : req.body.email,
    subject : "Send mail Using Node Js",
    text : 'Now Login Your Account'
};

sender.sendMail(composemail, function (error, info){
    if (error) {
        console.log(error);
    } else {
        console.log("Mail send successfully" + info.response)
    }
});

    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("nodecrud");
        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(req.body.password, salt);
        req.body.password = hash;
        await db.collection("customers").insertOne(req.body)
        connection.close();
        res.json({ message: "Customer Created" })
    } catch (error) {
        console.log(error);
    }
})

app.post("/login", async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("nodecrud");
        let user = await db.collection("customers").findOne({ email: req.body.email })
        if (user) {
            let passwordResult = await bcrypt.compare(req.body.password, user.password)
            if (passwordResult) {
                let token = jwt.sign({ userid: user._id }, secret, { expiresIn: '1h' })
                res.json({ token })
            } else {
                res.status(401).json({ message: "Wrong password" })
            }
        } else {
            res.status(401).json({ message: "No user found" })
        }
    } catch (error) {
        console.log(error)
    }
})

app.get("/dashboard", authenticate, function (req, res) {
    res.json({ totalUsers: 20 })
})

app.listen(process.env.PORT || 3001)