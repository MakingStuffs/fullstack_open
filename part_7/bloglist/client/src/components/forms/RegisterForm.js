import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { registerUser } from '../../reducers/authReducer'
import { useField } from '../../hooks'
import { useHistory } from 'react-router-dom'

const RegisterForm = () => {
  const dispatch = useDispatch()

  const username = useField('text', 'username')
  const name = useField('text', 'name')
  const password = useField('password', 'password')
  const user = useSelector((state) => state.auth)
  let history = useHistory()

  const { reset: resetUsername, ...usernameOptions } = username
  const { reset: resetName, ...nameOptions } = name
  const { reset: resetPassword, ...passwordOptions } = password

  useEffect(() => {
    if (user) {
      return history.push(`/user/${user.id}`)
    }
  }, [user])

  const handleSubmit = (event) => {
    event.preventDefault()
    dispatch(
      registerUser({
        username: username.value,
        password: password.value,
        name: name.value,
      })
    )
  }

  return (
    <div className="register-user">
      <h2>Create an Account</h2>
      <p>Use the form below to create an account.</p>
      <form onSubmit={handleSubmit}>
        <div
          className="form-input"
          data-has-content={username.value ? 'true' : 'false'}
        >
          <label>Username:</label>
          <input id="username" {...usernameOptions} />
        </div>
        <div
          className="form-input"
          data-has-content={name.value ? 'true' : 'false'}
        >
          <label>Name:</label>
          <input id="name" {...nameOptions} />
        </div>
        <div
          className="form-input"
          data-has-content={password.value ? 'true' : 'false'}
        >
          <label>Password:</label>
          <input id="password" {...passwordOptions} />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  )
}

export default RegisterForm
