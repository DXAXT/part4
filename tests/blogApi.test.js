const { test, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const helper = require('./test_helper')

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

after(async () => {
  await mongoose.connection.close()
})