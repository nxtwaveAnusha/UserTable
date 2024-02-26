const express = require('express')
const path = require('path')
const bcrypt = require('bcrypt')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'userData.db')
let db = null
const intializeDBAndSever = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
intializeDBAndSever()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    const createUserQuery = `INSERT INTO user (username,name,password,gender,location) VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`
    await db.run(createUserQuery)
    response.send('User created successfully')
  } else {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      response.status(400)
      response.send('User already exists')
    }
  }
})
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const passwordMatched = await bcrypt.compare(password, dbUser.password)
    if (passwordMatched === true) {
      response.send('Login success')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const ispasswordMatch = await bcrypt.compare(oldPassword, dbUser.password)
    if (ispasswordMatch === true) {
      const lengthNewPass = newPassword.length
      if (lengthNewPass.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const hashedNewPass = await bcrypt.hash(newPassword, 10)
        const updatePassquery = `UPDATE user SET password = '${hashedNewPass}' WHERE username = '${username}';`
        await db.run(updatePassquery)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
