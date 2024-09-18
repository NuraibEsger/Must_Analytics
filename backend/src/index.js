const express = require("express");
const path = require("path");
const hbs = require("hbs");
const collection = require("./mongodb");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

const templatePath = path.join(__dirname, "../templates");

app.use(express.json());
app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(express.urlencoded({ extended: false }));

app.get("/getUsers", (req, res) => {
  res
    .json(
      UserModel.find({}).then(function (users) {
        res.json(users);
      })
    )
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/signUp", (req, res) => {
  res
    .json(
      UserModel.find({}).then(function (users) {
        res.json(users);
      })
    )
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/login", async (req, res) => {
  try {
    const check = await collection.findOne({
      email: req.body.email,
    });

    if (check.password === req.body.password) {
        res.send("success")
    }
    else {
        res.send("wrong password")
    }

  } catch {
    res.send("no user found")
  }
});

app.post("/signUp", async (req, res) => {
  const data = {
    email: req.body.email,
  };

  await collection.insertMany([data]);

  res.send("success");
});

app.listen(3001, () => {
  console.log("Server is Running");
});
