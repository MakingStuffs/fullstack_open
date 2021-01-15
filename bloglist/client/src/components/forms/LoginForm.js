import React from 'react'
import { useField } from '../../hooks'
import { loginUser } from '../../reducers/authReducer'
import { useDispatch } from 'react-redux'

const LoginForm = () => {
  const dispatch = useDispatch()

  const username = useField('text', 'username')
  const password = useField('password', 'password')

  const { reset: usernameReset, ...usernameOptions } = username
  const { reset: passwordReset, ...passwordOptions } = password

  const handleSubmit = (event) => {
    event.preventDefault()
    dispatch(loginUser({ username: username.value, password: password.value }))
  }

  return (
    <div className="login-form">
      <h2>Login</h2>
      <p>Login to create, delete and view your own blog posts</p>
      <form onSubmit={handleSubmit}>
        <div
          className="form-input"
          data-has-content={username.value ? 'true' : 'false'}
        >
          <label>Username</label>
          <input id="form-login-username" {...usernameOptions} />
        </div>
        <div
          className="form-input"
          data-has-content={password.value ? 'true' : 'false'}
        >
          <label>Password</label>
          <input id="form-login-password" {...passwordOptions} />
        </div>
        <button id="login-submit" type="submit">
          Login
        </button>
      </form>
    </div>
  )
}

export default LoginForm
