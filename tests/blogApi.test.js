const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')

const helper = require('./test_helper')
const User = require('../models/user')
const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})

  await Blog.insertMany(helper.initialBlogs)
})

test('correct amount of blogs returned', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
    

    assert.strictEqual(response.body.length, helper.initialBlogs.length)
})

test('id of blog posts is named id', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)

    const values = Object.values(response.body)    
    assert((values.every(item => item?.id !== undefined)) && (values.every(item => item?._id === undefined)))
})

test('a valid blog can be added ', async () => {
  const newBlog = {
    _id: "5a422bc61b54a676234d1722",
    title: "Test Blog 1",
    author: "Test Blog 1 again",
    url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
    likes: 0,
    __v: 0
  }  

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const response = await api.get('/api/blogs')

  const values = Object.values(response.body) 

  assert.strictEqual(response.body.length, helper.initialBlogs.length + 1)  
  
  assert(values.find(item => item.title === 'Test Blog 1'))
})

test('a blog can be deleted', async() => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToDelete = blogsAtStart[0]

  const response = await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(204)

  const blogsAtEnd = await helper.blogsInDb()

  assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1)
  const values = Object.values(response.body)
  assert(!values.find(item => item.title === `${blogToDelete.title}`))
})

test('a blog can be edited (likes)', async() => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToEdit = blogsAtStart[0]
  const newBlog = {
    likes: 9001,
  }

  const response = await api
    .put(`/api/blogs/${blogToEdit.id}`)
    .send(newBlog)
    .expect(200)

  const blogsAtEnd = await helper.blogsInDb()

  assert.strictEqual(blogsAtEnd.length, blogsAtStart.length)
  assert(response.body.title === blogToEdit.title)
  assert(response.body.likes === 9001)
})

describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    console.log('1');
    
    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    console.log('2');

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    console.log('3');

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('expected `username` to be unique'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
})

after(async () => {
  await mongoose.connection.close()
})