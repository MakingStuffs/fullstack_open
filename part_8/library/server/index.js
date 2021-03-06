const {
  ApolloServer,
  gql,
  UserInputError,
  AuthenticationError,
  PubSub,
} = require('apollo-server')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const config = require('./utils/config')
const { Author, Book, User } = require('./models')
const { authors, books } = require('./dummy/data')
const pubsub = new PubSub()

const JWT_SECRET = config.JWT_SECRET
const MONGO_URI = config.MONGO_URI

const setBooks = async () => {
  for (let b of books) {
    const author = await Author.find({ name: b.author })
    b.author = author[0]._id
    const book = new Book(b)
    author[0].books = author[0].books.concat(book._id)
    await author[0].save()
    await book.save()
  }
}

const setAuthors = async () => {
  for (let a of authors) {
    const author = new Author(a)
    await author.save()
  }
}

const setUser = async () => {
  const user = new User({
    username: 'root',
    favoriteGenre: 'patterns',
    password: 'secret',
  })
  await user.save()
}

const initializeDB = async () => {
  await Author.deleteMany({})
  console.log('Deleted authors')
  await Book.deleteMany({})
  console.log('Deleted books')
  await User.deleteMany({})
  console.log('Deleted users')
  await setAuthors()
  console.log('Added dummy authors')
  await setBooks()
  console.log('Added dummy books')
  await setUser()
  console.log('Added dummy user')
}

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(async () => {
    console.log('connected to mongo db')
    if (process.env.NODE_ENV === 'test') {
      await initializeDB()
      console.log('Database reset and initialized with dummy data')
    }
  })
  .catch((err) => console.log(`error connecting to mongo: ${err.message}`))

const typeDefs = gql`
  type Subscription {
    bookAdded: Book!
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    bookCount: Int!
    allBooks(author: String, genre: String): [Book!]
    authorCount: Int!
    allAuthors: [Author!]
    me: User
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]
    id: ID!
  }

  type Author {
    name: String!
    born: Int
    books: [Book!]
    bookCount: Int
    id: ID!
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String
      genres: [String!]
    ): Book
    editAuthor(name: String!, setBornTo: Int): Author
    createUser(username: String!, favoriteGenre: String!): User
    login(username: String!, password: String!): Token
  }
`

const resolvers = {
  Query: {
    allBooks: async (root, args) => {
      if (args.author) {
        const books = (await Book.find({}).populate('author')).filter(
          (b) => b.author.name === args.author
        )
        return books
      }

      if (args.genre) {
        const books = await Book.find({ genres: { $in: args.genre } }).populate(
          'author'
        )
        return books
      }

      const books = await Book.find({}).populate('author')
      return books
    },
    authorCount: async () => {
      const authorCount = await Author.countDocuments({})
      return authorCount
    },
    allAuthors: async () => {
      const authors = await Author.find({}).populate('books')
      return authors
    },
    me: (root, args, context) => context.currentUser,
  },
  Mutation: {
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError('You need to be logged in for that')
      }

      if (args?.title?.length < 3) {
        throw new UserInputError('Title too short', { invalidArgs: args })
      }

      if (args?.author?.length < 3) {
        throw new UserInputError('Author name too short', { invalidArgs: args })
      }

      const book = new Book({ ...args })
      let author = await Author.findOne({ name: args.author })

      try {
        if (!author) {
          author = new Author({ name: args.author })
          author.books = [book._id]
          const dbAuthor = await author.save()
          book.author = dbAuthor._id
        } else {
          book.author = author._id
        }
        const dbBook = (await book.save()).populate('author').execPopulate()
        pubsub.publish('BOOK_ADDED', { bookAdded: dbBook })
        return dbBook
      } catch (err) {
        throw new UserInputError(err.message, { invalidArgs: args })
      }
    },
    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser
      if (!currentUser) {
        throw new AuthenticationError('You need to be logged in for that')
      }

      const author = (await Author.find({ name: args.name }))[0]
      if (!author) {
        throw new UserInputError('No Author found with that name', {
          invalidArgs: args,
        })
      }

      if (!args.setBornTo) {
        throw new UserInputError('You need to specify a new birth year', {
          invalidArgs: args,
        })
      }

      if (args.setBornTo) {
        author.born = args.setBornTo
        try {
          await author.save()
        } catch (err) {
          throw new UserInputError(err.message, { invalidArgs: args })
        }
        return author
      }

      return null
    },
    createUser: async (root, args) => {
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
      })
      try {
        const dbUser = await user.save()
        return dbUser
      } catch (err) {
        throw new UserInputError(err.message, { invalidArgs: args })
      }
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
      if (!user || args.password !== 'secret') {
        throw new UserInputError('Incorrect username/password')
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }
      return { value: jwt.sign(userForToken, JWT_SECRET) }
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED']),
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET)
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  },
})

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`)
  console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})
