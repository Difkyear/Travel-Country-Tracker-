import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "World",
  password: "VincentYeh",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];

function findColor(id) {
  // console.log("array" + users);
  const result = users.find((user) => user.id == id);
  // console.log("color" + result.color);
  return result.color;
}
async function checkRepeat(id, countryCode) {
  console.log("id" + id + "  code" + countryCode);
  let repeate = false;
  try {
    const result = await db.query(
      "select country_code from visited_countries   where user_id=$1 and   country_code =$2",
      [id, countryCode]
    );
    // console.log("rows");
    // console.log(result.rowCount);
    if (result.rowCount != 0) {
      repeate = true;
    } else {
      repeate = false;
    }
  } catch (error) {
    console.log(error);
  }
  console.log(repeate);

  return repeate;
}
async function checkVisisted(userId) {
  const result = await db.query(
    "select country_code from visited_countries where user_id=$1",
    [userId]
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  // console.log(result);
  return countries;
}
async function getUser() {
  const result = await db.query("select * from users");
  // console.log(result.rows);
  users = result.rows;
  // console.log(users);
}
app.get("/", async (req, res) => {
  getUser();
  const countries = await checkVisisted(currentUserId);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: findColor(currentUserId),
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"].trim();
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );
    // console.log(input);

    const data = result.rows[0];
    const countryCode = data.country_code;
    console.log(await checkRepeat(currentUserId, countryCode));
    if (await checkRepeat(currentUserId, countryCode)) {
      console.log("this is repeate");
    } else {
      try {
        await db.query(
          "INSERT INTO visited_countries (country_code,user_id) VALUES ($1,$2)",
          [countryCode, currentUserId]
        );
        res.redirect("/");
      } catch (err) {
        console.log(err);
      }
      console.log("this is not repeate");
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  // console.log(req.body["user"]);
  if (req.body["add"] === "new") {
    // console.log(213);
    res.render("new.ejs");
  } else {
    const userID = req.body["user"];
    currentUserId = userID;
    console.log(currentUserId - 1);
    const countries = await checkVisisted(currentUserId);
    res.redirect("/");
    // res.render("index.ejs", {
    //   countries: countries,
    //   total: countries.length,
    //   users: users,
    //   color: findColor(userID),
    // });
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  const color = req.body["color"];
  const name = req.body["name"];
  // console.log("newusercolor" + color);
  try {
    const result = await db.query(
      "insert into users(name,color)  values ($1,$2) returning *",
      [name, color]
    );
    currentUserId = result.rows[0].id;
    // console.log("currentUserId");
    // console.log(result);
    res.redirect("/");
  } catch (error) {}
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
