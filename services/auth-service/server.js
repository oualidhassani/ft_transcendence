
import Fastify from 'fastify';
import bcrypt from 'bcrypt';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import db from '../../Shared_dataBase/database/db-connection.js';
const app = Fastify(
  {
    logger : true 
  }
);
// const bcrypt = require('bcrypt');
// const db = require('../../Shared_dataBase/database/db-connection.js');

await app.register(cors);
await app.register(jwt, 
{
  secret: process.env.JWT_SECRET || 'transcendence-secret-key'
});

app.get('/test', async(request , reply)=>
{
  console.log("hey im here working good ");
})

app.post('/register', async(request , reply)=>
{
    const   {username , email, password} =  request.body;

    try 
    {
        const existingUser = await db.findUserByUsername(username);
        if(existingUser)
        {
            return reply.status(400).send({error: 'Username already exists'});
        }
        const existingEmail = await db.findEmailByEmail(email);
        if(existingEmail)
        {
            return reply.status(400).send({error: 'Email already exists'});
        }
      
        const hashPassword = await bcrypt.hash(password, 12);
        
        const newUser = await db.createUser(username, email, hashPassword);

        console.log("New user is created ", newUser);
        
        return { 
          message: 'User registered successfully', 
          newUser: { id: newUser.id, username: newUser.username }
        };

        
    }
    catch(err)
    {
      console.error('Login error:', err)
      reply.code(500).send({ error: 'Login failed' })
    }
})


app.post('/login', async (request, reply) => {
  const { username, password } = request.body

  try {
    const user = await db.findUserByUsername(username)
    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    const token = app.jwt.sign(
      { userId: user.id, username: user.username },
      { expiresIn: '7d' }
    )

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    reply.code(500).send({ error: 'Login failed' })
  }
})

const start = async () => {
  try 
  {
    await app.listen({ port: 3001, host: '0.0.0.0' })
    console.log(' Auth Service running on port 3001')
    console.log(' Database: SQLite (shared)')
  } 
  catch (err) 
  {
    app.log.error(err)
    process.exit(1)
  }
}

start()