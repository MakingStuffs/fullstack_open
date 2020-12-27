const mongoose = require("mongoose");
const app = require("../app");
const supertest = require("supertest");
const initialBlogs = require("./blogs");
const Blog = require("../models/Blog");

/**
 * Create an api variable to test the app's
 * api routes.
 */
const api = supertest(app);

/**
 * Initialise the database;
 */
beforeEach(async () => {
  await Blog.deleteMany({});
  for (let blog of initialBlogs) {
    const newBlog = new Blog(blog);
    await newBlog.save();
  }
});

test("response is json", async () => {
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("has id field", async () => {
  const blogs = await api.get("/api/blogs");
  expect(blogs.body[0].id).toBeDefined();
});

test("can post", async () => {
  const newBlog = {
    title: "A Blog From Jest",
    author: "Jest",
    likes: 2,
    url: "https://makingstuffs.co.uk",
  };

  await api.post("/api/blogs").send(newBlog);

  const blogs = (await api.get("/api/blogs")).body.map((blog) => blog.title);

  expect(blogs.length).toBe(initialBlogs.length + 1);
  expect(blogs).toContain("A Blog From Jest");
});

test("default likes", async () => {
  const newBlog = {
    title: "A Blog From Jest",
    author: "Jest",
    url: "https://makingstuffs.co.uk",
  };

  const result = (
    await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(200)
      .expect("Content-Type", /application\/json/)
  ).body;

  expect(result.likes).toBe(0);
});

test("no title", async () => {
  const newBlog = {
    author: "Jest",
    likes: 2,
    url: "https://makingstuffs.co.uk",
  };

  await api.post("/api/blogs").send(newBlog).expect(400);
});

test("no author", async () => {
  const newBlog = {
    title: "A Blog from Jest",
    likes: 2,
    url: "https://makingstuffs.co.uk",
  };

  await api.post("/api/blogs").send(newBlog).expect(400);
});

test("no url", async () => {
  const newBlog = {
    title: "A Blog from Jest",
    author: "Jest",
    likes: 2
  };

  await api.post("/api/blogs").send(newBlog).expect(400);
});

afterAll(() => {
  mongoose.connection.close();
});
