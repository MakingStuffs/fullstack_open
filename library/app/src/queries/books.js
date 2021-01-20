import { gql } from '@apollo/client'

export const ALL_BOOKS = gql`
  query($genre: String) {
    allBooks(genre: $genre) {
      title
      id
      published
      genres
      author {
        name
      }
    }
  }
`

export const ADD_BOOK = gql`
  mutation createBook(
    $title: String!
    $author: String
    $published: Int!
    $genres: [String!]
  ) {
    addBook(
      title: $title
      author: $author
      published: $published
      genres: $genres
    ) {
      title
      author {
        name
      }
      published
      genres
      id
    }
  }
`