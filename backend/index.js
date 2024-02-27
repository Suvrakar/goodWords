const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const passportJWT = require('passport-jwt');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

const PORT = process.env.PORT || 5000;

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'secret',
};

const strategy = new JwtStrategy(jwtOptions, (jwt_payload, next) => {
  console.log('payload received', jwt_payload);
  const user = prisma.user.findUnique({ where: { id: jwt_payload.id } });
  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
});

passport.use(strategy);

const app = express();

app.use(cors());
app.use(passport.initialize());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const typeDefs = gql`
  type User {
    id: Int
    name: String
    email: String
    posts: [Post]
  }

  type Category {
    id: Int
    name: String
    posts: [Post]
  }

  type Post {
    id: Int
    title: String
    content: String
    createdAt: String
    updatedAt: String
    user: User
    category: Category
  }

  type Query {
    hello: String
    getUser(id: Int!): User
    getAllUsers: [User]
    getPost(id: Int!): Post
    getAllPosts: [Post]
  }

  type Mutation {
    createUser(name: String!, email: String!): User
    createPost(title: String!, content: String!, userId: Int!, categoryId: Int!): Post
    editPost(id: Int!, title: String, content: String): Post
    deletePost(id: Int!): Post
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello, GraphQL!',
    getUser: (_, { id }) => prisma.user.findUnique({ where: { id } }),
    getAllUsers: () => prisma.user.findMany(),
    getPost: (_, { id }) => prisma.post.findUnique({ where: { id } }),
    getAllPosts: () => prisma.post.findMany(),
  },
  Mutation: {
    createUser: (_, { name, email }) => prisma.user.create({ data: { name, email } }),
    createPost: (_, { title, content, userId, categoryId }) =>
      prisma.post.create({ data: { title, content, userId, categoryId } }),
    editPost: (_, { id, title, content }) => prisma.post.update({ where: { id }, data: { title, content } }),
    deletePost: (_, { id }) => prisma.post.delete({ where: { id } }),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.applyMiddleware({ app });

app.listen(PORT, () => console.log(`Listening to port ${PORT}`));
