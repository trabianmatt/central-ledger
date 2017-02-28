'use strict'

const Joi = require('joi')
const Handler = require('./handler')
const tags = ['api', 'users']

module.exports = [
  {
    method: 'GET',
    path: '/users',
    handler: Handler.getAll,
    config: {
      tags,
      description: 'Get all users'
    }
  },
  {
    method: 'GET',
    path: '/users/{id}',
    handler: Handler.getById,
    config: {
      tags,
      description: 'Get user details',
      validate: {
        params: {
          id: Joi.string().guid().description('User Id')
        }
      }
    }
  },
  {
    method: 'PUT',
    path: '/users/{id}',
    handler: Handler.update,
    config: {
      tags,
      description: 'Update user details',
      validate: {
        params: {
          id: Joi.string().guid().description('User Id')
        },
        payload: {
          firstName: Joi.string().description('First name'),
          lastName: Joi.string().description('Last name'),
          key: Joi.string().description('Login key'),
          email: Joi.string().description('Email address'),
          isActive: Joi.bool().description('Active user')
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/users',
    handler: Handler.create,
    config: {
      tags,
      description: 'Create user',
      validate: {
        payload: {
          firstName: Joi.string().required().description('First name'),
          lastName: Joi.string().required().description('Last name'),
          key: Joi.string().required().description('Login key'),
          email: Joi.string().required().description('Email address')
        }
      }
    }
  },
  {
    method: 'DELETE',
    path: '/users/{id}',
    handler: Handler.remove,
    config: {
      tags,
      description: 'Delete user',
      validate: {
        params: {
          id: Joi.string().guid().description('user id')
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/users/{id}/roles',
    handler: Handler.getRoles,
    config: {
      tags,
      description: 'Get user roles',
      validate: {
        params: {
          id: Joi.string().guid().description('user id')
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/users/{id}/roles',
    handler: Handler.updateRoles,
    config: {
      tags,
      description: 'Update user roles',
      validate: {
        params: {
          id: Joi.string().guid().description('user id')
        },
        payload: Joi.array().items(Joi.string().guid()).required().description('Role ids')
      }
    }
  }
]
